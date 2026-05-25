'use client'

import React from 'react'
import { useTerminalStore } from '@/store/terminalStore'

export default function MetricsPanel() {
  const { metrics, status } = useTerminalStore()

  // Format Helper: Percentage
  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    const pct = value * 100
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${pct.toFixed(2)}%`
  }

  // Format Helper: Dollar amount
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format Helper: Raw numbers/ratios
  const formatRatio = (value: number | null | undefined, decimals = 4) => {
    if (value === null || value === undefined) return '—'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(decimals)}`
  }

  const getReturnClass = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-muted-foreground'
    return value >= 0 ? 'text-emerald-500' : 'text-destructive font-semibold'
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary animate-pulse select-none">RUNNING</span>
      case 'complete':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 select-none">COMPLETE</span>
      case 'error':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20 text-destructive select-none">ERROR</span>
      case 'resolving':
      case 'validating':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500 animate-pulse select-none">{status.toUpperCase()}</span>
      case 'idle':
      default:
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground select-none">IDLE</span>
    }
  }

  // Define metric values (either live/complete or fallback to empty state)
  const isComplete = status === 'complete' && !!metrics

  const data = {
    totalReturn: isComplete ? formatPercent(metrics.total_return_with_dividends) : '—',
    totalReturnClass: isComplete ? getReturnClass(metrics.total_return_with_dividends) : 'text-muted-foreground',
    priceReturn: isComplete ? formatPercent(metrics.price_return) : '—',
    priceReturnClass: isComplete ? getReturnClass(metrics.price_return) : 'text-muted-foreground',
    cagr: isComplete ? formatPercent(metrics.cagr) : '—',
    cagrClass: isComplete ? getReturnClass(metrics.cagr) : 'text-muted-foreground',
    
    sharpeRatio: isComplete ? formatRatio(metrics.sharpe_ratio) : '—',
    sharpeRatioClass: isComplete && metrics.sharpe_ratio !== null ? (metrics.sharpe_ratio >= 0 ? 'text-emerald-500' : 'text-destructive') : 'text-muted-foreground',
    maxDrawdown: isComplete ? formatPercent(metrics.max_drawdown ? -Math.abs(metrics.max_drawdown) : 0) : '—',
    maxDrawdownClass: isComplete ? 'text-destructive' : 'text-muted-foreground',
    volatility: isComplete ? formatPercent(metrics.volatility) : '—',
    winRate: isComplete ? formatPercent(metrics.win_rate) : '—',

    totalTrades: isComplete ? metrics.total_trades.toString() : '—',
    dividendIncome: isComplete ? formatCurrency(metrics.total_dividend_income) : '—',
    initialCapital: isComplete ? formatCurrency(metrics.initial_value) : '—',
    finalValue: isComplete ? formatCurrency(metrics.final_value) : '—',
    totalCommissionPaid: isComplete ? formatCurrency(metrics.total_commission_paid) : '—',

    benchmarkReturn: isComplete ? formatPercent(metrics.benchmark_return) : '—',
    benchmarkReturnClass: isComplete ? getReturnClass(metrics.benchmark_return) : 'text-muted-foreground',
    alpha: isComplete ? formatPercent(metrics.alpha) : '—',
    alphaClass: isComplete ? getReturnClass(metrics.alpha) : 'text-muted-foreground',
  }

  return (
    <div className="w-full flex flex-col p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4 select-none">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          ANALYTICS
        </span>
        {getStatusBadge()}
      </div>

      {/* Metrics List */}
      <div className="flex flex-col">
        {/* Returns Group */}
        <MetricRow label="Total Return" value={data.totalReturn} valueClass={data.totalReturnClass} />
        <MetricRow label="Price Return" value={data.priceReturn} valueClass={data.priceReturnClass} />
        <MetricRow label="CAGR" value={data.cagr} valueClass={data.cagrClass} />
        
        <GroupDivider />

        {/* Risk Group */}
        <MetricRow label="Sharpe Ratio" value={data.sharpeRatio} valueClass={data.sharpeRatioClass} />
        <MetricRow label="Max Drawdown" value={data.maxDrawdown} valueClass={data.maxDrawdownClass} />
        <MetricRow label="Volatility" value={data.volatility} />
        <MetricRow label="Win Rate" value={data.winRate} />

        <GroupDivider />

        {/* Execution Group */}
        <MetricRow label="Total Trades" value={data.totalTrades} />
        <MetricRow label="Dividend Income" value={data.dividendIncome} valueClass={isComplete && metrics.total_dividend_income > 0 ? 'text-emerald-500' : 'text-foreground'} />
        <MetricRow label="Commission Paid" value={data.totalCommissionPaid} />
        <MetricRow label="Initial Capital" value={data.initialCapital} />
        <MetricRow label="Final Value" value={data.finalValue} />

        <GroupDivider />

        {/* Benchmark Group */}
        <MetricRow label="Benchmark (SPY)" value={data.benchmarkReturn} valueClass={data.benchmarkReturnClass} />
        <MetricRow label="Alpha vs SPY" value={data.alpha} valueClass={data.alphaClass} />
      </div>
    </div>
  )
}

interface MetricRowProps {
  label: string
  value: string
  valueClass?: string
}

function MetricRow({ label, value, valueClass = 'text-foreground' }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center py-1.5 text-xs">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground select-none">
        {label}
      </span>
      <span className={`font-mono font-bold ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}

function GroupDivider() {
  return <div className="border-t border-border/40 my-2.5" />
}
