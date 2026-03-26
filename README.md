# RTK Dashboard v2.0

**Production-ready token savings dashboard for [RTK](https://github.com/rtk-ai/rtk).** Reads your real `history.db`, supports 10+ LLM pricing models, and visualizes everything RTK saves you.

## What it does

| Tab | Description |
|-----|------------|
| **Overview** | KPI cards, savings chart, strategy donut, category bars, session timeline |
| **Commands** | Per-command table with calls, savings bars, and strategy tags |
| **Compression preview** | Side-by-side raw vs compressed for 5 real commands |
| **Discover** | Low-savings commands to optimize + unintercepted commands you're missing |
| **Recent commands** | Full feed of intercepted commands with timestamps and savings |

**LLM cost selector**: Choose your model (Claude, GPT-4o, Gemini, DeepSeek, etc.) to see accurate dollar savings based on real provider pricing.

## Quick Start

```bash
git clone https://github.com/ChrisX101010/rtk-dashboard.git
cd rtk-dashboard
npm install
npm run dev
```

Opens at http://localhost:3000. Shows demo data by default — connect to your real RTK database with the backend server.

## Connect to Real RTK Data

RTK stores command history in `~/.local/share/rtk/history.db`. To read it:

```bash
# Install backend dependencies
npm install better-sqlite3 express cors

# Start the API server (reads history.db)
npm run server

# In another terminal, start the frontend
npm run dev
```

The dashboard auto-detects whether the backend is running. If it is, you see **Live data**. If not, you see **Demo mode**.

Set `RTK_DB_PATH` environment variable to use a custom database location.

## Architecture

```
rtk-dashboard/
├── src/
│   ├── App.jsx              # Main app — tabs, state, data fetching
│   ├── components/index.jsx # All 10 React components
│   ├── data/
│   │   ├── models.js        # LLM pricing (11 models, 5 providers)
│   │   └── previews.js      # Compression before/after examples
│   ├── utils/helpers.js     # Formatting, categorization, demo data
│   └── styles.css           # All styles
├── server/
│   └── index.js             # Express API reading RTK's SQLite DB
├── index.html
├── vite.config.js
└── package.json
```

## How It Connects to RTK

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────┐
│  RTK CLI          │────▶│  ~/.local/share/    │◀────│  Backend API │
│  (intercepts cmds)│     │  rtk/history.db     │     │  (Express)   │
└──────────────────┘     └────────────────────┘     └──────┬───────┘
                                                           │ JSON
                                                    ┌──────▼───────┐
                                                    │  React UI     │
                                                    │  (Vite)       │
                                                    └──────────────┘
```

**Without the backend**: Frontend generates realistic demo data so you can preview the UI.

**With the backend**: Frontend fetches from `/api/data` and shows real savings from your RTK sessions.

## LLM Pricing Models

The dashboard includes pricing for:
- **Anthropic**: Claude Sonnet 4, Opus 4, Haiku 4
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4.1, Codex Mini
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **DeepSeek**: V3
- **Custom**: Set your own rate

Select your model from the dropdown and see cost savings in real dollars.

## Deploy

```bash
npm run build    # Outputs to dist/
```

Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages). The frontend works standalone in demo mode. For live data, deploy the backend alongside.

## Related

- [RTK (Rust Token Killer)](https://github.com/rtk-ai/rtk) — the CLI this dashboard visualizes
- [Issue #142](https://github.com/rtk-ai/rtk/issues/142) — session analytics request this project addresses

## License

MIT
