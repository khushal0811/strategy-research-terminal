'use client'

import React from 'react'
import { Database, Cpu, Zap, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TechCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  content: string
  tags: string[]
}

function TechCard({ icon, iconBg, title, content, tags }: TechCardProps) {
  return (
    <Card className="border border-border bg-card/65 transition-all duration-300 hover:border-primary/40 hover:bg-card/90 shadow-sm flex flex-col h-full">
      <CardContent className="p-6 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg border border-border flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
            <h3 className="font-bold text-sm tracking-wide text-foreground font-sans">
              {title}
            </h3>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {content}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[10px] font-medium font-mono bg-secondary/80 text-secondary-foreground border border-border/60"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function HowItWorks() {
  return (
    <div className="space-y-6 w-full">
      <div className="space-y-2">
        <h2 className="text-base font-bold tracking-tight text-foreground font-sans">
          Under the Hood: System Architecture
        </h2>
        <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
          The Strategy Research Terminal decouples historical backtest evaluation, real-time messaging, data pipelining, and user intent parsing into four highly optimized components.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TechCard
          icon={<Database className="h-4.5 w-4.5 text-blue-500" />}
          iconBg="bg-blue-500/10 border-blue-500/20"
          title="Deterministic Data Infrastructure"
          content="Historical OHLCV data fetched via yfinance with auto_adjust=True to handle stock splits automatically. Data normalized to UTC, stored as Parquet files partitioned by symbol. Dividend history stored separately. A metadata API (get_symbol_info) lets the frontend check data availability per ticker before running — no silent gaps."
          tags={['Python', 'yfinance', 'PyArrow', 'Parquet']}
        />

        <TechCard
          icon={<Cpu className="h-4.5 w-4.5 text-emerald-500" />}
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          title="Zero-Lookahead Event Loop"
          content="A FIFO event queue processes one bar at a time: MarketEvent → Strategy → SignalEvent → OrderManager → OrderEvent → ExecutionEngine → FillEvent → Portfolio → Metrics. The engine is fully deterministic — same config plus same data always produces identical results. 108 tests verify this across all components including stress tests, determinism checks, and edge cases."
          tags={['Python', 'Event-Driven', '108 Tests', 'Deterministic']}
        />

        <TechCard
          icon={<Zap className="h-4.5 w-4.5 text-amber-500" />}
          iconBg="bg-amber-500/10 border-amber-500/20"
          title="Non-Blocking Async Streaming"
          content="The backtesting engine is synchronous. FastAPI runs it inside a thread pool executor (run_in_executor) so it never blocks the async event loop. An asyncio.Queue bridges the engine's emit_callback to the WebSocket handler using run_coroutine_threadsafe. The frontend receives progress, trade, dividend, and complete messages in real time."
          tags={['FastAPI', 'WebSocket', 'asyncio', 'Thread Pool']}
        />

        <TechCard
          icon={<Sparkles className="h-4.5 w-4.5 text-indigo-500" />}
          iconBg="bg-indigo-500/10 border-indigo-500/20"
          title="LLM as Interpreter, Not Executor"
          content="Natural language strategy descriptions are resolved by Groq (llama-3.3-70b-versatile) into structured JSON configs matching the engine's STRATEGY_REGISTRY. The LLM never touches execution — it only interprets. json_object response format enforces valid JSON output. The same pattern applies to universe resolution: 'large cap US tech' becomes a validated symbol list."
          tags={['Groq', 'llama-3.3-70b', 'JSON Mode', 'Strategy Registry']}
        />
      </div>
    </div>
  )
}
