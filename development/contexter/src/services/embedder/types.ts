export interface EmbeddingResult {
  vector: number[]
  dimensions: number
  tokenCount: number
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[]
  totalTokens: number
}

export interface EmbedderOptions {
  model?: string
  dimensions?: number
  task?: "retrieval.passage" | "retrieval.query" | "text-matching"
}

export const JINA_MODEL = "jina-embeddings-v4"
export const JINA_DIMENSIONS = 1024
export const JINA_MAX_BATCH = 64
