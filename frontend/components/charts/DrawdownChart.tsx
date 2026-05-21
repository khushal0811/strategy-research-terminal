'use client'

import React, { useState, useEffect } from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DrawdownChart() {
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

  if (status !== 'complete' || equityCurve.length === 0) {
    return null
  }

  // Calculate drawdowns
  let peak = -Infinity
  const chartData = equityCurve.map((point) => {
    if (point.equity > peak) {
      peak = point.equity
    }
    const drawdown = peak > 0 ? ((point.equity - peak) / peak) * 100 : 0

    return {
      date: new Date(point.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      drawdown: Math.round(drawdown * 100) / 100, // percentage e.g. -2.5
    }
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Drawdown Analysis</CardTitle>
        <CardDescription>
          Historical peak-to-trough value declines over the strategy simulation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                tickFormatter={(val) => `${val}%`}
                domain={['auto', 0]}
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
                          <span>Drawdown:</span>
                          <span className="font-bold text-destructive">{data.drawdown}%</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <defs>
                <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="var(--destructive)"
                fill="url(#drawdownGrad)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
