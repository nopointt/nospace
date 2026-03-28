import type { Sql } from "postgres"
import type { RagAnswer } from "../rag/types"

// F-013: proxy metrics — computed from RagAnswer only, zero extra LLM calls

export interface ProxyMetrics {
  queryId: string
  userId: string
  retrievalScoreMean: number
  retrievalScoreMax: number
  retrievalScoreSpread: number
  chunksRetrievedCount: number
  answerLengthTokens: number
  lexicalOverlapScore: number
  retrievalLatencyMs: number
  generationLatencyMs: number
  emptyAnswerRate: boolean
  embeddingL2NormMean: number
  queryVariantsCount: number
  queriedAt: Date
}

/**
 * ROUGE-L: longest common subsequence between query and answer token sets,
 * normalized by max(query_tokens.length, answer_tokens.length).
 * Tokenizes on whitespace + Unicode punctuation, lowercased.
 */
export function computeRougeL(query: string, answer: string): number {
  const tokenize = (s: string): string[] =>
    s.toLowerCase().split(/[\s\p{P}]+/u).filter((t) => t.length > 0)

  const qt = tokenize(query)
  const at = tokenize(answer)
  if (qt.length === 0 || at.length === 0) return 0

  // LCS via DP table
  const m = qt.length
  const n = at.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (qt[i - 1] === at[j - 1]) {
        dp[i]![j] = (dp[i - 1]![j - 1] ?? 0) + 1
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j] ?? 0, dp[i]![j - 1] ?? 0)
      }
    }
  }

  const lcsLength = dp[m]![n] ?? 0
  return lcsLength / Math.max(m, n)
}

export function computeProxyMetrics(
  queryId: string,
  userId: string,
  query: string,
  result: RagAnswer,
): ProxyMetrics {
  const scores = result.sources.map((s) => s.score)
  const retrievalScoreMean = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0
  const retrievalScoreMax = scores.length > 0 ? Math.max(...scores) : 0
  const retrievalScoreMin = scores.length > 0 ? Math.min(...scores) : 0
  const retrievalScoreSpread = scores.length > 1 ? retrievalScoreMax - retrievalScoreMin : 0

  return {
    queryId,
    userId,
    retrievalScoreMean,
    retrievalScoreMax,
    retrievalScoreSpread,
    chunksRetrievedCount: result.sources.length,
    answerLengthTokens: result.tokenUsage.llmCompletionTokens,
    lexicalOverlapScore: computeRougeL(query, result.answer),
    retrievalLatencyMs: result.retrievalLatencyMs,
    generationLatencyMs: result.generationLatencyMs,
    emptyAnswerRate: result.answer.trim().length === 0,
    embeddingL2NormMean: result.embeddingL2NormMean,
    queryVariantsCount: result.queryVariants.length,
    queriedAt: new Date(),
  }
}

export async function logProxyMetrics(sql: Sql, metrics: ProxyMetrics): Promise<void> {
  const id = crypto.randomUUID()
  await sql`
    INSERT INTO eval_metrics (
      id, query_id, user_id, queried_at,
      retrieval_score_mean, retrieval_score_max, retrieval_score_spread,
      chunks_retrieved_count, answer_length_tokens, lexical_overlap_score,
      retrieval_latency_ms, generation_latency_ms, empty_answer_rate,
      embedding_l2_norm_mean, query_variants_count
    ) VALUES (
      ${id}, ${metrics.queryId}, ${metrics.userId}, ${metrics.queriedAt},
      ${metrics.retrievalScoreMean}, ${metrics.retrievalScoreMax}, ${metrics.retrievalScoreSpread},
      ${metrics.chunksRetrievedCount}, ${metrics.answerLengthTokens}, ${metrics.lexicalOverlapScore},
      ${metrics.retrievalLatencyMs}, ${metrics.generationLatencyMs}, ${metrics.emptyAnswerRate},
      ${metrics.embeddingL2NormMean}, ${metrics.queryVariantsCount}
    )
  `
}
