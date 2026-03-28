import type { Chunk, ChunkerOptions } from "./types"
import { chunkSemantic } from "./semantic"
import { chunkTable } from "./table"
import { chunkTimestamp } from "./timestamp"
import { chunkHierarchical } from "./hierarchical"

export type { Chunk, ChunkMetadata, ChunkerOptions } from "./types"

export class ChunkerService {
  /**
   * Auto-detect strategy from sourceFormat, or use explicit override.
   * Pass options.hierarchical = true to emit parent+child chunks (F-017).
   */
  chunk(content: string, sourceFormat: string, options: ChunkerOptions = {}): Chunk[] {
    if (options.hierarchical) {
      return chunkHierarchical(content, options)
    }

    const strategy = options.strategy ?? detectStrategy(sourceFormat)

    switch (strategy) {
      case "row":
        return chunkTable(content, options.maxTokens)
      case "timestamp":
        return chunkTimestamp(content, options.maxTokens)
      case "semantic":
      default:
        return chunkSemantic(content, options)
    }
  }
}

function detectStrategy(sourceFormat: string): "semantic" | "row" | "timestamp" {
  switch (sourceFormat) {
    case "csv":
    case "xlsx":
    case "ods":
      return "row"
    case "audio":
    case "youtube":
      return "timestamp"
    default:
      return "semantic"
  }
}
