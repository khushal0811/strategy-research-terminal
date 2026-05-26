'use client'

import React from 'react'
import { useTerminalStore } from '@/store/terminalStore'
import { buildBacktestPayload, launchBacktest } from '@/hooks/useBacktest'
import { connectBacktest } from '@/hooks/useWebSocket'
import { resolveStrategy } from '@/llm/strategyResolver'
import { GroqProvider } from '@/llm/providers'
import { toast } from 'sonner'

// Components
import StrategyBox from '@/components/input/StrategyBox'
import UniverseBox from '@/components/input/UniverseBox'
import DateRangePicker from '@/components/input/DateRangePicker'
import IntervalSelector from '@/components/input/IntervalSelector'
import SimulationParameters from '@/components/input/SimulationParameters'
import RunButton from '@/components/input/RunButton'

import EquityCurve from '@/components/charts/EquityCurve'
import DrawdownChart from '@/components/charts/DrawdownChart'
import RollingSharpeChart from '@/components/charts/RollingSharpeChart'
import MetricsPanel from '@/components/analytics/MetricsPanel'
import TradeLog from '@/components/analytics/TradeLog'
import AIReport from '@/components/report/AIReport'
import UniverseNotes from '@/components/analytics/UniverseNotes'
import SystemOverlay from '@/components/sections/SystemOverlay'

// Auth & History Components
import { useAuthStore } from '@/store/authStore'
import { fetchMe } from '@/hooks/useAuth'
import UserMenu from '@/components/auth/UserMenu'
import AccountSettings from '@/components/settings/AccountSettings'
import RunHistory from '@/components/history/RunHistory'

import { Shield, TrendingUp, Cpu, Sun, Moon, Info, RotateCcw } from 'lucide-react'

