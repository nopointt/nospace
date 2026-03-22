import type { HybridSearchResult } from "../vectorstore/types"
import type { RagSource } from "./types"
import { DEFAULT_MAX_CONTEXT_TOKENS } from "./types"

/**
 * Build context string from search results, fitting within token budget.
 * Returns context string + source list.
 */
export function buildContext(
  results: HybridSearchResult[],
  maxTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
): { context: string; sources: RagSource[] } {
  const sources: RagSource[] = []
  const parts: string[] = []
  let currentTokens = 0

  for (const result of results) {
    const chunkTokens = estimateTokens(result.metadata.content)

    if (currentTokens + chunkTokens > maxTokens && parts.length > 0) {
      break
    }

    parts.push(`[Source ${parts.length + 1}]\n${result.metadata.content}`)
    sources.push({
      chunkId: result.id,
      documentId: result.metadata.documentId,
      content: result.metadata.content,
      score: result.score,
      source: result.source,
    })
    currentTokens += chunkTokens
  }

  return {
    context: parts.join("\n\n"),
    sources,
  }
}

/**
 * Simple token estimation: ~1 token per word.
 */
function estimateTokens(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}
