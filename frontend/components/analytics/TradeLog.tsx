'use client'

import React from 'react'
import { useTerminalStore } from '@/store/terminalStore'

export default function TradeLog() {
  const { trades } = useTerminalStore()

  // Calculate blotter statistics
  const totalFills = trades.length
  const totalVolume = trades.reduce((sum, t) => sum + t.quantity, 0)

  // Reverse chronological order: newest trades at the top
  const sortedTrades = [...trades].reverse()

  return (
    <div className="w-full flex flex-col h-full overflow-hidden pt-2">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-2 px-4 select-none shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          EXECUTION BLOTTER
        </span>
        <span className="text-[10px] font-mono font-semibold text-muted-foreground/75">
          {totalFills} fills · {totalVolume.toLocaleString()} shares
        </span>
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
                // Format timestamp as "MMM DD" (e.g. "Mar 12")
                const dateStr = new Date(trade.timestamp).toLocaleDateString(undefined, {
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
    </div>
  )
}
