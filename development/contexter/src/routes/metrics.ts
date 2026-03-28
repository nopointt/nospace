import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import { resolveAuth } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env } }

export const metrics = new Hono<AppEnv>()

// F-013: GET /api/metrics — aggregated proxy metrics for the authenticated user
metrics.get("/", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  const rawDays = c.req.query("days") ?? "7"
  const parsedDays = parseInt(rawDays, 10)
  const windowDays = Number.isFinite(parsedDays) && parsedDays > 0
    ? Math.min(parsedDays, 90)
    : 7

  try {
    const rows = await sql<{
      total_queries: number
      empty_answer_rate_pct: number | null
      retrieval_score_mean_avg: number | null
      retrieval_score_mean_p50: number | null
      retrieval_score_mean_p95: number | null
      chunks_retrieved_avg: number | null
      answer_length_tokens_avg: number | null
      lexical_overlap_avg: number | null
      retrieval_latency_p50_ms: number | null
      retrieval_latency_p95_ms: number | null
      generation_latency_p50_ms: number | null
      generation_latency_p95_ms: number | null
      embedding_l2_norm_mean_avg: number | null
    }[]>`
      SELECT
        COUNT(*)::int                                                       AS total_queries,
        ROUND((AVG(CASE WHEN empty_answer_rate THEN 1.0 ELSE 0.0 END) * 100)::numeric, 2)::float
                                                                            AS empty_answer_rate_pct,
        AVG(retrieval_score_mean)                                           AS retrieval_score_mean_avg,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY retrieval_score_mean)  AS retrieval_score_mean_p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY retrieval_score_mean) AS retrieval_score_mean_p95,
        AVG(chunks_retrieved_count)                                         AS chunks_retrieved_avg,
        AVG(answer_length_tokens)                                           AS answer_length_tokens_avg,
        AVG(lexical_overlap_score)                                          AS lexical_overlap_avg,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY retrieval_latency_ms)  AS retrieval_latency_p50_ms,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY retrieval_latency_ms) AS retrieval_latency_p95_ms,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY generation_latency_ms) AS generation_latency_p50_ms,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY generation_latency_ms) AS generation_latency_p95_ms,
        AVG(embedding_l2_norm_mean)                                         AS embedding_l2_norm_mean_avg
      FROM eval_metrics
      WHERE user_id = ${auth.userId}
        AND queried_at >= NOW() - (${windowDays} || ' days')::interval
    `

    const row = rows[0]

    return c.json({
      window_days: windowDays,
      total_queries: row?.total_queries ?? 0,
      empty_answer_rate_pct: row?.empty_answer_rate_pct ?? 0,
      retrieval_score_mean_avg: row?.retrieval_score_mean_avg ?? null,
      retrieval_score_mean_p50: row?.retrieval_score_mean_p50 ?? null,
      retrieval_score_mean_p95: row?.retrieval_score_mean_p95 ?? null,
      chunks_retrieved_avg: row?.chunks_retrieved_avg ?? null,
      answer_length_tokens_avg: row?.answer_length_tokens_avg ?? null,
      lexical_overlap_avg: row?.lexical_overlap_avg ?? null,
      retrieval_latency_p50_ms: row?.retrieval_latency_p50_ms ?? null,
      retrieval_latency_p95_ms: row?.retrieval_latency_p95_ms ?? null,
      generation_latency_p50_ms: row?.generation_latency_p50_ms ?? null,
      generation_latency_p95_ms: row?.generation_latency_p95_ms ?? null,
      embedding_l2_norm_mean_avg: row?.embedding_l2_norm_mean_avg ?? null,
      computed_at: new Date().toISOString(),
    })
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
