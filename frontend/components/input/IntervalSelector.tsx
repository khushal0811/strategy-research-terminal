'use client'

import React from 'react'
import { useTerminalStore, Interval } from '@/store/terminalStore'
import { toast } from 'sonner'

export default function IntervalSelector() {
  const { interval, setInterval, startDate, setStartDate } = useTerminalStore()

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as Interval
    setInterval(selected)

    // Check constraints and auto-adjust start date if needed
    const today = new Date()
    let limitDays = 0
    let intervalLabel = ''

    if (selected === '1h') {
      limitDays = 730
      intervalLabel = '1 Hour'
    } else if (['30m', '15m', '5m', '2m'].includes(selected)) {
      limitDays = 60
      intervalLabel = selected
    } else if (selected === '1m') {
      limitDays = 7
      intervalLabel = '1 Minute'
    }

    if (limitDays > 0 && startDate) {
      const start = new Date(startDate)
      const diffTime = Math.abs(today.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > limitDays) {
        const adjustedStart = new Date()
        adjustedStart.setDate(today.getDate() - limitDays)
        const adjustedStartStr = adjustedStart.toISOString().split('T')[0]
        setStartDate(adjustedStartStr)

        toast.warning(
          `Interval '${intervalLabel}' only supports up to ${limitDays} days of history. Start date adjusted to ${adjustedStartStr}.`
        )
      }
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor="interval-select" className="text-sm font-medium">
        Data Interval
      </label>
      <select
        id="interval-select"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        value={interval}
        onChange={handleIntervalChange}
      >
        <option value="1d">1 Day (Full History)</option>
        <option value="1h">1 Hour (Max 2 Years)</option>
        <option value="30m">30 Min (Max 60 Days)</option>
        <option value="15m">15 Min (Max 60 Days)</option>
        <option value="5m">5 Min (Max 60 Days)</option>
        <option value="2m">2 Min (Max 60 Days)</option>
        <option value="1m">1 Min (Max 7 Days)</option>
      </select>
    </div>
  )
}
