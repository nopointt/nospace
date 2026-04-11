import { Queue, Worker, type Job } from "bullmq"
import type { Sql } from "postgres"
import { runDriftCheck } from "../services/evaluation/drift"
import { runQuarterlyRevShare } from "../services/supporters-revshare"
import { runSupportersRanking } from "../services/supporters-ranking"
import { runSoftDemotion } from "../services/supporters-lifecycle"
import type { Env } from "../types/env"

// F-013: maintenance queue — separate from "pipeline" to avoid concurrency interference

const MAINTENANCE_QUEUE_NAME = "maintenance"
const RETENTION_DAYS = 90

let _maintenanceQueue: Queue | null = null

export function getMaintenanceQueue(redisUrl: string): Queue {
  if (_maintenanceQueue) return _maintenanceQueue
  _maintenanceQueue = new Queue(MAINTENANCE_QUEUE_NAME, {
    connection: { url: redisUrl },
    defaultJobOptions: {
      removeOnComplete: { age: 86_400 },
      removeOnFail: { age: 7 * 86_400 },
    },
  })
  return _maintenanceQueue
}

/**
 * Start the maintenance worker and schedule daily 02:00 UTC retention job.
 * Idempotent — safe to call on every startup (BullMQ deduplicates repeat jobs by key).
 */
export function startMaintenanceWorker(redisUrl: string, sql: Sql, env: Env): Worker {
  const queue = getMaintenanceQueue(redisUrl)

  // Schedule daily retention job at 02:00 UTC
  queue.add(
    "daily-retention",
    {},
    { repeat: { pattern: "0 2 * * *" }, jobId: "daily-retention-cron" }
  ).catch((err) =>
    console.error("Failed to schedule daily-retention job:", err instanceof Error ? err.message : String(err))
  )

  // F-033: Schedule weekly drift check at Monday 03:00 UTC
  queue.add(
    "drift-check",
    {},
    { repeat: { pattern: "0 3 * * 1" }, jobId: "weekly-drift-check-cron" }
  ).catch((err) =>
    console.error("Failed to schedule drift-check job:", err instanceof Error ? err.message : String(err))
  )

  // CTX-12 W2-01: Schedule weekly supporters ranking at Monday 04:00 UTC
  // (1h after drift-check to avoid any worker contention).
  queue.add(
    "weekly-supporters-ranking",
    {},
    { repeat: { pattern: "0 4 * * 1" }, jobId: "weekly-supporters-ranking-cron" }
  ).catch((err) =>
    console.error("Failed to schedule weekly-supporters-ranking job:", err instanceof Error ? err.message : String(err))
  )

  // CTX-12 W4-05: Schedule quarterly rev share at 05:00 UTC on the first day
  // of January / April / July / October. MRR gate + idempotent source_id
  // protect against early or duplicate firings.
  queue.add(
    "quarterly-revshare",
    {},
    { repeat: { pattern: "0 5 1 1,4,7,10 *" }, jobId: "quarterly-revshare-cron" }
  ).catch((err) =>
    console.error("Failed to schedule quarterly-revshare job:", err instanceof Error ? err.message : String(err))
  )

  // CTX-12 W5-02: Schedule daily soft demotion sweep at 03:30 UTC.
  // Applies the 30/60/90d ladder (warning → bronze → exiting) to all
  // active/warning supporters. Re-activation clears warnings automatically.
  queue.add(
    "daily-soft-demotion",
    {},
    { repeat: { pattern: "30 3 * * *" }, jobId: "daily-soft-demotion-cron" }
  ).catch((err) =>
    console.error("Failed to schedule daily-soft-demotion job:", err instanceof Error ? err.message : String(err))
  )

  const worker = new Worker<Record<string, never>>(
    MAINTENANCE_QUEUE_NAME,
    async (job: Job) => {
      if (job.name === "drift-check") {
        await runDriftCheck(sql)
        return
      }
      if (job.name === "weekly-supporters-ranking") {
        await runSupportersRanking(sql)
        return
      }
      if (job.name === "quarterly-revshare") {
        await runQuarterlyRevShare(sql, env)
        return
      }
      if (job.name === "daily-soft-demotion") {
        await runSoftDemotion(sql, env)
        return
      }
      await runDailyRetention(sql)
    },
    {
      connection: { url: redisUrl },
      concurrency: 1,
    }
  )

  worker.on("completed", (job) => {
    console.log(JSON.stringify({ event: "maintenance_job_completed", jobId: job.id }))
  })

  worker.on("failed", (job, err) => {
    console.error(JSON.stringify({
      event: "maintenance_job_failed",
      jobId: job?.id,
      error: err.message,
    }))
  })

  return worker
}

async function runDailyRetention(sql: Sql): Promise<void> {
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString()

  // 1. Aggregate per (agg_date, user_id) for rows that will be deleted
  await sql`
    INSERT INTO eval_metrics_daily_agg (
      id, agg_date, user_id, query_count,
      empty_answer_rate_pct,
      retrieval_score_mean_avg, retrieval_score_mean_p50, retrieval_score_mean_p95,
      chunks_retrieved_avg, answer_length_tokens_avg, lexical_overlap_avg,
      retrieval_latency_p50_ms, retrieval_latency_p95_ms,
      generation_latency_p50_ms, generation_latency_p95_ms,
      embedding_l2_norm_mean_avg
    )
    SELECT
      gen_random_uuid()::text,
      queried_at::date                                                       AS agg_date,
      user_id,
      COUNT(*)::int                                                          AS query_count,
      ROUND((AVG(CASE WHEN empty_answer_rate THEN 1.0 ELSE 0.0 END) * 100)::numeric, 2)::float
                                                                             AS empty_answer_rate_pct,
      AVG(retrieval_score_mean)                                              AS retrieval_score_mean_avg,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY retrieval_score_mean)     AS retrieval_score_mean_p50,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY retrieval_score_mean)    AS retrieval_score_mean_p95,
      AVG(chunks_retrieved_count)                                            AS chunks_retrieved_avg,
      AVG(answer_length_tokens)                                              AS answer_length_tokens_avg,
      AVG(lexical_overlap_score)                                             AS lexical_overlap_avg,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY retrieval_latency_ms)     AS retrieval_latency_p50_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY retrieval_latency_ms)    AS retrieval_latency_p95_ms,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY generation_latency_ms)    AS generation_latency_p50_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY generation_latency_ms)   AS generation_latency_p95_ms,
      AVG(embedding_l2_norm_mean)                                            AS embedding_l2_norm_mean_avg
    FROM eval_metrics
    WHERE queried_at < ${cutoffStr}
    GROUP BY queried_at::date, user_id
    ON CONFLICT (agg_date, user_id) DO NOTHING
  `

  // 2. Delete raw rows older than retention window
  await sql`
    DELETE FROM eval_metrics WHERE queried_at < ${cutoffStr}
  `

  console.log(JSON.stringify({
    event: "daily_retention_complete",
    cutoff: cutoffStr,
    retention_days: RETENTION_DAYS,
  }))
}

export async function shutdownMaintenanceQueue(worker: Worker): Promise<void> {
  await worker.close()
  if (_maintenanceQueue) await _maintenanceQueue.close()
}
