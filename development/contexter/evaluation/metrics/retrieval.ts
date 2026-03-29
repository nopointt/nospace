/**
 * Layer 2 — Retrieval quality metrics.
 *
 * Metrics implemented:
 *   TokenIoU@K — token-level overlap between retrieved chunks and ground-truth excerpt
 *   Recall@K   — fraction of relevant character spans covered by top-K chunks
 *   MRR        — Mean Reciprocal Rank (standard IR metric)
 *
 * All metrics are parameterised by K (default: 5) and require an embedder so
 * that chunks can be ranked by semantic similarity to the query.
 *
 * "Tokens" for overlap computation are words (whitespace-split), not BPE tokens.
 * This is intentional: word-level overlap is more interpretable for IoU, and
 * avoids a dependency on the tokenizer for the eval layer.
 */

import type { EvalChunk, EvalQuery, MetricResult, EmbedFn } from "../types"

// ─── Word tokenisation ────────────────────────────────────────────────────────

/**
 * Split text into a set of normalised word tokens.
 * Lowercased, punctuation stripped — suitable for token-level overlap.
 */
function tokeniseWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ""))
      .filter((w) => w.length > 0),
  )
}

/**
 * Build a multiset (word → count) from text for IoU computation.
 * Multiset is represented as a Map to handle duplicate words correctly.
 */
function tokeniseMultiset(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 0)

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return counts
}

/**
 * Compute multiset intersection size: sum of min(count_a, count_b) for each word.
 */
function multisetIntersectionSize(a: Map<string, number>, b: Map<string, number>): number {
  let size = 0
  for (const [word, countA] of a) {
    const countB = b.get(word) ?? 0
    size += Math.min(countA, countB)
  }
  return size
}

/**
 * Compute multiset union size: sum of max(count_a, count_b) for each word.
 */
function multisetUnionSize(a: Map<string, number>, b: Map<string, number>): number {
  const allWords = new Set([...a.keys(), ...b.keys()])
  let size = 0
  for (const word of allWords) {
    size += Math.max(a.get(word) ?? 0, b.get(word) ?? 0)
  }
  return size
}

// ─── Cosine similarity ────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += (a[i]! * b[i]!)
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ─── Rank chunks by embedding similarity ─────────────────────────────────────

/**
 * Rank chunks by cosine similarity to the query embedding.
 * Returns chunk indices sorted highest-similarity first.
 *
 * @param queryEmbed   - The query embedding vector.
 * @param chunkEmbeds  - Per-chunk embedding vectors (same length as chunks).
 * @param k            - Return at most K indices.
 */
function rankTopK(
  queryEmbed: number[],
  chunkEmbeds: number[][],
  k: number,
): number[] {
  const scored = chunkEmbeds.map((embed, idx) => ({
    idx,
    score: cosineSimilarity(queryEmbed, embed),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, k).map((s) => s.idx)
}

// ─── Token IoU @ K ───────────────────────────────────────────────────────────

/**
 * Compute Token-IoU@K for a single query.
 *
 * Steps:
 *   1. Retrieve top-K chunks (ranked by embedding similarity to query).
 *   2. Concatenate their text → retrieved token multiset.
 *   3. Compute token multiset of the ground-truth relevant excerpt.
 *   4. IoU = |intersection| / |union|.
 *
 * @param query        - The ground-truth query with relevant excerpt.
 * @param chunks       - All chunks for the document.
 * @param queryEmbed   - Embedding of the query text.
 * @param chunkEmbeds  - Per-chunk embeddings (aligned with chunks array).
 * @param k            - Number of chunks to retrieve.
 */
function tokenIoUForQuery(
  query: EvalQuery,
  chunks: EvalChunk[],
  queryEmbed: number[],
  chunkEmbeds: number[][],
  k: number,
): number {
  const topKIndices = rankTopK(queryEmbed, chunkEmbeds, k)
  const retrievedText = topKIndices.map((i) => chunks[i]!.content).join(" ")

  const relevantMultiset = tokeniseMultiset(query.relevantExcerpt)
  const retrievedMultiset = tokeniseMultiset(retrievedText)

  const intersectionSize = multisetIntersectionSize(relevantMultiset, retrievedMultiset)
  const unionSize = multisetUnionSize(relevantMultiset, retrievedMultiset)

  if (unionSize === 0) return 0
  return intersectionSize / unionSize
}

// ─── Recall @ K ──────────────────────────────────────────────────────────────

/**
 * Compute Recall@K for a single query.
 *
 * A chunk is "relevant" if its character span [startOffset, endOffset) overlaps
 * with [query.relevantStartChar, query.relevantEndChar).
 *
 * Recall@K = (relevant tokens covered by any top-K chunk) / (total relevant tokens).
 * Here we use word-token sets (not char counts) for consistency with TokenIoU.
 *
 * @param query       - Ground-truth query.
 * @param chunks      - All chunks for the document.
 * @param queryEmbed  - Query embedding.
 * @param chunkEmbeds - Per-chunk embeddings.
 * @param k           - K value.
 */
function recallAtKForQuery(
  query: EvalQuery,
  chunks: EvalChunk[],
  queryEmbed: number[],
  chunkEmbeds: number[][],
  k: number,
): number {
  const topKIndices = rankTopK(queryEmbed, chunkEmbeds, k)

  const relevantWords = tokeniseWords(query.relevantExcerpt)
  if (relevantWords.size === 0) return 0

  const coveredWords = new Set<string>()
  for (const idx of topKIndices) {
    const chunk = chunks[idx]!
    // Span overlap check: skip chunks that don't overlap with relevant region
    const hasOverlap =
      chunk.startOffset < query.relevantEndChar &&
      chunk.endOffset > query.relevantStartChar

    if (hasOverlap) {
      const chunkWords = tokeniseWords(chunk.content)
      for (const word of chunkWords) {
        if (relevantWords.has(word)) coveredWords.add(word)
      }
    }
  }

  return coveredWords.size / relevantWords.size
}

// ─── MRR (Mean Reciprocal Rank) ───────────────────────────────────────────────

/**
 * Compute reciprocal rank for a single query.
 *
 * A chunk is considered "relevant" when its character span overlaps the
 * ground-truth relevant region. Returns 1/rank of the first relevant chunk in
 * the top-K list, or 0 if none of the top-K are relevant.
 *
 * @param query       - Ground-truth query.
 * @param chunks      - All chunks for the document.
 * @param queryEmbed  - Query embedding.
 * @param chunkEmbeds - Per-chunk embeddings.
 * @param k           - K value.
 */
function reciprocalRankForQuery(
  query: EvalQuery,
  chunks: EvalChunk[],
  queryEmbed: number[],
  chunkEmbeds: number[][],
  k: number,
): number {
  const topKIndices = rankTopK(queryEmbed, chunkEmbeds, k)

  for (let rank = 0; rank < topKIndices.length; rank++) {
    const chunk = chunks[topKIndices[rank]!]!
    const hasOverlap =
      chunk.startOffset < query.relevantEndChar &&
      chunk.endOffset > query.relevantStartChar

    if (hasOverlap) return 1 / (rank + 1)
  }

  return 0
}

// ─── Embed helpers ────────────────────────────────────────────────────────────

/**
 * Embed a list of texts in batches to avoid oversized API calls.
 */
async function batchEmbed(
  texts: string[],
  embedFn: EmbedFn,
  batchSize: number,
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length)
  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize)
    const embeds = await embedFn(batch)
    for (let j = 0; j < embeds.length; j++) {
      results[start + j] = embeds[j]!
    }
  }
  return results
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Per-query scores for all Layer 2 metrics.
 * Used internally and by compare.ts for paired tests.
 */
