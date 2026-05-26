import { SymbolInfoResponse } from '@/types'
import { useAuthStore } from '@/store/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export interface BacktestPayload {
  symbols: string[]
  strategy: {
    type: string
    parameters: Record<string, any>
    python_code?: string | null
  }
  start_date: string
  end_date: string
  interval: string
  initial_capital: number
  position_sizing: string
  position_size: number
  risk_per_trade: number
  stop_fraction?: number
  benchmark_symbol?: string | null
  include_dividends?: boolean
}

/**
 * Builds the BacktestRequestSchema payload from the Zustand store state.
 */
export function buildBacktestPayload(storeState: {
  symbols: { symbol: string; status: 'loading' | 'ok' | 'partial' | 'error' }[]
  strategyMode: 'nl' | 'python'
  strategyInput: string
  strategyConfig: any
  startDate: string
  endDate: string
  interval: string
  capital: number
  riskPerTrade: number
  positionSizing: string
  positionSize: number
  stopFraction: number
  benchmarkSymbol: string
  includeDividends: boolean
}): BacktestPayload {
  const symbols = storeState.symbols
    .filter((s) => s.status === 'ok' || s.status === 'partial')
    .map((s) => s.symbol.toUpperCase())

  let strategy: { type: string; parameters: Record<string, any>; python_code?: string | null }

  if (storeState.strategyMode === 'python') {
    strategy = {
      type: 'custom',
      parameters: {},
      python_code: storeState.strategyInput,
    }
  } else {
    // Natural Language / preset mode
    if (storeState.strategyConfig) {
      strategy = {
        type: storeState.strategyConfig.type,
        parameters: storeState.strategyConfig.parameters || {},
        python_code: null,
      }
    } else {
      // Fallback/Default config if none resolved yet
      strategy = {
        type: 'moving_average_crossover',
        parameters: { short_window: 20, long_window: 50 },
        python_code: null,
      }
    }
  }

  return {
    symbols,
    strategy,
    start_date: storeState.startDate,
    end_date: storeState.endDate,
    interval: storeState.interval,
    initial_capital: storeState.capital,
    position_sizing: storeState.positionSizing,
    position_size: storeState.positionSize,
    risk_per_trade: storeState.riskPerTrade,
    stop_fraction: storeState.stopFraction,
    benchmark_symbol: storeState.benchmarkSymbol || null,
    include_dividends: storeState.includeDividends,
  }
}

/**
 * Sends a POST /api/backtest/run request to the backend.
 * Returns the run_id on success, or throws an error with backend validation details.
 */
export async function launchBacktest(payload: BacktestPayload): Promise<string> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}/api/backtest/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let errorMessage = 'Failed to launch backtest'
    try {
      const errData = await res.json()
      if (errData.detail) {
        if (Array.isArray(errData.detail)) {
          errorMessage = errData.detail.map((e: any) => e.msg).join(', ')
        } else if (typeof errData.detail === 'string') {
          errorMessage = errData.detail
        } else if (errData.detail.errors) {
          errorMessage = errData.detail.errors.join(', ')
        }
      }
    } catch {
      // Non-JSON response
    }
    throw new Error(errorMessage)
  }

  const data = await res.json()
  return data.run_id
}

/**
 * Fetches symbol information from the backend.
 */
export async function getSymbolInfo(symbol: string): Promise<SymbolInfoResponse> {
  const res = await fetch(`${API_URL}/api/data/info/${symbol.toUpperCase()}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch symbol info for ${symbol}`)
  }
  return res.json()
}
