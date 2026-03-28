import type Redis from "ioredis"
import { EmbedderService } from "./index"
import type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions } from "./types"
import { JINA_MODEL, JINA_DIMENSIONS } from "./types"

const TTL_PASSAGE = 2_592_000 // 30 days — stable document content
const TTL_QUERY = 14_400      // 4 hours  — ephemeral query embeddings

export class CachedEmbedderService {
  private inner: EmbedderService
  private redis: Redis

  constructor(inner: EmbedderService, redis: Redis) {
    this.inner = inner
    this.redis = redis
  }

  async embed(text: string, options: EmbedderOptions = {}): Promise<EmbeddingResult> {
    const result = await this.embedBatch([text], options)
    const first = result.embeddings[0]
    if (!first) throw new Error("CachedEmbedderService.embed: no embedding returned")
    return first
  }

  async embedBatch(texts: string[], options: EmbedderOptions = {}): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) return { embeddings: [], totalTokens: 0 }

    const model = options.model ?? JINA_MODEL
    const dims = options.dimensions ?? JINA_DIMENSIONS
    const task = options.task ?? "retrieval.passage"
    const ttl = this.ttlFor(task)

    // Compute cache keys for all texts
    const keys = await Promise.all(texts.map((t) => this.computeKey(t, model, task, dims)))

    // Batch Redis MGET in one round-trip
    let redisValues: (string | null)[] = new Array(texts.length).fill(null)
    try {
      redisValues = await this.redis.mget(...keys)
    } catch (e) {
      console.warn(JSON.stringify({ event: "embedding_cache_lookup_error", error: e instanceof Error ? e.message : String(e) }))
    }

    // Partition into cached and uncached
    const cached: (EmbeddingResult | null)[] = redisValues.map((v) => {
      if (!v) return null
      try { return JSON.parse(v) as EmbeddingResult } catch { return null }
    })

    const uncachedIndices: number[] = []
    const uncachedTexts: string[] = []
    for (let i = 0; i < texts.length; i++) {
      if (!cached[i]) {
        uncachedIndices.push(i)
        uncachedTexts.push(texts[i]!)
      }
    }

    // Fetch uncached from Jina
    let freshEmbeddings: EmbeddingResult[] = []
    let totalTokens = 0
    if (uncachedTexts.length > 0) {
      const batchResult = await this.inner.embedBatch(uncachedTexts, options)
      freshEmbeddings = batchResult.embeddings
      totalTokens = batchResult.totalTokens

      // Store fresh embeddings in Redis
      try {
        const pipeline = this.redis.pipeline()
        for (let j = 0; j < uncachedIndices.length; j++) {
          const idx = uncachedIndices[j]!
          pipeline.set(keys[idx]!, JSON.stringify(freshEmbeddings[j]), "EX", ttl)
        }
        await pipeline.exec()
      } catch (e) {
        console.warn(JSON.stringify({ event: "embedding_cache_store_error", error: e instanceof Error ? e.message : String(e) }))
      }
    }

    // Reconstruct full result in original order
    let freshCursor = 0
    const ordered: EmbeddingResult[] = texts.map((_, i) => {
      if (cached[i]) return cached[i]!
      return freshEmbeddings[freshCursor++]!
    })

    return { embeddings: ordered, totalTokens }
  }

  async embedQuery(query: string, options: EmbedderOptions = {}): Promise<EmbeddingResult> {
    return this.embed(query, { ...options, task: "retrieval.query" })
  }

  private async computeKey(text: string, model: string, task: string, dims: number): Promise<string> {
    const normalized = text.normalize("NFC").trim().replace(/\s+/g, " ")
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized))
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    return `emb:v1:${model}:${task}:${dims}:${hashHex}`
  }

  private ttlFor(task: string): number {
    return task === "retrieval.query" ? TTL_QUERY : TTL_PASSAGE
  }
}
