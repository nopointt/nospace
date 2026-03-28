/** A chunk record ready for vector indexing. */
export interface VectorRecord {
  /** Stable chunk identifier (UUID). */
  id: string
  /** Embedding vector produced by the embedding model. */
  vector: number[]
  /** Structured payload stored alongside the vector. */
  metadata: VectorMetadata
}

/** Payload stored with every indexed chunk. */
export interface VectorMetadata {
  /** Parent document identifier. */
  documentId: string
  /** Owner user — used for per-user search scoping. */
  userId?: string
  /** Zero-based position of this chunk within the document. */
  chunkIndex: number
  /** Raw text content of the chunk. */
  content: string
  // F-017: parent-child hierarchy fields
  chunkType?: "parent" | "child" | "flat"
  parentId?: string
}

/** Result from a single-mode search (vector-only or FTS-only). */
export interface SearchResult {
  /** Chunk identifier. */
  id: string
  /** Relevance score in [0, 1]. */
  score: number
  /** Chunk payload. */
  metadata: VectorMetadata
}

/** Result from hybrid search after Reciprocal Rank Fusion. */
export interface HybridSearchResult {
  /** Chunk identifier. */
  id: string
  /** Fused RRF score. Higher is more relevant. */
  score: number
  /** Which retrieval path(s) returned this chunk. */
  source: "vector" | "fts" | "both"
  /** Chunk payload. */
  metadata: VectorMetadata
}

/** Runtime options accepted by {@link VectorStoreService.search}. */
export interface SearchOptions {
  /** Maximum number of results to return. Defaults to {@link DEFAULT_TOP_K}. */
  topK?: number
  /** Minimum fused score to include in results. Defaults to {@link DEFAULT_SCORE_THRESHOLD}. */
  scoreThreshold?: number
  /** Restrict results to chunks owned by this user. */
  userId?: string
}

// F-017: parent row shape returned by fetchParentsForChildren()
export interface ParentRow {
  parentId: string
  parentContent: string
  sectionHeading: string | null
  pageNumber: number | null
  bestChildScore: number
}

/** Default number of results returned when `topK` is not specified. */
export const DEFAULT_TOP_K = 10
/** Default minimum score threshold for hybrid search results. */
export const DEFAULT_SCORE_THRESHOLD = 0.3
/** Rank constant used in Reciprocal Rank Fusion (larger = smoother ranking). */
export const RRF_K = 60
