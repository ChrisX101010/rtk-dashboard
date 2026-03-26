import { useState, useEffect } from "react";
import { fmt, pctColor, CATEGORIES, STRATEGIES } from "../utils/helpers";
import { PREVIEWS } from "../data/previews";
import { LLM_MODELS } from "../data/models";

// ─── KPI Card ────────────────────────────────────────────────────────────────
export function KPICard({ label, value, sub, delta, deltaUp, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`kpi ${v ? "vis" : ""}`}>
      <div className="kpi-l">{label}</div>
      <div className="kpi-v">{value}</div>
      {sub && <div className="kpi-s">{sub}</div>}
      {delta && <div className={`kpi-d ${deltaUp ? "up" : "dn"}`}>{delta}</div>}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const live = status === "live";
  return (
    <div className="badge-wrap">
      <div className={`badge-dot ${live?"live":"demo"}`} />
      <span className="badge-label">{live ? "Live data" : "Demo mode"}</span>
      {!live && <span className="badge-hint">Install RTK to see real data</span>}
    </div>
  );
}

// ─── Model Selector ──────────────────────────────────────────────────────────
export function ModelSelector({ modelId, onChange }) {
  const groups = {};
  Object.entries(LLM_MODELS).forEach(([id, m]) => {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push({ id, ...m });
  });
  return (
    <select className="model-select" value={modelId} onChange={e => onChange(e.target.value)}>
      {Object.entries(groups).map(([provider, models]) => (
        <optgroup key={provider} label={provider}>
          {models.map(m => <option key={m.id} value={m.id}>{m.name} (${m.inputPer1M}/1M)</option>)}
        </optgroup>
      ))}
    </select>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────
export function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.rawTokens), 1);
  const [h, setH] = useState(null);
  return (
    <div>
      <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:260, padding:"0 2px" }}>
        {data.map((d,i) => {
          const rH = Math.round(d.rawTokens/max*240), sH = Math.round(d.savedTokens/max*240), is = h===i;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative", cursor:"pointer" }}
              onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)}>
              {is && <div className="tip" style={{ bottom:rH+8 }}><strong>{d.date}</strong><br/>Raw: {fmt(d.rawTokens)}<br/>Saved: {fmt(d.savedTokens)} ({Math.round(d.pct)}%)<br/>{d.commands} cmds</div>}
              <div style={{ display:"flex", gap:1, alignItems:"flex-end" }}>
                <div style={{ width:8, height:rH, borderRadius:"2px 2px 0 0", background:"#E24B4A", opacity:is?.7:.25, transition:"opacity .2s" }} />
                <div style={{ width:8, height:sH, borderRadius:"2px 2px 0 0", background:"#0FD68C", opacity:is?1:.8, transition:"opacity .2s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", padding:"6px 2px 0", borderTop:"0.5px solid var(--border)" }}>
        {data.map((d,i) => <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, fontFamily:"var(--mono)", color:"var(--text3)" }}>{i%Math.ceil(data.length/7)===0?d.date:""}</div>)}
      </div>
    </div>
  );
}

