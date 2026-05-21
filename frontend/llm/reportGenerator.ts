import { LLMProvider } from './providers'
import { BacktestMetrics } from '@/store/terminalStore'

const REPORT_GENERATOR_SYSTEM_PROMPT = `You are an expert investment quantitative research analyst.
Your task is to analyze strategy backtest metrics and generate a professional, structured performance report in Markdown format.

Provide a thorough analysis including:
1. Executive Summary: Overall performance evaluation
2. Return Analysis: Evaluation of returns (CAGR, total return, price return vs benchmark)
3. Risk & Volatility: Analysis of Sharpe ratio, volatility, and Maximum Drawdown
4. Trading Efficiency: Win rate and trade count analytics
5. Optimization Recommendations: Suggestions to improve Sharpe or decrease drawdown based on metrics

Return the raw Markdown response directly. Do not wrap in markdown \`\`\`markdown blocks.
`

/**
 * Generates an AI analysis report in markdown based on the backtest metrics.
 */
export async function generateAiReport(
  metrics: BacktestMetrics,
  provider: LLMProvider
): Promise<string> {
  const promptContent = `Generate a performance report based on the following backtest metrics:
- Initial Capital: $${metrics.initial_value.toLocaleString()}
- Final Value: $${metrics.final_value.toLocaleString()}
- Total Return: ${(metrics.total_return * 100).toFixed(2)}%
- Price Return: ${(metrics.price_return * 100).toFixed(2)}%
- Total Return with Dividends: ${(metrics.total_return_with_dividends * 100).toFixed(2)}%
- CAGR: ${metrics.cagr ? (metrics.cagr * 100).toFixed(2) + '%' : '—'}
- Sharpe Ratio: ${metrics.sharpe_ratio ? metrics.sharpe_ratio.toFixed(4) : '—'}
- Max Drawdown: ${metrics.max_drawdown ? (metrics.max_drawdown * 100).toFixed(2) + '%' : '—'}
- Annualized Volatility: ${metrics.volatility ? (metrics.volatility * 100).toFixed(2) + '%' : '—'}
- Win Rate: ${metrics.win_rate ? (metrics.win_rate * 100).toFixed(2) + '%' : '—'}
- Total Trades: ${metrics.total_trades}
- Total Dividend Income: $${metrics.total_dividend_income.toLocaleString()}
- Benchmark Return (SPY): ${metrics.benchmark_return ? (metrics.benchmark_return * 100).toFixed(2) + '%' : '—'}
- Alpha: ${metrics.alpha ? (metrics.alpha * 100).toFixed(2) + '%' : '—'}
`

  // Note: Since we want markdown text, we disable JSON mode response formatting in the provider for this call
  // Or since the provider's complete method uses response_format: json_object by default,
  // we can create a text-completion complete call or update providers.ts to make response_format optional!
  // Let's check: in providers.ts, the complete() method does "response_format: { type: 'json_object' }".
  // If json_object is set, the LLM will fail if the response is not valid JSON!
  // Ah! This is a critical observation! If providers.ts always enforces json_object, then the report generator cannot return raw markdown text easily, OR we must request JSON from the LLM and extract a markdown string field, OR we must edit providers.ts to make response_format optional or customizable!
  // Modifying providers.ts to make json mode customizable or optional is the cleanest and most standard way.
  // Let's verify: we can pass a third parameter to complete() or check if it should only use JSON format when requested.
  // Actually, we can add a `jsonMode?: boolean` flag to `LLMProvider.complete` which default to `true` (or we can pass it as false for report text completion!).
  // Let's first edit providers.ts to add a `jsonMode` parameter.
  return provider.complete(
    [
      {
        role: 'user',
        content: promptContent,
      },
    ],
    REPORT_GENERATOR_SYSTEM_PROMPT,
    false
  )
}
