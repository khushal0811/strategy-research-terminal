'use client'

import React, { useEffect, useState } from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function DateRangePicker() {
  const { startDate, endDate, setStartDate, setEndDate } = useTerminalStore()
  const [error, setError] = useState<string | null>(null)

  // Get current date string in YYYY-MM-DD format
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Set default dates if empty
  useEffect(() => {
    if (!endDate) {
      setEndDate(getTodayString())
    }
    if (!startDate) {
      // Default to 1 year ago
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      setStartDate(oneYearAgo.toISOString().split('T')[0])
    }
  }, [startDate, endDate, setStartDate, setEndDate])

  // Validate dates
  useEffect(() => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setError('Start date must be before end date')
      } else {
        setError(null)
      }
    }
  }, [startDate, endDate])

  const applyPreset = (years: number) => {
    const today = new Date()
    const targetDate = new Date()
    targetDate.setFullYear(today.getFullYear() - years)

    const endStr = today.toISOString().split('T')[0]
    const startStr = targetDate.toISOString().split('T')[0]

    setEndDate(endStr)
    setStartDate(startStr)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Backtest Date Range</label>
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => applyPreset(1)}>
            1Y
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => applyPreset(3)}>
            3Y
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => applyPreset(5)}>
            5Y
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => applyPreset(10)}>
            10Y
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Start Date</span>
          <Input
            type="date"
            max={getTodayString()}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">End Date</span>
          <Input
            type="date"
            max={getTodayString()}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
