export interface VectorRecord {
  id: string
  vector: number[]
  metadata: VectorMetadata
}

export interface VectorMetadata {
  documentId: string
  userId?: string
  chunkIndex: number
  content: string
}

export interface SearchResult {
  id: string
  score: number
  metadata: VectorMetadata
}

export interface HybridSearchResult {
  id: string
  score: number
  source: "vector" | "fts" | "both"
  metadata: VectorMetadata
}

export interface SearchOptions {
  topK?: number
  scoreThreshold?: number
  userId?: string
}

export const DEFAULT_TOP_K = 10
export const DEFAULT_SCORE_THRESHOLD = 0.3
export const RRF_K = 60
