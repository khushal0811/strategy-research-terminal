# Strategy Research Terminal

**The web application and API interface for the Strategy Research Platform. It integrates a Next.js frontend and a FastAPI backend with PostgreSQL persistence, JWT user authentication, real-time WebSocket streaming, and LLM-assisted strategy analysis.**

Part of the three-component Strategy Research Platform:
- [Market Data Pipeline](file:///Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Backtester-Oriented-Market-Data-Pipeline) — Data ingestion & storage
- [Event-Driven Backtesting Engine](file:///Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Event-Driven-Backtesting-Engine) — Core event simulation engine
- **Strategy Research Terminal** — Full-stack UI & REST/WS APIs (this component)

---

## Technical Architecture

The terminal connects the user interface to the backtesting engine and manages persistence and authentication:

```
                  ┌──────────────────────────────┐
                  │       Next.js Frontend       │
                  │   (React 19 / TypeScript)    │
                  └──────────────┬───────────────┘
                                 │
             HTTP Requests       │       WebSocket Connection
          (JWT Auth Headers)     │       (Real-time Streams)
                                 ▼
                  ┌──────────────────────────────┐
                  │       FastAPI Backend        │
                  │       (REST & WS APIs)       │
                  └──────────────┬───────────────┘
                                 │
             SQLAlchemy          │       Engine Thread Pool
             (Asyncpg)           │       (Queued Forwarding)
                                 ▼
   ┌───────────────────┐  ┌──────────────┐  ┌──────────────────┐
   │    PostgreSQL     │  │  yfinance    │  │  Backtesting     │
   │ (Runs/Trades/User)│  │ (On-demand)  │  │  Engine Sub-repo │
   └───────────────────┘  └──────────────┘  └──────────────────┘
```

---

## Core Features

* **JWT User Authentication**: Secure login (`POST /auth/login`), registration (`POST /auth/register`), and token-based route authorization.
* **Persistent User Profiles & Transaction Costs**: Saves custom execution metrics per user account. When launching a backtest, user profile parameters (commission model type, fee values, and basis point slippage constraints) are retrieved and injected into the engine.
* **PostgreSQL Session Persistence**: Simulating backtests persists the complete execution profile, portfolio metrics, AI-generated reports, and the full round-trip trade history in the database.
* **Historical Run Restoration**: Restores past runs from the Run History side panel. Hydrating a run loads the complete historical record, re-drawing charts and populating the **Execution Blotter** with exact entries and exits.
* **Real-time Streaming Pipeline**: A custom asyncio queue bridge monitors execution threads, converting backtest snapshots into WebSocket events to update progress bars, trade logs, and charts bar-by-bar.
* **Aesthetic and Precision Upgrades**:
  * Date labels display the full date including the year (e.g. `2024-03-12`) rather than truncated month-day indices.
  * Quantitative calculations (like Alpha relative to the benchmark index) are correctly scaled (multiplied by 100) before rendering as percentages in metrics cards.

---

## Repository Layout

```
strategy-research-terminal/
├── backend/
│   ├── main.py                 # FastAPI setup and WebSocket router
│   ├── config.py               # Path configurations & env safety checks
│   ├── api/
│   │   ├── routes.py           # REST routes (data query & backtest launch)
│   │   └── schemas.py          # Request and response schemas (Pydantic)
│   ├── auth/
│   │   ├── router.py           # Login, registration, & user profiles
│   │   ├── schemas.py          # Authentication contracts
│   │   └── utils.py            # Password hashing & JWT token verification
│   ├── db/
│   │   ├── database.py         # SQLAlchemy engine & async session pools
│   │   └── models.py           # User & BacktestRun relational tables
│   ├── runs/
│   │   ├── router.py           # Run retrieval, deletion, and patch routes
│   │   └── schemas.py          # Persistence serialization schemas
│   ├── pipeline/
│   │   └── fetcher.py          # Downloads missing symbols at runtime
│   ├── validation/
│   │   └── config_validator.py # Engine parameter bounds checking
│   └── websocket/
│       └── manager.py          # Streams live events & saves complete runs to DB
│
└── frontend/
    ├── app/
    │   ├── page.tsx            # Interactive layout & Zustand bindings
    │   └── api/llm/route.ts    # Server-side proxy for Groq API
    ├── components/
    │   ├── input/              # Universe chips & parameter forms
    │   ├── charts/             # Equity, Drawdown, and Sharpe charts
    │   ├── analytics/          # Metrics cards & Execution Blotter log
    │   └── history/            # Side panel run history & modal summaries
    ├── hooks/
    │   ├── useBacktest.ts      # Launches runs & handles auth headers
    │   └── useWebSocket.ts     # WebSocket connect, message parser & disconnect hooks
    └── store/
        └── terminalStore.ts    # Zustand global store managing app state
```

---

## Configuration Settings

### Backend Environment Configuration
Create a `.env` file inside `strategy-research-terminal/backend/.env`:
```env
# Module Paths
DATA_DIR=/Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Backtester-Oriented-Market-Data-Pipeline/data
ENGINE_PATH=/Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Event-Driven-Backtesting-Engine
PIPELINE_PATH=/Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Backtester-Oriented-Market-Data-Pipeline

# Security Credentials
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/strategy_terminal
JWT_SECRET_KEY=use-a-strong-generated-key-here

# Artificial Intelligence Model Key
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Generating a JWT Secret Key
You can generate a secure secret key by running this command in your terminal:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Database Tables Auto-Migration
The backend database is managed via SQLAlchemy. When the FastAPI server starts up, it automatically creates the required tables (`users`, `backtest_runs`) in the PostgreSQL schema if they do not exist.

### Frontend Environment Configuration
Create a `.env.local` file inside `strategy-research-terminal/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
GROQ_API_KEY=gsk_your_groq_api_key_here
```

---

## API Documentation

### 👤 User Account Endpoints
* `POST /auth/register` — Creates a new account.
* `POST /auth/login` — Verifies passwords (bcrypt) and returns a JWT token.
* `GET /auth/me` — Fetches current user information.
* `PUT /auth/costs` — Updates the user's default transaction settings (`commission_model`, `commission_value`, `slippage_bps`).

### 📈 Historical Runs Endpoints
* `GET /api/runs` — Lists the user's completed simulation runs.
* `GET /api/runs/{run_id}` — Fetches details of a specific run including complete trades list and metrics.
* `DELETE /api/runs/{run_id}` — Deletes a simulation run from the history database.
* `PATCH /api/runs/{run_id}/report` — Saves the AI-generated markdown report to the database record.

### 📊 Ingestion & Launch Endpoints
* `GET /api/data/symbols` — Lists symbols currently available in local Parquet storage.
* `GET /api/data/info/{symbol}` — Probes symbol availability, checking if it is stored locally or fetchable via yfinance.
* `POST /api/backtest/run` — Validates configurations, fetches missing asset records, registers the simulation session, and outputs a `run_id`.

### 🔌 Live WebSocket Connection
* `WS /ws/backtest/{run_id}` — Forwarding channel. Accepts `token` as a query parameter for authorized runs. Streams active progression metrics and execution entries.

---

## Development Guide

### 1. Launch the Backend REST Server
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Launch the Next.js Client
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the research workspace dashboard.

---

## License

MIT — see [LICENSE](LICENSE).
