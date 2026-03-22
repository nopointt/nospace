import type { EmbeddingResult, BatchEmbeddingResult, EmbedderOptions } from "./types"
import { JINA_MODEL, JINA_DIMENSIONS, JINA_MAX_BATCH } from "./types"

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
    return result.embeddings[0]
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

    const allEmbeddings: EmbeddingResult[] = []
    let totalTokens = 0

    for (let i = 0; i < texts.length; i += JINA_MAX_BATCH) {
      const batch = texts.slice(i, i + JINA_MAX_BATCH)
      const result = await this.callApi(batch, model, dimensions, task)
      allEmbeddings.push(...result.embeddings)
      totalTokens += result.totalTokens
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
    task: string
  ): Promise<BatchEmbeddingResult> {
    const body = {
      model,
      input: texts.map((text) => ({ text })),
      dimensions,
      task,
      truncate_dim: dimensions,
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

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
