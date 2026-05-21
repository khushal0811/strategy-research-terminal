import { WsMessage } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000'

interface TerminalStoreActions {
  status: string
  setProgress: (p: number) => void
  setCurrentEquity: (e: number) => void
  appendEquityPoint: (p: { timestamp: string; equity: number }) => void
  appendTrade: (t: any) => void
  appendDividend: (d: { symbol: string; dividend_per_share: number; timestamp: string }) => void
  setMetrics: (m: any) => void
  setStatus: (s: any) => void
  setError: (msg: string) => void
}

/**
 * Connects to the backtest WebSocket stream for the given runId.
 * Maps incoming events to Zustand store actions.
 */
export function connectBacktest(runId: string, store: TerminalStoreActions): WebSocket {
  const uri = `${WS_URL}/ws/backtest/${runId}`
  const ws = new WebSocket(uri)

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WsMessage

      if (msg.type === 'progress') {
        store.setProgress(msg.percent)
        store.setCurrentEquity(msg.equity)
        store.appendEquityPoint({
          timestamp: msg.timestamp,
          equity: msg.equity,
        })
      } else if (msg.type === 'trade') {
        store.appendTrade({
          symbol: msg.symbol,
          side: msg.side,
          quantity: msg.quantity,
          fill_price: msg.fill_price,
          timestamp: msg.timestamp,
        })
      } else if (msg.type === 'dividend') {
        store.appendDividend({
          symbol: msg.symbol,
          dividend_per_share: msg.dividend_per_share,
          timestamp: msg.timestamp,
        })
      } else if (msg.type === 'complete') {
        store.setMetrics(msg.metrics)
        store.setStatus('complete')
        ws.close()
      } else if (msg.type === 'error') {
        store.setError(msg.message)
        ws.close()
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err)
      store.setError('Invalid data received from WebSocket.')
      ws.close()
    }
  }

  ws.onerror = () => {
    store.setError('WebSocket connection error.')
  }

  ws.onclose = () => {
    // If connection drops before completing normally, report unexpected disconnect
    if (store.status === 'running') {
      store.setError('Connection closed unexpectedly.')
    }
  }

  return ws
}
