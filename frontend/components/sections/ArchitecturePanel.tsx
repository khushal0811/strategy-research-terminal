'use client'

import React, { useState } from 'react'
import { ArrowRight, Bot, Cpu, Database, Play, Terminal, Code2, ShieldAlert } from 'lucide-react'

interface CommunicationNode {
  from: string
  to: string
  protocol: 'HTTP POST' | 'WebSocket Stream' | 'Python API' | 'Disk read/write Snappy' | 'REST HTTPS API'
  label: string
  status: 'active' | 'success' | 'idle'
}

interface WorkflowData {
  title: string
  tagline: string
  description: string
  icon: React.ReactNode
  terminalLabel: string
  terminalOutput: string
  communications: CommunicationNode[]
}

export default function ArchitecturePanel() {
  const [activeTab, setActiveTab] = useState<'llm' | 'parquet' | 'engine' | 'websocket'>('llm')

  const workflows: Record<'llm' | 'parquet' | 'engine' | 'websocket', WorkflowData> = {
    llm: {
      title: 'Strategy Ingestion & Resolution Pipeline',
      tagline: 'How client inputs compile into deterministic strategy engines.',
      description: 'Observe the relational exchange as natural language prompts are compiled, parsed, and pushed into the backend worker queue.',
      icon: <Bot className="h-5 w-5 text-violet-400" />,
      terminalLabel: 'COMM::INGESTION_PIPELINE',
      terminalOutput: `[HTTP POST] -> 14:04:11 - Client submitted prompt to /api/backtest
[FASTAPI]   -> Validating connection token...
[REST HTTP] -> Forwarding payload to Groq LLaMA-3 system brokers
[REST HTTP] <- Received JSON model parameters (Token count: 485, Latency: 1.1s)
[FASTAPI]   -> Binding parameters into Pydantic model "StrategyConfig"...
[FASTAPI]   ✓ Type casting check passed. Schema is verified.
[FASTAPI]   -> Enqueueing strategy task into local asyncio worker thread pool.
[STATUS]    ✓ Strategy compiled successfully. Backtester queue ready.`,
      communications: [
        { from: 'Frontend Workspace', to: 'FastAPI Server', protocol: 'HTTP POST', label: 'Submit plain prompt', status: 'success' },
        { from: 'FastAPI Server', to: 'Groq LLM API', protocol: 'REST HTTPS API', label: 'Parse parameters', status: 'active' },
        { from: 'Groq LLM API', to: 'FastAPI Server', protocol: 'REST HTTPS API', label: 'Return JSON strategy config', status: 'success' },
        { from: 'FastAPI Server', to: 'asyncio Job Queue', protocol: 'Python API', label: 'Validate schema & queue run', status: 'success' }
      ]
    },
    parquet: {
      title: 'Market Data Ingestion & Storage Tier',
      tagline: 'Caching splits and dividend-adjusted series on the storage tier.',
      description: 'Historical OHLCV + dividend data is fetched dynamically. If a cache miss occurs on local Snappy files, the pipeline requests fresh bars from external Yahoo Finance APIs, adjusts splits, and writes back high-speed compressed Parquet tables.',
      icon: <Database className="h-5 w-5 text-amber-400" />,
      terminalLabel: 'COMM::DATA_INGESTION_TIER',
      terminalOutput: `[PARQUET]  -> Scanning /data/cache/AAPL.parquet for daily time-series...
[PARQUET]  <- Cache Miss: local Snappy compressed table does not exist.
[REST HTTP] -> Requesting Yahoo Finance API daily ticker bars (AAPL)...
[REST HTTP] <- Ingested 252 bars + historical dividend distribution table.
[ENG LOG]  -> Adjusting prices for stock splits & corporate actions...
[PYARROW]  -> Serializing DataFrame into local binary Parquet cache.
[PARQUET]  ✓ Apache Parquet snaphshot saved. Write IO latency: 0.84ms.
[STATUS]   ✓ Ingestion complete. Disk Read Scan initialized.`,
      communications: [
        { from: 'Execution Engine', to: 'Local Parquet Cache', protocol: 'Disk read/write Snappy', label: 'Check caching existence', status: 'success' },
        { from: 'Execution Engine', to: 'Yahoo Finance API', protocol: 'REST HTTPS API', label: 'Request OHLCV data (Cache Miss)', status: 'active' },
        { from: 'Yahoo Finance API', to: 'Execution Engine', protocol: 'REST HTTPS API', label: 'Ingest raw time-series bars', status: 'success' },
        { from: 'Execution Engine', to: 'Local Parquet Cache', protocol: 'Disk read/write Snappy', label: 'Compress Snappy and write', status: 'success' }
      ]
    },
    engine: {
      title: 'Event-Driven Simulation backtest engine',
      tagline: 'Deterministic zero-lookahead backtesting loop.',
      description: 'Watch the core event simulation tick daily bars sequentially. Ticks trigger signals, signals place orders, and transactions adjust the capital balance. Dividends paid are computed and compounded.',
      icon: <Cpu className="h-5 w-5 text-emerald-400" />,
      terminalLabel: 'COMM::ENGINE_SIMULATION_LOOP',
      terminalOutput: `[ENGINE]  -> Spawning backtest simulation worker thread...
[ENGINE]  -> LoadingSnappy compressed Parquet series (AAPL).
[ENGINE]  <- Capital initialized with $100,000.00 cash balance.
[EVENT]   -> Ticking timeline coordinates... (Row 145/252)
[STRATEGY]-> RSI calculated: 26.5. Generating BUY trade signal...
[ORDER]   -> Pushing order into execution queue (FIFO matcher).
[FILL]    <- Order filled: BUY 100 shares @ $174.50 (Cash balance: $82,550.00).
[DIVIDEND]-> Corporate action detected: AAPL paid $0.24 cash dividend.
[DIVIDEND]<- Adjusted cash balance: +$24.00 added to capital.
[STATUS]  ✓ Backtest complete. Cumulative returns: +31.42%.`,
      communications: [
        { from: 'FastAPI Server', to: 'Simulation Engine', protocol: 'Python API', label: 'Spawn backtest process thread', status: 'success' },
        { from: 'Simulation Engine', to: 'Local Parquet Cache', protocol: 'Disk read/write Snappy', label: 'Sequential bar tick scans', status: 'active' },
        { from: 'Simulation Engine', to: 'Strategy Broker', protocol: 'Python API', label: 'Calculate signals (zero lookahead)', status: 'success' },
        { from: 'Strategy Broker', to: 'Portfolio Tracker', protocol: 'Python API', label: 'Execute fill & adjust capital balance', status: 'success' }
      ]
    },
    websocket: {
      title: 'Real-Time WebSocket Analytics Stream',
      tagline: 'Asynchronous event streaming framework for live workspace rendering.',
      description: 'Observe the connection loop as the simulator pushes high-frequency binary frames over WebSocket channels, which are parsed by React and injected directly into Recharts curves and TradeLog rows.',
      icon: <Play className="h-5 w-5 text-blue-400" />,
      terminalLabel: 'COMM::WEBSOCKET_REALTIME_FEED',
      terminalOutput: `[WS FEED]  -> Connection established on ws://localhost:8000/ws/terminal
[STREAM]   -> Dispatching initial run metrics and strategy settings...
[STREAM]   -> Pushing simulation timeline packet (Frame 1/252)...
[STREAM]   -> Pushing simulation timeline packet (Frame 45/252)...
[STREAM]   -> Pushing live execution fill payload (BUY 100 AAPL @ $174.50)
[CLIENT]   <- Ingested trade fill. Appending row to Execution Blotter.
[STREAM]   -> Pushing live dividend event packet (AAPL cash yield: $24.00)
[CLIENT]   <- Ingested timeline point. Re-rendering Equity Curve.
[STATUS]   ✓ Broadcast complete. Connection closed cleanly.`,
      communications: [
        { from: 'Simulation Engine', to: 'FastAPI Server', protocol: 'Python API', label: 'Pipe simulation frames', status: 'success' },
        { from: 'FastAPI Server', to: 'Frontend Workspace', protocol: 'WebSocket Stream', label: 'Stream real-time binary updates', status: 'active' },
        { from: 'Frontend Workspace', to: 'Zustand Storage', protocol: 'Python API', label: 'Ingest coordinate frames', status: 'success' },
        { from: 'Frontend Workspace', to: 'Recharts & TradeLog', protocol: 'Python API', label: 'Re-render curves and data blotters', status: 'success' }
      ]
    }
  }

  const activeWorkflow = workflows[activeTab]

  return (
    <section className="w-full border border-border/80 bg-card/25 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl select-none relative overflow-hidden backdrop-blur-md">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full filter blur-3xl pointer-events-none -mr-40 -mt-40 opacity-75" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 pb-4 gap-4">
        <div className="space-y-1">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            <span>Interactive Workflow Architect</span>
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Behind the Scenes: System Communication & Data Flowcharts
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl font-sans leading-relaxed">
            Select a pipeline stage below to trace the relational communications occurring between the Frontend, FastAPI gateway servers, simulation threads, local databases, and external APIs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted/30 p-1 rounded-xl border border-border/60">
        {(Object.keys(workflows) as Array<'llm' | 'parquet' | 'engine' | 'websocket'>).map((tabKey) => {
          const isActive = activeTab === tabKey
          const label = tabKey === 'llm' ? '1. Strategy Ingestion' : tabKey === 'parquet' ? '2. Ingestion & Storage' : tabKey === 'engine' ? '3. Event Engine' : '4. Live WebSocket'
          return (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 border uppercase tracking-wider ${
                isActive
                  ? 'bg-card text-foreground shadow border-border'
                  : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-card/30'
              }`}
            >
              <span>{label}</span>
            </button>
          )}
        )}
      </div>

      {/* Active Tab System View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
        {/* Left Column: Visual Flowchart & Description */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className={`p-1.5 rounded-lg border bg-card/65 shadow-inner`}>
                {activeWorkflow.icon}
              </div>
              <h3 className="text-md font-bold tracking-tight text-foreground font-sans uppercase">
                {activeWorkflow.title}
              </h3>
            </div>
            
            <p className="text-xs font-semibold text-primary/80 font-mono tracking-wide leading-relaxed">
              {activeWorkflow.tagline}
            </p>
            
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              {activeWorkflow.description}
            </p>
          </div>

          {/* Connected Relational Flowchart (Behind-the-Scenes Communication Diagram) */}
          <div className="border border-border/60 bg-card/15 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm select-none min-h-[260px] flex flex-col justify-center">
            {/* System Pillars */}
            <div className="grid grid-cols-3 gap-2 text-center border-b border-border/30 pb-3 mb-6 select-none shrink-0">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 border border-border/40 py-1 rounded">
                CLIENT WORKSPACE
              </div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 border border-border/40 py-1 rounded">
                FASTAPI GATEWAY
              </div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 border border-border/40 py-1 rounded">
                CORE PIPELINE
              </div>
            </div>

            {/* Comm Steps Grid */}
            <div className="space-y-3.5 relative z-10">
              {activeWorkflow.communications.map((comm, idx) => {
                const isActive = comm.status === 'active'
                return (
                  <div 
                    key={idx}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-2.5 bg-card/85 shadow-sm transition-all duration-300 hover:border-primary/30 gap-2.5 ${
                      isActive 
                        ? 'border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5 bg-background' 
                        : 'border-border/60'
                    }`}
                  >
                    {/* Node Communication Entities */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[9px] font-mono font-bold bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/60">
                        {comm.from}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      <span className="text-[9px] font-mono font-bold bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                        {comm.to}
                      </span>
                    </div>

                    {/* Protocol and Action detail */}
                    <div className="flex items-center justify-between sm:justify-end flex-1 gap-4">
                      <span className="text-[10px] font-sans font-bold text-foreground truncate max-w-[180px] sm:max-w-none">
                        {comm.label}
                      </span>
                      <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                        comm.protocol === 'WebSocket Stream' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                          : comm.protocol === 'HTTP POST'
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25'
                          : comm.protocol === 'REST HTTPS API'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          : comm.protocol === 'Disk read/write Snappy'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      }`}>
                        {comm.protocol}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Code Terminal / Log Mockup */}
        <div className="lg:col-span-5 flex flex-col min-h-[300px]">
          <div className="flex-1 border border-border/80 bg-black/90 rounded-2xl overflow-hidden flex flex-col font-mono shadow-2xl relative">
            {/* Terminal Title Bar */}
            <div className="h-9 bg-muted/15 border-b border-border flex items-center px-4 justify-between shrink-0 select-none">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 animate-pulse" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted/40" />
              </div>
              <span className="text-[9px] text-muted-foreground/80 font-mono tracking-wider flex items-center space-x-1">
                <Terminal className="h-3 w-3" />
                <span>{activeWorkflow.terminalLabel}</span>
              </span>
              <div className="w-8" />
            </div>

            {/* Terminal Screen Console */}
            <div className="flex-1 overflow-auto p-4 text-[10px] leading-relaxed text-zinc-300 font-mono bg-zinc-950/80">
              <pre className="whitespace-pre-wrap font-mono">
                {activeWorkflow.terminalOutput}
              </pre>
            </div>
            
            {/* Overlay Indicator */}
            <div className="absolute bottom-3 right-3 select-none pointer-events-none text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest flex items-center space-x-1 border border-border/10 bg-black/45 px-2 py-0.5 rounded">
              <Code2 className="h-3 w-3" />
              <span>LIVE WIRESHARK BROADCAST FEED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech list tag list */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-4 border-t border-border/40 text-muted-foreground/60 select-none text-[9px] font-mono leading-none">
        <span className="text-muted-foreground font-semibold">Comm protocols verified:</span>
        <span className="font-semibold text-foreground/80">REST HTTPS API</span>
        <span>•</span>
        <span className="font-semibold text-foreground/80">HTTP POST Payload</span>
        <span>•</span>
        <span className="font-semibold text-foreground/80">asyncio Websocket binary streaming</span>
        <span>•</span>
        <span className="font-semibold text-foreground/80">Parquet Local Read/Write Scan IO</span>
      </div>
    </section>
  )
}
