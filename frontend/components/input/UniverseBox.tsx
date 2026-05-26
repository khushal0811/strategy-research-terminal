'use client'

import React, { useState } from 'react'
import { useTerminalStore, UniverseMode } from '@/store/terminalStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TickerChip from './TickerChip'
import { toast } from 'sonner'
import { resolveUniverse } from '@/llm/universeResolver'
import { GroqProvider } from '@/llm/providers'
import { Loader2, Sparkles } from 'lucide-react'

export default function UniverseBox() {
  const {
    universeInput,
    setUniverseInput,
    universeMode,
    setUniverseMode,
    symbols,
    addSymbol,
    removeSymbol,
    updateSymbol,
    startDate,
    llmApiKey,
  } = useTerminalStore()

  const [inputValue, setInputValue] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  const handleTabChange = (value: string) => {
    setUniverseMode(value as UniverseMode)
  }

  // Check symbol metadata via the API
  const checkSymbol = async (symbol: string) => {
    // Retain only valid ticker characters (A-Z, 0-9, dot, hyphen) and strip BOMs/zero-width spaces
    const cleanSymbol = symbol.replace(/[^A-Za-z0-9.-]/g, '').trim().toUpperCase()
    if (!cleanSymbol) return

    // Universe limit check
    if (symbols.length >= 100) {
      toast.warning('Stock universe cannot exceed 100 symbols.')
      return
    }

    // Deduplication check
    if (symbols.some((s) => s.symbol === cleanSymbol)) {
      toast.info(`Symbol ${cleanSymbol} is already in the list.`)
      return
    }

    // Add with loading state
    addSymbol({ symbol: cleanSymbol, status: 'loading' })

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const response = await fetch(`${apiUrl}/api/data/info/${cleanSymbol}`)
      if (!response.ok) {
        throw new Error('API request failed')
      }
      const data = await response.json()

      if (data.exists) {
        // Data is always re-fetched fresh from yfinance at run-time,
        // so the cached file dates are irrelevant — mark as ok.
        updateSymbol(cleanSymbol, {
          status: 'ok',
          availableFrom: data.start || undefined,
          availableTo: data.end || undefined,
          rowCount: data.row_count,
        })
      } else if (data.fetchable) {
        // No local data yet, but valid yfinance ticker — will be fetched at run-time
        updateSymbol(cleanSymbol, { status: 'ok' })
      } else {
        updateSymbol(cleanSymbol, { status: 'error' })
        toast.error(`Ticker ${cleanSymbol} not found.`)
      }
    } catch (error) {
      console.error(`Error validating ticker ${cleanSymbol}:`, error)
      updateSymbol(cleanSymbol, { status: 'error' })
      toast.error(`Could not validate ticker ${cleanSymbol}.`)
    }
  }

  const handleResolveUniverse = async () => {
    if (!universeInput.trim()) {
      toast.error('Please describe a stock universe first.')
      return
    }

    setIsResolving(true)
    try {
      const provider = new GroqProvider(llmApiKey)
      let resolvedSymbols = await resolveUniverse(universeInput, provider)

      if (resolvedSymbols.length === 0) {
        toast.info('No symbols resolved for this description.')
        return
      }

      let wasCapped = false
      if (resolvedSymbols.length > 20) {
        resolvedSymbols = resolvedSymbols.slice(0, 20)
        wasCapped = true
      }

      if (wasCapped) {
        toast.warning(
          'AI universe resolution is capped at 20 assets per query to ensure high resolution quality. Only the first 20 assets have been added.',
          { duration: 6000 }
        )
      } else {
        toast.success(`Resolved ${resolvedSymbols.length} tickers. Validating...`)
      }

      // Sequentially validate each symbol
      for (const sym of resolvedSymbols) {
        await checkSymbol(sym)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to resolve stock universe.')
    } finally {
      setIsResolving(false)
    }
  }

  // Parse strings with commas/spaces and check them
  const addSymbolsFromText = (text: string) => {
    const candidates = text
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    candidates.forEach((cand) => {
      checkSymbol(cand)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSymbolsFromText(inputValue)
      setInputValue('')
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) {
      addSymbolsFromText(inputValue)
      setInputValue('')
    }
  }

  return (
    <div className="w-full flex flex-col space-y-2 select-none">
      <div className="space-y-0.5">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
          UNIVERSE SELECTION
        </h3>
        <p className="text-[10px] text-muted-foreground leading-normal font-sans">
          Specify stock assets via manual tickers or natural language.
        </p>
      </div>

      <div className="border border-border/80 bg-card/20 rounded p-3 space-y-3">
        <Tabs value={universeMode} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-7 p-0.5 bg-muted/60">
            <TabsTrigger value="tickers" className="text-[10px] font-bold h-6 uppercase tracking-wider">Manual Tickers</TabsTrigger>
            <TabsTrigger value="nl" className="text-[10px] font-bold h-6 uppercase tracking-wider">Describe (AI)</TabsTrigger>
          </TabsList>

          <TabsContent value="tickers" className="space-y-3 pt-2">
            <div className="flex flex-col space-y-1">
              <label htmlFor="ticker-input" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Add Tickers
              </label>
              <Input
                id="ticker-input"
                type="text"
                placeholder="AAPL, MSFT..."
                value={inputValue}
                className="h-8 text-xs placeholder:text-muted-foreground/50"
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
              />
            </div>
          </TabsContent>

          <TabsContent value="nl" className="space-y-3 pt-2">
            <div className="flex flex-col space-y-1">
              <label htmlFor="universe-nl-input" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Universe description
              </label>
              <textarea
                id="universe-nl-input"
                className="min-h-[80px] w-full rounded border border-input bg-transparent px-2.5 py-1.5 text-xs shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Describe stock assets (e.g. 'liquid tech equities')..."
                value={universeInput}
                onChange={(e) => setUniverseInput(e.target.value)}
              />
              <p className="text-[9px] text-yellow-500/90 font-mono leading-normal mt-1 border border-yellow-500/20 bg-yellow-500/5 p-1.5 rounded select-none">
                ⚠️ AI universe resolution is capped at 20 assets per query to ensure high resolution quality. To build a larger universe (up to 100), you can resolve multiple AI queries sequentially or add tickers manually under &quot;Manual Tickers&quot;.
              </p>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={handleResolveUniverse}
                disabled={isResolving}
                className="font-bold text-[10px] uppercase h-7 px-3 flex items-center tracking-wider"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    Resolve AI Universe
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Persistent Ticker Chip List for both modes */}
        <div className="border-t border-border/40 pt-2.5 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
            <span>Active Universe</span>
            <span className="text-[9px] text-foreground/80 font-normal">({symbols.length} assets)</span>
          </div>
          <div className="flex flex-wrap gap-1 min-h-[30px] max-h-[100px] overflow-y-auto pr-1 scrollbar-thin">
            {symbols.length === 0 ? (
              <div className="text-[10px] text-muted-foreground/50 italic flex items-center h-8 font-mono">
                No assets added.
              </div>
            ) : (
              symbols.map((sym) => (
                <TickerChip key={sym.symbol} symbol={sym} onRemove={removeSymbol} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
