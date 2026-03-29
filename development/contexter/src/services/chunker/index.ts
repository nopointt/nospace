import type { Chunk, ChunkerOptions } from "./types"
import { chunkSemantic } from "./semantic"
import { chunkTable } from "./table"
import { chunkTimestamp } from "./timestamp"
import { chunkHierarchical } from "./hierarchical"
import { classifyBlocks } from "./block-classifier"
import type { Block } from "./block-classifier"
import { doclingElementsToBlocks } from "./docling-blocks"

export type { Chunk, ChunkMetadata, ChunkerOptions } from "./types"

export class ChunkerService {
  /**
   * Auto-detect strategy from sourceFormat, or use explicit override.
   * For semantic strategy, auto-detects content character (code-heavy, table-heavy, narrative)
   * and applies adaptive token limits unless explicit options are provided.
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
      default: {
        // Use Docling ML elements when available (more accurate than regex for PDF/DOCX).
        // Fall back to regex-based classification for plain text formats.
        const blocks = options.doclingElements && options.doclingElements.length > 0
          ? doclingElementsToBlocks(options.doclingElements)
          : classifyBlocks(content)
        const totalTokens = blocks.reduce((sum, b) => sum + b.tokenCount, 0)

        // Auto-activate hierarchical for substantial documents (> 1000 tokens)
        // unless explicitly disabled via options.hierarchical === false
        if (totalTokens > 1000 && options.hierarchical !== false) {
          return chunkHierarchical(content, options)
        }

        const adaptedOptions = applyContentTypeDefaults(blocks, options)
        return chunkSemantic(content, adaptedOptions, blocks)
      }
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

/**
 * Auto-detect content character from pre-classified blocks and apply adaptive defaults.
 * Only applies when the user hasn't specified explicit soft/hard limits.
 *
 * Detection heuristic:
 *  - >30% code blocks → code-heavy:  softMax=800, hardMax=1500, overlap=0
 *  - >30% table blocks → table-heavy: softMax=500, hardMax=1000, overlap=0
 *  - else → narrative:                softMax=400, hardMax=600,  overlap=80
 */
function applyContentTypeDefaults(blocks: Block[], options: ChunkerOptions): ChunkerOptions {
  if (options.softMaxTokens !== undefined || options.hardMaxTokens !== undefined) {
    return options
  }

  const contentBlocks = blocks.filter((b) => b.type !== "heading")
  const total = contentBlocks.length
  if (total === 0) return options

  const codeCount = contentBlocks.filter((b) => b.type === "code_block").length
  const tableCount = contentBlocks.filter((b) => b.type === "table").length

  if (codeCount / total > 0.3) {
    return { ...options, softMaxTokens: 800, hardMaxTokens: 1500, overlap: 0 }
  }
  if (tableCount / total > 0.3) {
    return { ...options, softMaxTokens: 500, hardMaxTokens: 1000, overlap: 0 }
  }

  return { ...options, softMaxTokens: 400, hardMaxTokens: 600, overlap: 80 }
}
