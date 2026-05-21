'use client'

import React from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { AlertCircle } from 'lucide-react'

export default function UniverseNotes() {
  const { symbols, status } = useTerminalStore()

  if (status !== 'complete') {
    return null
  }

  const partialSymbols = symbols.filter((s) => s.status === 'partial')

  if (partialSymbols.length === 0) {
    return null
  }

  return (
    <div className="flex items-start space-x-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold">Historical Data Availability Notice</p>
        <p className="leading-relaxed">
          The following assets in your trading universe contain partial data coverage and were only simulated within their active periods:
        </p>
        <ul className="list-disc list-inside space-y-0.5 pl-1 pt-1 font-medium">
          {partialSymbols.map((s) => {
            const startStr = s.availableFrom
              ? new Date(s.availableFrom).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
              : 'Unknown'
            const endStr = s.availableTo
              ? new Date(s.availableTo).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
              : 'Present'
            return (
              <li key={s.symbol}>
                <span className="font-bold">{s.symbol}</span>: Available from {startStr} to {endStr} ({s.rowCount?.toLocaleString() || '0'} bars simulated).
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
