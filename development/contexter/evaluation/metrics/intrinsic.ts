/**
 * Layer 1 — Intrinsic chunk quality metrics.
 *
 * These metrics evaluate chunk quality WITHOUT retrieval.  They operate purely
 * on the chunks themselves (and the original document text for BI).
 *
 * Metrics implemented:
 *   SC  — Size Compliance      — fraction of chunks within expected token range
 *   ICC — Intrachunk Cohesion  — avg semantic similarity of sentences to their chunk
 *   BI  — Block Integrity      — fraction of structural blocks kept intact
 */

import type { EvalChunk, MetricResult, EmbedFn } from "../types"
import { classifyBlocks } from "../../src/services/chunker/block-classifier"
import { DEFAULT_SOFT_MAX, DEFAULT_HARD_MAX } from "../../src/services/chunker/types"
import { countTokensSync, ensureEncoderLoaded } from "../../src/services/chunker/tokenizer"

// ─── Size Compliance (SC) ────────────────────────────────────────────────────

/**
 * Compute the fraction of chunks whose token count falls within the expected
 * range: [softMax * 0.8, hardMax * 1.2].
 *
 * Child chunks from a hierarchical strategy are excluded from the size check
 * (they are intentionally smaller); only "parent" or "flat" chunks are counted.
 *
 * Target: > 0.90
 *
 * @param chunks - The chunks to evaluate.
 * @param softMax - Soft token target (default: DEFAULT_SOFT_MAX = 400).
 * @param hardMax - Hard token ceiling (default: DEFAULT_HARD_MAX = 800).
 */
export function computeSizeCompliance(
  chunks: EvalChunk[],
  softMax: number = DEFAULT_SOFT_MAX,
  hardMax: number = DEFAULT_HARD_MAX,
): MetricResult {
  if (chunks.length === 0) {
    return { name: "SizeCompliance", value: 0, details: {} }
  }

  const lowerBound = softMax * 0.8
  const upperBound = hardMax * 1.2

  // Filter out child chunks — they are sub-sentence fragments by design
  const evaluable = chunks.filter((c) => {
    const meta = c.metadata as { chunkType?: string }
    return meta.chunkType !== "child"
  })

  if (evaluable.length === 0) {
    return { name: "SizeCompliance", value: 0, details: {} }
  }

  const details: Record<string, number> = {}
  let compliantCount = 0

  for (let i = 0; i < evaluable.length; i++) {
    const chunk = evaluable[i]!
    const inRange = chunk.tokenCount >= lowerBound && chunk.tokenCount <= upperBound
    details[String(i)] = inRange ? 1 : 0
    if (inRange) compliantCount++
  }

  return {
    name: "SizeCompliance",
    value: compliantCount / evaluable.length,
    details,
  }
}

// ─── Intrachunk Cohesion (ICC) ───────────────────────────────────────────────

/**
 * Split text into sentences using simple terminal-punctuation heuristic.
 * Returns non-empty sentences only.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end-of-string.
  // Handles common abbreviations imperfectly but is good enough for cohesion scoring.
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Compute cosine similarity between two equal-length float vectors.
 * Returns 0 for zero vectors.
 */
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
  if (denom === 0) return 0
  return dot / denom
}

/**
 * Compute mean of a numeric array. Returns 0 for empty arrays.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Compute Intrachunk Cohesion (ICC) for a list of chunks.
 *
 * Algorithm per chunk:
 *   1. Split chunk text into sentences.
 *   2. Embed each sentence + the full chunk content using the embedder.
 *   3. Compute cosine similarity between each sentence embedding and the
 *      chunk embedding.
 *   4. Average the per-sentence similarities → per-chunk ICC score.
 * Final ICC = mean of per-chunk scores.
 *
 * Chunks with fewer than 2 sentences are skipped (score 1.0 assigned — a
 * single-sentence chunk is trivially coherent).
 *
 * Target: > 0.70
 *
 * @param chunks  - The chunks to evaluate.
 * @param embedFn - Injectable embedding function (allows mock in offline tests).
 * @param batchSize - Max texts per embedder call (default: 32).
 */
