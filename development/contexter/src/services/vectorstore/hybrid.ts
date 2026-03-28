import type { SearchResult, HybridSearchResult } from "./types"
import { FUSION_ALPHA } from "./types"

/**
 * Min-max normalize an array of scores to [0, 1].
 * Edge cases:
 *   - Empty array → return [].
 *   - Single element → return [1.0] (perfect score for uncontested result).
 *   - All scores identical → return array filled with 0.5 (equal weight, avoid 0/0).
 */
function minmaxNormalize(scores: number[]): number[] {
  if (scores.length === 0) return []
  // Single result gets score 1.0 — it is maximally ranked within its channel.
  // This means a single low-relevance result gets promoted. This is by design:
  // topK and confidence scoring downstream provide quality gating.
  if (scores.length === 1) return [1.0]

  const min = Math.min(...scores)
  const max = Math.max(...scores)

  if (max === min) {
    // All scores identical — assign equal weight rather than 0.0
    return scores.map(() => 0.5)
  }

  return scores.map((s) => (s - min) / (max - min))
}

/**
 * Convex Combination fusion: merges pgvector cosine and FTS ts_rank results
 * into a single ranked list preserving score magnitude.
 *
 * Formula: fused_score = alpha * norm_vector + (1 - alpha) * norm_fts
 *
 * Where norm_vector and norm_fts are min-max normalized to [0, 1].
 * Results appearing in only one list receive 0.0 for the missing channel.
 *
 * @param vectorResults  Results from pgvector cosine search (pre-fetched topK*2).
 * @param ftsResults     Results from PostgreSQL ts_rank FTS search (pre-fetched topK*2).
 * @param topK           Number of results to return.
 * @param alpha          Weight for vector channel. Default: FUSION_ALPHA (0.5).
 *                       Pass from F-021 adaptive classifier to override per query.
 */
export function convexCombinationFusion(
  vectorResults: SearchResult[],
  ftsResults: SearchResult[],
  topK: number = 10,
  alpha: number = FUSION_ALPHA
): HybridSearchResult[] {
  // Edge case: both lists empty
  if (vectorResults.length === 0 && ftsResults.length === 0) {
    return []
  }

  // Edge case: one list empty — normalize the non-empty list and return it
  if (vectorResults.length === 0) {
    const normFts = minmaxNormalize(ftsResults.map((r) => r.score))
    return ftsResults
      .map((r, i) => ({
        id: r.id,
        score: (1 - alpha) * normFts[i]!,
        source: "fts" as HybridSearchResult["source"],
        metadata: r.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  if (ftsResults.length === 0) {
    const normVec = minmaxNormalize(vectorResults.map((r) => r.score))
    return vectorResults
      .map((r, i) => ({
        id: r.id,
        score: alpha * normVec[i]!,
        source: "vector" as HybridSearchResult["source"],
        metadata: r.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  // Normalize each list independently
  const normVec = minmaxNormalize(vectorResults.map((r) => r.score))
  const normFts = minmaxNormalize(ftsResults.map((r) => r.score))

  // Build lookup maps: id → normalized score
  const vecMap = new Map<string, { normScore: number; metadata: SearchResult["metadata"] }>()
  for (let i = 0; i < vectorResults.length; i++) {
    vecMap.set(vectorResults[i]!.id, {
      normScore: normVec[i]!,
      metadata: vectorResults[i]!.metadata,
    })
  }

  const ftsMap = new Map<string, { normScore: number; metadata: SearchResult["metadata"] }>()
  for (let i = 0; i < ftsResults.length; i++) {
    ftsMap.set(ftsResults[i]!.id, {
      normScore: normFts[i]!,
      metadata: ftsResults[i]!.metadata,
    })
  }

  // Union of all IDs
  const allIds = new Set<string>([...vecMap.keys(), ...ftsMap.keys()])

  const fused: HybridSearchResult[] = []

  for (const id of allIds) {
    const vec = vecMap.get(id)
    const fts = ftsMap.get(id)

    // Missing channel contributes 0.0 (not penalized by normalization range,
    // but absent from that retrieval path)
    const vecScore = vec?.normScore ?? 0.0
    const ftsScore = fts?.normScore ?? 0.0

    const combinedScore = alpha * vecScore + (1 - alpha) * ftsScore

    // Determine source
    let source: HybridSearchResult["source"]
    if (vec && fts) source = "both"
    else if (vec) source = "vector"
    else source = "fts"

    // Prefer vector metadata (has documentId, chunkIndex, content)
    const metadata = (vec?.metadata ?? fts?.metadata)!

    fused.push({ id, score: combinedScore, source, metadata })
  }

  return fused.sort((a, b) => b.score - a.score).slice(0, topK)
}
