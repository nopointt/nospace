import type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions } from "./types"
import { JINA_MODEL, JINA_DIMENSIONS, JINA_MAX_BATCH } from "./types"
import { jinaRateLimiter } from "../resilience"

export type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions }

export class EmbedderService {
  private apiUrl: string
  private apiKey: string

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl
    this.apiKey = apiKey
  }

  /**
   * Embed a single text string.
   */
  async embed(text: string, options: EmbedderOptions = {}): Promise<EmbeddingResult> {
    const result = await this.embedBatch([text], options)
    const first = result.embeddings[0]
    if (!first) throw new Error("EmbedderService.embed: empty response from Jina API")
    return first
  }

  /**
   * Embed a batch of texts. Splits into sub-batches of JINA_MAX_BATCH.
   */
  async embedBatch(texts: string[], options: EmbedderOptions = {}): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokens: 0 }
    }

    const model = options.model ?? JINA_MODEL
    const dimensions = options.dimensions ?? JINA_DIMENSIONS
    const task = options.task ?? "retrieval.passage"

    const batchPromises: Promise<BatchEmbeddingResult>[] = []
    for (let i = 0; i < texts.length; i += JINA_MAX_BATCH) {
      batchPromises.push(this.callApi(texts.slice(i, i + JINA_MAX_BATCH), model, dimensions, task, options))
    }

    // Process in groups of 3 concurrent batches to respect Jina rate limits
    const CONCURRENCY = 3
    const allEmbeddings: EmbeddingResult[] = []
    let totalTokens = 0

    for (let i = 0; i < batchPromises.length; i += CONCURRENCY) {
      const group = batchPromises.slice(i, i + CONCURRENCY)
      const results = await Promise.all(group)
      for (const result of results) {
        allEmbeddings.push(...result.embeddings)
        totalTokens += result.totalTokens
      }
    }

    return { embeddings: allEmbeddings, totalTokens }
  }

  /**
   * Embed a query (uses retrieval.query task for asymmetric search).
   */
  async embedQuery(query: string, options: EmbedderOptions = {}): Promise<EmbeddingResult> {
    return this.embed(query, { ...options, task: "retrieval.query" })
  }

  private async callApi(
    texts: string[],
    model: string,
    dimensions: number,
    task: string,
    options: EmbedderOptions = {}
  ): Promise<BatchEmbeddingResult> {
    const body: Record<string, unknown> = {
      model,
      input: texts.map((text) => ({ text })),
      dimensions,
      task,
      truncate_dim: dimensions,
    }
    if (options.lateChunking) {
      body.late_chunking = true
    }

    // Max 3 retries with capped delays: 1s, 2s, 4s = 7s total backoff.
    // P4-007: runs on Bun — not CF Workers, no 30s wall clock limit.
    const maxRetries = 3
    let lastError: string = ""

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Respect shared backoff state — if another request already hit 429, wait it out
      if (jinaRateLimiter.isBackingOff()) {
        await new Promise((r) => setTimeout(r, jinaRateLimiter.remainingMs()))
      }

      // 10s per-request timeout prevents a single slow call from blocking the stage
      const signal = AbortSignal.timeout(10_000)

      let response: Response
      try {
        response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal,
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`Jina API fetch failed: ${msg}`)
      }

      // P3-008: retry on 429, 500, 502, 503 — transient Jina errors should not fail pipeline
      if ([429, 500, 502, 503].includes(response.status) && attempt < maxRetries - 1) {
        lastError = await response.text()
        if (response.status === 429) {
          // Parse Retry-After (seconds) and broadcast to all concurrent callers
          const retryAfterSec = Number(response.headers.get("Retry-After") ?? "5")
          const retryAfterMs = Number.isFinite(retryAfterSec) ? retryAfterSec * 1000 : 5_000
          jinaRateLimiter.setBackoff(retryAfterMs)
        }
        const delay = Math.min(1000 * Math.pow(2, attempt), 4_000)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Jina API error ${response.status}: ${error}`)
      }

      const json = (await response.json()) as JinaResponse

      const embeddings: EmbeddingResult[] = json.data.map((item) => ({
        vector: item.embedding,
        dimensions: item.embedding.length,
        tokenCount: item.tokens ?? 0,
      }))

      return {
        embeddings,
        totalTokens: json.usage?.total_tokens ?? embeddings.reduce((sum, e) => sum + e.tokenCount, 0),
      }
    }

    throw new Error(`Jina API rate limit after ${maxRetries} retries: ${lastError}`)
  }
}

interface JinaResponse {
  data: Array<{
    embedding: number[]
    index: number
    tokens?: number
  }>
  usage?: {
    total_tokens: number
    prompt_tokens: number
  }
}
