// Shared TypeScript types for the Strategy Research Terminal frontend
// Most types are co-located with the Zustand store (store/terminalStore.ts)
// This file holds API response shapes and utility types.

export interface SymbolInfoResponse {
  symbol: string
  exists: boolean
  start: string | null
  end: string | null
  row_count: number
  has_dividends: boolean
  dividend_start: string | null
  dividend_end: string | null
}

export interface BacktestRunResponse {
  run_id: string
  status: string
}

// WebSocket message union type
export type WsMessage =
  | { type: 'progress'; bar: number; total: number; percent: number; equity: number; timestamp: string }
  | { type: 'trade'; symbol: string; side: 'BUY' | 'SELL'; quantity: number; fill_price: number; timestamp: string }
  | { type: 'dividend'; symbol: string; dividend_per_share: number; timestamp: string }
  | { type: 'complete'; metrics: import('../store/terminalStore').BacktestMetrics; db_run_id?: string | null }
  | { type: 'error'; message: string }
