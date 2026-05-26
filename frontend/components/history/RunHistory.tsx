'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useTerminalStore } from '@/store/terminalStore'
import { fetchRuns, fetchRun, deleteRun } from '@/hooks/useRuns'
import RunHistoryRow from './RunHistoryRow'
import { RefreshCw, History, Loader2, AlertCircle, Database } from 'lucide-react'

export default function RunHistory() {
  const { accessToken } = useAuthStore()
  const store = useTerminalStore()
  
  const [runs, setRuns] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null)
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!accessToken) return
    setError(null)
    setLoading(true)
    try {
      const data = await fetchRuns(accessToken)
      setRuns(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load run history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [accessToken])

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleLoadRun = async (runId: string) => {
    if (!accessToken) return
    setError(null)
    setLoadingRunId(runId)
    try {
      const run = await fetchRun(accessToken, runId)
      
      // Populate store with saved results
      store.resetRun()
      
      // Store the DB run ID so further updates (like AI reports) map correctly
      store.setDbRunId(run.id)
      
      // Construct BacktestMetrics compatible object
      const metricsObj = {
        total_return: run.total_return ?? 0.0,
        price_return: run.price_return ?? 0.0,
        total_return_with_dividends: run.total_return ?? 0.0, // fallback
        cagr: run.cagr ?? null,
        sharpe_ratio: run.sharpe_ratio ?? null,
        max_drawdown: run.max_drawdown ?? 0.0,
        volatility: run.volatility ?? null,
        win_rate: run.win_rate ?? null,
        total_trades: run.total_trades ?? 0,
        avg_trade_return: null, // fallback
        total_dividend_income: run.dividend_income ?? 0.0,
        initial_value: run.initial_capital ?? 100000.0,
        final_value: run.final_value ?? 100000.0,
        benchmark_return: run.benchmark_return ?? null,
        alpha: run.alpha ?? null,
        total_commission_paid: 0.0, // fallback
      }
      
      store.setMetrics(metricsObj)
      store.setStatus('complete')
      
      // Restore equity curve from saved JSON
      if (run.equity_curve) {
        run.equity_curve.forEach((point: any) => {
          store.appendEquityPoint({
            timestamp: point.timestamp,
            equity: point.equity,
          })
        })
      }
      
      if (run.trades) {
        run.trades.forEach((trade: any) => {
          store.appendTrade({
            symbol: trade.symbol,
            side: trade.side,
            quantity: trade.quantity,
            fill_price: trade.fill_price,
            timestamp: trade.timestamp,
          })
        })
      }

      if (run.ai_report) {
        store.setReport(run.ai_report)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load run details.')
    } finally {
      setLoadingRunId(null)
    }
  }

  const handleDeleteRun = async (runId: string) => {
    if (!accessToken) return
    if (!confirm('Are you sure you want to delete this run?')) return
    
    setError(null)
    setDeletingRunId(runId)
    try {
      await deleteRun(accessToken, runId)
      setRuns(prev => prev.filter(r => r.id !== runId))
      
      // If loaded run was deleted, reset the store
      if (store.dbRunId === runId) {
        store.resetRun()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete run.')
    } finally {
      setDeletingRunId(null)
    }
  }

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center select-none text-muted-foreground">
        <History className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-xs">Log in to save and view past runs.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col select-none">
      {/* Sleek Trigger Card Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full border border-border/80 bg-card/25 hover:bg-card/85 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between p-3 rounded-lg shadow-sm group transition-all duration-200"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-all duration-200">
            <Database className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-start select-none">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-all duration-200">
              Run History
            </span>
            <span className="text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground transition-all duration-200 font-sans">
              View saved backtests
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
          ) : (
            <span className="px-2 py-0.5 rounded bg-muted/60 text-foreground font-mono text-[10px] font-bold border border-border/60">
              {runs.length}
            </span>
          )}
        </div>
      </button>

      {/* Center Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-12"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-4xl border border-border bg-card/95 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* macOS Title Bar */}
            <div className="h-9 bg-muted/40 border-b border-border flex items-center px-4 justify-between select-none">
              {/* Traffic light control window buttons */}
              <div className="flex items-center space-x-1.5 w-20">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-all flex items-center justify-center group/btn cursor-pointer"
                  title="Close"
                >
                  <span className="text-[7px] font-bold text-rose-950 opacity-0 group-hover/btn:opacity-100 transition-opacity">✕</span>
                </button>
              </div>

              {/* Title */}
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center space-x-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>RUN HISTORY DATABASE</span>
              </span>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2.5 w-20">
                <button
                  onClick={loadHistory}
                  disabled={loading}
                  className="flex items-center justify-center w-5.5 h-5.5 rounded border border-border bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh Database"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col min-h-0 bg-background/50">
              {error && (
                <div className="flex items-center space-x-2 rounded bg-destructive/10 border border-destructive/20 p-2.5 mb-4 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex-1 min-h-0 border border-border/60 rounded bg-card/25 overflow-y-auto scrollbar-thin">
                {loading && runs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground select-none text-xs space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Fetching saved runs...</span>
                  </div>
                ) : runs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-6 select-none text-muted-foreground font-sans text-xs space-y-1">
                    <History className="h-8 w-8 mb-1 opacity-40 text-primary" />
                    <p className="font-semibold text-foreground">No runs saved yet</p>
                    <p className="text-[11px] opacity-75">Run a strategy backtest to populate this database.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Strategy</th>
                        <th className="py-2.5 px-4">Universe</th>
                        <th className="py-2.5 px-4 text-right">Return</th>
                        <th className="py-2.5 px-4 text-right">Sharpe</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => (
                        <RunHistoryRow
                          key={run.id}
                          run={run}
                          onLoad={(id) => {
                            handleLoadRun(id)
                            setIsOpen(false)
                          }}
                          onDelete={handleDeleteRun}
                          isDeleting={deletingRunId === run.id}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Screen-wide Loading detail Overlay */}
      {loadingRunId && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="flex items-center space-x-3 bg-card border border-border px-5 py-3.5 rounded-lg shadow-2xl text-xs font-mono">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading backtest data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
