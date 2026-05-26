'use client'

import React from 'react'
import {
  TrendingUp,
  Brain,
  Zap,
  BarChart3,
  Workflow,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
import ArchitecturePanel from '@/components/sections/ArchitecturePanel'

interface LandingPageProps {
  onLaunch?: () => void
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const handleLaunch = () => {
    if (onLaunch) {
      onLaunch()
    } else {
      window.open('/terminal', '_blank')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* ─── HERO ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-[92vh] px-6 text-center overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 30%, var(--primary) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 75% 60%, #8b5cf6 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(to right, var(--foreground) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm text-[11px] font-mono font-medium text-muted-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Open-Source Quantitative Research Platform
          </div>

          {/* Logo + Title */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 shadow-lg shadow-primary/5">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/60">
                Strategy Research
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-violet-500">
                Terminal
              </span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Describe a trading strategy in plain English. Backtest it against real market data.
            Stream institutional-grade risk metrics in real time — powered by an event-driven
            simulation engine with{' '}
            <span className="text-foreground font-semibold">126 verified tests</span>.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleLaunch}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold
                         bg-primary text-primary-foreground
                         hover:bg-primary/90 active:scale-[0.97]
                         shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                         transition-all duration-200 cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Launch Terminal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="https://github.com/khushal0811/strategy-research-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                         border border-border bg-card/60 text-foreground/80
                         hover:bg-card hover:text-foreground hover:border-foreground/20
                         transition-all duration-200"
            >
              <GithubIcon className="h-4 w-4" />
              View Source
            </a>
          </div>

          {/* Tech stack pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {['Python', 'FastAPI', 'Next.js 15', 'React 19', 'WebSocket', 'Groq LLM', 'Parquet'].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-medium bg-muted/60 text-muted-foreground border border-border/60"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="px-6 py-24 bg-card/30">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Everything you need for strategy research
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              From natural language input to AI-generated performance reports — a complete pipeline
              for quantitative backtesting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="h-5 w-5" />}
              iconColor="text-violet-500"
              iconBg="bg-violet-500/10 border-violet-500/20"
              title="Natural Language Strategies"
              description="Describe your strategy in plain English — 'RSI with 30/70 thresholds on AAPL' — and the Groq LLM resolves it to a precise engine configuration."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10 border-amber-500/20"
              title="Real-Time WebSocket Streaming"
              description="Watch your equity curve, trade fills, and dividend events render bar-by-bar via live WebSocket streaming. No page refreshes, no polling."
            />
            <FeatureCard
              icon={<Workflow className="h-5 w-5" />}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              title="10 Built-In Strategies"
              description="Moving Average Crossover, RSI, MACD, Bollinger Bands, Momentum, Mean Reversion, Breakout, Dual Momentum, Trend Following, and VWAP Mean Reversion."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10 border-blue-500/20"
              title="Full Risk Analytics"
              description="Total return, CAGR, Sharpe ratio, max drawdown, volatility, win rate, alpha vs benchmark, dividend income — computed on every run."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              iconColor="text-indigo-500"
              iconBg="bg-indigo-500/10 border-indigo-500/20"
              title="AI-Generated Reports"
              description="After each backtest, Groq LLM generates a structured performance analysis covering returns, risk, trading efficiency, and optimization recommendations."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              iconColor="text-teal-500"
              iconBg="bg-teal-500/10 border-teal-500/20"
              title="Deterministic Engine"
              description="Same input always produces identical output. Zero lookahead bias, FIFO event queue, 126 verified tests across all components including stress and determinism checks."
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
              SYSTEM WORKFLOW
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Real-Time Ingestion & Execution Flowcharts
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed font-sans">
              Trace how your strategy configurations execute deterministically across our client, server, and local database cache layers.
            </p>
          </div>

          {/* Architecture panel */}
          <ArchitecturePanel />
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section className="px-6 py-24 bg-card/30">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
            ENGINEERING & AUTHORSHIP
          </p>
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Khushal Arora
            </h2>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider font-mono">
              Systems Architect & Quantitative Developer
            </p>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed font-sans">
              Strategy Research Terminal is an institutional-grade, open-source quantitative platform. It was engineered to demonstrate high-performance event-driven simulation loop designs, asynchronous real-time binary serialization over WebSockets, Snappy-compressed columnar Parquet data caching, and robust automated test coverage.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/khushal0811"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold
                         border border-border bg-card/60 text-foreground/80
                         hover:bg-card hover:text-foreground hover:border-foreground/20
                         transition-all duration-200"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href="https://www.linkedin.com/in/khushalarora11"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold
                         border border-border bg-card/60 text-foreground/80
                         hover:bg-card hover:text-foreground hover:border-foreground/20
                         transition-all duration-200"
            >
              <LinkedinIcon className="h-4 w-4" />
              LinkedIn
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Ready to backtest?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Open the terminal, describe your strategy, and watch the simulation run live.
          </p>
          <button
            onClick={handleLaunch}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold
                       bg-primary text-primary-foreground
                       hover:bg-primary/90 active:scale-[0.97]
                       shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                       transition-all duration-200 cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Launch Terminal
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-mono">
          <span>Strategy Research Terminal · Khushal Arora</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/khushal0811/strategy-research-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Source Code
            </a>
            <span className="text-border">·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Feature Card ── */
function FeatureCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  title: string
  description: string
}) {
  return (
    <div className="group border border-border bg-card/65 rounded-xl p-6 space-y-4
                    transition-all duration-300 hover:border-primary/30 hover:bg-card/90
                    hover:shadow-lg hover:shadow-primary/5">
      <div className={`inline-flex p-2.5 rounded-lg border ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <h3 className="text-sm font-bold tracking-wide text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
