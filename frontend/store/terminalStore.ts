import { create } from 'zustand'

export type RunStatus = 'idle' | 'resolving' | 'validating' | 'running' | 'paused' | 'complete' | 'error'
export type Interval = '1d' | '1h' | '30m' | '15m' | '5m' | '2m' | '1m'
export type StrategyMode = 'nl' | 'python'
export type UniverseMode = 'nl' | 'tickers'

export interface TickerSymbol {
  symbol: string
  status: 'loading' | 'ok' | 'partial' | 'error'
  availableFrom?: string
  availableTo?: string
  rowCount?: number
}

export interface EquityPoint {
  timestamp: string
  equity: number
}

export interface Trade {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  fill_price: number
  timestamp: string
}

export interface BacktestMetrics {
  total_return: number
  price_return: number
  total_return_with_dividends: number
  cagr: number | null
  sharpe_ratio: number | null
  max_drawdown: number
  volatility: number | null
  win_rate: number | null
  total_trades: number
  avg_trade_return: number | null
  total_dividend_income: number
  initial_value: number
  final_value: number
  benchmark_return: number | null
  alpha: number | null
  total_commission_paid: number
}

interface TerminalState {
  // Input
  strategyInput: string
  strategyMode: StrategyMode
  strategyConfig: object | null
  universeInput: string
  universeMode: UniverseMode
  symbols: TickerSymbol[]
  startDate: string
  endDate: string
  interval: Interval
  capital: number
  riskPerTrade: number       // fraction: 0.005–0.10
  positionSizing: 'fixed' | 'percentage' | 'risk_based'
  positionSize: number
  stopFraction: number
  benchmarkSymbol: string
  includeDividends: boolean

  // LLM
  llmProvider: string
  llmApiKey: string

  // Run state
  runId: string | null
  dbRunId: string | null
  status: RunStatus
  progress: number
  errorMessage: string | null
  wsRef: WebSocket | null

  // Live results
  equityCurve: EquityPoint[]
  trades: Trade[]
  dividendEvents: { symbol: string; dividend_per_share: number; timestamp: string }[]
  currentEquity: number

  // Final results
  metrics: BacktestMetrics | null
  report: string | null

  // Actions
  setStrategyInput: (v: string) => void
  setStrategyMode: (m: StrategyMode) => void
  setStrategyConfig: (c: object | null) => void
  setUniverseInput: (v: string) => void
  setUniverseMode: (m: UniverseMode) => void
  addSymbol: (s: TickerSymbol) => void
  removeSymbol: (symbol: string) => void
  updateSymbol: (symbol: string, update: Partial<TickerSymbol>) => void
  setStartDate: (d: string) => void
  setEndDate: (d: string) => void
  setInterval: (i: Interval) => void
  setCapital: (c: number) => void
  setRiskPerTrade: (r: number) => void
  setLlmProvider: (p: string) => void
  setLlmApiKey: (k: string) => void
  setRunId: (id: string | null) => void
  setDbRunId: (id: string | null) => void
  setStatus: (s: RunStatus) => void
  setProgress: (p: number) => void
  appendEquityPoint: (p: EquityPoint) => void
  appendTrade: (t: Trade) => void
  appendDividend: (d: { symbol: string; dividend_per_share: number; timestamp: string }) => void
  setCurrentEquity: (e: number) => void
  setMetrics: (m: BacktestMetrics) => void
  setReport: (r: string) => void
  setError: (msg: string) => void
  setPositionSizing: (v: 'fixed' | 'percentage' | 'risk_based') => void
  setPositionSize: (v: number) => void
  setStopFraction: (v: number) => void
  setBenchmarkSymbol: (v: string) => void
  setIncludeDividends: (v: boolean) => void
  setWsRef: (ws: WebSocket | null) => void
  pauseRun: () => void
  resumeRun: () => void
  stopRun: () => void
  resetRun: () => void
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  strategyInput: '',
  strategyMode: 'nl',
  strategyConfig: null,
  universeInput: '',
  universeMode: 'tickers',
  symbols: [],
  startDate: '',
  endDate: '',
  interval: '1d',
  capital: 100_000,
  riskPerTrade: 0.02,
  positionSizing: 'risk_based',
  positionSize: 100,
  stopFraction: 0.02,
  benchmarkSymbol: 'SPY',
  includeDividends: true,
  llmProvider: 'groq',
  llmApiKey: '',
  runId: null,
  dbRunId: null,
  status: 'idle',
  progress: 0,
  errorMessage: null,
  wsRef: null,
  equityCurve: [],
  trades: [],
  dividendEvents: [],
  currentEquity: 0,
  metrics: null,
  report: null,

