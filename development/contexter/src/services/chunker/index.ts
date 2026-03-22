import type { Chunk, ChunkerOptions } from "./types"
import { chunkSemantic } from "./semantic"
import { chunkTable } from "./table"
import { chunkTimestamp } from "./timestamp"

export type { Chunk, ChunkMetadata, ChunkerOptions } from "./types"

export class ChunkerService {
  /**
   * Auto-detect strategy from sourceFormat, or use explicit override.
   */
  chunk(content: string, sourceFormat: string, options: ChunkerOptions = {}): Chunk[] {
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
