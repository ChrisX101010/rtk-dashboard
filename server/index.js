// RTK Dashboard — Backend API Server
// Reads RTK's history.db and serves JSON endpoints.
// Install: npm install better-sqlite3 express cors
// Run: node server/index.js

import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

const app = express();
app.use(cors());

function findDB() {
  if (process.env.RTK_DB_PATH && existsSync(process.env.RTK_DB_PATH)) return process.env.RTK_DB_PATH;
  const h = homedir(), os = platform(), paths = [];
  if (os === "darwin") paths.push(join(h, "Library", "Application Support", "rtk", "history.db"));
  if (os === "win32") paths.push(join(h, "AppData", "Local", "rtk", "history.db"));
  paths.push(join(h, ".local", "share", "rtk", "history.db"));
  return paths.find(p => existsSync(p)) || null;
}

let db = null, dbPath = findDB(), demo = true;

async function connect() {
  if (!dbPath) { console.log("⚠ RTK history.db not found → demo mode"); return; }
  try {
    const { default: Database } = await import("better-sqlite3");
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
    db.pragma("journal_mode = WAL");
    demo = false;
    console.log(`✓ Connected: ${dbPath}`);
  } catch (e) { console.warn(`⚠ DB error: ${e.message} → demo mode`); }
}
await connect();

app.get("/api/status", (_, res) => res.json({ connected: !demo, db_path: dbPath, mode: demo ? "demo" : "live" }));

app.get("/api/data", (req, res) => {
  if (demo) return res.json({ status: "demo" });
  const days = parseInt(req.query.days) || 90;
  const cut = new Date(Date.now() - days * 864e5).toISOString();
  try {
    const summary = db.prepare(`SELECT COUNT(*) as total_commands, COALESCE(SUM(input_tokens),0) as total_input, COALESCE(SUM(output_tokens),0) as total_output, COALESCE(SUM(saved_tokens),0) as total_saved, COALESCE(AVG(savings_pct),0) as avg_savings_pct FROM commands WHERE timestamp > ?`).get(cut);
    const daily = db.prepare(`SELECT DATE(timestamp) as date, COUNT(*) as commands, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(saved_tokens) as saved_tokens, ROUND(CASE WHEN SUM(input_tokens)>0 THEN CAST(SUM(saved_tokens) AS REAL)/SUM(input_tokens)*100 ELSE 0 END,2) as savings_pct FROM commands WHERE timestamp > ? GROUP BY DATE(timestamp) ORDER BY date`).all(cut);
    const by_command = db.prepare(`SELECT rtk_cmd, COUNT(*) as calls, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(saved_tokens) as saved_tokens, ROUND(CASE WHEN SUM(input_tokens)>0 THEN CAST(SUM(saved_tokens) AS REAL)/SUM(input_tokens)*100 ELSE 0 END,2) as savings_pct, AVG(exec_time_ms) as avg_time_ms FROM commands WHERE timestamp > ? GROUP BY rtk_cmd ORDER BY saved_tokens DESC`).all(cut);
    const commands = db.prepare(`SELECT timestamp, original_cmd, rtk_cmd, input_tokens, output_tokens, saved_tokens, savings_pct, exec_time_ms FROM commands ORDER BY timestamp DESC LIMIT 50`).all();
    res.json({
      status: "live", db_path: dbPath,
      summary: { total_commands: summary.total_commands, total_input: summary.total_input, total_output: summary.total_output, total_saved: summary.total_saved, avg_savings_pct: Math.round(summary.avg_savings_pct * 100) / 100 },
      daily, by_command, commands,
    });
  } catch (e) { res.json({ status: "error", message: e.message }); }
});

app.use(express.static("dist"));
app.get("*", (req, res) => { if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" }); res.sendFile(join(process.cwd(), "dist", "index.html")); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  RTK Dashboard API — ${demo ? "DEMO" : "LIVE"}`);
  if (dbPath) console.log(`  DB: ${dbPath}`);
  console.log(`  http://localhost:${PORT}\n`);
});
