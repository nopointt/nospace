export interface Chunk {
  content: string
  index: number
  tokenCount: number
  startOffset: number
  endOffset: number
  metadata: ChunkMetadata
  /** F-017: "parent" | "child" | "flat". Absent on legacy chunks. */
  chunkType?: "parent" | "child" | "flat"
  /** F-017: index of parent chunk in the returned array (child only). */
  parentIndex?: number
  /** F-020: LLM-generated context prefix (50-100 tokens) */
  contextPrefix?: string
}

export interface ChunkMetadata {
  type: "semantic" | "row" | "slide" | "timestamp"
  page?: number
  sheet?: string
  startTime?: number
  endTime?: number
  sectionHeading?: string  // heading path at the point this chunk starts (e.g. "Installation > Linux")
}

export interface ChunkerOptions {
  maxTokens?: number
  overlap?: number
  strategy?: "semantic" | "row" | "slide" | "timestamp"
  /** F-017: emit parent+child hierarchy instead of flat chunks */
  hierarchical?: boolean
}

export const DEFAULT_MAX_TOKENS = 500
export const DEFAULT_OVERLAP = 100

// F-017: hierarchical chunker token limits
export const PARENT_MAX_TOKENS = 1024
export const PARENT_MIN_TOKENS = 50
export const CHILD_MAX_TOKENS = 200
export const CHILD_MIN_TOKENS = 20
