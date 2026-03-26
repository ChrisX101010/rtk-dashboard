// ─── Formatting ──────────────────────────────────────────────────────────────

export const fmt = (n) => n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(1)+"K" : String(Math.round(n));
export const fmtDollar = (n) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toFixed(2);
export const pctColor = (pct) => pct >= 85 ? "#0FD68C" : pct >= 70 ? "#EF9F27" : "#E24B4A";

export const CATEGORIES = {
  git:   { name: "Git", icon: "\u2387", color: "#EF9F27" },
  test:  { name: "Test runners", icon: "\u25C8", color: "#E24B4A" },
  file:  { name: "Files & search", icon: "\u25EB", color: "#3B8BD4" },
  infra: { name: "Infrastructure", icon: "\u2B21", color: "#9B72CF" },
  build: { name: "Build & lint", icon: "\u2699", color: "#0FD68C" },
  gh:    { name: "GitHub CLI", icon: "\u25C9", color: "#F47E5C" },
  other: { name: "Other", icon: "\u25CB", color: "#888780" },
};

export const STRATEGIES = {
  filter:   { name: "Smart filtering", color: "#0FD68C" },
  truncate: { name: "Truncation", color: "#3B8BD4" },
  group:    { name: "Grouping", color: "#EF9F27" },
  dedup:    { name: "Deduplication", color: "#9B72CF" },
};

export function categorizeCommand(cmd) {
  if (!cmd) return { cat: "other", strategy: "filter" };
  const c = cmd.toLowerCase();
  if (c.includes("git ")) return { cat: "git", strategy: c.includes("diff")||c.includes("log") ? "truncate" : "filter" };
  if (c.includes("test")||c.includes("pytest")||c.includes("vitest")||c.includes("jest")) return { cat: "test", strategy: "filter" };
  if (c.includes("cat ")||c.includes("read ")||c.includes("ls")||c.includes("grep")||c.includes("rg ")||c.includes("find ")) return { cat: "file", strategy: "group" };
  if (c.includes("docker")||c.includes("kubectl")) return { cat: "infra", strategy: c.includes("log") ? "dedup" : "filter" };
  if (c.includes("eslint")||c.includes("build")||c.includes("clippy")||c.includes("tsc")||c.includes("ruff")||c.includes("lint")||c.includes("prettier")) return { cat: "build", strategy: "group" };
  if (c.includes("gh ")) return { cat: "gh", strategy: "filter" };
  return { cat: "other", strategy: "filter" };
}

// ─── Demo data (used when no RTK database is available) ──────────────────────

const R = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const CMDS = ["rtk git status","rtk git diff","rtk git log","rtk git push","rtk git add","rtk git commit","rtk cargo test","rtk pytest","rtk npm test","rtk read","rtk ls","rtk grep","rtk find","rtk docker ps","rtk docker logs","rtk kubectl pods","rtk eslint","rtk cargo build","rtk cargo clippy","rtk tsc","rtk ruff check","rtk gh pr list"];

export function generateDemoData() {
  const now = Date.now();
  const daily = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now - i*864e5).toISOString().split("T")[0];
    const n = R(50,350); let inp=0, out=0;
    for (let c=0;c<n;c++) { const r=R(200,12000), p=R(65,96); inp+=r; out+=Math.round(r*(1-p/100)); }
    daily.push({ date:d, commands:n, input_tokens:inp, output_tokens:out, saved_tokens:inp-out, savings_pct:Math.round((inp-out)/inp*1e4)/100 });
  }
  const records = [];
  for (let i=0;i<600;i++) {
    const cmd=CMDS[R(0,CMDS.length-1)], inp=R(200,12000), p=R(65,96), out=Math.round(inp*(1-p/100));
    records.push({ timestamp:new Date(now-R(0,29)*864e5).toISOString(), original_cmd:cmd.replace("rtk ",""), rtk_cmd:cmd, input_tokens:inp, output_tokens:out, saved_tokens:inp-out, savings_pct:Math.round((inp-out)/inp*1e4)/100, exec_time_ms:R(5,200) });
  }
  const agg = {};
  records.forEach(r => {
    if(!agg[r.rtk_cmd]) agg[r.rtk_cmd]={rtk_cmd:r.rtk_cmd,calls:0,input_tokens:0,output_tokens:0,saved_tokens:0};
    agg[r.rtk_cmd].calls++; agg[r.rtk_cmd].input_tokens+=r.input_tokens; agg[r.rtk_cmd].output_tokens+=r.output_tokens; agg[r.rtk_cmd].saved_tokens+=r.saved_tokens;
  });
  const by_command = Object.values(agg).map(c=>({...c,savings_pct:Math.round(c.saved_tokens/c.input_tokens*1e4)/100})).sort((a,b)=>b.saved_tokens-a.saved_tokens);
  const ti = daily.reduce((a,d)=>a+d.input_tokens,0), to = daily.reduce((a,d)=>a+d.output_tokens,0);
  return {
    status:"demo", summary:{total_commands:daily.reduce((a,d)=>a+d.commands,0),total_input:ti,total_output:to,total_saved:ti-to,avg_savings_pct:Math.round((ti-to)/ti*1e4)/100},
    daily:daily.slice(-30), commands:records.slice(0,50), by_command,
  };
}

// ─── Transform API/demo response into dashboard-friendly format ──────────────

export function transformData(raw) {
  if (!raw) return null;
  const { summary, daily, commands, by_command } = raw;
  const breakdown = {};
  if (by_command?.length > 0) {
    by_command.forEach(row => {
      const cmd = row.rtk_cmd || row.original_cmd || "unknown";
      const { cat, strategy } = categorizeCommand(cmd);
      breakdown[cmd] = { calls:row.calls, raw:row.input_tokens, saved:row.saved_tokens, pct:row.savings_pct, cat, strategy };
    });
  } else if (commands?.length > 0) {
    commands.forEach(row => {
      const cmd = row.rtk_cmd || row.original_cmd || "unknown";
      const { cat, strategy } = categorizeCommand(cmd);
      if (!breakdown[cmd]) breakdown[cmd] = { calls:0, raw:0, saved:0, cat, strategy };
      breakdown[cmd].calls++; breakdown[cmd].raw += row.input_tokens; breakdown[cmd].saved += row.saved_tokens;
    });
    Object.values(breakdown).forEach(b => { b.pct = b.raw > 0 ? Math.round(b.saved/b.raw*1e4)/100 : 0; });
  }
  return {
    status: raw.status, dbPath: raw.db_path,
    summary: { totalCommands:summary?.total_commands||0, totalInput:summary?.total_input||0, totalSaved:summary?.total_saved||0, avgPct:summary?.avg_savings_pct||0 },
    daily: (daily||[]).map(d => ({ date:d.date, commands:d.commands, rawTokens:d.input_tokens, savedTokens:d.saved_tokens, pct:d.savings_pct })),
    breakdown,
    recent: (commands||[]).map(c => ({ time:c.timestamp?new Date(c.timestamp).toLocaleTimeString("en-US",{hour12:false}):"", cmd:c.rtk_cmd||c.original_cmd||"", rawTokens:c.input_tokens, savedTokens:c.saved_tokens, pct:c.savings_pct, ...categorizeCommand(c.rtk_cmd||c.original_cmd) })),
  };
}
