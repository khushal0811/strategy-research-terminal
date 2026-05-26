'use client'

import React from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { Button } from '@/components/ui/button'
import { Play, Loader2, Pause, Square } from 'lucide-react'

interface RunButtonProps {
  onRun?: () => void | Promise<void>
}

export default function RunButton({ onRun }: RunButtonProps) {
  const {
    status,
    progress,
    symbols,
    universeMode,
    universeInput,
    startDate,
    endDate,
    currentEquity,
    pauseRun,
    resumeRun,
    stopRun,
  } = useTerminalStore()

  // Determine if inputs are missing/invalid
  // We need at least one valid/loading/partial symbol, OR we need the universeInput to be filled in nl mode.
  const hasNoSymbols = universeMode === 'tickers'
    ? !symbols.some((s) => s.status === 'ok' || s.status === 'partial' || s.status === 'loading')
    : (!symbols.some((s) => s.status === 'ok' || s.status === 'partial' || s.status === 'loading') && !universeInput.trim())

  const hasNoDates = !startDate || !endDate

  const isDisabled =
    hasNoSymbols ||
    hasNoDates ||
    status === 'resolving' ||
    status === 'validating' ||
    status === 'running' ||
    status === 'paused'

  // Dynamic button classes
  const getButtonClasses = () => {
    const base = "w-full text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg "
    if (status === 'complete') {
      return base + "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer"
    }
    if (isDisabled) {
      return base + "disabled:bg-muted/20 disabled:text-muted-foreground/40 disabled:border disabled:border-border/20 disabled:opacity-80 disabled:cursor-not-allowed"
    }
    // Idle/Active with nice glow effect on hover
    return base + "bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-[0_0_15px_rgba(37,99,235,0.35)] hover:border-primary/50 cursor-pointer"
  }

  // Dynamic button content based on status
  const renderContent = () => {
    switch (status) {
      case 'resolving':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resolving strategy...
          </>
        )
      case 'validating':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating parameters...
          </>
        )
      case 'running':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
            Running Simulation...
          </>
        )
      case 'paused':
        return (
          <>
            <Pause className="mr-2 h-4 w-4 text-amber-500" />
            Simulation Paused
          </>
        )
      case 'complete':
        return (
          <>
            <span className="mr-2 font-mono font-bold text-emerald-500">[✓]</span>
            Rerun Simulation
          </>
        )
      case 'idle':
      case 'error':
      default:
        return (
          <>
            <Play className="mr-2 h-4 w-4 fill-current text-primary-foreground/90" />
            Run Backtest
          </>
        )
    }
  }

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={onRun}
        disabled={isDisabled}
        size="lg"
        className={getButtonClasses()}
      >
        {renderContent()}
      </Button>

      {(status === 'running' || status === 'paused') && (
        <div className="w-full space-y-3 p-3.5 rounded-lg border border-border bg-card/40 select-none">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground font-mono">
            <span className="flex items-center space-x-1.5">
              {status === 'running' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Pause className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className="font-sans text-[11px] text-foreground/90">
                {status === 'running' ? 'Running simulation...' : 'Simulation paused'}
              </span>
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="h-px bg-border/80 w-full" />
          
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-muted-foreground/75">Portfolio updating live:</span>
            <span className="text-foreground font-bold font-mono">
              ${Math.round(currentEquity).toLocaleString()}
            </span>
          </div>

          <div className="h-px bg-border/80 w-full" />

          {/* Interactive controls */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {status === 'running' ? (
              <button
                onClick={pauseRun}
                className="flex items-center justify-center space-x-1.5 py-1.5 rounded border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/25 text-amber-500 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 h-7"
                title="Pause active strategy ticks"
              >
                <Pause className="h-3 w-3" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeRun}
                className="flex items-center justify-center space-x-1.5 py-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 h-7"
                title="Resume strategy ticks"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={stopRun}
              className="flex items-center justify-center space-x-1.5 py-1.5 rounded border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/25 text-rose-500 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 h-7"
              title="Stop and abandon current run"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop Run</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
