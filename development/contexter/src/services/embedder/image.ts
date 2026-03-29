/**
 * Image embedding via Jina CLIP v2.
 *
 * jina-embeddings-v4 is text-only. Multimodal image embedding requires
 * jina-clip-v2, which accepts { image: "data:image/png;base64,..." } inputs
 * and produces 512-dim vectors in the same cosine space as text embeddings.
 *
 * TODO: when Jina unifies jina-embeddings-v4 with multimodal support, migrate
 * image embedding here to use the same model as text chunks.
 */

import type { EmbeddingResult, BatchEmbeddingResult } from "./types"
import { JINA_DIMENSIONS, JINA_MAX_BATCH } from "./types"

const JINA_CLIP_MODEL = "jina-clip-v2"

export class ImageEmbedderService {
  private apiUrl: string
  private apiKey: string

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl
    this.apiKey = apiKey
  }

  /**
   * Embed a batch of images. Each input is a base64 string (no data URI prefix).
   * mimeTypes array must correspond 1:1 with base64Inputs.
   */
  async embedImages(
    base64Inputs: string[],
    mimeTypes: string[],
  ): Promise<BatchEmbeddingResult> {
    if (base64Inputs.length === 0) return { embeddings: [], totalTokens: 0 }

    const allEmbeddings: EmbeddingResult[] = []
    let totalTokens = 0

    for (let i = 0; i < base64Inputs.length; i += JINA_MAX_BATCH) {
      const batchB64 = base64Inputs.slice(i, i + JINA_MAX_BATCH)
      const batchMime = mimeTypes.slice(i, i + JINA_MAX_BATCH)
      const result = await this.callApi(batchB64, batchMime)
      allEmbeddings.push(...result.embeddings)
      totalTokens += result.totalTokens
    }

    return { embeddings: allEmbeddings, totalTokens }
  }

  private async callApi(
    base64Inputs: string[],
    mimeTypes: string[],
  ): Promise<BatchEmbeddingResult> {
    const input = base64Inputs.map((b64, i) => ({
      image: `data:${mimeTypes[i] ?? "image/png"};base64,${b64}`,
    }))

    const body = {
      model: JINA_CLIP_MODEL,
      input,
      dimensions: JINA_DIMENSIONS,
      truncate_dim: JINA_DIMENSIONS,
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Jina CLIP API error ${response.status}: ${error.slice(0, 200)}`)
    }

    const json = (await response.json()) as JinaResponse

    const embeddings: EmbeddingResult[] = json.data.map((item) => ({
      vector: item.embedding,
      dimensions: item.embedding.length,
      tokenCount: item.tokens ?? 0,
    }))

    return {
      embeddings,
      totalTokens: json.usage?.total_tokens ?? 0,
    }
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
