'use client'

import React, { useState, useEffect } from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RollingSharpeChart() {
  const { equityCurve, status } = useTerminalStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center bg-card">
        <p className="text-muted-foreground text-sm">Loading chart...</p>
      </Card>
    )
  }

  if (status !== 'complete' || equityCurve.length < 60) {
    // If not complete, or fewer than 60 data points, hide the chart
    return null
  }

  // Calculate 60-bar rolling Sharpe
  const returns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity
    const curr = equityCurve[i].equity
    returns.push(prev > 0 ? (curr - prev) / prev : 0)
  }

  const chartData = []

  // Rolling window of 60 days
  const windowSize = 60

  for (let i = windowSize - 1; i < returns.length; i++) {
    const windowReturns = returns.slice(i - windowSize + 1, i + 1)

    // Calculate mean
    const mean = windowReturns.reduce((sum, r) => sum + r, 0) / windowSize

    // Calculate standard deviation
    const variance = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (windowSize - 1)
    const stdDev = Math.sqrt(variance)

    // Annualized Sharpe ratio (assuming daily returns: mean / stdDev * sqrt(252))
    let sharpe = 0
    if (stdDev > 0) {
      sharpe = (mean / stdDev) * Math.sqrt(252)
    }

    // Map index back to corresponding equityCurve point (index i in returns corresponds to index i+1 in equityCurve)
    const point = equityCurve[i + 1]

    chartData.push({
      date: new Date(point.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      sharpe: Math.round(sharpe * 1000) / 1000,
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Rolling Sharpe Ratio</CardTitle>
        <CardDescription>
          60-day rolling annualized Sharpe ratio track indicating return consistency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toFixed(1)}
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-popover border border-border p-2.5 rounded-lg shadow-md text-xs text-popover-foreground">
                        <p className="font-semibold text-muted-foreground mb-1">{data.date}</p>
                        <p className="flex justify-between space-x-4">
                          <span>Sharpe Ratio:</span>
                          <span className={`font-bold ${data.sharpe >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            {data.sharpe >= 0 ? '+' : ''}{data.sharpe}
                          </span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="sharpe"
                stroke="var(--primary)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
