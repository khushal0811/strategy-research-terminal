'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { X, MessageSquare, ListPlus, Settings2, Play, BarChart3, Sparkles } from 'lucide-react'

interface SystemOverlayProps {
  open: boolean
  onClose: () => void
}

export default function SystemOverlay({ open, onClose }: SystemOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // --- Lock body scroll while overlay is open ---
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // --- Focus the close button when overlay opens ---
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [open])

  // --- Keyboard: ESC to close + focus trap ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose]
  )

  // --- Click outside to dismiss ---
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="How to use the terminal"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6
                 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto
                   bg-background border border-border/80 rounded-2xl shadow-2xl
                   animate-in zoom-in-95 fade-in duration-300
                   scrollbar-thin"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close guide"
          className="absolute top-4 right-4 z-30 flex items-center justify-center w-7 h-7 rounded-full
                     border border-border/60 bg-background/80 backdrop-blur-sm
                     text-muted-foreground hover:text-foreground hover:border-foreground/30
                     transition-all duration-150 cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center space-y-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary">
            Quick Start Guide
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            How to Use the Terminal
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Follow these steps to run your first backtest. The entire workflow takes about 30 seconds.
          </p>
        </div>

        <div className="mx-8 h-px bg-border/50" />

        {/* Steps */}
        <div className="px-8 py-6 space-y-5">
          <GuideStep
            icon={<MessageSquare className="h-4 w-4" />}
            iconBg="bg-violet-500/10 border-violet-500/20 text-violet-500"
            step="1"
            title="Describe Your Strategy"
            description="Use the Strategy Config panel on the left. Choose 'Natural Language' and type something like:"
            example={`"Momentum strategy — buy when rate of change exceeds threshold"`}
            tip="Or switch to 'Python Code' mode to write custom strategy logic. You can also select a preset from the dropdown."
          />

          <GuideStep
            icon={<ListPlus className="h-4 w-4" />}
            iconBg="bg-blue-500/10 border-blue-500/20 text-blue-500"
            step="2"
            title="Build Your Universe"
            description="In the Universe Selection section, add stock tickers manually (type and press Enter) or use AI:"
            example={`"Top 10 US tech stocks as of 2025"`}
            tip="Each ticker is validated against Yahoo Finance in real time. Green ✓ = valid, Red ✗ = invalid."
          />

          <GuideStep
            icon={<Settings2 className="h-4 w-4" />}
            iconBg="bg-amber-500/10 border-amber-500/20 text-amber-500"
            step="3"
            title="Configure Simulation"
            description="Set your backtest date range, data interval (1D, 1H, 5M, etc.), initial capital, and position sizing model. The quick buttons (1Y, 3Y, 5Y, 10Y) set common date ranges."
            tip="For intraday intervals (5m, 15m, etc.), Yahoo Finance limits historical data to ~60 days."
          />

          <GuideStep
            icon={<Play className="h-4 w-4" />}
            iconBg="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            step="4"
            title="Run the Backtest"
            description="Click 'Run Backtest'. The system fetches fresh data, validates your config, and launches the simulation. Watch the equity curve build in real time as the engine processes each bar."
            tip="The execution blotter on the right shows every trade fill as it happens — symbol, side, quantity, and fill price."
          />

          <GuideStep
            icon={<BarChart3 className="h-4 w-4" />}
            iconBg="bg-teal-500/10 border-teal-500/20 text-teal-500"
            step="5"
            title="Analyze Results"
            description="When the simulation completes, the Metrics Panel shows key performance indicators: total return, CAGR, Sharpe ratio, max drawdown, volatility, win rate, and alpha vs benchmark. Drawdown and Rolling Sharpe charts appear below the equity curve."
          />

          <GuideStep
            icon={<Sparkles className="h-4 w-4" />}
            iconBg="bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
            step="6"
            title="Read the AI Report"
            description="After the backtest completes, an AI-generated performance report appears with an executive summary, return analysis, risk assessment, and optimization recommendations."
            tip="This requires a Groq API key — set it in the LLM Settings collapsible section, or set GROQ_API_KEY as a server environment variable."
          />
        </div>

        {/* Dismiss footer */}
        <div className="sticky bottom-0 flex justify-center py-4
                        bg-gradient-to-t from-background via-background to-transparent border-t border-border/30">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-xs font-bold font-sans
                       bg-primary text-primary-foreground
                       hover:bg-primary/90 active:scale-[0.97]
                       shadow-sm hover:shadow-md
                       transition-all duration-150 cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Got it, let&apos;s go →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Guide Step ── */
function GuideStep({
  icon,
  iconBg,
  step,
  title,
  description,
  example,
  tip,
}: {
  icon: React.ReactNode
  iconBg: string
  step: string
  title: string
  description: string
  example?: string
  tip?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg border ${iconBg}`}>
          {icon}
        </div>
        <div className="w-px flex-1 bg-border/40 mt-2" />
      </div>
      <div className="space-y-2 pb-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-muted-foreground/50 border border-border/60 bg-muted/20 px-1.5 py-0.5 rounded">
            {step}
          </span>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        {example && (
          <div className="bg-muted/40 border border-border/60 rounded-md px-3 py-2">
            <p className="text-[11px] font-mono text-foreground/80 italic">&ldquo;{example}&rdquo;</p>
          </div>
        )}
        {tip && (
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            <span className="font-semibold text-primary/70">Tip:</span> {tip}
          </p>
        )}
      </div>
    </div>
  )
}
