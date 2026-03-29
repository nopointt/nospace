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
  /**
   * Typed elements from Docling ML analysis.
   * When present, used instead of regex-based classifyBlocks() for semantic chunking.
   * Pass from pipeline when the Docling parser was used.
   */
  doclingElements?: import("../parsers/types").DoclingElement[]
  /** @deprecated Use softMaxTokens/hardMaxTokens. Maps to hardMaxTokens for backward compat. */
  maxTokens?: number
  /** Prefer closing chunk at this token count (default 400). */
  softMaxTokens?: number
  /** Absolute ceiling — never exceed unless a single atomic block is larger (default 800). */
  hardMaxTokens?: number
  /** Overlap tokens carried from previous chunk (default 50). Set 0 for code/table content. */
  overlap?: number
  strategy?: "semantic" | "row" | "slide" | "timestamp"
  /** F-017: emit parent+child hierarchy instead of flat chunks */
  hierarchical?: boolean
}

/** Resolve effective soft/hard/overlap from options, respecting backward compat. */
export function resolveTokenLimits(options: ChunkerOptions): {
  softMax: number
  hardMax: number
  overlap: number
} {
  const hardMax = options.hardMaxTokens ?? options.maxTokens ?? DEFAULT_HARD_MAX
  const softMax = options.softMaxTokens ?? Math.min(DEFAULT_SOFT_MAX, hardMax)
  const overlap = options.overlap ?? DEFAULT_OVERLAP
  return { softMax, hardMax, overlap }
}

export const DEFAULT_SOFT_MAX = 400
export const DEFAULT_HARD_MAX = 800
export const DEFAULT_OVERLAP = 50

/** @deprecated Use DEFAULT_SOFT_MAX / DEFAULT_HARD_MAX */
export const DEFAULT_MAX_TOKENS = DEFAULT_HARD_MAX

// F-017: hierarchical chunker token limits
export const PARENT_MAX_TOKENS = 1024
export const PARENT_MIN_TOKENS = 50
export const CHILD_MAX_TOKENS = 200
export const CHILD_MIN_TOKENS = 20