export default function TerminalDashboard() {
  const store = useTerminalStore()
  const {
    universeMode,
    symbols,
    strategyInput,
    strategyMode,
    strategyConfig,
    setStrategyConfig,
    llmApiKey,
    setLlmApiKey,
    setStatus,
    setError,
    status,
    runId,
    setRunId,
    resetRun,
  } = store

  const { accessToken, setUser } = useAuthStore()

  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark')
  const [llmSettingsOpen, setLlmSettingsOpen] = React.useState(false)
  const [overlayOpen, setOverlayOpen] = React.useState(false) // Start as false for terminal direct access
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  // Hydrate auth tokens from localStorage on client mount.
  // This MUST run before loadUser — without it, accessToken is null after
  // every page refresh, which silently breaks: auth headers on POST /api/backtest/run,
  // authenticated WebSocket connections (no DB save), and AI report persistence.
  React.useEffect(() => {
    useAuthStore.getState().hydrate()
  }, [])

  React.useEffect(() => {
    async function loadUser() {
      if (accessToken) {
        try {
          const u = await fetchMe(accessToken)
          setUser(u)
        } catch {
          // If token expired, clear tokens
          useAuthStore.getState().logout()
        }
      }
    }
    loadUser()
  }, [accessToken])

  // Hydrate theme on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = saved || 'dark'
    setTheme(initialTheme)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleRun = async () => {
    // 1. Reset previous run
    resetRun()

    // 2. Validate strategy configuration if in NL mode
    let activeConfig = strategyConfig
    if (strategyMode === 'nl' && !activeConfig) {
      setStatus('resolving')
      try {
        const provider = new GroqProvider(llmApiKey)
        const resolved = await resolveStrategy(strategyInput, provider)
        setStrategyConfig(resolved)
        activeConfig = resolved
        toast.success(`Strategy resolved: ${resolved.type}`)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to resolve strategy')
        toast.error(err.message || 'Strategy resolution failed.')
        return
      }
    }

    // 3. Set status to validating
    setStatus('validating')

    try {
      // 4. Build backtest request payload
      const payload = buildBacktestPayload({
        ...store,
        strategyConfig: activeConfig,
      })

      // 5. Fire launch request
      const runId = await launchBacktest(payload)
      setRunId(runId)
      setStatus('running')
      toast.success('Backtest initialized successfully. Streaming metrics...')

      // 6. Connect WebSocket for live updates
      connectBacktest(runId, store)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to launch backtest')
      toast.error(err.message || 'Backtest execution failed.')
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header bar */}
      <header className="h-[53px] shrink-0 border-b border-border bg-card/60 backdrop-blur-md flex items-center px-4 select-none">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-primary/10 border border-primary/30 p-1 rounded">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 font-sans uppercase">
                Strategy Research Terminal
              </h1>
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tight">
                Deterministic Engine Version 2.4.0
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Clear Run button — resets terminal dashboard state */}
            {(store.status !== 'idle' || store.runId !== null) && (
              <button
                onClick={() => {
                  store.resetRun()
                  toast.success('Dashboard cleared. Ready for a new run!')
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all cursor-pointer text-[10px] font-mono font-bold uppercase tracking-wider h-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Reset dashboard and clear current run"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear Run</span>
              </button>
            )}

            {/* Info button — opens system overlay */}
            <button
              onClick={() => setOverlayOpen(true)}
              aria-label="View system architecture"
              title="System Architecture"
              className="flex items-center justify-center w-6 h-6 rounded-full
                         border border-border bg-card
                         text-muted-foreground hover:text-primary
                         hover:border-primary/40 hover:shadow-[0_0_8px_rgba(37,99,235,0.15)]
                         transition-all duration-200 cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3 w-3" />
            </button>
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] text-muted-foreground border border-border bg-card px-2 py-0.5 rounded font-mono">
              <Cpu className="h-3 w-3 text-emerald-500" />
              <span>ENGINE: <strong className="text-foreground">ONLINE</strong></span>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] text-muted-foreground border border-border bg-card px-2 py-0.5 rounded font-mono">
              <Shield className="h-3 w-3 text-amber-500" />
              <span>SANDBOX: <strong className="text-foreground">ACTIVE</strong></span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-6 h-6 rounded border border-border bg-card hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
              )}
            </button>
            <UserMenu onOpenSettings={() => setSettingsOpen(true)} />
          </div>
        </div>
      </header>

      {/* Main Persistent Layout (Three Columns) */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 p-4 lg:p-6 lg:overflow-hidden items-stretch">
        {/* Column 1: Strategy & Parameters Sidebar */}
        <aside className="space-y-5 w-full lg:h-full lg:overflow-y-auto lg:pr-2 scrollbar-thin">
          <StrategyBox />
          <UniverseBox />

          {/* Collapsible LLM Settings */}
          <div className="border border-border/80 rounded bg-card/20 overflow-hidden">
            <button
              onClick={() => setLlmSettingsOpen(!llmSettingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-all select-none"
            >
              <span>LLM Settings</span>
              <span className="text-[9px]">{llmSettingsOpen ? '▼' : '▶'}</span>
            </button>
            {llmSettingsOpen && (
              <div className="p-3 border-t border-border/40 space-y-3 select-none">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="api-key" className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Groq API Key
                  </label>
                  <input
                    id="api-key"
                    type="password"
                    placeholder="gsk_..."
                    className="h-8 rounded border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono text-foreground"
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                  />
                  <p className="text-[9px] text-muted-foreground/60 leading-normal font-sans">
                    Required for natural language strategy mapping and universe resolution.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Simulation parameters group */}
          <div className="border border-border bg-card/25 rounded p-4.5 space-y-4 select-none">
            <div className="space-y-0.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
                SIMULATION PARAMETERS
              </h3>
              <p className="text-[10px] text-muted-foreground leading-normal font-sans">
                Configure backtest window bounds and trade size settings.
              </p>
            </div>
            
            <div className="h-px bg-border/40 w-full" />
            
            <DateRangePicker />
            <IntervalSelector />
            <SimulationParameters />
          </div>

          <RunButton onRun={handleRun} />
        </aside>

        {/* Column 2: Central Dashboard Column */}
        <main className="space-y-6 w-full min-w-0 lg:h-full lg:overflow-y-auto lg:px-2 scrollbar-thin">
          <EquityCurve />

          {status === 'complete' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DrawdownChart />
              <RollingSharpeChart />
            </div>
          )}

          <MetricsPanel />
          <UniverseNotes />
          <AIReport />
        </main>

        {/* Column 3: Live Execution Blotter Sidebar */}
        <aside className="border border-border bg-card/25 rounded w-full lg:h-full flex flex-col overflow-hidden p-4 space-y-4">
          <div className="flex-1 min-h-0 overflow-hidden">
            <TradeLog />
          </div>
          <div className="h-px bg-border/40 w-full" />
          <RunHistory />
        </aside>
      </div>

      {/* Mini status bar footer */}
      <footer className="h-7 shrink-0 border-t border-border/40 bg-card/10 flex items-center px-4 select-none text-[9px] font-mono text-muted-foreground/80">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span>Built with:</span>
            <span className="px-1 py-0.2 rounded bg-muted text-[8px] text-foreground/80">Python</span>
            <span className="px-1 py-0.2 rounded bg-muted text-[8px] text-foreground/80">FastAPI</span>
            <span className="px-1 py-0.2 rounded bg-muted text-[8px] text-foreground/80">Next.js</span>
            <span className="px-1 py-0.2 rounded bg-muted text-[8px] text-foreground/80">WebSocket</span>
            <span className="px-1 py-0.2 rounded bg-muted text-[8px] text-foreground/80">Groq</span>
          </div>

          <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50">
            Strategy Research Terminal · Real-time Quantitative System
          </div>
        </div>
      </footer>

      <SystemOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />
      <AccountSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
