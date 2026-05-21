'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { X, TrendingUp, Zap, Brain, ShieldCheck, BarChart3, Workflow } from 'lucide-react'
import ArchitecturePanel from '@/components/sections/ArchitecturePanel'
import HowItWorks from '@/components/sections/HowItWorks'

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
      aria-label="Welcome to Strategy Research Terminal"
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
        className="relative z-10 w-full max-w-5xl max-h-[88vh] overflow-y-auto
                   bg-background border border-border/80 rounded-2xl shadow-2xl
                   animate-in zoom-in-95 fade-in duration-300
                   scrollbar-thin"
      >
        {/* Close button — floating top-right */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close welcome overlay"
          className="absolute top-4 right-4 z-30 flex items-center justify-center w-7 h-7 rounded-full
                     border border-border/60 bg-background/80 backdrop-blur-sm
                     text-muted-foreground hover:text-foreground hover:border-foreground/30
                     transition-all duration-150 cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* ─── HERO SECTION ─── */}
        <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden">
          {/* Subtle radial gradient glow behind the logo */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 40%, var(--primary) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          {/* Logo mark */}
          <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl
                          bg-primary/10 border border-primary/25 mb-5 shadow-sm">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            Strategy Research Terminal
          </h1>
          <p className="mt-2.5 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Describe a trading strategy in plain English, backtest it against real market data,
            and stream institutional-grade risk metrics — all in real time.
          </p>

          {/* Key capabilities row */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <CapabilityBadge icon={<Brain className="h-3.5 w-3.5" />} label="LLM Strategy Resolver" />
            <CapabilityBadge icon={<Workflow className="h-3.5 w-3.5" />} label="Event-Driven Engine" />
            <CapabilityBadge icon={<Zap className="h-3.5 w-3.5" />} label="Live WebSocket Streaming" />
            <CapabilityBadge icon={<BarChart3 className="h-3.5 w-3.5" />} label="Full Risk Analytics" />
            <CapabilityBadge icon={<ShieldCheck className="h-3.5 w-3.5" />} label="126 Verified Tests" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px bg-border/50" />

        {/* ─── HOW IT WORKS ─── */}
        <div className="px-8 py-7 space-y-1">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/70">
            How it works
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Your natural-language prompt flows through four independent systems. Each is deterministic, tested, and observable.
          </p>
        </div>

        {/* Architecture cards */}
        <div className="px-8 pb-6">
          <ArchitecturePanel />
        </div>

        {/* Divider */}
        <div className="mx-8 h-px bg-border/50" />

        {/* ─── DEEP DIVE CARDS ─── */}
        <div className="px-8 pt-6 pb-8">
          <HowItWorks />
        </div>

        {/* ─── DISMISS FOOTER ─── */}
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
            Start Backtesting →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Small internal sub-component ── */

function CapabilityBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     border border-border bg-card/60 text-[11px] font-medium text-foreground/80
                     select-none shadow-sm">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  )
}
