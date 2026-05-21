import { LLMProvider, cleanAndParseJSON } from './providers'

export interface ResolvedStrategy {
  type: string
  parameters: Record<string, any>
}

const STRATEGY_RESOLVER_SYSTEM_PROMPT = `You are a financial quantitative analysis assistant.
Your task is to parse a trading strategy description in natural language and map it to one of the supported preset trading strategy types.

Supported strategy types and their parameter schemas:
1. moving_average_crossover
   Parameters:
     short_window: integer (default 20)
     long_window: integer (default 50)
2. momentum
   Parameters:
     lookback: integer (default 20)
     threshold: float (default 0.02)
3. mean_reversion
   Parameters:
     window: integer (default 20)
     num_std: float (default 2.0)
4. rsi
   Parameters:
     period: integer (default 14)
     oversold: float (default 30.0)
     overbought: float (default 70.0)
5. macd
   Parameters:
     fast: integer (default 12)
     slow: integer (default 26)
     signal: integer (default 9)
6. breakout
   Parameters:
     lookback: integer (default 20)
7. bollinger_bands
   Parameters:
     window: integer (default 20)
     num_std: float (default 2.0)
     squeeze_factor: float (default 0.05)
8. dual_momentum
   Parameters:
     lookback: integer (default 12)
     avg_lookback: integer (default 3)
9. trend_following
   Parameters:
     period: integer (default 200)
10. volume_weighted_mean_reversion
    Parameters:
      window: integer (default 20)
      threshold: float (default 0.02)

You MUST respond with valid JSON ONLY. Do not wrap in markdown \`\`\`json blocks.
The JSON must follow this exact schema:
{
  "type": "one_of_the_strategy_types_listed_above",
  "parameters": {
    "param_name": value
  }
}
`

/**
 * Resolves a natural language strategy description into a structured JSON configuration.
 */
export async function resolveStrategy(
  description: string,
  provider: LLMProvider
): Promise<ResolvedStrategy> {
  const resultText = await provider.complete(
    [
      {
        role: 'user',
        content: `Resolve this trading strategy description: "${description}"`,
      },
    ],
    STRATEGY_RESOLVER_SYSTEM_PROMPT
  )

  try {
    const parsed = cleanAndParseJSON<ResolvedStrategy>(resultText)

    if (!parsed.type) {
      throw new Error('LLM response missing strategy "type" property.')
    }
    if (!parsed.parameters) {
      parsed.parameters = {}
    }

    return parsed
  } catch (err) {
    console.error('Failed to parse strategy resolution JSON:', resultText, err)
    throw new Error('LLM did not return a valid strategy configuration JSON structure.')
  }
}
