export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMProvider {
  complete(messages: Message[], systemPrompt?: string, jsonMode?: boolean): Promise<string>
}

export class GroqProvider implements LLMProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async complete(messages: Message[], systemPrompt?: string, jsonMode = true): Promise<string> {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        systemPrompt,
        jsonMode,
        userApiKey: this.apiKey,
      }),
    })

    if (!response.ok) {
      let errText = 'Failed to connect to Groq API'
      try {
        const errJson = await response.json()
        if (errJson?.error) {
          errText = errJson.error
        }
      } catch {
        // Fallback
      }
      throw new Error(errText)
    }

    const data = await response.json()
    return data.content
  }
}

/**
 * Clean Markdown code blocks and parse JSON safely
 */
export function cleanAndParseJSON<T>(rawText: string): T {
  let cleaned = rawText.trim()

  // Strip starting ```json or ```
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n')
    if (lines[0].startsWith('```')) {
      lines.shift()
    }
    if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
      lines.pop()
    }
    cleaned = lines.join('\n').trim()
  }

  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')
  let startIdx = -1
  let endChar = ''

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace
    endChar = '}'
  } else if (firstBracket !== -1) {
    startIdx = firstBracket
    endChar = ']'
  }

  if (startIdx !== -1) {
    const endIdx = cleaned.lastIndexOf(endChar)
    if (endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.slice(startIdx, endIdx + 1)
    }
  }

  return JSON.parse(cleaned) as T
}