  setStrategyInput: (v) => set({ strategyInput: v }),
  setStrategyMode: (m) => set({ strategyMode: m }),
  setStrategyConfig: (c) => set({ strategyConfig: c }),
  setUniverseInput: (v) => set({ universeInput: v }),
  setUniverseMode: (m) => set({ universeMode: m }),
  addSymbol: (s) => set((state) => ({
    symbols: state.symbols.find(x => x.symbol === s.symbol)
      ? state.symbols
      : [...state.symbols, s]
  })),
  removeSymbol: (symbol) => set((state) => ({
    symbols: state.symbols.filter(s => s.symbol !== symbol)
  })),
  updateSymbol: (symbol, update) => set((state) => ({
    symbols: state.symbols.map(s => s.symbol === symbol ? { ...s, ...update } : s)
  })),
  setStartDate: (d) => set({ startDate: d }),
  setEndDate: (d) => set({ endDate: d }),
  setInterval: (i) => set({ interval: i }),
  setCapital: (c) => set({ capital: c }),
  setRiskPerTrade: (r) => set({ riskPerTrade: r }),
  setPositionSizing: (v) => set({ positionSizing: v }),
  setPositionSize: (v) => set({ positionSize: v }),
  setStopFraction: (v) => set({ stopFraction: v }),
  setBenchmarkSymbol: (v) => set({ benchmarkSymbol: v }),
  setIncludeDividends: (v) => set({ includeDividends: v }),
  setLlmProvider: (p) => set({ llmProvider: p }),
  setLlmApiKey: (k) => set({ llmApiKey: k }),
  setRunId: (id) => set({ runId: id }),
  setDbRunId: (id) => set({ dbRunId: id }),
  setStatus: (s) => set({ status: s }),
  setProgress: (p) => set({ progress: p }),
  appendEquityPoint: (p) => set((state) => ({ equityCurve: [...state.equityCurve, p] })),
  appendTrade: (t) => set((state) => ({ trades: [...state.trades, t] })),
  appendDividend: (d) => set((state) => ({ dividendEvents: [...state.dividendEvents, d] })),
  setCurrentEquity: (e) => set({ currentEquity: e }),
  setMetrics: (m) => set({ metrics: m }),
  setReport: (r) => set({ report: r }),
  setError: (msg) => set({ status: 'error', errorMessage: msg }),
  setWsRef: (ws) => set({ wsRef: ws }),
  pauseRun: () => {
    const ws = get().wsRef
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'pause' }))
      set({ status: 'paused' })
    }
  },
  resumeRun: () => {
    const ws = get().wsRef
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'resume' }))
      set({ status: 'running' })
    }
  },
  stopRun: () => {
    const ws = get().wsRef
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'stop' }))
      }
      try {
        ws.close()
      } catch (err) {
        // swallow
      }
    }
    set({
      runId: null,
      dbRunId: null,
      status: 'idle',
      progress: 0,
      errorMessage: null,
      equityCurve: [],
      trades: [],
      dividendEvents: [],
      currentEquity: 0,
      metrics: null,
      report: null,
      wsRef: null
    })
  },
  resetRun: () => set({
    runId: null, dbRunId: null, status: 'idle', progress: 0, errorMessage: null,
    equityCurve: [], trades: [], dividendEvents: [], currentEquity: 0,
    metrics: null, report: null, wsRef: null
  }),
}))
