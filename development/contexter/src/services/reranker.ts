/**
 * Jina Reranker v3 — cross-encoder post-fusion reranking.
 * F-010: insert after dedup+sort, before buildContext.
 *
 * API: POST https://api.jina.ai/v1/rerank
 * Auth: Bearer token from JINA_API_KEY (same key as embeddings)
 * Latency: ~188ms per call
 * Cost: $0.02 / 1K searches
 */

export interface RerankerConfig {
  apiKey: string
  enabled?: boolean       // default: true; set false to disable at runtime
  timeoutMs?: number      // default: 3000
  minCandidates?: number  // default: 2; skip rerank if fewer candidates
}

export interface RerankCandidate {
  id: string
  text: string
  originalScore: number
}

export interface RerankResult {
  id: string
  relevanceScore: number  // cross-encoder score from Jina, range 0–1
  originalScore: number   // preserved for fallback / debugging
}

// --- Jina API wire types ---

interface JinaRerankRequest {
  model: string
  query: string
  documents: string[]
  top_n: number
  return_documents: false  // we already have the texts; saves response size
}

interface JinaRerankResponseResult {
  index: number
  relevance_score: number
  document?: { text: string }  // present only if return_documents: true
}

interface JinaRerankResponse {
  results: JinaRerankResponseResult[]
  usage: {
    total_tokens: number
    prompt_tokens: number
  }
}

// --- Constants ---

const JINA_RERANK_URL = "https://api.jina.ai/v1/rerank"
const JINA_RERANK_MODEL = "jina-reranker-v3"

export const RERANK_ENABLED = true
export const RERANK_TIMEOUT_MS = 3000
export const RERANK_MIN_CANDIDATES = 2

// --- RerankerService ---

export class RerankerService {
  private apiKey: string
  private enabled: boolean
  private timeoutMs: number
  private minCandidates: number

  constructor(config: RerankerConfig) {
    this.apiKey = config.apiKey
    this.enabled = config.enabled ?? RERANK_ENABLED
    this.timeoutMs = config.timeoutMs ?? RERANK_TIMEOUT_MS
    this.minCandidates = config.minCandidates ?? RERANK_MIN_CANDIDATES
  }

  /**
   * Rerank candidates by relevance to query.
   * Returns results sorted by descending relevanceScore.
   * On any error or if disabled: returns candidates sorted by originalScore (fallback).
   */
  async rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]> {
    // Passthrough: disabled or too few candidates
    if (!this.enabled || candidates.length < this.minCandidates) {
      return this.fallbackSort(candidates)
    }

    const requestBody: JinaRerankRequest = {
      model: JINA_RERANK_MODEL,
      query,
      documents: candidates.map((c) => c.text),
      top_n: candidates.length,  // rerank all candidates; caller controls final topK
      return_documents: false,
    }

    let response: Response
    try {
      response = await fetch(JINA_RERANK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[reranker] API call failed (fallback to RRF order): ${msg}`)
      return this.fallbackSort(candidates)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.warn(`[reranker] API error ${response.status} (fallback to RRF order): ${errorText}`)
      return this.fallbackSort(candidates)
    }

    let json: JinaRerankResponse
    try {
      json = (await response.json()) as JinaRerankResponse
    } catch (e) {
      console.warn(`[reranker] Response parse failed (fallback to RRF order): ${e}`)
      return this.fallbackSort(candidates)
    }

    // Map index positions back to candidate ids.
    // Jina guarantees r.index is within bounds of the input documents array.
    const reranked = json.results.map((r) => ({
      id: candidates[r.index]!.id,
      relevanceScore: r.relevance_score,
      originalScore: candidates[r.index]!.originalScore,
    }))

    // Sort descending by cross-encoder score
    return reranked.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private fallbackSort(candidates: RerankCandidate[]): RerankResult[] {
    return [...candidates]
      .sort((a, b) => b.originalScore - a.originalScore)
      .map((c) => ({
        id: c.id,
        relevanceScore: c.originalScore,  // use RRF score as proxy
        originalScore: c.originalScore,
      }))
  }
}
