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

/** Result from hybrid search after Convex Combination fusion. */
export interface HybridSearchResult {
  /** Chunk identifier. */
  id: string
  /** Fused CC score in [0, 1]. Higher is more relevant. */
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
  /** Minimum CC score threshold. CC scores are in [0, 1]. Defaults to 0 — use topK to control result count. */
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
// CC scores are in [0, 1]. Set to 0 — topK controls the cutoff, not score.
export const DEFAULT_SCORE_THRESHOLD = 0
/**
 * @deprecated Legacy RRF rank constant — ONLY used by confidence.ts for legacy RRF normalization mode.
 * CC fusion (the current default) does not use this value.
 * Retained for backward compatibility when FUSION_MODE env var is "rrf".
 */
export const RRF_K = 60

// F-007: Convex Combination fusion alpha constants
/** Default weight for vector channel in CC fusion (0 = FTS-only, 1 = vector-only). */
export const FUSION_ALPHA = 0.5
/** Alpha for short keyword queries — favor FTS. */
export const FUSION_ALPHA_KEYWORD = 0.3
/** Alpha for long semantic queries — favor vector. */
export const FUSION_ALPHA_SEMANTIC = 0.7
/** Alpha for code/API queries — strongly favor FTS. */
export const FUSION_ALPHA_CODE = 0.2
