'use client'

import React from 'react'

interface BoxProps {
  step: string
  title: string
  borderClass: string
  subText: string
  bullets: string[]
}

function PipelineBox({ step, title, borderClass, subText, bullets }: BoxProps) {
  return (
    <div className={`border border-border bg-card/65 rounded-lg p-3.5 space-y-2.5 transition-all duration-300 hover:bg-card/90 shadow-sm flex flex-col justify-between ${borderClass}`}>
      <div className="space-y-2.5">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold font-mono uppercase tracking-wider text-foreground">
              {title}
            </div>
            <div className="text-[9px] font-mono text-muted-foreground/75">
              {subText}
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold text-muted-foreground/50 border border-border/60 bg-muted/20 px-1 py-0.2 rounded select-none">
            {step}
          </span>
        </div>
        <ul className="space-y-1 select-none">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="text-[10px] text-muted-foreground/90 flex items-center space-x-1.5 font-sans leading-tight">
              <span className="text-[8px] text-primary/60">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function ArchitecturePanel() {
  return (
    <section className="w-full border border-border bg-card/25 rounded-xl p-5 space-y-5 select-none">
      <div className="space-y-0.5 border-b border-border/40 pb-2">
        <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          SYSTEM EXECUTION PIPELINE
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PipelineBox
          step="01"
          title="Next.js Frontend"
          borderClass="border-t-2 border-t-primary"
          subText="User Workspace"
          bullets={[
            'NL/Python Input Fields',
            'Groq LLM Strategy Resolver',
            'Live WebSocket Client Broker'
          ]}
        />

        <PipelineBox
          step="02"
          title="FastAPI Backend"
          borderClass="border-t-2 border-t-amber-500"
          subText="Async Server Bridge"
          bullets={[
            'Pydantic Config Validation',
            'WebSocket Streaming Server',
            'Engine execution thread pool'
          ]}
        />

        <PipelineBox
          step="03"
          title="Event-Driven Engine"
          borderClass="border-t-2 border-t-emerald-500"
          subText="Simulation Loop"
          bullets={[
            'Deterministic backtest queue',
            'Zero-lookahead event state',
            '108 integration & unit tests'
          ]}
        />

        <PipelineBox
          step="04"
          title="Market Data Pipeline"
          borderClass="border-t-2 border-t-blue-500"
          subText="Data Infrastructure"
          bullets={[
            'Yahoo Finance auto_adjust API',
            'Parquet time-series storage',
            'Dividend income historical logic'
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-2 border-t border-border/40 text-muted-foreground/60 select-none">
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">Python 3.11</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">FastAPI</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">Next.js 15</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">Recharts</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">Groq</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">asyncio</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">WebSocket</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">PyArrow</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">Parquet</span>
        <span className="text-[9px] font-mono">•</span>
        <span className="font-mono text-[9px] text-muted-foreground font-semibold">108 Tests</span>
      </div>
    </section>
  )
}
