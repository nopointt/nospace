import type { HybridSearchResult } from "../vectorstore/types"
import type { RagSource } from "./types"
import { DEFAULT_MAX_CONTEXT_TOKENS, MMR_MAX_CHUNKS_PER_DOCUMENT } from "./types"
import { countTokensSync } from "../chunker/tokenizer"

/**
 * Build context string from search results using document-level diversity cap.
 *
 * F-008: MMR fallback — no embeddings available at assembly time, so we apply
 * maxChunksPerDocument=3 cap as a proxy for diversity. Captures ~60% of
 * full MMR benefit at zero cost.
 *
 * Results must be pre-sorted by descending score (RRF or reranker score).
 */
export function buildContext(
  results: HybridSearchResult[],
  maxTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
): { context: string; sources: RagSource[] } {
  const sources: RagSource[] = []
  const parts: string[] = []
  let currentTokens = 0
  const docChunkCount = new Map<string, number>()

  for (const result of results) {
    const docId = result.metadata.documentId
    const docCount = docChunkCount.get(docId) ?? 0

    // Diversity cap: skip if this document already contributed MMR_MAX_CHUNKS_PER_DOCUMENT chunks
    if (docCount >= MMR_MAX_CHUNKS_PER_DOCUMENT) {
      continue
    }

    const chunkTokens = estimateTokens(result.metadata.content)

    // Token budget: stop if adding this chunk would overflow (only after at least one chunk selected)
    if (currentTokens + chunkTokens > maxTokens && parts.length > 0) {
      break
    }

    parts.push(`[Source ${parts.length + 1}]\n${result.metadata.content}`)
    sources.push({
      chunkId: result.id,
      documentId: docId,
      content: result.metadata.content,
      score: result.score,
      source: result.source,
    })
    currentTokens += chunkTokens
    docChunkCount.set(docId, docCount + 1)
  }

  return {
    context: parts.join("\n\n"),
    sources,
  }
}

/**
 * Token estimation using BPE cl100k_base if loaded, conservative fallback otherwise.
 */
function estimateTokens(text: string): number {
  return countTokensSync(text)
}
