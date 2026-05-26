'use client'

import React, { useState, useEffect } from 'react'
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
  LineChart,
  Activity,
  CheckCircle2,
  Terminal,
  ArrowUpRight,
  Lock,
  Server,
  Code,
  Database
} from 'lucide-react'
import ArchitecturePanel from '@/components/sections/ArchitecturePanel'

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

interface LandingPageProps {
  onLaunch?: () => void
}

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLaunch = () => {
    if (onLaunch) {
      onLaunch()
    } else {
      window.open('/terminal', '_blank')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-[#F8FAFC] overflow-x-hidden font-sans antialiased selection:bg-blue-600/35">
      {/* Subtle Background Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage:
            'linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(to right, #F8FAFC 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          background: 'radial-gradient(circle 800px at 50% 200px, #0A0F1F, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 left-0 w-full h-14 z-50 border-b transition-all duration-300 select-none ${
          scrolled
            ? 'bg-[#030712]/80 backdrop-blur-md border-white/[0.06] shadow-lg'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1600px] h-full mx-auto px-6 flex items-center justify-between">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-2.5">
            <div className="p-1 rounded bg-[#2563EB]/10 border border-[#2563EB]/35">
              <TrendingUp className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
              Strategy Research Terminal
            </span>
          </div>

          {/* Center Navigation links */}
          <div className="hidden md:flex items-center space-x-6 text-[10px] font-mono font-bold uppercase tracking-widest text-[#94A3B8]">
            <a href="#features" className="hover:text-[#F8FAFC] transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-[#F8FAFC] transition-colors">
              Workflow
            </a>
            <a href="#preview" className="hover:text-[#F8FAFC] transition-colors">
              Terminal
            </a>
            <a href="#performance" className="hover:text-[#F8FAFC] transition-colors">
              Performance
            </a>
            <a
              href="https://github.com/khushal0811/strategy-research-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#F8FAFC] transition-colors flex items-center space-x-1"
            >
              <span>GitHub</span>
              <ArrowUpRight className="h-2.5 w-2.5" />
            </a>
          </div>

          {/* Right Button */}
          <div>
            <button
              onClick={handleLaunch}
              className="px-3.5 py-1.5 rounded bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.97] text-[10px] font-mono font-bold uppercase tracking-wider text-[#F8FAFC] transition-all duration-200 border border-blue-500/30 cursor-pointer shadow-sm shadow-[#2563EB]/25"
            >
              Launch Terminal →
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative flex flex-col justify-center min-h-[95vh] px-6 max-w-[1600px] mx-auto z-10 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Side: Product Messaging */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-white/[0.06] bg-[#0A0F1F]/60 backdrop-blur-sm text-[9px] font-mono font-bold uppercase tracking-widest text-[#94A3B8]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              </span>
              Deterministic Strategy Infrastructure
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#F8FAFC] font-sans">
              Describe strategies in plain English.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6]">
                Run lookahead-free simulations.
              </span>
            </h1>

            <p className="text-sm text-[#94A3B8] max-w-xl leading-relaxed">
              An event-driven backtesting platform designed for systematic traders and quantitative researchers. Translate natural language rules into deterministic simulations against high-precision market series—verified by <span className="text-[#34D399] font-mono font-bold bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/20">126 integration specs</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleLaunch}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.97] text-xs font-mono font-bold uppercase tracking-widest text-[#F8FAFC] border border-blue-500/30 transition-all duration-200 cursor-pointer shadow-lg shadow-[#2563EB]/15"
              >
                <span>Launch Terminal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <a
                href="https://github.com/khushal0811/strategy-research-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-white/[0.06] bg-[#0A0F1F]/60 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/10 text-xs font-mono font-bold uppercase tracking-widest transition-all duration-200"
              >
                <GithubIcon className="h-4 w-4" />
                <span>View Source</span>
              </a>
            </div>

            {/* Live activity indicator bar */}
            <div className="flex items-center space-x-6 text-[9px] font-mono text-[#64748B] pt-4 select-none">
              <div className="flex items-center space-x-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                <span className="font-bold text-[#94A3B8]">STREAMING CLIENT OK</span>
              </div>
              <div>•</div>
              <div>LATENCY: &lt;0.5ms</div>
              <div>•</div>
              <div>ENGINE: Python 3.11</div>
            </div>
          </div>

          {/* Hero Right Side: Product Visual Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="border border-white/[0.08] bg-[#0A0F1F]/90 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono max-w-full">
              {/* Mockup Title bar */}
              <div className="h-8 bg-black/40 border-b border-white/[0.06] flex items-center px-4 justify-between select-none">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#64748B]/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#64748B]/30" />
                </div>
                <span className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest flex items-center space-x-1">
                  <Activity className="h-3 w-3 text-[#3B82F6]" />
                  <span>STRATEGY_RUNNER_MONITOR</span>
                </span>
                <span className="text-[8px] font-mono text-[#10B981] font-bold flex items-center space-x-1">
                  <span className="h-1 w-1 rounded-full bg-[#10B981] animate-ping" />
                  <span>● LIVE STREAM</span>
                </span>
              </div>

              {/* Mockup Terminal Core Contents */}
              <div className="p-4 bg-black/60 space-y-4 text-left select-none overflow-x-auto min-h-[300px]">
                {/* Metric Strip */}
                <div className="grid grid-cols-3 gap-2.5 border border-white/[0.06] bg-[#0A0F1F]/40 p-2.5 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-[8px] text-[#64748B] block uppercase tracking-wider mb-0.5">Sharpe Ratio</span>
                    <span className="font-bold text-[#F8FAFC]">1.54</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#64748B] block uppercase tracking-wider mb-0.5">Max Drawdown</span>
                    <span className="font-bold text-rose-500">-11.20%</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#64748B] block uppercase tracking-wider mb-0.5">Alpha vs SPY</span>
                    <span className="font-bold text-[#34D399]">+18.92%</span>
                  </div>
                </div>

                {/* Plot Curve (SVG mockup) */}
                <div className="h-28 border border-white/[0.06] rounded-lg bg-black/30 p-2 relative flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[8px] text-[#64748B] font-mono border-b border-white/[0.04] pb-1 select-none">
                    <span>PORTFOLIO VALUATION CURVE</span>
                    <span>$100,000.00 → $131,420.00</span>
                  </div>
                  {/* SVG Plot */}
                  <svg className="w-full h-16" viewBox="0 0 400 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    {/* Benchmark curve */}
                    <path d="M 0,45 Q 100,42 200,38 T 400,28" stroke="#64748B" strokeWidth="1" strokeDasharray="3,2" />
                    {/* Portfolio curves */}
                    <path d="M 0,55 Q 80,48 160,35 T 280,24 T 400,12" stroke="#3B82F6" strokeWidth="2" />
                  </svg>
                  <div className="flex items-center justify-between text-[7px] text-[#64748B] select-none font-mono">
                    <span className="flex items-center space-x-1">
                      <span className="h-1 w-1 rounded-full bg-[#3B82F6]" />
                      <span>Portfolio Equity (+31.4%)</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="h-1 w-1 rounded-full bg-[#64748B]" />
                      <span>S&P 500 Index Benchmark (+12.5%)</span>
                    </span>
                  </div>
                </div>

                {/* Event Logs stream */}
                <div className="text-[9px] text-[#94A3B8] space-y-1 font-mono leading-relaxed select-none max-h-24 overflow-y-auto">
                  <div className="text-[#64748B] border-b border-white/[0.04] pb-0.5 select-none uppercase tracking-wider block mb-1">REAL-TIME EXECUTION LOGS</div>
                  <div>[14:02:11] Ingested Yahoo Parquet bar AAPL @ $174.50</div>
                  <div>[14:02:12] <span className="text-[#34D399] font-bold">BUY FILL</span> 100 AAPL @ $174.50 (Value: $17,450.00)</div>
                  <div>[14:02:12] Adjusted Cash: $82,550.00 | Portfolio Equity: $100,000.00</div>
                  <div>[14:02:13] <span className="text-rose-500 font-bold">DIVIDEND PAY</span> AAPL cash distribution +$24.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="border-y border-white/[0.06] bg-[#050816]/60 py-6 select-none z-10 relative">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-[#64748B] text-[10px] font-mono uppercase tracking-widest font-bold">
          <span>Python 3.11</span>
          <span>FastAPI</span>
          <span>Next.js 15</span>
          <span>PostgreSQL</span>
          <span>WebSockets</span>
          <span>Apache Parquet</span>
          <span>PyArrow</span>
          <span>Pandas</span>
        </div>
      </section>

      {/* ─── FEATURES GRID (3x2 Dense Card layout) ─── */}
      <section id="features" className="px-6 py-24 bg-[#050816]/30 border-b border-white/[0.04] relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-16">
          <div className="text-left max-w-2xl space-y-3">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
              TECHNICAL SYSTEM SPECIFICATION
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] font-sans">
              Platform Capabilities & Backtesting Tier
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Designed from first principles to ensure mathematical accuracy, lookahead-free order fills, and high-performance pipeline caching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="h-4 w-4" />}
              title="Natural Language Strategies"
              description="Describe rules in natural English (e.g. 'RSI with 30/70 thresholds on AMD'). Groq LLM system prompts compile your intent into type-safe, validated JSON configuration schemas."
            />
            <FeatureCard
              icon={<Zap className="h-4 w-4" />}
              title="Real-Time WebSocket Streaming"
              description="Watch equity valuations, trade matches, and cash distributions stream bar-by-bar via active async WebSockets. Built on uvicorn streams with minimal frame delivery lag."
            />
            <FeatureCard
              icon={<Workflow className="h-4 w-4" />}
              title="10 Built-In Strategy Kernels"
              description="Features integrated strategies: Moving Average Crossover, RSI, MACD, Bollinger Bands, Momentum, Mean Reversion, Breakout, Dual Momentum, Trend Following, and VWAP."
            />
            <FeatureCard
              icon={<BarChart3 className="h-4 w-4" />}
              title="Spacious Risk Analytics"
              description="Calculates professional portfolio instrumentation: Sharpe ratio, max drawdown, volatility metrics, compound annual growth rate (CAGR), alpha vs benchmark index, and cash dividend yields."
            />
            <FeatureCard
              icon={<Sparkles className="h-4 w-4" />}
              title="AI-Generated Reports"
              description="Utilizes LLM parsing models to auto-generate deep performance writeups after each run, detailing return profiles, strategic efficiency scores, and mathematical optimizations."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Lookahead-Free Event Loop"
              description="Ensures execution determinism. Processes bars sequentially inside a strict FIFO queue.unit-tested with 126 integration specs ensuring exact price synchronization and zero lookahead bias."
            />
          </div>
        </div>
      </section>

      {/* ─── SYSTEM WORKFLOW SECTION ─── */}
      <section id="workflow" className="px-6 py-24 relative z-10 border-b border-white/[0.04]">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="text-left max-w-2xl space-y-3">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
              EXECUTION PIPELINE DIAGRAM
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] font-sans">
              System Communication & Sequence Workflows
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Trace the exact behind-the-scenes communication workflows, protocols, and data models exchanged between client frontends, backend servers, database systems, and external brokers.
            </p>
          </div>

          {/* Interactive Flowcharts and Observation Terminal */}
          <ArchitecturePanel />
        </div>
      </section>

      {/* ─── LIVE TERMINAL PREVIEW (Bloomberg/Datadog-like High-Fidelity UI Mockup) ─── */}
      <section id="preview" className="px-6 py-24 bg-[#050816]/30 border-b border-white/[0.04] relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
              PLATFORM WORKSPACE OBSERVABILITY
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] font-sans">
              High-Fidelity Quantitative Workspace
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Explore the dense, highly organized terminal workspace containing real-time instrumentation, charting panels, logs, configuration sidebars, and execution blotters.
            </p>
          </div>

          {/* Large Terminal Mockup Visual */}
          <div className="border border-white/[0.08] bg-[#0A0F1F]/90 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono w-full max-w-6xl mx-auto select-none">
            {/* Title Bar */}
            <div className="h-9 bg-black/40 border-b border-white/[0.06] flex items-center px-4 justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-[#64748B]/30" />
                <div className="w-3 h-3 rounded-full bg-[#64748B]/30" />
              </div>
              <span className="text-[10px] text-[#94A3B8] font-bold tracking-widest flex items-center space-x-1.5 uppercase font-mono">
                <Terminal className="h-4 w-4 text-[#3B82F6]" />
                <span>Strategy_Terminal_v1.0.0</span>
              </span>
              <div className="flex items-center space-x-1 text-[9px] text-[#10B981] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span>WORKSPACE_CONNECTED</span>
              </div>
            </div>

            {/* Bloomberg-styled Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 h-[480px]">
              {/* Left Panel: Settings Mockup (Cols 1-4) */}
              <div className="md:col-span-4 border-r border-white/[0.06] bg-black/20 p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="text-[10px] text-[#64748B] border-b border-white/[0.04] pb-1 font-bold uppercase tracking-wider">STRATEGY PROPERTIES</div>
                  
                  {/* Prompt Field */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-[#64748B] uppercase tracking-wider block">Natural language rules</label>
                    <div className="border border-white/[0.08] bg-[#030712] rounded p-2 text-[10px] text-[#F8FAFC]">
                      Moving Average crossover on AMD daily using 20 and 50 thresholds
                    </div>
                  </div>

                  {/* Settings grid */}
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <span className="text-[8px] text-[#64748B] block">TICKER SYMBOLS</span>
                      <span className="text-[#F8FAFC] font-semibold font-mono">AMD</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#64748B] block">TIME INTERVAL</span>
                      <span className="text-[#F8FAFC] font-semibold font-mono">Daily (Snappy)</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#64748B] block">INITIAL CAPITAL</span>
                      <span className="text-[#F8FAFC] font-semibold font-mono">$100,000.00</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#64748B] block">EXECUTION COMMISSION</span>
                      <span className="text-[#F8FAFC] font-semibold font-mono">0.00% (No Fee)</span>
                    </div>
                  </div>
                </div>

                {/* History Trigger Card Mockup */}
                <div className="border border-white/[0.06] bg-[#0A0F1F]/40 p-2.5 rounded-lg flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-[#3B82F6]" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[#F8FAFC]">Run History</span>
                      <span className="text-[8px] text-[#64748B]">View 12 saved backtests</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[#64748B]/20 text-[#94A3B8] font-bold font-mono text-[8px]">12</span>
                </div>
              </div>

              {/* Center Panel: Curves & Charts (Cols 5-9) */}
              <div className="md:col-span-5 bg-black/45 p-4 flex flex-col justify-between overflow-y-auto">
                <div className="text-[10px] text-[#64748B] border-b border-white/[0.04] pb-1 font-bold uppercase tracking-wider">PERFORMANCE INSTRUMENTATION</div>

                {/* Main plot mockup */}
                <div className="h-56 flex flex-col justify-between pt-2">
                  <svg className="w-full h-44" viewBox="0 0 350 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid lines */}
                    <line x1="0" y1="28" x2="350" y2="28" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="56" x2="350" y2="56" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="84" x2="350" y2="84" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="112" x2="350" y2="112" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    {/* Benchmark Curve */}
                    <path d="M 0,110 Q 90,95 180,82 T 350,68" stroke="#64748B" strokeWidth="1" strokeDasharray="3,2" />
                    {/* Portfolio Curve */}
                    <path d="M 0,120 Q 70,88 150,65 T 260,34 T 350,18" stroke="#3B82F6" strokeWidth="2" />
                  </svg>
                  
                  <div className="flex justify-between items-center text-[7px] text-[#64748B] font-mono select-none">
                    <span className="flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
                      <span className="text-[#94A3B8]">VALUATION: +31.42%</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                      <span className="text-[#94A3B8]">BENCHMARK: +12.50%</span>
                    </span>
                  </div>
                </div>

                {/* Sub metrics stats strip */}
                <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-white/[0.04] pt-3">
                  <div>
                    <span className="text-[7px] text-[#64748B] block">CUMULATIVE RETURN</span>
                    <span className="text-[#34D399] font-bold">+31.42%</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-[#64748B] block">VOLATILITY</span>
                    <span className="text-[#F8FAFC] font-bold">14.28%</span>
                  </div>
                </div>
              </div>

              {/* Right Panel: Trade Blotter & Console logs (Cols 10-12) */}
              <div className="md:col-span-3 border-l border-white/[0.06] bg-black/20 p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="text-[10px] text-[#64748B] border-b border-white/[0.04] pb-1 font-bold uppercase tracking-wider">EXECUTION BLOTTER</div>
                  
                  {/* Fills table mock */}
                  <div className="text-[8px] space-y-2 font-mono">
                    <div className="flex justify-between text-[#64748B] border-b border-white/[0.04] pb-0.5">
                      <span>SYMBOL</span>
                      <span>SIDE</span>
                      <span>QTY</span>
                      <span>PRICE</span>
                    </div>
                    <div className="flex justify-between text-[#F8FAFC]">
                      <span>AMD</span>
                      <span className="text-[#34D399] font-bold">BUY</span>
                      <span>150</span>
                      <span>$165.20</span>
                    </div>
                    <div className="flex justify-between text-[#F8FAFC]">
                      <span>AMD</span>
                      <span className="text-[#34D399] font-bold">BUY</span>
                      <span>200</span>
                      <span>$168.40</span>
                    </div>
                    <div className="flex justify-between text-[#F8FAFC]">
                      <span>AMD</span>
                      <span className="text-rose-500 font-bold">SELL</span>
                      <span>350</span>
                      <span>$184.10</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  <div className="text-[8px] text-[#64748B] uppercase tracking-wider font-bold">System Status</div>
                  <div className="flex items-center justify-between text-[8px] text-[#94A3B8]">
                    <span>126 passing tests</span>
                    <span className="text-[#34D399] font-bold">✓ 100% OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PERFORMANCE SECTION (Deterministic Execution & 126 passing tests) ─── */}
      <section id="performance" className="px-6 py-24 border-b border-white/[0.04] relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Stat Blocks */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
                PLATFORM STABILITY & COVERAGE
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] font-sans">
                Engineered for Complete Execution Accuracy
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Quantitative algorithms require perfect reproducibility. We have built an event-driven time-series backend that processes every bar with complete correctness, ensuring that your logic runs exactly the same, every time.
              </p>
              
              {/* Massive coverage block */}
              <div className="border border-white/[0.06] bg-[#0A0F1F]/40 p-5 rounded-2xl flex items-center space-x-6">
                <div className="text-4xl font-extrabold text-[#34D399] font-mono">
                  126
                </div>
                <div className="flex flex-col text-left space-y-1 select-none">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#F8FAFC] tracking-wider">Verified Test Specifications</span>
                  <span className="text-[9px] text-[#64748B] leading-tight">Comprehensive integration, unit, and stress checks running on each backend iteration.</span>
                </div>
              </div>
            </div>

            {/* Right Col: Mathematical Rigor features */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <RigorFeatureCard
                title="FIFO Queue event loop"
                description="Simulates time tick-by-tick. Prevents future data leaks (lookahead bias) entirely by loading bar datasets sequentially inside asyncio execution queues."
              />
              <RigorFeatureCard
                title="Dividend-Yield Reinvestment"
                description="Processes historical cash distribution tables. Yield actions are calculated and automatically compounded into your portfolio cash curve dynamically."
              />
              <RigorFeatureCard
                title="Transaction Cost Math"
                description="Simulates market friction. Accounts for custom transaction slips and execution commissions, giving you highly realistic backtesting results."
              />
              <RigorFeatureCard
                title="Apache Parquet Cache Storage"
                description="Stores high-volume daily time series in snappy compressed local Parquet tables, lowering cache file reading scanned latency to under 0.2 milliseconds."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / ARCHITECTURE SECTION ─── */}
      <section className="px-6 py-24 bg-[#050816]/30 border-b border-white/[0.04] relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
            ENGINEERING & AUTHORSHIP
          </p>
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] font-sans uppercase">
              Khushal Arora
            </h2>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
              Systems Architect & Quantitative Developer
            </p>
            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl mx-auto font-sans">
              Strategy Research Terminal is an institutional-grade, open-source backtesting system. It was designed from the ground up to demonstrate event-driven architecture models, Snappy-compressed Parquet IO data pipelines, real-time WebSocket binary streaming frameworks, and comprehensive test suite validation.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 select-none">
            <a
              href="https://github.com/khushal0811"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/[0.06] bg-[#0A0F1F]/60 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/10 text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-200"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-[#64748B]" />
            </a>
            <a
              href="https://www.linkedin.com/in/khushalarora11"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-white/[0.06] bg-[#0A0F1F]/60 text-[#94A3B8] hover:text-[#F8FAFC] hover:border-white/10 text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-200"
            >
              <LinkedinIcon className="h-4 w-4" />
              <span>LinkedIn</span>
              <ExternalLink className="h-3 w-3 text-[#64748B]" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="px-6 py-28 relative z-10">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC] font-sans">
            Ready to research?
          </h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed max-w-md mx-auto">
            Launch the terminal workspace, describe strategy kernels in natural English, and run deterministic backtests against adjusted historical data.
          </p>
          <button
            onClick={handleLaunch}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.97] text-xs font-mono font-bold uppercase tracking-widest text-[#F8FAFC] border border-blue-500/30 transition-all duration-200 cursor-pointer shadow-lg shadow-[#2563EB]/25"
          >
            <span>Launch Terminal</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] bg-[#030712] px-6 py-12 relative z-10">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left">
          {/* Col 1 */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#F8FAFC] tracking-wider block">Product</span>
            <ul className="space-y-2 text-[10px] font-mono text-[#64748B]">
              <li><button onClick={handleLaunch} className="hover:text-[#F8FAFC] transition-colors">Strategy Workspace</button></li>
              <li><a href="#features" className="hover:text-[#F8FAFC] transition-colors">Specification Tier</a></li>
              <li><a href="#preview" className="hover:text-[#F8FAFC] transition-colors">Terminal Preview</a></li>
            </ul>
          </div>
          {/* Col 2 */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#F8FAFC] tracking-wider block">Docs & Ingestion</span>
            <ul className="space-y-2 text-[10px] font-mono text-[#64748B]">
              <li><a href="#workflow" className="hover:text-[#F8FAFC] transition-colors">System Workflows</a></li>
              <li><a href="#performance" className="hover:text-[#F8FAFC] transition-colors">Deterministic loop logic</a></li>
              <li><span className="text-zinc-600 select-none">126 verified tests</span></li>
            </ul>
          </div>
          {/* Col 3 */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#F8FAFC] tracking-wider block">GitHub Modules</span>
            <ul className="space-y-2 text-[10px] font-mono text-[#64748B]">
              <li><a href="https://github.com/khushal0811/strategy-research-platform" target="_blank" rel="noopener noreferrer" className="hover:text-[#F8FAFC] transition-colors">Core platform repo</a></li>
              <li><a href="https://github.com/khushal0811/strategy-research-terminal" target="_blank" rel="noopener noreferrer" className="hover:text-[#F8FAFC] transition-colors">Submodule frontend</a></li>
            </ul>
          </div>
          {/* Col 4 */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#F8FAFC] tracking-wider block">Terms</span>
            <ul className="space-y-2 text-[10px] font-mono text-[#64748B]">
              <li><span className="text-zinc-600 select-none">MIT Open Source License</span></li>
              <li><span className="text-zinc-600 select-none">No lookahead strategy system</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1600px] mx-auto pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-[#64748B] font-mono">
          <span>Strategy Research Terminal · Engineered by Khushal Arora</span>
          <span>© 2026. All rights reserved. Open-source under MIT.</span>
        </div>
      </footer>
    </div>
  )
}

/* ── Feature Card ── */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group border border-white/[0.06] bg-[#050816]/60 rounded-xl p-6 space-y-4 select-none
                    transition-all duration-300 hover:border-[#3B82F6]/30 hover:bg-[#0A0F1F]/70
                    hover:shadow-lg hover:shadow-[#2563EB]/5 text-left">
      <div className="inline-flex p-2.5 rounded-lg border border-white/[0.06] bg-[#0A0F1F]/80 text-[#3B82F6] group-hover:text-[#60A5FA] group-hover:border-[#3B82F6]/20 transition-all duration-200">
        {icon}
      </div>
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F8FAFC]">{title}</h3>
      <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">{description}</p>
    </div>
  )
}

/* ── Rigor Feature Card ── */
function RigorFeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="border border-white/[0.06] bg-[#050816]/30 p-5 rounded-xl space-y-2 transition-all duration-300 hover:bg-[#0A0F1F]/45 text-left select-none">
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
        <h4 className="text-[11px] font-mono font-bold uppercase text-[#F8FAFC] tracking-wider">{title}</h4>
      </div>
      <p className="text-[10px] text-[#94A3B8] leading-relaxed font-sans">{description}</p>
    </div>
  )
}
