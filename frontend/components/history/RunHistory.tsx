'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useTerminalStore } from '@/store/terminalStore'
import { fetchRuns, fetchRun, deleteRun } from '@/hooks/useRuns'
import RunHistoryRow from './RunHistoryRow'
import { RefreshCw, History, Loader2, AlertCircle } from 'lucide-react'

export default function RunHistory() {
  const { accessToken } = useAuthStore()
  const store = useTerminalStore()
  
  const [runs, setRuns] = useState<any[]>([])
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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3 select-none">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center space-x-1.5">
          <History className="h-3.5 w-3.5" />
          <span>RUN HISTORY</span>
        </span>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center justify-center w-5 h-5 rounded border border-border bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
          title="Refresh History"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded bg-destructive/10 border border-destructive/20 p-2 mb-3 text-[10px] text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin border border-border/60 rounded bg-card/10 min-h-[120px]">
        {loading && runs.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground select-none text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Fetching saved runs...</span>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center p-4 select-none text-muted-foreground font-sans text-xs">
            <p>No runs saved yet.</p>
            <p className="text-[10px] opacity-70 mt-0.5">Run a backtest to see your history here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Strategy</th>
                <th className="py-2 px-3">Universe</th>
                <th className="py-2 px-3 text-right">Return</th>
                <th className="py-2 px-3 text-right">Sharpe</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <RunHistoryRow
                  key={run.id}
                  run={run}
                  onLoad={handleLoadRun}
                  onDelete={handleDeleteRun}
                  isDeleting={deletingRunId === run.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {loadingRunId && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="flex items-center space-x-2 bg-card border border-border px-3.5 py-2.5 rounded shadow-lg text-xs font-mono">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading backtest data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
