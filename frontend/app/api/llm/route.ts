import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, systemPrompt, jsonMode, userApiKey } = await request.json()

    // 1. Prioritize the server-side environment variable (secure, not exposed to browser)
    // 2. Fall back to the user-provided key from the UI session if set
    const apiKey = process.env.GROQ_API_KEY || userApiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API Key is missing. Please set GROQ_API_KEY in your server environment (e.g., .env.local) or enter it in the settings panel.' },
        { status: 400 }
      )
    }

    const formattedMessages = []
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt })
    }
    formattedMessages.push(...messages)

    const requestBody: any = {
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages,
      temperature: 0,
    }

    if (jsonMode) {
      requestBody.response_format = { type: 'json_object' }
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errText = 'Failed to connect to Groq API'
      try {
        const errJson = await response.json()
        if (errJson?.error?.message) {
          errText = errJson.error.message
        }
      } catch {
        // Fallback
      }
      return NextResponse.json({ error: errText }, { status: response.status })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Invalid response from Groq API' }, { status: 500 })
    }

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error('Error in LLM Route Handler:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  const hasKey = !!process.env.GROQ_API_KEY
  return NextResponse.json({ hasKey })
}

