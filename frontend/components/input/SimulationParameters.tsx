'use client'

import React from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

export default function SimulationParameters() {
  const {
    capital,
    setCapital,
    positionSizing,
    setPositionSizing,
    positionSize,
    setPositionSize,
    riskPerTrade,
    setRiskPerTrade,
    stopFraction,
    setStopFraction,
    benchmarkSymbol,
    setBenchmarkSymbol,
    includeDividends,
    setIncludeDividends,
  } = useTerminalStore()

  // Convert risk fraction (e.g. 0.02) to percentage (e.g. 2)
  const percentRiskValue = Math.round(riskPerTrade * 100 * 10) / 10

  const handleRiskChange = (value: number | readonly number[]) => {
    const val = Array.isArray(value) ? value[0] : value
    if (val !== undefined) {
      setRiskPerTrade(val / 100)
    }
  }

  // Convert stop fraction (e.g. 0.02) to percentage (e.g. 2)
  const percentStopValue = Math.round(stopFraction * 100 * 10) / 10

  const handleStopChange = (value: number | readonly number[]) => {
    const val = Array.isArray(value) ? value[0] : value
    if (val !== undefined) {
      setStopFraction(val / 100)
    }
  }

  return (
    <div className="space-y-4">
      {/* Capital Input & Benchmark Ticker */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="capital-input" className="text-xs font-medium text-foreground">
            Initial Capital
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
              $
            </span>
            <Input
              id="capital-input"
              type="number"
              min={100}
              value={capital}
              onChange={(e) => setCapital(Math.max(0, parseFloat(e.target.value) || 0))}
              className="pl-6 h-8 text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="benchmark-input" className="text-xs font-medium text-foreground">
            Benchmark
          </label>
          <Input
            id="benchmark-input"
            type="text"
            placeholder="SPY"
            value={benchmarkSymbol}
            onChange={(e) => setBenchmarkSymbol(e.target.value.toUpperCase())}
            className="h-8 text-xs font-mono font-semibold"
          />
        </div>
      </div>

      {/* Position Sizing Select */}
      <div className="space-y-1.5">
        <label htmlFor="sizing-select" className="text-xs font-medium text-foreground">
          Position Sizing Model
        </label>
        <select
          id="sizing-select"
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          value={positionSizing}
          onChange={(e) => {
            const val = e.target.value as 'fixed' | 'percentage' | 'risk_based'
            setPositionSizing(val)
            // Reset to sensible defaults if changing sizing method
            if (val === 'percentage') {
              setPositionSize(10.0) // 10% defaults
            } else if (val === 'fixed') {
              setPositionSize(100.0) // 100 shares default
            }
          }}
        >
          <option value="risk_based">Risk-Based (Kelly/ATR)</option>
          <option value="percentage">Percentage of Equity</option>
          <option value="fixed">Fixed Quantity (Shares)</option>
        </select>
      </div>

      {/* Dynamic Sizing Settings */}
      {positionSizing === 'risk_based' && (
        <div className="space-y-3.5 pt-1.5 border-t border-border/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Risk Per Trade</span>
              <span className="font-semibold text-primary">{percentRiskValue}%</span>
            </div>
            <Slider
              min={0.5}
              max={10}
              step={0.5}
              value={[percentRiskValue]}
              onValueChange={handleRiskChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Stop Distance (ATR fallback)</span>
              <span className="font-semibold text-primary">{percentStopValue}%</span>
            </div>
            <Slider
              min={0.5}
              max={5}
              step={0.5}
              value={[percentStopValue]}
              onValueChange={handleStopChange}
              className="w-full"
            />
          </div>
        </div>
      )}

      {positionSizing === 'percentage' && (
        <div className="space-y-2 pt-1.5 border-t border-border/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Position size (% of equity)</span>
            <span className="font-semibold text-primary">{positionSize}%</span>
          </div>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[positionSize]}
            onValueChange={(val) => {
              const value = Array.isArray(val) ? val[0] : val
              if (value !== undefined) {
                setPositionSize(value)
              }
            }}
            className="w-full"
          />
        </div>
      )}

      {positionSizing === 'fixed' && (
        <div className="space-y-1.5 pt-1.5 border-t border-border/20">
          <label htmlFor="shares-input" className="text-xs font-medium text-foreground">
            Order Quantity (shares)
          </label>
          <Input
            id="shares-input"
            type="number"
            min={1}
            value={positionSize}
            onChange={(e) => setPositionSize(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 text-xs font-mono"
          />
        </div>
      )}

      {/* Include Dividends Option */}
      <div className="flex items-center space-x-2.5 pt-1">
        <input
          id="dividends-checkbox"
          type="checkbox"
          checked={includeDividends}
          onChange={(e) => setIncludeDividends(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary/40 bg-transparent cursor-pointer"
        />
        <label
          htmlFor="dividends-checkbox"
          className="text-xs font-semibold text-foreground/80 hover:text-foreground cursor-pointer select-none"
        >
          Include Dividend Payments
        </label>
      </div>
    </div>
  )
}
