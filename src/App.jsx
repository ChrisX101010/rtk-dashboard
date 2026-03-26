import { useState, useEffect, useMemo } from "react";
import { generateDemoData, transformData, fmt, fmtDollar, pctColor } from "./utils/helpers";
import { calculateCost, DEFAULT_MODEL } from "./data/models";
import { KPICard, StatusBadge, ModelSelector, BarChart, CommandTable, StrategyDonut, CategoryBreakdown, RecentFeed, CompressionPreview, SessionTimeline, DiscoverPanel } from "./components/index.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "commands", label: "Commands" },
  { id: "preview", label: "Compression preview" },
  { id: "discover", label: "Discover" },
  { id: "recent", label: "Recent commands" },
];

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [previewCmd, setPreviewCmd] = useState("git status");
  const [timeRange, setTimeRange] = useState(30);
  const [modelId, setModelId] = useState(() => {
    try { return localStorage.getItem("rtk-model") || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
  });

  // Persist model selection
  useEffect(() => { try { localStorage.setItem("rtk-model", modelId); } catch {} }, [modelId]);

  // Load data — try API first, fallback to demo
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let raw = null;
      // Try backend API (only works when server/index.js is running)
      try {
        const res = await fetch("/api/data?days=90", { signal: AbortSignal.timeout(2000) });
        if (res.ok) raw = await res.json();
      } catch {}
      // Try localhost:3001 (dev mode with separate server)
      if (!raw) {
        try {
          const res = await fetch("http://localhost:3001/api/data?days=90", { signal: AbortSignal.timeout(2000) });
          if (res.ok) raw = await res.json();
        } catch {}
      }
      // Fallback to demo data
      if (!raw) raw = generateDemoData();
      if (!cancelled) { setData(transformData(raw)); setLoading(false); }
    }
    load();
    const iv = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const rangeDaily = useMemo(() => data?.daily?.slice(-timeRange) || [], [data, timeRange]);
  const bk = data?.breakdown || {};

  if (loading && !data) return (
    <div className="app"><div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:300 }}>
      <div className="logo">rtk</div><div style={{ marginTop:16, color:"var(--text3)" }}>Connecting...</div>
    </div></div>
  );

  const today = rangeDaily[rangeDaily.length-1] || { savedTokens:0, rawTokens:0, pct:0, commands:0 };
  const yest = rangeDaily[rangeDaily.length-2] || today;
  const w7 = rangeDaily.slice(-7);
  const wSaved = w7.reduce((a,d)=>a+d.savedTokens,0);
  const delta = yest.savedTokens > 0 ? Math.round((today.savedTokens - yest.savedTokens)/yest.savedTokens*100) : 0;

  const TimeBtn = () => <div className="tbtn">{[7,14,30].map(n => <button key={n} className={timeRange===n?"on":""} onClick={()=>setTimeRange(n)}>{n}d</button>)}</div>;

  return (
    <div className="app">
      <div className="hdr">
        <div className="logo">rtk</div>
        <div className="title">Token savings dashboard</div>
        <span className="ver">v2.0</span>
        <StatusBadge status={data?.status} />
      </div>

      <div className="tabs">
        {TABS.map(t => <button key={t.id} className={`tab ${activeTab===t.id?"on":""}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeTab === "overview" && <>
        <div className="model-bar">
          <span style={{ fontSize:11, color:"var(--text3)" }}>Cost model:</span>
          <ModelSelector modelId={modelId} onChange={setModelId} />
        </div>
        <div className="grid4">
          <KPICard label="Tokens saved (latest day)" value={fmt(today.savedTokens||data?.summary?.totalSaved||0)} delta={delta?`${delta>0?"+":""}${delta}% vs prior day`:undefined} deltaUp={delta>=0} delay={0} />
          <KPICard label="Avg compression" value={Math.round(data?.summary?.avgPct||today.pct||0)+"%" } sub={`across ${data?.summary?.totalCommands||0} commands`} delay={80} />
          <KPICard label="Est. cost saved" value={fmtDollar(calculateCost(today.savedTokens||data?.summary?.totalSaved||0, modelId))} delta={wSaved>0?fmtDollar(calculateCost(wSaved,modelId))+" this week":undefined} deltaUp delay={160} />
          <KPICard label="Commands intercepted" value={String(data?.summary?.totalCommands||0)} sub={`${Object.keys(bk).length} unique commands`} delay={240} />
        </div>

        {rangeDaily.length > 1 && <div className="sec">
          <div className="sec-hdr"><div className="sec-t"><span className="sec-dot" style={{background:"var(--green)"}} />Token savings over time</div><TimeBtn /></div>
          <BarChart data={rangeDaily} />
          <div className="legend"><span><span className="lsw" style={{background:"var(--green)"}} />Saved</span><span><span className="lsw" style={{background:"var(--red)",opacity:.35}} />Raw (wasted)</span></div>
        </div>}

        {Object.keys(bk).length > 0 && <div className="grid2">
          <div className="panel"><div className="pan-t"><span className="sec-dot" style={{background:"var(--purple)"}} />By strategy</div><StrategyDonut breakdown={bk} /></div>
          <div className="panel"><div className="pan-t"><span className="sec-dot" style={{background:"var(--amber)"}} />By category</div><CategoryBreakdown breakdown={bk} /></div>
        </div>}

        <div className="grid2">
          {rangeDaily.length >= 3 && <div className="panel"><div className="pan-t"><span className="sec-dot" style={{background:"var(--blue)"}} />7-day activity</div><SessionTimeline data={rangeDaily} /></div>}
          {Object.keys(bk).length > 0 && <div className="panel"><div className="pan-t"><span className="sec-dot" style={{background:"var(--green)"}} />Top commands</div>
            <div style={{fontSize:12}}>{Object.entries(bk).map(([cmd,d])=>({cmd,...d,pct:d.pct||(d.raw>0?Math.round(d.saved/d.raw*100):0)})).sort((a,b)=>b.saved-a.saved).slice(0,5).map(c=>(
              <div key={c.cmd} className="top-row"><code>{c.cmd}</code><span className="mono-c" style={{color:"var(--text3)"}}>{c.calls}x</span><span className="mono-c" style={{color:pctColor(c.pct),fontWeight:600}}>-{Math.round(c.pct)}%</span></div>
            ))}</div>
          </div>}
        </div>
      </>}

      {activeTab === "commands" && <div className="sec"><div className="sec-hdr"><div className="sec-t"><span className="sec-dot" style={{background:"var(--purple)"}} />All intercepted commands</div></div><CommandTable breakdown={bk} /></div>}
      {activeTab === "preview" && <div className="sec"><div className="sec-t" style={{marginBottom:12}}><span className="sec-dot" style={{background:"var(--blue)"}} />See exactly what RTK strips</div><CompressionPreview selectedCmd={previewCmd} onSelect={setPreviewCmd} /></div>}
      {activeTab === "discover" && <div className="sec"><div className="sec-t" style={{marginBottom:12}}><span className="sec-dot" style={{background:"var(--amber)"}} />Optimization opportunities</div><div className="panel"><DiscoverPanel breakdown={bk} /></div></div>}
      {activeTab === "recent" && <div className="sec"><div className="sec-hdr"><div className="sec-t"><span className="sec-dot" style={{background:"var(--red)"}} />Recent intercepted commands</div></div><RecentFeed events={data?.recent||[]} /></div>}

      <div className="ftr">
        <span>RTK Dashboard v2.0 — reads history.db · supports 10+ LLM pricing models</span>
        <span><a href="https://github.com/rtk-ai/rtk" target="_blank" rel="noopener noreferrer">RTK</a>{" · "}<a href="https://github.com/ChrisX101010/rtk-dashboard" target="_blank" rel="noopener noreferrer">Dashboard repo</a>{" · "}<a href="https://discord.gg/gFwRPEKq4p" target="_blank" rel="noopener noreferrer">Discord</a></span>
      </div>
    </div>
  );
}
