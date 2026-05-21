'use client'

import React, { useState, useEffect } from 'react'
import { useTerminalStore, StrategyMode } from '@/store/terminalStore'
import { PRESET_STRATEGIES, PresetStrategyKey } from '@/constants/presetStrategies'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StrategyEditor from '@/components/editor/StrategyEditor'

export default function StrategyBox() {
  const {
    strategyInput,
    setStrategyInput,
    strategyMode,
    setStrategyMode,
    setStrategyConfig,
  } = useTerminalStore()

  // Local state to keep track of inputs for each tab independently
  const [nlInput, setNlInput] = useState<string>('')
  const [pythonInput, setPythonInput] = useState<string>('')

  // Sync initial values once
  useEffect(() => {
    if (strategyMode === 'nl') {
      setNlInput(strategyInput)
    } else {
      setPythonInput(strategyInput)
    }
  }, [])

  const handleTabChange = (value: string) => {
    const mode = value as StrategyMode
    setStrategyMode(mode)
    if (mode === 'nl') {
      setStrategyInput(nlInput)
    } else {
      setStrategyInput(pythonInput)
    }
  }

  const handleNlChange = (val: string) => {
    setNlInput(val)
    if (strategyMode === 'nl') {
      setStrategyInput(val)
    }
  }

  const handlePythonChange = (val: string) => {
    setPythonInput(val)
    if (strategyMode === 'python') {
      setStrategyInput(val)
    }
  }

  const handlePresetSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const key = event.target.value as PresetStrategyKey
    if (key && PRESET_STRATEGIES[key]) {
      const preset = PRESET_STRATEGIES[key]
      // In NL mode, select a preset strategy
      setStrategyConfig(preset.defaultConfig)
      const descText = `Preset: ${preset.label} - ${preset.description}`
      setNlInput(descText)
      setStrategyInput(descText)
    }
  }

  return (
    <div className="w-full flex flex-col space-y-2 select-none">
      <div className="space-y-0.5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
          STRATEGY CONFIG
        </h3>
        <p className="text-[10px] text-muted-foreground leading-normal font-sans">
          Select strategy parser to configure deterministic execution.
        </p>
      </div>

      <div className="border border-border/80 bg-card/20 rounded p-3 space-y-3">
        <Tabs value={strategyMode} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-7 p-0.5 bg-muted/60">
            <TabsTrigger value="nl" className="text-[10px] font-bold h-6 uppercase tracking-wider">Natural Language</TabsTrigger>
            <TabsTrigger value="python" className="text-[10px] font-bold h-6 uppercase tracking-wider">Python Code</TabsTrigger>
          </TabsList>

          <TabsContent value="nl" className="space-y-3 pt-2">
            <textarea
              className="min-h-[140px] w-full rounded border border-input bg-transparent px-2.5 py-1.5 text-xs shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Describe your trading strategy (e.g., 'moving average crossover with short 10 and long 50 days')..."
              value={nlInput}
              onChange={(e) => handleNlChange(e.target.value)}
            />

            <div className="flex flex-col space-y-1">
              <label htmlFor="preset-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Preset Strategy
              </label>
              <select
                id="preset-select"
                className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                onChange={handlePresetSelect}
                defaultValue=""
              >
                <option value="" disabled>-- Select a preset --</option>
                {Object.entries(PRESET_STRATEGIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          </TabsContent>

          <TabsContent value="python" className="space-y-3 pt-2">
            <StrategyEditor value={pythonInput} onChange={handlePythonChange} />
            <p className="text-[9px] text-muted-foreground/60 leading-normal font-sans">
              Custom Python strategy support will be dynamically parsed during run.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