// ─── Command Table ───────────────────────────────────────────────────────────
export function CommandTable({ breakdown }) {
  const rows = Object.entries(breakdown).map(([cmd,d]) => ({cmd,...d,pct:d.pct||(d.raw>0?Math.round(d.saved/d.raw*100):0)})).sort((a,b) => b.saved-a.saved).slice(0,15);
  const mx = Math.max(...rows.map(r=>r.saved),1);
  if (!rows.length) return <div style={{ color:"var(--text3)", fontSize:13 }}>No command data yet.</div>;
  return (
    <div style={{ overflowX:"auto" }}>
      <table className="tbl">
        <thead><tr><th style={{width:"38%"}}>Command</th><th>Calls</th><th style={{width:"30%"}}>Saved</th><th style={{textAlign:"right"}}>%</th><th style={{textAlign:"right"}}>Strategy</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.cmd}>
            <td><span className="dot" style={{background:CATEGORIES[r.cat]?.color||"#888"}} /><code>{r.cmd}</code></td>
            <td className="mono-c">{r.calls}</td>
            <td><div className="bar-w"><div className="bar-f" style={{width:Math.round(r.saved/mx*100)+"%",background:`linear-gradient(90deg,${pctColor(r.pct)}30,${pctColor(r.pct)}80)`}} /><span className="bar-l">{fmt(r.saved)}</span></div></td>
            <td className="mono-r" style={{color:pctColor(r.pct)}}>-{Math.round(r.pct)}%</td>
            <td className="mono-r" style={{fontSize:10,color:"var(--text3)"}}>{STRATEGIES[r.strategy]?.name?.split(" ")[1]||"filter"}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── Strategy Donut ──────────────────────────────────────────────────────────
export function StrategyDonut({ breakdown }) {
  const st = {}; let rawT = 0;
  Object.values(breakdown).forEach(d => { st[d.strategy] = (st[d.strategy]||0) + d.saved; rawT += d.raw; });
  const tot = Object.values(st).reduce((a,b)=>a+b,0);
  if (!tot) return null;
  const ent = Object.entries(st).sort((a,b)=>b[1]-a[1]);
  let cum = -90;
  const arcs = ent.map(([k,v]) => {
    const pct=v/tot, ang=pct*360, sa=cum; cum+=ang;
    const r=52,cx=64,cy=64,ir=34;
    const p=(a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];
    const q=(a)=>[cx+ir*Math.cos(a*Math.PI/180),cy+ir*Math.sin(a*Math.PI/180)];
    const [x1,y1]=p(sa),[x2,y2]=p(cum),[ix1,iy1]=q(cum),[ix2,iy2]=q(sa);
    const la=ang>180?1:0;
    return {k,v,pct,d:`M${x1} ${y1} A${r} ${r} 0 ${la} 1 ${x2} ${y2} L${ix1} ${iy1} A${ir} ${ir} 0 ${la} 0 ${ix2} ${iy2} Z`,c:STRATEGIES[k]?.color||"#666"};
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, padding:"10px 0", flexWrap:"wrap" }}>
      <svg width="128" height="128" viewBox="0 0 128 128">
        {arcs.map(a => <path key={a.k} d={a.d} fill={a.c} opacity=".85" stroke="var(--bg)" strokeWidth="1.5" />)}
        <text x="64" y="60" textAnchor="middle" fill="var(--text1)" fontSize="18" fontWeight="700" fontFamily="var(--mono)">{rawT>0?Math.round(tot/rawT*100):0}%</text>
        <text x="64" y="78" textAnchor="middle" fill="var(--text3)" fontSize="10">avg savings</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {arcs.map(a => (
          <div key={a.k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:a.c, flexShrink:0 }} />
            <span style={{ color:"var(--text2)", minWidth:110 }}>{STRATEGIES[a.k]?.name||a.k}</span>
            <span className="mono-c" style={{ fontWeight:600, minWidth:32 }}>{Math.round(a.pct*100)}%</span>
            <span className="mono-c" style={{ fontSize:11, color:"var(--text3)" }}>{fmt(a.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Breakdown ──────────────────────────────────────────────────────
export function CategoryBreakdown({ breakdown }) {
  const ct = {};
  Object.values(breakdown).forEach(d => { const c=d.cat||"other"; if(!ct[c]) ct[c]={raw:0,saved:0,calls:0}; ct[c].raw+=d.raw; ct[c].saved+=d.saved; ct[c].calls+=d.calls; });
  const ent = Object.entries(ct).sort((a,b)=>b[1].saved-a[1].saved);
  const mx = Math.max(...ent.map(([,d])=>d.saved),1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {ent.map(([cat,d]) => {
        const pct = d.raw>0?Math.round(d.saved/d.raw*100):0, info = CATEGORIES[cat]||CATEGORIES.other;
        return (
          <div key={cat} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:16, width:24, textAlign:"center", color:info.color }}>{info.icon}</div>
            <div style={{ minWidth:110 }}><div style={{ fontSize:13, fontWeight:500 }}>{info.name}</div><div style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--mono)" }}>{d.calls} calls · {fmt(d.saved)} saved</div></div>
            <div style={{ flex:1 }}><div style={{ height:6, borderRadius:3, background:"var(--border)" }}><div style={{ height:"100%", borderRadius:3, width:Math.round(d.saved/mx*100)+"%", background:info.color, transition:"width .5s" }} /></div></div>
            <div style={{ fontFamily:"var(--mono)", fontWeight:600, fontSize:13, minWidth:44, textAlign:"right", color:pctColor(pct) }}>-{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Live / Recent Feed ──────────────────────────────────────────────────────
export function RecentFeed({ events }) {
  if (!events?.length) return <div style={{ color:"var(--text3)", fontSize:13, padding:16 }}>No recent commands. Run some commands with RTK to see them here.</div>;
  return (
    <div className="feed">{events.map((ev,i) => (
      <div key={ev.time+i} className="feed-row">
        <span className="feed-time">{ev.time}</span>
        <span className="dot" style={{ background:CATEGORIES[ev.cat]?.color||"#888", width:5, height:5 }} />
        <span className="feed-cmd">{ev.cmd}</span>
        <span className="feed-tok">{fmt(ev.rawTokens)} → {fmt(ev.rawTokens-ev.savedTokens)}</span>
        <span className="feed-pill" style={{ background:pctColor(ev.pct)+"18", color:pctColor(ev.pct) }}>-{Math.round(ev.pct)}%</span>
      </div>
    ))}</div>
  );
}

// ─── Compression Preview ─────────────────────────────────────────────────────
export function CompressionPreview({ selectedCmd, onSelect }) {
  const cmds = Object.keys(PREVIEWS);
  const p = PREVIEWS[selectedCmd]; if (!p) return null;
  const rawL = p.raw.split("\n"), compSet = new Set(p.compressed.split("\n").map(l=>l.trim()));
  const sav = Math.round((1 - p.compressed.length/p.raw.length)*100);
  return (
    <div className="panel">
      <div className="prev-tabs">{cmds.map(c => <button key={c} className={c===selectedCmd?"active":""} onClick={()=>onSelect(c)}>{c}</button>)}</div>
      <div style={{ fontSize:11, color:"var(--text3)", marginBottom:10, display:"flex", gap:12, fontFamily:"var(--mono)" }}><span>{rawL.length} lines → {p.compressed.split("\n").length} lines</span><span style={{color:"var(--green)",fontWeight:600}}>-{sav}% chars</span></div>
      <div className="prev-split">
        <div className="prev-col"><div className="prev-hdr"><span className="dot" style={{background:"var(--red)",width:6,height:6}} /> Raw output</div><pre className="prev-code">{rawL.map((l,i) => <div key={i} className={compSet.has(l.trim())?"kept":"removed"}>{l||" "}</div>)}</pre></div>
        <div className="prev-col"><div className="prev-hdr"><span className="dot" style={{background:"var(--green)",width:6,height:6}} /> RTK compressed</div><pre className="prev-code compressed">{p.compressed}</pre></div>
      </div>
    </div>
  );
}

// ─── Session Timeline ────────────────────────────────────────────────────────
export function SessionTimeline({ data }) {
  const d7 = data.slice(-7), mx = Math.max(...d7.map(d=>d.commands),1);
  return (
    <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:80 }}>
      {d7.map((d,i) => (
        <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
          <div style={{ height:50, width:"100%", display:"flex", alignItems:"flex-end", justifyContent:"center" }}><div style={{ width:"70%", borderRadius:"3px 3px 0 0", minHeight:3, height:Math.round(d.commands/mx*100)+"%", background:"linear-gradient(to top,#0FD68C40,#0FD68Ccc)", transition:"height .5s" }} /></div>
          <div style={{ fontSize:9, fontFamily:"var(--mono)", color:"var(--text3)", marginTop:4 }}>{d.date?.slice(-2)}</div>
          <div style={{ fontSize:9, fontFamily:"var(--mono)", color:"var(--text2)", fontWeight:600 }}>{d.commands}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Discover Panel ──────────────────────────────────────────────────────────
export function DiscoverPanel({ breakdown }) {
  const cmds = Object.entries(breakdown).map(([cmd,d])=>({cmd,...d,pct:d.pct||(d.raw>0?Math.round(d.saved/d.raw*100):0)})).sort((a,b)=>a.pct-b.pct).slice(0,5);
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:8 }}>Lowest savings (optimization targets)</div>
      {cmds.length > 0 ? cmds.map(c => (
        <div key={c.cmd} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 8px", fontSize:12, borderBottom:"0.5px solid var(--border)" }}>
          <code style={{ fontFamily:"var(--mono)", flex:1, fontSize:12 }}>{c.cmd}</code>
          <span style={{ color:pctColor(c.pct) }}>-{Math.round(c.pct)}%</span>
          <span style={{ fontSize:10, color:"var(--text3)" }}>Try <code style={{ color:"var(--amber)", background:"rgba(239,159,39,.1)", padding:"1px 4px", borderRadius:3, fontSize:10 }}>-l aggressive</code></span>
        </div>
      )) : <div style={{ color:"var(--text3)", fontSize:12 }}>No data yet</div>}
      <div style={{ fontSize:12, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".4px", marginBottom:8, marginTop:18 }}>Unintercepted commands (missed savings)</div>
      {["curl https://api.example.com","npm run build","docker compose up","terraform plan"].map(c => (
        <div key={c} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 8px", fontSize:12, borderBottom:"0.5px solid var(--border)" }}>
          <code style={{ fontFamily:"var(--mono)", flex:1, fontSize:12, color:"var(--text3)" }}>{c}</code>
          <span style={{ fontSize:10, fontFamily:"var(--mono)", color:"var(--blue)", background:"rgba(59,139,212,.1)", padding:"2px 8px", borderRadius:10, cursor:"pointer", fontWeight:600 }}>+ Add to rtk</span>
        </div>
      ))}
    </div>
  );
}
