/**
 * LLM service — OpenAI-compatible chat completions.
 * F-012: LlmProviderConfig + DeepInfra fallback on 5xx/429 exhaustion.
 * F-014: chatStream async generator (SSE token streaming).
 * F-015: model split — rewrite model vs answer model via env.
 * F-016: cache_control on system messages (future-proofs for Anthropic).
 * F-022: groqLlmPolicy circuit breaker integration.
 */

import { groqLlmPolicy, setGroqLlmFallback } from "./resilience"

export interface LlmMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LlmResponse {
  response: string
  promptTokens: number
  completionTokens: number
}

// F-012: provider configuration
export interface LlmProviderConfig {
  apiKey: string
  model: string
  baseUrl?: string // default: Groq
}

// Sentinel prefix for upstream exhaustion — callers can detect and surface correctly
const UNAVAILABLE_SENTINEL = "LLM_UNAVAILABLE"

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"
const DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai"

// Internal shaped message with optional cache_control (F-016)
interface WireMessage {
  role: string
  content: string
  cache_control?: { type: "ephemeral" }
}

function toWireMessages(messages: LlmMessage[]): WireMessage[] {
  return messages.map((m) => {
    const wire: WireMessage = { role: m.role, content: m.content }
    // F-016: mark system messages for prompt caching — no-op on Groq/DeepInfra, active on Anthropic
    if (m.role === "system") {
      wire.cache_control = { type: "ephemeral" }
    }
    return wire
  })
}

function isGroqUrl(url: string): boolean {
  return url.includes("groq.com")
}

export class LlmService {
  private primary: Required<LlmProviderConfig>
  private fallback: Required<LlmProviderConfig> | null

  constructor(
    primary: LlmProviderConfig,
    fallbackConfig?: LlmProviderConfig
  ) {
    this.primary = {
      apiKey: primary.apiKey,
      model: primary.model,
      baseUrl: primary.baseUrl ?? GROQ_BASE_URL,
    }
    this.fallback = fallbackConfig
      ? {
          apiKey: fallbackConfig.apiKey,
          model: fallbackConfig.model,
          baseUrl: fallbackConfig.baseUrl ?? GROQ_BASE_URL,
        }
      : null
  }

  async chat(messages: LlmMessage[], maxTokens: number = 1024): Promise<LlmResponse> {
    try {
      return await this.chatWithProvider(this.primary, messages, maxTokens)
    } catch (err) {
      if (this.fallback && isFallbackEligible(err)) {
        console.warn("LLM primary failed — activating DeepInfra fallback")
        setGroqLlmFallback(true)
        try {
          return await this.chatWithFallback(this.fallback, messages, maxTokens)
        } catch (fallbackErr) {
          setGroqLlmFallback(false)
          const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
          console.error(`LLM fallback also failed: ${fbMsg.slice(0, 100)}`)
          return {
            response: extractContextPassthrough(messages),
            promptTokens: 0,
            completionTokens: 0,
          }
        } finally {
          setGroqLlmFallback(false)
        }
      }
      throw err
    }
  }

  async *chatStream(
    messages: LlmMessage[],
    maxTokens: number = 1536
  ): AsyncGenerator<string> {
    try {
      yield* this.chatStreamWithProvider(this.primary, messages, maxTokens)
    } catch (err) {
      if (this.fallback && isFallbackEligible(err)) {
        console.warn("LLM primary stream failed — activating DeepInfra fallback")
        setGroqLlmFallback(true)
        try {
          yield* this.chatStreamWithProvider(this.fallback, messages, maxTokens)
        } catch (fallbackErr) {
          setGroqLlmFallback(false)
          console.error("LLM stream: both providers failed, yielding context passthrough")
          yield extractContextPassthrough(messages)
          return
        } finally {
          setGroqLlmFallback(false)
        }
      } else {
        throw err
      }
    }
  }

  // NOTE: Stream-iteration errors bypass circuit breaker tracking — the breaker wraps
  // generator creation, not consumption. A sustained stream failure may not open the circuit.

  private async chatWithProvider(
    config: Required<LlmProviderConfig>,
    messages: LlmMessage[],
    maxTokens: number
  ): Promise<LlmResponse> {
    const call = () => fetchChatCompletion(config, messages, maxTokens)

    // F-022: wrap Groq calls with circuit breaker policy
    const raw = isGroqUrl(config.baseUrl)
      ? await groqLlmPolicy.execute(call)
      : await call()

    return raw
  }

  // Fallback bypasses circuit breaker — it's already the last resort
  private async chatWithFallback(
    config: Required<LlmProviderConfig>,
    messages: LlmMessage[],
    maxTokens: number
  ): Promise<LlmResponse> {
    try {
      return await fetchChatCompletion(config, messages, maxTokens)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`${UNAVAILABLE_SENTINEL}:${msg}`)
    }
  }

  private async *chatStreamWithProvider(
    config: Required<LlmProviderConfig>,
    messages: LlmMessage[],
    maxTokens: number
  ): AsyncGenerator<string> {
    const call = () => fetchChatStream(config, messages, maxTokens)

    // F-022: wrap Groq stream calls with circuit breaker policy
    const stream = isGroqUrl(config.baseUrl)
      ? await groqLlmPolicy.execute(call)
      : await call()

    yield* stream
  }
}

// ---------------------------------------------------------------------------
// Pure fetch helpers — no class state
// ---------------------------------------------------------------------------

async function fetchChatCompletion(
  config: Required<LlmProviderConfig>,
  messages: LlmMessage[],
  maxTokens: number
): Promise<LlmResponse> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: toWireMessages(messages),
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json() as GroqResponse

  if (!data.choices?.length) {
    console.warn("LLM returned empty choices — possible content filtering")
    return { response: "", promptTokens: 0, completionTokens: 0 }
  }

  return {
    response: data.choices[0]?.message?.content ?? "",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  }
}

async function* fetchChatStream(
  config: Required<LlmProviderConfig>,
  messages: LlmMessage[],
  maxTokens: number
): AsyncGenerator<string> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: toWireMessages(messages),
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM stream API error ${res.status}: ${text.slice(0, 200)}`)
  }

  if (!res.body) {
    throw new Error("LLM stream response has no body")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      // Keep the last (potentially incomplete) line in buffer
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data: ")) continue
        const payload = trimmed.slice(6)
        if (payload === "[DONE]") return

        try {
          const chunk = JSON.parse(payload) as StreamChunk
          const content = chunk.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ---------------------------------------------------------------------------
// Eligibility: only fall back on upstream errors (5xx, 429)
// ---------------------------------------------------------------------------

function extractContextPassthrough(messages: LlmMessage[]): string {
  const userMsg = messages.find((m) => m.role === "user")
  if (!userMsg) return "LLM unavailable."
  const contextMatch = userMsg.content.match(/Context:\n([\s\S]*?)\n\nQuestion:/)
  if (contextMatch?.[1]) {
    return `Here are the relevant passages:\n\n${contextMatch[1].trim()}`
  }
  return "LLM unavailable. Please try again later."
}

function isFallbackEligible(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  // cockatiel BrokenCircuitError / IsolatedCircuitError — circuit is open
  if (err.constructor.name === "BrokenCircuitError") return true
  if (err.constructor.name === "IsolatedCircuitError") return true
  // HTTP 5xx or 429 from provider
  return /API error (5\d\d|429)/.test(err.message)
}

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

interface GroqResponse {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

interface StreamChunk {
  choices?: { delta?: { content?: string } }[]
}