export interface PerQueryRetrievalScores {
  queryId: string
  tokenIoU: number
  recall: number
  reciprocalRank: number
}

/**
 * Compute Token-IoU@K, Recall@K, and MRR for all queries against a document's chunks.
 *
 * Returns both the aggregated MetricResult[] and per-query scores (for
 * statistical comparison via compare.ts).
 *
 * @param queries         - All eval queries relevant to this document.
 * @param chunks          - All chunks for the document.
 * @param embedFn         - Embedding function (injectable for offline mocking).
 * @param k               - Number of chunks to retrieve per query (default: 5).
 * @param batchSize       - Texts per embedder call (default: 32).
 */
export async function computeRetrievalMetrics(
  queries: EvalQuery[],
  chunks: EvalChunk[],
  embedFn: EmbedFn,
  k: number = 5,
  batchSize: number = 32,
): Promise<{ metrics: MetricResult[]; perQuery: PerQueryRetrievalScores[] }> {
  if (queries.length === 0 || chunks.length === 0) {
    return {
      metrics: [
        { name: `TokenIoU@${k}`, value: 0 },
        { name: `Recall@${k}`, value: 0 },
        { name: "MRR", value: 0 },
      ],
      perQuery: [],
    }
  }

  // ── Build texts to embed: all chunk contents + all query texts ──────────
  const chunkTexts = chunks.map((c) => c.content)
  const queryTexts = queries.map((q) => q.query)

  const allTexts = [...chunkTexts, ...queryTexts]
  const allEmbeds = await batchEmbed(allTexts, embedFn, batchSize)

  const chunkEmbeds = allEmbeds.slice(0, chunks.length)
  const queryEmbeds = allEmbeds.slice(chunks.length)

  // ── Per-query computation ────────────────────────────────────────────────
  const perQuery: PerQueryRetrievalScores[] = []
  const ioUDetails: Record<string, number> = {}
  const recallDetails: Record<string, number> = {}
  const mrrDetails: Record<string, number> = {}

  for (let qi = 0; qi < queries.length; qi++) {
    const query = queries[qi]!
    const queryEmbed = queryEmbeds[qi]!

    const tokenIoU = tokenIoUForQuery(query, chunks, queryEmbed, chunkEmbeds, k)
    const recall = recallAtKForQuery(query, chunks, queryEmbed, chunkEmbeds, k)
    const rr = reciprocalRankForQuery(query, chunks, queryEmbed, chunkEmbeds, k)

    ioUDetails[query.id] = tokenIoU
    recallDetails[query.id] = recall
    mrrDetails[query.id] = rr

    perQuery.push({ queryId: query.id, tokenIoU, recall, reciprocalRank: rr })
  }

  // ── Aggregate ────────────────────────────────────────────────────────────
  const avg = (values: number[]): number =>
    values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

  const iouValues = perQuery.map((p) => p.tokenIoU)
  const recallValues = perQuery.map((p) => p.recall)
  const mrrValues = perQuery.map((p) => p.reciprocalRank)

  return {
    metrics: [
      { name: `TokenIoU@${k}`, value: avg(iouValues), details: ioUDetails },
      { name: `Recall@${k}`, value: avg(recallValues), details: recallDetails },
      { name: "MRR", value: avg(mrrValues), details: mrrDetails },
    ],
    perQuery,
  }
}
