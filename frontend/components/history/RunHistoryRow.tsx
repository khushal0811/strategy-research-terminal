'use client'

import React from 'react'
import { Trash2, FolderOpen } from 'lucide-react'

interface RunHistoryItem {
  id: string
  created_at: string
  symbols: string[]
  strategy_type: string
  start_date: string
  end_date: string
  interval: string
  initial_capital: number
  total_return: number | null
  sharpe_ratio: number | null
  max_drawdown: number | null
  total_trades: number | null
  final_value: number | null
  status: string
}

interface RunHistoryRowProps {
  run: RunHistoryItem
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export default function RunHistoryRow({ run, onLoad, onDelete, isDeleting }: RunHistoryRowProps) {
  // Format Helper: Date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  // Format Helper: Percentage
  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return '—'
    const pct = value * 100
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${pct.toFixed(2)}%`
  }

  // Format Helper: Sharpe
  const formatSharpe = (value: number | null) => {
    if (value === null || value === undefined) return '—'
    return value.toFixed(2)
  }

  const getReturnClass = (value: number | null) => {
    if (value === null || value === undefined) return 'text-muted-foreground'
    return value >= 0 ? 'text-emerald-500 font-semibold' : 'text-destructive font-semibold'
  }

  const formatStrategy = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const formatUniverse = (symbols: string[]) => {
    if (!symbols || symbols.length === 0) return '—'
    if (symbols.length > 3) {
      return `${symbols.length} stocks`
    }
    return symbols.join(' ')
  }

  return (
    <tr className="border-b border-border/40 hover:bg-muted/10 transition-all font-mono text-[11px]">
      <td className="py-2.5 px-3 text-muted-foreground select-none">
        {formatDate(run.created_at)}
      </td>
      <td className="py-2.5 px-3 font-semibold text-foreground truncate max-w-[120px]">
        {formatStrategy(run.strategy_type)}
      </td>
      <td className="py-2.5 px-3 text-muted-foreground">
        {formatUniverse(run.symbols)}
      </td>
      <td className={`py-2.5 px-3 text-right ${getReturnClass(run.total_return)}`}>
        {formatPercent(run.total_return)}
      </td>
      <td className="py-2.5 px-3 text-right text-foreground font-semibold">
        {formatSharpe(run.sharpe_ratio)}
      </td>
      <td className="py-2.5 px-3 text-right select-none">
        <div className="flex justify-end space-x-1.5">
          <button
            onClick={() => onLoad(run.id)}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded border border-border bg-card hover:bg-accent/40 text-foreground transition-all cursor-pointer"
            title="Load Run Results"
          >
            <FolderOpen className="h-3 w-3 text-primary" />
            <span>Load</span>
          </button>
          
          <button
            onClick={() => onDelete(run.id)}
            disabled={isDeleting}
            className="flex items-center justify-center p-1 rounded border border-border bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50 cursor-pointer"
            title="Delete Run"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  )
}
