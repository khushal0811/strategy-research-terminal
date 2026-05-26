'use client'

import React, { useState, useEffect } from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { Maximize2, Copy, Check } from 'lucide-react'

export default function TradeLog() {
  const { trades } = useTerminalStore()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Calculate blotter statistics
  const totalFills = trades.length
  const totalVolume = trades.reduce((sum, t) => sum + t.quantity, 0)

  // Reverse chronological order: newest trades at the top
  const sortedTrades = [...trades].reverse()

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

  // Copy trades as CSV to Clipboard
  const handleCopyCSV = () => {
    if (trades.length === 0) return
    const headers = ['Timestamp', 'Symbol', 'Side', 'Quantity', 'Fill Price', 'Total Value']
    const rows = trades.map(t => [
      new Date(t.timestamp).toISOString(),
      t.symbol,
      t.side,
      t.quantity,
      t.fill_price,
      (t.quantity * t.fill_price).toFixed(2)
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    navigator.clipboard.writeText(csvContent)
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format Helper: Detailed Date Time
  const formatDateTime = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr)
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return timestampStr
    }
  }

  return (
    <div className="w-full flex flex-col h-full overflow-hidden pt-2">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-2 px-4 select-none shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          EXECUTION BLOTTER
        </span>
        <div className="flex items-center space-x-2.5">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground/75">
            {totalFills} fills · {totalVolume.toLocaleString()} shares
          </span>
          {trades.length > 0 && (
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center w-5 h-5 rounded border border-border bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Expand Trade Blotter"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="flex-1 overflow-y-auto w-full px-4 select-none scrollbar-thin">
        {sortedTrades.length === 0 ? (
          <div className="text-center text-muted-foreground italic py-10 text-xs font-sans">
            No execution fills recorded yet.
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px] font-mono">
            <tbody>
              {sortedTrades.map((trade, idx) => {
                const isBuy = trade.side === 'BUY'
                // Format timestamp as "MMM DD, YYYY" (e.g. "Mar 12, 2026")
                const dateStr = new Date(trade.timestamp).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
                
                return (
                  <tr
                    key={idx}
                    className={`h-7 transition-colors hover:bg-muted/10 ${
                      idx % 2 === 0 ? 'bg-muted/5' : 'bg-transparent'
                    }`}
                  >
                    <td
                      className={`pl-2 pr-2 py-0 text-muted-foreground text-left align-middle ${
                        isBuy ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-destructive'
                      }`}
                    >
                      {dateStr}
                    </td>
                    <td className="px-2 py-0 font-bold text-foreground text-left align-middle">
                      {trade.symbol}
                    </td>
                    <td
                      className={`px-2 py-0 text-center font-bold align-middle ${
                        isBuy ? 'text-emerald-500' : 'text-destructive'
                      }`}
                    >
                      {trade.side}
                    </td>
                    <td className="px-2 py-0 text-right text-foreground align-middle font-semibold">
                      {trade.quantity.toLocaleString()}
                    </td>
                    <td className="pl-2 pr-2 py-0 text-right text-foreground align-middle font-bold">
                      ${trade.fill_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Spacious Detailed Execution Blotter Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-12"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-5xl border border-border bg-card/95 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* macOS Title Bar */}
            <div className="h-9 bg-muted/40 border-b border-border flex items-center px-4 justify-between select-none">
              {/* Traffic light circular close button on left */}
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
                <Maximize2 className="h-3.5 w-3.5" />
                <span>DETAILED EXECUTION BLOTTER</span>
              </span>

              {/* Export CSV button in top right */}
              <div className="flex items-center justify-end w-24">
                <button
                  onClick={handleCopyCSV}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-border bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground text-[10px] font-mono transition-all duration-200 cursor-pointer"
                  title="Copy all trades to clipboard in CSV format"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Content Details Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col min-h-0 bg-background/50">
              <div className="flex items-center justify-between mb-4 px-1 select-none shrink-0 text-xs">
                <span className="font-mono text-muted-foreground">
                  Active workspace backtest fills database
                </span>
                <span className="font-mono font-semibold text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded border border-border/40">
                  {totalFills} fills · {totalVolume.toLocaleString()} shares traded
                </span>
              </div>

              <div className="flex-1 min-h-0 border border-border/60 rounded bg-card/25 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                      <th className="py-2.5 px-4">Date & Time</th>
                      <th className="py-2.5 px-4">Symbol</th>
                      <th className="py-2.5 px-4 text-center">Side</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Fill Price</th>
                      <th className="py-2.5 px-4 text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTrades.map((trade, idx) => {
                      const isBuy = trade.side === 'BUY'
                      const totalValue = trade.quantity * trade.fill_price
                      
                      return (
                        <tr
                          key={idx}
                          className="border-b border-border/40 hover:bg-muted/10 transition-all font-mono text-[11px]"
                        >
                          <td className="py-2.5 px-4 text-muted-foreground">
                            {formatDateTime(trade.timestamp)}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-foreground">
                            {trade.symbol}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isBuy 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-foreground font-semibold">
                            {trade.quantity.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right text-foreground font-bold">
                            ${trade.fill_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-right text-foreground font-bold">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
