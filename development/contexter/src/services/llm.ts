/**
 * LLM service — Groq API (replaces Workers AI).
 * Model: llama-3.1-8b-instant (fast, free tier available).
 * P4-008: baseUrl configurable via env.
 * P2-009: exponential backoff retry on 429.
 * P3-004: log warning on empty choices (content filtering).
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LlmResponse {
  response: string
  promptTokens: number
  completionTokens: number
}

const MAX_RETRIES = 3
const BACKOFF_MS = [1000, 2000, 4000]

export class LlmService {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(apiKey: string, model: string = "llama-3.1-8b-instant") {
    this.apiKey = apiKey
    this.model = model
    // P4-008: configurable base URL — falls back to Groq
    this.baseUrl = process.env.GROQ_LLM_URL ?? "https://api.groq.com/openai/v1"
  }

  async chat(messages: LlmMessage[], maxTokens: number = 1024): Promise<LlmResponse> {
    let lastError = ""

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxTokens,
        }),
      })

      // P2-009: retry on 429 with exponential backoff
      if (res.status === 429 && attempt < MAX_RETRIES) {
        lastError = await res.text()
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]))
        continue
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Groq API error ${res.status}: ${text.slice(0, 200)}`)
      }

      const data = await res.json() as GroqResponse

      // P3-004: warn on empty choices — possible content filtering
      if (!data.choices?.length) {
        console.warn("Groq returned empty choices — possible content filtering")
        return { response: "", promptTokens: 0, completionTokens: 0 }
      }

      return {
        response: data.choices[0]?.message?.content ?? "",
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      }
    }

    throw new Error(`Groq API rate limit after ${MAX_RETRIES} retries: ${lastError}`)
  }
}

interface GroqResponse {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}
