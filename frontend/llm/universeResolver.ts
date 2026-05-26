import { LLMProvider, cleanAndParseJSON } from './providers'

const UNIVERSE_RESOLVER_SYSTEM_PROMPT = `You are a financial quantitative analysis assistant.
Your task is to parse a stock universe description in natural language and resolve it to a list of matching public stock ticker symbols.

Rules:
1. Always use current, up-to-date ticker symbols. For example, use 'META' (Meta Platforms) instead of 'FB'. Use 'GOOGL' or 'GOOG' for Alphabet.
2. Be accurate to current market capitalization and trends (as of 2025/2026). The top US tech stocks by size/market cap are MSFT, AAPL, NVDA, GOOGL, AMZN, META, TSLA, AVGO, etc. Do not include outdated tickers (like FB) or smaller/non-top-10 tech firms (like PYPL, ADBE) when resolving queries for "top 10 biggest US tech stocks" unless specifically requested by name.
3. Return a maximum of 20 relevant stock tickers.

You MUST respond with valid JSON ONLY. Do not wrap in markdown \`\`\`json blocks.
The JSON must follow this exact schema:
{
  "symbols": ["AAPL", "MSFT", "GOOGL"]
}
`

/**
 * Resolves a natural language universe description into an array of ticker symbol strings.
 */
export async function resolveUniverse(
  description: string,
  provider: LLMProvider
): Promise<string[]> {
  const resultText = await provider.complete(
    [
      {
        role: 'user',
        content: `Resolve this universe description: "${description}"`,
      },
    ],
    UNIVERSE_RESOLVER_SYSTEM_PROMPT
  )

  try {
    const parsed = cleanAndParseJSON<{ symbols: string[] }>(resultText)

    if (!parsed || !Array.isArray(parsed.symbols)) {
      throw new Error('LLM response missing "symbols" array property.')
    }

    // Capitalize and sanitize symbols
    return parsed.symbols
      .map((s) => s.replace(/[^A-Za-z0-9.-]/g, '').trim().toUpperCase())
      .filter((s) => s.length > 0)
  } catch (err) {
    console.error('Failed to parse universe resolution JSON:', resultText, err)
    throw new Error('LLM did not return a valid universe JSON structure.')
  }
}
