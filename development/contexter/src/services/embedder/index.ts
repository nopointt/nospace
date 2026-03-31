import type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions } from "./types"
import { JINA_MODEL, JINA_DIMENSIONS, JINA_MAX_BATCH } from "./types"
import { jinaRateLimiter, jinaPolicy } from "../resilience"
import { countTokensSync } from "../chunker/tokenizer"

export type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions }

/**
 * Conservative token cap per late_chunking batch.
 * Jina v4 blog (Jul 2025) stated 8K API limit; main docs advertise 32K.
 * Start conservative — increase to 32768 after empirical verification.
 */
const LATE_CHUNKING_TOKEN_CAP = 8192

interface EmbedBatch {
  texts: string[]
  useLateChunking: boolean
}

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
   * Embed a batch of texts.
   *
   * When lateChunking=true, uses token-aware batching:
   *  - Groups texts so each sub-batch total tokens <= LATE_CHUNKING_TOKEN_CAP (8K)
   *  - Single-text sub-batches skip late_chunking (identical result, less overhead)
   *  - Texts exceeding the cap individually are embedded without late_chunking
   *
   * When lateChunking=false, splits by JINA_MAX_BATCH (64) as before.
   */
  async embedBatch(texts: string[], options: EmbedderOptions = {}): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokens: 0 }
    }

    const model = options.model ?? JINA_MODEL
    const dimensions = options.dimensions ?? JINA_DIMENSIONS
    const task = options.task ?? "retrieval.passage"

    const batches = options.lateChunking
      ? this.buildLateChunkingBatches(texts)
      : this.buildStandardBatches(texts)

    const makeBatchCall = (batch: EmbedBatch) => {
      const batchOptions = batch.useLateChunking
        ? options
        : { ...options, lateChunking: false }
      // Wrap each API call with jinaPolicy (circuit breaker + bulkhead + retry)
      return jinaPolicy.execute(() => this.callApi(batch.texts, model, dimensions, task, batchOptions))
    }

    // Process in groups of 3 concurrent batches to respect Jina rate limits
    const CONCURRENCY = 3
    const allEmbeddings: EmbeddingResult[] = []
    let totalTokens = 0

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const group = batches.slice(i, i + CONCURRENCY).map(makeBatchCall)
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

  /**
   * Standard batching: split by JINA_MAX_BATCH (64 texts per API call).
   */
  private buildStandardBatches(texts: string[]): EmbedBatch[] {
    const batches: EmbedBatch[] = []
    for (let i = 0; i < texts.length; i += JINA_MAX_BATCH) {
      batches.push({ texts: texts.slice(i, i + JINA_MAX_BATCH), useLateChunking: false })
    }
    return batches
  }

  /**
   * Token-aware batching for late_chunking.
   *
   * Groups texts so that the total token count per batch stays under the cap.
   * Single texts exceeding the cap are embedded without late_chunking.
   * Single-text batches skip late_chunking (no cross-chunk context to gain).
   */
  private buildLateChunkingBatches(texts: string[]): EmbedBatch[] {
    const batches: EmbedBatch[] = []
    let current: string[] = []
    let currentTokens = 0

    for (const text of texts) {
      const tokens = countTokensSync(text)

      // Single text exceeds token cap → embed without late_chunking
      if (tokens > LATE_CHUNKING_TOKEN_CAP) {
        if (current.length > 0) {
          batches.push({ texts: current, useLateChunking: current.length > 1 })
          current = []
          currentTokens = 0
        }
        batches.push({ texts: [text], useLateChunking: false })
        continue
      }

      // Would exceed cap or max batch size → flush current batch
      if (
        (currentTokens + tokens > LATE_CHUNKING_TOKEN_CAP || current.length >= JINA_MAX_BATCH) &&
        current.length > 0
      ) {
        batches.push({ texts: current, useLateChunking: current.length > 1 })
        current = []
        currentTokens = 0
      }

      current.push(text)
      currentTokens += tokens
    }

    if (current.length > 0) {
      batches.push({ texts: current, useLateChunking: current.length > 1 })
    }

    return batches
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
    }
    if (options.lateChunking) {
      body.late_chunking = true
    }

    const maxRetries = 3
    let lastError: string = ""

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (jinaRateLimiter.isBackingOff()) {
        await new Promise((r) => setTimeout(r, jinaRateLimiter.remainingMs()))
      }

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

      if ([429, 500, 502, 503].includes(response.status) && attempt < maxRetries - 1) {
        lastError = await response.text()

        // Late_chunking-specific logging: distinguish from normal rate limits
        // (Jina v4 has a known ISE bug with late_chunking — HF discussion #59)
        if ([500, 502, 503].includes(response.status) && options.lateChunking) {
          console.warn(JSON.stringify({
            event: "jina_late_chunking_error",
            status: response.status,
            textCount: texts.length,
            attempt,
            error: lastError.slice(0, 200),
          }))
        }

        if (response.status === 429) {
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
