// F-026 + F-027: Confidence scoring — Tiers 1, 2, and 3
import type { RagSource, ConfidenceResult, ConfidenceLevel, ConfidenceSignals } from "./types"
import { nliService } from "../nli"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// F-007: CC is now the default fusion mode. RRF_K_LEGACY retained for backward compat
// in case FUSION_MODE env var is set to "rrf" on an old deployment.
const RRF_K_LEGACY = 60
const FUSION_MODE = process.env.FUSION_MODE ?? "cc"
const MAX_FUSION_SCORE = FUSION_MODE === "cc" ? 1.0 : (2 / (RRF_K_LEGACY + 1))

// ---------------------------------------------------------------------------
// Tier 1 helpers
// ---------------------------------------------------------------------------

function normalizeTopScore(score: number): number {
  return Math.min(score / MAX_FUSION_SCORE, 1.0)
}

function computeScoreEntropy(sources: RagSource[]): number {
  if (sources.length === 0) return 1.0
  if (sources.length === 1) return 0.0

  const scores = sources.map((s) => s.score)
  const total = scores.reduce((a, b) => a + b, 0)
  if (total === 0) return 1.0

  const probs = scores.map((s) => s / total)
  const H = -probs.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0)
  const H_max = Math.log2(sources.length)
  return H_max > 0 ? H / H_max : 0.0
}

function computeTopScoreGap(sources: RagSource[]): number {
  if (sources.length === 0) return 0
  if (sources.length === 1) return 1.0
  if (sources[0]!.score === 0) return 0
  return (sources[0]!.score - sources[1]!.score) / sources[0]!.score
}

export function computeTier1Confidence(sources: RagSource[]): number {
  if (sources.length === 0) return 0.0
  const retrievalScore = normalizeTopScore(sources[0]!.score)
  const scoreEntropy = computeScoreEntropy(sources)
  const sourceAgreement = sources.filter((s) => s.source === "both").length / sources.length
  const topScoreGap = computeTopScoreGap(sources)
  return (
    0.40 * retrievalScore +
    0.25 * (1 - scoreEntropy) +
    0.20 * sourceAgreement +
    0.15 * topScoreGap
  )
}

// ---------------------------------------------------------------------------
// Tier 2: grounding JSON parsing
// ---------------------------------------------------------------------------

export function parseGroundingJson(rawAnswer: string): {
  answer: string
  groundingScore: number | undefined
} {
  const lines = rawAnswer.split("\n")
  const lastLine = lines[lines.length - 1]!.trim()
  try {
    const parsed = JSON.parse(lastLine) as { grounding?: string }
    const map: Record<string, number> = { high: 1.0, medium: 0.7, low: 0.3, none: 0.0 }
    const groundingScore = parsed.grounding !== undefined ? (map[parsed.grounding] ?? undefined) : undefined
    const answer = lines.slice(0, lines.length - 1).join("\n").trimEnd()
    return { answer, groundingScore }
  } catch {
    return { answer: rawAnswer, groundingScore: undefined }
  }
}

// ---------------------------------------------------------------------------
// Tier 3: NLI faithfulness (F-027)
// ---------------------------------------------------------------------------

/**
 * Compute NLI faithfulness score for Tier 3 confidence.
 * premise = concatenated source chunks (context used to generate the answer)
 * hypothesis = the generated answer
 * Returns [0,1] or undefined if NLI unavailable.
 */
export async function computeFaithfulnessNli(
  context: string,
  answer: string
): Promise<number | undefined> {
  if (!nliService.isAvailable()) return undefined

  // Single pair: context as premise, full answer as hypothesis.
  // Truncated to stay within T5-base 2K token limit (conservative: 1 token ≈ 4 chars).
  // Increased from 1500 to 2500 chars for safety margin on multilingual content
  const truncatedContext = context.slice(0, 2500)
  const truncatedAnswer = answer.slice(0, 500)

  const scores = await nliService.scorePairs([
    { premise: truncatedContext, hypothesis: truncatedAnswer }
  ])

  return scores?.[0]
}

// ---------------------------------------------------------------------------
// Full assembly: Tier 1 + 2 + 3
// ---------------------------------------------------------------------------

export function assembleConfidence(
  sources: RagSource[],
  groundingScore?: number,
  faithfulnessScore?: number
): ConfidenceResult {
  const t1 = computeTier1Confidence(sources)
  const signals: ConfidenceSignals = {
    retrievalScore: normalizeTopScore(sources.length > 0 ? sources[0]!.score : 0),
    scoreEntropy: computeScoreEntropy(sources),
    sourceAgreement: sources.length > 0
      ? sources.filter((s) => s.source === "both").length / sources.length
      : 0,
    topScoreGap: computeTopScoreGap(sources),
    groundingScore,
    faithfulnessScore,
  }

  // Hard override: no sources
  if (sources.length === 0) {
    return {
      score: 0,
      level: "insufficient",
      signals,
      abstentionReason: "No relevant sources found in knowledge base.",
    }
  }

  // Hard override: retrieval score below minimum
  if (signals.retrievalScore < 0.1) {
    const score = computeCompositeScore(t1, groundingScore, faithfulnessScore)
    return {
      score,
      level: "insufficient",
      signals,
      abstentionReason: "Top retrieval score below minimum threshold.",
    }
  }

  // Hard override: LLM rated grounding as "none"
  if (groundingScore !== undefined && groundingScore <= 0.0) {
    const score = computeCompositeScore(t1, groundingScore, faithfulnessScore)
    return {
      score,
      level: "insufficient",
      signals,
      abstentionReason: "LLM self-assessment: context does not contain relevant information.",
    }
  }

  // Hard override: NLI faithfulness too low (F-027)
  if (faithfulnessScore !== undefined && faithfulnessScore < 0.2) {
    const score = computeCompositeScore(t1, groundingScore, faithfulnessScore)
    return {
      score,
      level: "insufficient",
      signals,
      abstentionReason: "NLI faithfulness score below minimum threshold.",
    }
  }

  const score = computeCompositeScore(t1, groundingScore, faithfulnessScore)
  let level: ConfidenceLevel
  let abstentionReason: string | undefined

  if (score >= 0.7) level = "high"
  else if (score >= 0.4) level = "medium"
  else if (score >= 0.2) level = "low"
  else {
    level = "insufficient"
    abstentionReason = "Composite confidence score below abstention threshold."
  }

  return { score, level, signals, abstentionReason }
}

function computeCompositeScore(
  t1: number,
  groundingScore: number | undefined,
  faithfulnessScore: number | undefined
): number {
  if (faithfulnessScore !== undefined && groundingScore !== undefined) {
    // Tier 3: F-027 formula
    return 0.30 * t1 + 0.20 * groundingScore + 0.50 * faithfulnessScore
  }
  if (groundingScore !== undefined) {
    // Tier 2
    return 0.60 * t1 + 0.40 * groundingScore
  }
  // Tier 1 only
  return t1
}
