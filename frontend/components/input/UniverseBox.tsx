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
    const cleanSymbol = symbol.trim().toUpperCase()
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
        const dataStartStr = data.start // YYYY-MM-DD
        const isPartial = dataStartStr && startDate && new Date(dataStartStr) > new Date(startDate)

        if (isPartial) {
          const formattedDate = new Date(dataStartStr).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })
          updateSymbol(cleanSymbol, {
            status: 'partial',
            availableFrom: dataStartStr,
            availableTo: data.end || undefined,
            rowCount: data.row_count,
          })
          toast.warning(
            `${cleanSymbol} has data from ${formattedDate} — included from that date onwards`
          )
        } else {
          updateSymbol(cleanSymbol, {
            status: 'ok',
            availableFrom: dataStartStr || undefined,
            availableTo: data.end || undefined,
            rowCount: data.row_count,
          })
        }
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
      const resolvedSymbols = await resolveUniverse(universeInput, provider)

      if (resolvedSymbols.length === 0) {
        toast.info('No symbols resolved for this description.')
        return
      }

      toast.success(`Resolved ${resolvedSymbols.length} tickers. Validating...`)

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
