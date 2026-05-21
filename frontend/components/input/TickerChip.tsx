'use client'

import React from 'react'
import { TickerSymbol } from '@/store/terminalStore'
import { X, Check, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react'

interface TickerChipProps {
  symbol: TickerSymbol
  onRemove: (symbol: string) => void
}

export default function TickerChip({ symbol, onRemove }: TickerChipProps) {
  const { symbol: ticker, status, availableFrom, availableTo } = symbol

  let statusIcon = null
  let statusClass = 'border-muted bg-muted text-muted-foreground'
  let tooltipText = ''

  if (status === 'loading') {
    statusIcon = <Loader2 className="h-3.5 w-3.5 animate-spin" />
    statusClass = 'border-amber-500 bg-amber-500/10 text-amber-500'
    tooltipText = 'Checking data availability...'
  } else if (status === 'ok') {
    statusIcon = <Check className="h-3.5 w-3.5 text-emerald-500" />
    statusClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    tooltipText = 'Data fully available'
  } else if (status === 'partial') {
    statusIcon = <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    statusClass = 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
    tooltipText = `Partial history available: ${availableFrom ? new Date(availableFrom).toLocaleDateString() : '?'} to ${availableTo ? new Date(availableTo).toLocaleDateString() : '?'}`
  } else if (status === 'error') {
    statusIcon = <AlertCircle className="h-3.5 w-3.5 text-destructive" />
    statusClass = 'border-destructive bg-destructive/10 text-destructive'
    tooltipText = 'No data found for this symbol'
  }

  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition-all select-none hover:shadow ${statusClass}`}
      title={tooltipText}
    >
      <span>{ticker}</span>
      <span className="flex items-center justify-center">{statusIcon}</span>
      <button
        onClick={() => onRemove(ticker)}
        className="rounded-full p-0.5 hover:bg-background/20 focus:outline-none transition-colors"
        aria-label={`Remove ${ticker}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
