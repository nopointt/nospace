/**
 * Query enhancement classifier — F-018 (HyDE gate) + F-019 (decomposition gate).
 * Pure heuristic, no LLM calls. O(1) per query.
 *
 * NOTE: This is rag/classifier.ts — NOT the same as vectorstore/classifier.ts (F-021).
 * F-021 exports classifyQuery() for fusion alpha selection.
 * This file exports classifyQueryEnhancement() for HyDE/decomposition gating.
 */

export interface QueryClassification {
  hydeScore: number        // 0–4: how much HyDE is likely to help
  complexityScore: number  // 0–6: how complex the query is for decomposition
  shouldHyde: boolean      // hydeScore >= HYDE_THRESHOLD (2)
  shouldDecompose: boolean // complexityScore >= COMPLEXITY_THRESHOLD (2)
}

export const HYDE_THRESHOLD = 2
export const COMPLEXITY_THRESHOLD = 2

export function classifyQueryEnhancement(query: string): QueryClassification {
  const lower = query.toLowerCase()
  const words = query.trim().split(/\s+/)
  const wordCount = words.length

  // --- HyDE signals (does the query benefit from a document-space probe?) ---
  // Signal 1: length > 10 words → suggests open-ended, not keyword lookup
  const longQuery = wordCount > 10 ? 1 : 0
  // Signal 2: question words → open-ended explanatory queries
  const hasQuestionWords = /\b(how|why|what is|what are|explain|describe|compare|summarize|overview|difference)\b/.test(lower) ? 1 : 0
  // Signal 3: not a short proper-noun lookup (short + capitalized = known-item search)
  const isKnownItemSearch = wordCount <= 5 && /[A-Z]/.test(query) ? 1 : 0
  // Signal 4: not quoted (quoted = exact match intent)
  const isQuotedExact = /^["'].*["']$/.test(query.trim()) ? 1 : 0
  // Signal 5: not code/API syntax
  const isCodeSyntax = /[.()[\]{}<>]|->|::/.test(query) ? 1 : 0

  const hydeScore = longQuery + hasQuestionWords - isKnownItemSearch - isQuotedExact - isCodeSyntax
  // Clamp to 0–4 range (negatives become 0)
  const hydeClamped = Math.max(0, Math.min(4, hydeScore))

  // --- Decomposition signals (is the query multi-part?) ---
  // Signal 1: conjunctions / comparisons
  const hasConjunction = /\b(and|or|but|versus|vs\.?|compared? to|in contrast)\b/.test(lower) ? 1 : 0
  // Signal 2: multiple question marks
  const hasMultipleQuestions = (query.match(/\?/g) ?? []).length > 1 ? 1 : 0
  // Signal 3: comparison words
  const hasComparisonWords = /\b(compar|differ|similar|between|both|each|respective)\b/.test(lower) ? 1 : 0
  // Signal 4: temporal ranges
  const hasTemporalRange = /\b(Q[1-4].*Q[1-4]|before.*after|from.*to|trend|over time|year.over.year|month.over.month)\b/i.test(query) ? 1 : 0
  // Signal 5: 2+ distinct entities (capitalized words or quoted terms)
  const entities = (query.match(/\b[A-Z][a-zA-Z]+\b|"[^"]+"/g) ?? [])
  const hasMultipleEntities = new Set(entities).size >= 2 ? 1 : 0
  // Signal 6: long query (> 20 words) suggests multi-part
  const veryLongQuery = wordCount > 20 ? 1 : 0

  const complexityScore = hasConjunction + hasMultipleQuestions + hasComparisonWords + hasTemporalRange + hasMultipleEntities + veryLongQuery

  return {
    hydeScore: hydeClamped,
    complexityScore,
    shouldHyde: hydeClamped >= HYDE_THRESHOLD,
    shouldDecompose: complexityScore >= COMPLEXITY_THRESHOLD,
  }
}
