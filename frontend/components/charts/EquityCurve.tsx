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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function EquityCurve() {
  const { equityCurve, metrics, capital, currentEquity, status } = useTerminalStore()
  const [returnType, setReturnType] = useState<'total' | 'price'>('total')
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR hydration mismatch issues with Recharts
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Card className="w-full border border-border bg-card/45">
        <div className="w-full h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground text-xs font-mono">LOADING INSTRUMENTATION...</p>
        </div>
      </Card>
    )
  }

  // Calculate live values
  const hasData = equityCurve.length > 0
  const activeEquity = status === 'running' 
    ? currentEquity 
    : (hasData ? equityCurve[equityCurve.length - 1].equity : capital)
  
  const returnVal = ((activeEquity - capital) / capital) * 100
  
  const portfolioStr = (status === 'idle' && !hasData)
    ? '—'
    : `$${activeEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    
  const returnStr = (status === 'idle' && !hasData)
    ? '—'
    : `${returnVal >= 0 ? '+' : ''}${returnVal.toFixed(2)}%`
    
  const benchmarkStr = metrics && metrics.benchmark_return !== null 
    ? `${metrics.benchmark_return * 100 >= 0 ? '+' : ''}${(metrics.benchmark_return * 100).toFixed(2)}%`
    : '—'
    
  const alphaVal = metrics && metrics.alpha !== null ? metrics.alpha : 0
  const alphaStr = metrics && metrics.alpha !== null 
    ? `${metrics.alpha * 100 >= 0 ? '+' : ''}${(metrics.alpha * 100).toFixed(2)}%`
    : '—'

  // Format data for Recharts
  const initialEquity = hasData ? equityCurve[0]?.equity || capital : capital

  const chartData = equityCurve.map((point, idx) => {
    let displayEquity = point.equity

    // Scale price vs total return if complete and 'price' selected
    if (metrics && returnType === 'price') {
      const totalRet = metrics.total_return_with_dividends
      const priceRet = metrics.price_return

      if (totalRet !== 0) {
        const scalingFactor = priceRet / totalRet
        displayEquity = initialEquity + (point.equity - initialEquity) * scalingFactor
      }
    }

    const pctReturn = ((displayEquity - initialEquity) / initialEquity) * 100

    let benchmarkVal = undefined
    if (metrics && metrics.benchmark_return !== null && metrics.benchmark_return !== undefined) {
      const totalPoints = equityCurve.length
      const factor = totalPoints > 1 ? idx / (totalPoints - 1) : 0
      benchmarkVal = initialEquity * (1 + metrics.benchmark_return * factor)
    }

    return {
      date: new Date(point.timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      rawDate: point.timestamp,
      equity: Math.round(displayEquity * 100) / 100,
      return: Math.round(pctReturn * 100) / 100,
      benchmark: benchmarkVal ? Math.round(benchmarkVal * 100) / 100 : undefined,
    }
  })

  const formatYAxis = (value: number) => {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }

  return (
    <Card className="w-full border border-border bg-card/45 select-none">
      <CardHeader className="space-y-4 pb-2">
        {/* Title bar with LIVE indicator and buttons */}
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">
            PERFORMANCE CURVE
          </CardTitle>
          
          <div className="flex items-center space-x-3">
            {status === 'running' && (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded animate-pulse">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                <span>● LIVE</span>
              </span>
            )}
            
            {hasData && (
              <div className="flex bg-muted/80 border border-border/80 p-0.5 rounded text-[9px] font-semibold space-x-0.5">
                <Button
                  variant={returnType === 'total' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-5 text-[9px] px-2 font-bold uppercase tracking-wider cursor-pointer"
                  onClick={() => setReturnType('total')}
                >
                  Total Return
                </Button>
                <Button
                  variant={returnType === 'price' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-5 text-[9px] px-2 font-bold uppercase tracking-wider cursor-pointer"
                  onClick={() => setReturnType('price')}
                >
                  Price Return
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Separator line */}
        <div className="h-px bg-border/40 w-full" />

        {/* Sub-header stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono select-none">
          <div>
            <span className="text-muted-foreground text-[9px] block uppercase font-sans font-semibold mb-0.5 tracking-wider">
              Portfolio
            </span>
            <span className="text-foreground font-bold">{portfolioStr}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground text-[9px] block uppercase font-sans font-semibold mb-0.5 tracking-wider">
              Return
            </span>
            <span className={`font-bold ${(status !== 'idle' || hasData) ? (returnVal >= 0 ? 'text-emerald-500' : 'text-destructive') : 'text-foreground'}`}>
              {returnStr}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[9px] block uppercase font-sans font-semibold mb-0.5 tracking-wider">
              Benchmark (SPY)
            </span>
            <span className={`font-bold ${metrics && metrics.benchmark_return !== null ? (metrics.benchmark_return >= 0 ? 'text-emerald-500' : 'text-destructive') : 'text-foreground'}`}>
              {benchmarkStr}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground text-[9px] block uppercase font-sans font-semibold mb-0.5 tracking-wider">
              Alpha vs SPY
            </span>
            <span className={`font-bold ${metrics && metrics.alpha !== null ? (alphaVal >= 0 ? 'text-emerald-500' : 'text-destructive') : 'text-foreground'}`}>
              {alphaStr}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasData ? (
          <div className="w-full h-[360px] flex items-center justify-center border border-dashed border-border/80 rounded-lg bg-card/10">
            <div className="text-center space-y-1.5 p-6">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest font-sans">
                AWAITING SIMULATION STREAM
              </p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Initiate a strategy backtest to begin live event updates.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatYAxis}
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-popover border border-border p-3 rounded shadow-md text-[11px] space-y-1.5 text-popover-foreground font-mono">
                          <p className="font-semibold text-muted-foreground">{data.date}</p>
                          <p className="flex justify-between space-x-4">
                            <span>Portfolio Value:</span>
                            <span className="font-bold text-foreground">${data.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </p>
                          <p className="flex justify-between space-x-4">
                            <span>Return:</span>
                            <span className={`font-bold ${data.return >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                              {data.return >= 0 ? '+' : ''}{data.return}%
                            </span>
                          </p>
                          {data.benchmark !== undefined && (
                            <p className="flex justify-between space-x-4 border-t pt-1 mt-1 border-border">
                              <span className="text-muted-foreground">Benchmark:</span>
                              <span className="font-bold text-foreground">
                                ${data.benchmark.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                {metrics && metrics.benchmark_return !== null && metrics.benchmark_return !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="var(--muted-foreground)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
