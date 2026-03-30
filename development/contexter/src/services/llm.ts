/**
 * LLM service — OpenAI-compatible chat completions with provider chain.
 *
 * Provider chain: Groq (primary) → NIM (fallback 1) → DeepInfra (fallback 2).
 * On 429/5xx from any provider, the next in the chain is tried.
 * If all providers fail, returns a context passthrough (raw retrieved text).
 *
 * F-012: provider chain with ordered fallbacks.
 * F-014: chatStream async generator (SSE token streaming).
 * F-015: model split — rewrite model vs answer model via env.
 * F-022: groqLlmPolicy circuit breaker on Groq calls.
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

export interface LlmProviderConfig {
  apiKey: string
  model: string
  baseUrl?: string
  /** Human-readable name for logging (e.g., "Groq", "NIM", "DeepInfra") */
  name?: string
}

type ResolvedProvider = Required<Pick<LlmProviderConfig, "apiKey" | "model" | "baseUrl">> & { name: string }

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"

// Internal wire message with optional cache_control (F-016, Anthropic-only)
interface WireMessage {
  role: string
  content: string
  cache_control?: { type: "ephemeral" }
}

function toWireMessages(messages: LlmMessage[]): WireMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }))
}

function isGroqUrl(url: string): boolean {
  return url.includes("groq.com")
}

function resolveProvider(config: LlmProviderConfig, defaultName: string): ResolvedProvider {
  return {
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl ?? GROQ_BASE_URL,
    name: config.name ?? defaultName,
  }
}

export class LlmService {
  private chain: ResolvedProvider[]

  /**
   * @param primary — main provider (typically Groq)
   * @param fallbacks — ordered fallback providers, tried in sequence on 429/5xx
   */
  constructor(primary: LlmProviderConfig, ...fallbacks: (LlmProviderConfig | undefined)[]) {
    this.chain = [
      resolveProvider(primary, "primary"),
      ...fallbacks
        .filter((f): f is LlmProviderConfig => f !== undefined)
        .map((f, i) => resolveProvider(f, f.name ?? `fallback-${i + 1}`)),
    ]
  }

  async chat(messages: LlmMessage[], maxTokens: number = 1024): Promise<LlmResponse> {
    for (let i = 0; i < this.chain.length; i++) {
      const provider = this.chain[i]
      try {
        const result = await this.chatWithProvider(provider, messages, maxTokens)
        if (i > 0) setGroqLlmFallback(false) // reset fallback state on success
        return result
      } catch (err) {
        const isLast = i === this.chain.length - 1
        if (isLast || !isFallbackEligible(err)) {
          if (isLast && this.chain.length > 1) {
            // All providers exhausted — return context passthrough
            console.error(`LLM chain exhausted (${this.chain.length} providers) — returning context passthrough`)
            return {
              response: extractContextPassthrough(messages),
              promptTokens: 0,
              completionTokens: 0,
            }
          }
          throw err
        }
        const next = this.chain[i + 1]
        console.warn(`LLM [${provider.name}] failed (${errSummary(err)}) — falling back to [${next?.name}]`)
        if (isGroqUrl(provider.baseUrl)) setGroqLlmFallback(true)
      }
    }
    // Unreachable, but TypeScript needs it
    throw new Error("LLM provider chain is empty")
  }

  async *chatStream(messages: LlmMessage[], maxTokens: number = 1536): AsyncGenerator<string> {
    for (let i = 0; i < this.chain.length; i++) {
      const provider = this.chain[i]
      try {
        yield* this.chatStreamWithProvider(provider, messages, maxTokens)
        if (i > 0) setGroqLlmFallback(false)
        return
      } catch (err) {
        const isLast = i === this.chain.length - 1
        if (isLast || !isFallbackEligible(err)) {
          if (isLast && this.chain.length > 1) {
            console.error(`LLM stream chain exhausted — yielding context passthrough`)
            yield extractContextPassthrough(messages)
            return
          }
          throw err
        }
        const next = this.chain[i + 1]
        console.warn(`LLM stream [${provider.name}] failed (${errSummary(err)}) — falling back to [${next?.name}]`)
        if (isGroqUrl(provider.baseUrl)) setGroqLlmFallback(true)
      }
    }
  }

  private async chatWithProvider(
    provider: ResolvedProvider,
    messages: LlmMessage[],
    maxTokens: number,
  ): Promise<LlmResponse> {
    const call = () => fetchChatCompletion(provider, messages, maxTokens)
    return isGroqUrl(provider.baseUrl)
      ? await groqLlmPolicy.execute(call)
      : await call()
  }

  private async *chatStreamWithProvider(
    provider: ResolvedProvider,
    messages: LlmMessage[],
    maxTokens: number,
  ): AsyncGenerator<string> {
    const call = () => fetchChatStream(provider, messages, maxTokens)
    const stream = isGroqUrl(provider.baseUrl)
      ? await groqLlmPolicy.execute(call)
      : await call()
    yield* stream
  }
}

// ---------------------------------------------------------------------------
// Pure fetch helpers
// ---------------------------------------------------------------------------

async function fetchChatCompletion(
  config: ResolvedProvider,
  messages: LlmMessage[],
  maxTokens: number,
): Promise<LlmResponse> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: toWireMessages(messages),
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as GroqResponse

  if (!data.choices?.length) {
    console.warn(`LLM [${config.name}] returned empty choices — possible content filtering`)
    return { response: "", promptTokens: 0, completionTokens: 0 }
  }

  return {
    response: data.choices[0]?.message?.content ?? "",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  }
}

async function* fetchChatStream(
  config: ResolvedProvider,
  messages: LlmMessage[],
  maxTokens: number,
): AsyncGenerator<string> {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: toWireMessages(messages),
      max_tokens: maxTokens,
      stream: true,
    }),
    signal: AbortSignal.timeout(60_000), // streams need longer timeout
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
// Fallback eligibility + helpers
// ---------------------------------------------------------------------------

function isFallbackEligible(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (err.constructor.name === "BrokenCircuitError") return true
  if (err.constructor.name === "IsolatedCircuitError") return true
  return /API error (5\d\d|429)/.test(err.message)
}

function extractContextPassthrough(messages: LlmMessage[]): string {
  const userMsg = messages.find((m) => m.role === "user")
  if (!userMsg) return "LLM unavailable."
  const contextMatch = userMsg.content.match(/Context:\n([\s\S]*?)\n\nQuestion:/)
  if (contextMatch?.[1]) {
    return `Here are the relevant passages:\n\n${contextMatch[1].trim()}`
  }
  return "LLM unavailable. Please try again later."
}

function errSummary(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 80)
  return String(err).slice(0, 80)
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