export async function computeIntrachunkCohesion(
  chunks: EvalChunk[],
  embedFn: EmbedFn,
  batchSize: number = 32,
): Promise<MetricResult> {
  if (chunks.length === 0) {
    return { name: "IntrachunkCohesion", value: 0, details: {} }
  }

  // Only evaluate content chunks (exclude heading-only fragments)
  const contentChunks = chunks.filter((c) => c.content.trim().length > 0)

  if (contentChunks.length === 0) {
    return { name: "IntrachunkCohesion", value: 0, details: {} }
  }

  // ── Build embed request: collect (chunkIndex, text, role) tuples ──────────
  interface EmbedRequest {
    chunkIdx: number
    text: string
    role: "chunk" | "sentence"
    sentenceIdx: number
  }

  const requests: EmbedRequest[] = []
  const chunkSentences: string[][] = []

  for (let i = 0; i < contentChunks.length; i++) {
    const chunk = contentChunks[i]!
    const sentences = splitSentences(chunk.content)

    // Single-sentence chunks are trivially coherent
    if (sentences.length < 2) {
      chunkSentences.push([])
      continue
    }

    chunkSentences.push(sentences)
    requests.push({ chunkIdx: i, text: chunk.content, role: "chunk", sentenceIdx: -1 })

    for (let si = 0; si < sentences.length; si++) {
      requests.push({ chunkIdx: i, text: sentences[si]!, role: "sentence", sentenceIdx: si })
    }
  }

  // ── Embed in batches ──────────────────────────────────────────────────────
  const embeddings: number[][] = new Array(requests.length)
  const texts = requests.map((r) => r.text)

  for (let start = 0; start < texts.length; start += batchSize) {
    const batchTexts = texts.slice(start, start + batchSize)
    const batchEmbeds = await embedFn(batchTexts)
    for (let j = 0; j < batchEmbeds.length; j++) {
      embeddings[start + j] = batchEmbeds[j]!
    }
  }

  // ── Compute per-chunk ICC ─────────────────────────────────────────────────
  // Map: chunkIdx → { chunkEmbed, sentenceEmbeds }
  const chunkEmbedMap = new Map<number, { chunkEmbed: number[]; sentenceEmbeds: number[][] }>()

  for (let ri = 0; ri < requests.length; ri++) {
    const req = requests[ri]!
    const embed = embeddings[ri]!

    if (!chunkEmbedMap.has(req.chunkIdx)) {
      chunkEmbedMap.set(req.chunkIdx, { chunkEmbed: [], sentenceEmbeds: [] })
    }
    const entry = chunkEmbedMap.get(req.chunkIdx)!

    if (req.role === "chunk") {
      entry.chunkEmbed = embed
    } else {
      // Insert in sentence order
      entry.sentenceEmbeds[req.sentenceIdx] = embed
    }
  }

  const details: Record<string, number> = {}
  const perChunkScores: number[] = []

  for (let i = 0; i < contentChunks.length; i++) {
    const sentences = chunkSentences[i]!

    // Single-sentence → trivially coherent
    if (sentences.length < 2) {
      details[String(i)] = 1.0
      perChunkScores.push(1.0)
      continue
    }

    const entry = chunkEmbedMap.get(i)
    if (!entry || entry.chunkEmbed.length === 0) {
      details[String(i)] = 0
      perChunkScores.push(0)
      continue
    }

    const similarities = entry.sentenceEmbeds
      .filter((e) => e && e.length > 0)
      .map((sentEmbed) => cosineSimilarity(sentEmbed, entry.chunkEmbed))

    const score = mean(similarities)
    details[String(i)] = score
    perChunkScores.push(score)
  }

  return {
    name: "IntrachunkCohesion",
    value: mean(perChunkScores),
    details,
  }
}

// ─── Block Integrity (BI) ────────────────────────────────────────────────────

/**
 * Check whether a structural block's full content appears within a single chunk.
 *
 * We compare by content string containment — if the block.content string is a
 * substring of any single chunk's content, the block is considered intact.
 */
function isBlockIntact(blockContent: string, chunks: EvalChunk[]): boolean {
  const normalised = blockContent.trim()
  return chunks.some((chunk) => chunk.content.includes(normalised))
}

/**
 * Compute Block Integrity (BI) for a chunking result.
 *
 * Algorithm:
 *   1. Classify the original document text into structural blocks using
 *      the existing block-classifier.
 *   2. Filter to "atomic" blocks: code_block, table, list.
 *      (Headings and paragraphs are not integrity-sensitive.)
 *   3. For each atomic block, check if its full content appears in one chunk.
 *   4. BI = intact_blocks / total_atomic_blocks.
 *
 * Returns 1.0 when there are no structural blocks to protect.
 *
 * @param documentContent - The original full document text.
 * @param chunks          - The chunks produced from that document.
 */
export async function computeBlockIntegrity(
  documentContent: string,
  chunks: EvalChunk[],
): Promise<MetricResult> {
  await ensureEncoderLoaded()

  const blocks = classifyBlocks(documentContent)
  const atomicBlocks = blocks.filter(
    (b) => b.type === "code_block" || b.type === "table" || b.type === "list",
  )

  if (atomicBlocks.length === 0) {
    return { name: "BlockIntegrity", value: 1.0, details: {} }
  }

  const details: Record<string, number> = {}
  let intactCount = 0

  for (let i = 0; i < atomicBlocks.length; i++) {
    const block = atomicBlocks[i]!
    const intact = isBlockIntact(block.content, chunks)
    details[`${block.type}_${i}`] = intact ? 1 : 0
    if (intact) intactCount++
  }

  return {
    name: "BlockIntegrity",
    value: intactCount / atomicBlocks.length,
    details,
  }
}

// ─── Convenience: compute all Layer 1 metrics ────────────────────────────────

/**
 * Compute all three Layer 1 intrinsic metrics in one call.
 *
 * @param documentContent - Original document text (required for BI).
 * @param chunks          - Chunks to evaluate.
 * @param embedFn         - Embedding function for ICC (pass mock for offline use).
 * @param softMax         - Token soft target for SC (default: 400).
 * @param hardMax         - Token hard ceiling for SC (default: 800).
 */
export async function computeIntrinsicMetrics(
  documentContent: string,
  chunks: EvalChunk[],
  embedFn: EmbedFn,
  softMax?: number,
  hardMax?: number,
): Promise<MetricResult[]> {
  const [sc, icc, bi] = await Promise.all([
    Promise.resolve(computeSizeCompliance(chunks, softMax, hardMax)),
    computeIntrachunkCohesion(chunks, embedFn),
    computeBlockIntegrity(documentContent, chunks),
  ])

  return [sc, icc, bi]
}
