import { Queue, Worker, type Job } from "bullmq"
import type { Sql } from "postgres"
import { LlmService } from "../llm"

// F-031: sampled LLM evaluation — faithfulness + answer relevancy via Groq

const LLM_EVAL_QUEUE_NAME = "llm-eval"

const RETRY_OPTS = {
  attempts: 2,
  backoff: {
    type: "exponential" as const,
    delay: 30_000,
  },
}

export interface LlmEvalJobData {
  queryId: string
  query: string
  answer: string
  context: string
}

export interface LlmEvalResult {
  faithfulness: number | null
  relevancy_score: number | null
  claims_total: number
  claims_supported: number
  claims: { claim: string; verdict: "supported" | "unsupported" }[]
  evaluated_at: string
  model: string
}

let _llmEvalQueue: Queue | null = null

export function getLlmEvalQueue(redisUrl: string): Queue {
  if (_llmEvalQueue) return _llmEvalQueue
  _llmEvalQueue = new Queue(LLM_EVAL_QUEUE_NAME, {
    connection: { url: redisUrl },
    defaultJobOptions: {
      ...RETRY_OPTS,
      removeOnComplete: { age: 86_400 },
      removeOnFail: { age: 7 * 86_400 },
    },
  })
  return _llmEvalQueue
}

/**
 * Run the 3-call RAGAS evaluation: claim extraction → verdict per claim → answer relevancy.
 * Called both from the BullMQ worker (F-031) and directly from the CI runner (F-032).
 */
export async function runLlmEval(
  llm: LlmService,
  query: string,
  answer: string,
  context: string,
): Promise<LlmEvalResult> {
  // Call 1 — Claim Extraction
  const claimsRaw = await llm.chat(
    [
      {
        role: "system",
        content:
          "You are a precise claim extractor. Given an answer text, extract every distinct factual claim as a JSON array of strings. A claim is a single self-contained statement that can be verified as true or false independently. Output ONLY valid JSON. Example output: [\"The sky is blue.\", \"Water boils at 100°C at sea level.\"]",
      },
      {
        role: "user",
        content: `Answer: ${answer}\n\nExtract all factual claims. Output only a JSON array of strings.`,
      },
    ],
    512,
  )

  let claims: string[] = []
  try {
    const parsed = JSON.parse(claimsRaw.response)
    if (Array.isArray(parsed)) claims = parsed.filter((c): c is string => typeof c === "string")
  } catch {
    console.warn("llm_eval: claim extraction parse failed, defaulting to empty claims")
  }

  // Call 2 — Verdict per claim
  type Verdict = { claim: string; verdict: "supported" | "unsupported" }
  let verdicts: Verdict[] = []

  if (claims.length > 0) {
    const verdictsRaw = await llm.chat(
      [
        {
          role: "system",
          content:
            "You are a precise fact-checker. Given a context and a list of claims, determine whether each claim is supported by the context. For each claim output \"supported\" or \"unsupported\". Output ONLY valid JSON as an array of objects with keys \"claim\" and \"verdict\". Example: [{\"claim\": \"The sky is blue.\", \"verdict\": \"supported\"}]",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nClaims:\n${JSON.stringify(claims)}\n\nFor each claim, output whether it is "supported" or "unsupported" by the context. Output only a JSON array.`,
        },
      ],
      1024,
    )

    try {
      const parsed = JSON.parse(verdictsRaw.response)
      if (Array.isArray(parsed)) {
        verdicts = parsed
          .filter((v): v is Verdict =>
            typeof v?.claim === "string" &&
            (v?.verdict === "supported" || v?.verdict === "unsupported")
          )
      }
    } catch {
      console.warn("llm_eval: verdict parse failed, treating all claims as unsupported")
      verdicts = claims.map((c) => ({ claim: c, verdict: "unsupported" as const }))
    }
  }

  const claimsSupported = verdicts.filter((v) => v.verdict === "supported").length
  const faithfulness = claims.length > 0 ? claimsSupported / claims.length : null

  // Call 3 — Answer Relevancy
  const relevancyRaw = await llm.chat(
    [
      {
        role: "system",
        content:
          "You are an answer quality evaluator. Given a question and an answer, rate how relevant and complete the answer is to the question on a scale from 0.0 to 1.0. Output ONLY a JSON object with key \"relevancy_score\" and a float value between 0.0 and 1.0. Example: {\"relevancy_score\": 0.85}",
      },
      {
        role: "user",
        content: `Question: ${query}\n\nAnswer: ${answer}\n\nRate the relevancy and completeness of the answer to the question. Output only a JSON object.`,
      },
    ],
    256,
  )

  let relevancyScore: number | null = null
  try {
    const parsed = JSON.parse(relevancyRaw.response) as { relevancy_score?: unknown }
    if (typeof parsed?.relevancy_score === "number") {
      relevancyScore = Math.max(0, Math.min(1, parsed.relevancy_score))
    }
  } catch {
    console.warn("llm_eval: relevancy parse failed")
  }

  return {
    faithfulness,
    relevancy_score: relevancyScore,
    claims_total: claims.length,
    claims_supported: claimsSupported,
    claims: verdicts,
    evaluated_at: new Date().toISOString(),
    model: "llama-3.1-8b-instant",
  }
}

export function startLlmEvalWorker(redisUrl: string, sql: Sql): Worker {
  const llm = new LlmService({
    apiKey: process.env.GROQ_API_KEY ?? "",
    model: "llama-3.1-8b-instant",
  })

  const worker = new Worker<LlmEvalJobData>(
    LLM_EVAL_QUEUE_NAME,
    async (job: Job<LlmEvalJobData>) => {
      const { queryId, query, answer, context } = job.data

      const evalResult = await runLlmEval(llm, query, answer, context)

      const evalJson = JSON.stringify(evalResult)
      const updated = await sql<{ id: string }[]>`
        UPDATE eval_metrics
        SET llm_eval = ${evalJson}::jsonb
        WHERE query_id = ${queryId}
        RETURNING id
      `

      if (updated.length === 0) {
        console.warn(JSON.stringify({
          event: "llm_eval_no_row",
          queryId,
          note: "eval_metrics row not found — possible race condition",
        }))
      } else {
        console.log(JSON.stringify({
          event: "llm_eval_completed",
          queryId,
          faithfulness: evalResult.faithfulness,
          relevancy: evalResult.relevancy_score,
        }))
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 1,
    },
  )

  worker.on("failed", (job, err) => {
    console.error(JSON.stringify({
      event: "llm_eval_job_failed",
      jobId: job?.id,
      queryId: job?.data?.queryId,
      attempt: job?.attemptsMade,
      error: err.message,
    }))
  })

  return worker
}

/** Deterministic FNV-1a 32-bit hash of a string, result in [0, 99] */
export function shouldSample(queryId: string, rate: number): boolean {
  let hash = 2166136261
  for (let i = 0; i < queryId.length; i++) {
    hash ^= queryId.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return (hash % 100) < rate
}

export async function shutdownLlmEvalQueue(worker: Worker): Promise<void> {
  await worker.close()
  if (_llmEvalQueue) await _llmEvalQueue.close()
}
