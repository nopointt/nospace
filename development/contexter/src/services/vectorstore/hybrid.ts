import type { SearchResult, HybridSearchResult } from "./types"
import { RRF_K } from "./types"

/**
 * Reciprocal Rank Fusion: merges FTS5 and vector results into a single ranked list.
 * RRF score = sum(1 / (k + rank)) across all result lists.
 */
export function reciprocalRankFusion(
  vectorResults: SearchResult[],
  ftsResults: SearchResult[],
  topK: number = 10
): HybridSearchResult[] {
  const scores = new Map<string, { score: number; source: Set<string>; metadata: SearchResult["metadata"] }>()

  // Score vector results
  for (let rank = 0; rank < vectorResults.length; rank++) {
    const r = vectorResults[rank]
    const existing = scores.get(r.id)
    const rrfScore = 1 / (RRF_K + rank + 1)

    if (existing) {
      existing.score += rrfScore
      existing.source.add("vector")
    } else {
      scores.set(r.id, {
        score: rrfScore,
        source: new Set(["vector"]),
        metadata: r.metadata,
      })
    }
  }

  // Score FTS results
  for (let rank = 0; rank < ftsResults.length; rank++) {
    const r = ftsResults[rank]
    const existing = scores.get(r.id)
    const rrfScore = 1 / (RRF_K + rank + 1)

    if (existing) {
      existing.score += rrfScore
      existing.source.add("fts")
    } else {
      scores.set(r.id, {
        score: rrfScore,
        source: new Set(["fts"]),
        metadata: r.metadata,
      })
    }
  }

  // Sort by fused score descending, take topK
  const fused = Array.from(scores.entries())
    .map(([id, data]) => ({
      id,
      score: data.score,
      source: (data.source.size === 2 ? "both" : data.source.values().next().value) as HybridSearchResult["source"],
      metadata: data.metadata,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return fused
}
