/**
 * F-030: Daily feedback score decay via BullMQ cron.
 *
 * Decay factor: 0.99/day → ~69-day half-life.
 * Multiplies feedback_pos and feedback_neg counters by 0.99 each day, then
 * recalculates feedback_score using post-decay counter values.
 *
 * Scheduled: 02:00 UTC daily.
 */
import { Queue, Worker } from "bullmq"
import type { Sql } from "postgres"

const DECAY_QUEUE = "feedback_decay"
const DECAY_FACTOR = 0.99

export function startFeedbackDecayWorker(redisUrl: string, sql: Sql): Worker {
  const worker = new Worker(
    DECAY_QUEUE,
    async () => {
      // PostgreSQL evaluates SET expressions using pre-UPDATE row values,
      // so multiplying by DECAY_FACTOR here correctly uses the old counters.
      await sql`
        UPDATE chunks
        SET
          feedback_pos   = feedback_pos * ${DECAY_FACTOR},
          feedback_neg   = feedback_neg * ${DECAY_FACTOR},
          feedback_score = 0.5 + (feedback_pos * ${DECAY_FACTOR} + 1)
            / (feedback_pos * ${DECAY_FACTOR} + feedback_neg * ${DECAY_FACTOR} + 2)
        WHERE feedback_pos > 0 OR feedback_neg > 0
      `
      console.log(JSON.stringify({ event: "feedback_decay_applied", factor: DECAY_FACTOR }))
    },
    { connection: { url: redisUrl } }
  )

  worker.on("failed", (job, err) => {
    console.error(JSON.stringify({
      event: "feedback_decay_job_failed",
      jobId: job?.id,
      error: err instanceof Error ? err.message : String(err),
    }))
  })

  return worker
}

/**
 * Register (or re-register) the daily decay repeating job.
 * Idempotent: removes any existing "daily_decay" schedule before adding a new one.
 */
export async function scheduleFeedbackDecay(redisUrl: string): Promise<void> {
  const queue = new Queue(DECAY_QUEUE, { connection: { url: redisUrl } })

  const repeatableJobs = await queue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    if (job.name === "daily_decay") {
      await queue.removeRepeatableByKey(job.key)
    }
  }

  await queue.add("daily_decay", {}, {
    repeat: { pattern: "0 2 * * *" },
    removeOnComplete: { count: 1 },
    removeOnFail: { count: 5 },
  })

  await queue.close()
}
