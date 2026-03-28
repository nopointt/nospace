export interface Chunk {
  content: string
  index: number
  tokenCount: number
  startOffset: number
  endOffset: number
  metadata: ChunkMetadata
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
}

export const DEFAULT_MAX_TOKENS = 500
export const DEFAULT_OVERLAP = 100
