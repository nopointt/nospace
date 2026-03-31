import { Queue, Worker, type Job } from "bullmq"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type { StageType } from "./pipeline"
import { runPipelineAsync, resumePipelineFromStage, createPendingJobs } from "./pipeline"
import { GetObjectCommand } from "@aws-sdk/client-s3"

export interface PipelineJobData {
  documentId: string
  userId: string
  fileName: string
  mimeType: string
  fileSize: number
  r2Key: string
  /** When set, resume from this stage rather than running full pipeline */
  fromStage?: StageType
  /** Pre-built jobIds map — must be provided by caller */
  jobIds: Record<StageType, string>
}

const QUEUE_NAME = "pipeline"

const RETRY_OPTS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 60_000, // 1min, 2min, 4min
  },
}

const REMOVE_ON_COMPLETE = { age: 86_400 } // keep 24h
const REMOVE_ON_FAIL = { age: 7 * 86_400 }  // keep 7 days for debugging

let _queue: Queue | null = null

export function getPipelineQueue(redisUrl: string): Queue {
  if (_queue) return _queue
  _queue = new Queue(QUEUE_NAME, {
    connection: { url: redisUrl },
    defaultJobOptions: {
      ...RETRY_OPTS,
      removeOnComplete: REMOVE_ON_COMPLETE,
      removeOnFail: REMOVE_ON_FAIL,
    },
  })
  return _queue
}

async function fetchFromR2(env: Env, r2Key: string): Promise<ArrayBuffer> {
  const cmd = new GetObjectCommand({ Bucket: env.storageBucket, Key: r2Key })
  const res = await env.storage.send(cmd)
  if (!res.Body) throw new Error(`R2 object not found: ${r2Key}`)
  const bytes = await res.Body.transformToByteArray()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export function startPipelineWorker(
  redisUrl: string,
  env: Env,
  sql: Sql
): Worker {
  const worker = new Worker<PipelineJobData>(
    QUEUE_NAME,
    async (job: Job<PipelineJobData>) => {
      const { documentId, userId, fileName, mimeType, fileSize, r2Key, fromStage, jobIds } = job.data

      let file: ArrayBuffer
      try {
        file = await fetchFromR2(env, r2Key)
      } catch (e) {
        const msg = `R2 fetch failed for ${r2Key}: ${e instanceof Error ? e.message : String(e)}`
        console.error(JSON.stringify({ event: "pipeline_r2_fetch_error", documentId, r2Key, error: msg }))
        // Update document status so it doesn't stay "processing" forever
        await sql`UPDATE documents SET status = 'error', error_message = ${msg}, updated_at = NOW() WHERE id = ${documentId}`.catch(() => {})
        throw e // re-throw so BullMQ retries
      }
      const input = { file, fileName, mimeType, fileSize }

      if (fromStage) {
        await resumePipelineFromStage(documentId, fromStage, env, sql, userId, jobIds)
      } else {
        await runPipelineAsync(documentId, input, env, sql, userId, jobIds)
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 4,
    }
  )

  worker.on("failed", (job, err) => {
    console.error(JSON.stringify({
      event: "pipeline_job_failed",
      jobId: job?.id,
      documentId: job?.data?.documentId,
      attempt: job?.attemptsMade,
      error: err.message,
    }))
  })

  worker.on("completed", (job) => {
    console.log(JSON.stringify({
      event: "pipeline_job_completed",
      jobId: job.id,
      documentId: job.data.documentId,
    }))
  })

  return worker
}

/** Graceful shutdown — call on SIGTERM */
export async function shutdownQueue(worker: Worker): Promise<void> {
  await worker.close()
  if (_queue) await _queue.close()
}
