import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"
import { LlmService } from "../services/llm"
import type { LlmProviderConfig } from "../services/llm"
import { RerankerService } from "../services/reranker"
import { resolveAuth } from "../services/auth"
import { computeProxyMetrics, logProxyMetrics } from "../services/evaluation/proxy"

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"
const DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const query = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildLlmServices(env: Env): { llmRewrite: LlmService; llmAnswer: LlmService } {
  // F-015: model split — rewrite uses fast small model, answer uses high-quality model
  const rewriteModel = env.GROQ_REWRITE_MODEL ?? "llama-3.1-8b-instant"
  const answerModel = env.GROQ_ANSWER_MODEL ?? "llama-3.3-70b-versatile"

  const rewritePrimary: LlmProviderConfig = {
    apiKey: env.GROQ_API_KEY,
    model: rewriteModel,
    baseUrl: GROQ_BASE_URL,
  }

  const answerPrimary: LlmProviderConfig = {
    apiKey: env.GROQ_API_KEY,
    model: answerModel,
    baseUrl: GROQ_BASE_URL,
  }

  // F-012: DeepInfra fallback — only when key is present
  const deepinfraFallback: LlmProviderConfig | undefined = env.DEEPINFRA_API_KEY
    ? { apiKey: env.DEEPINFRA_API_KEY, model: answerModel, baseUrl: DEEPINFRA_BASE_URL }
    : undefined

  const llmRewrite = new LlmService(rewritePrimary)
  const llmAnswer = new LlmService(answerPrimary, deepinfraFallback)

  return { llmRewrite, llmAnswer }
}

async function buildDocsMeta(sql: Sql, userId: string): Promise<string> {
  // P1-008: COUNT(*) returns bigint — cast to int
  const docs = await sql<{ name: string; mime_type: string; status: string; chunk_count: number }[]>`
    SELECT d.name, d.mime_type, d.status,
      (SELECT COUNT(*)::int FROM chunks WHERE document_id = d.id) as chunk_count
    FROM documents d WHERE d.user_id = ${userId} ORDER BY d.created_at DESC LIMIT 50
  `
  return docs
    .map((d) => `- ${d.name} (${d.mime_type}, ${d.status}, ${d.chunk_count} chunks)`)
    .join("\n")
}

async function enrichSources(
  sql: Sql,
  sources: import("../services/rag").RagSource[],
  authScope: string | string[]
): Promise<{
  documentId: string
  document_name: string
  content: string
  score: number
  source: string
}[]> {
  const filtered = sources.filter((s) => {
    if (authScope === "all") return true
    return (authScope as string[]).includes(s.documentId)
  })

  const docIds = [...new Set(filtered.map((s) => s.documentId))]
  const docs = docIds.length > 0
    ? await sql<{ id: string; file_name: string }[]>`
        SELECT id, name as file_name FROM documents WHERE id = ANY(${docIds})`
    : []
  const nameMap = Object.fromEntries(docs.map((d) => [d.id, d.file_name]))

  return filtered.map((s) => ({
    documentId: s.documentId,
    document_name: nameMap[s.documentId] ?? s.documentId,
    content: s.content,
    score: s.score,
    source: s.source,
  }))
}

function parseQueryBody(body: unknown): { query: string; topK: number } | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  if (!b.query || typeof b.query !== "string" || b.query.trim().length === 0) return null
  if (b.query.length > 2000) return null
  return {
    query: b.query.trim(),
    topK: Math.min(typeof b.topK === "number" ? b.topK : 5, 20),
  }
}

// ---------------------------------------------------------------------------
// POST /api/query — batch (existing)
// ---------------------------------------------------------------------------

query.post("/", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  const parsed = parseQueryBody(rawBody)
  if (!parsed) {
    const b = rawBody as Record<string, unknown>
    if (!b?.query || (b.query as string).trim().length === 0) {
      return c.json({ error: "Query is required." }, 400)
    }
    if ((b.query as string).length > 2000) {
      return c.json({ error: "Query exceeds 2000 character limit." }, 400)
    }
    return c.json({ error: "Invalid request body." }, 400)
  }

  // NEW-005: per-user rate limit — max 60 queries per minute
  const queryRateKey = `rate:query:${auth.userId}`
  try {
    const count = await redis.incr(queryRateKey)
    if (count === 1) await redis.expire(queryRateKey, 60)
    if (count > 60) {
      return c.json({ error: "Query rate limit exceeded. Maximum 60 queries per minute." }, 429)
    }
  } catch (e) {
    console.error("Redis query rate limit check failed, allowing request:", e instanceof Error ? e.message : String(e))
  }

  const embedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const vectorStore = new VectorStoreService({ sql })
  await vectorStore.initialize()

  const docsMeta = await buildDocsMeta(sql, auth.userId)
  const { llmRewrite, llmAnswer } = buildLlmServices(env)
  // F-010: reranker uses same JINA_API_KEY as embeddings
  const reranker = new RerankerService({ apiKey: env.JINA_API_KEY })
  // F-017: pass sql so RagService can resolve child→parent chunks
  const rag = new RagService({ llm: llmRewrite, llmAnswer, embedder, vectorStore, reranker, docsMeta, sql })

  // F-013: generate query ID before rag.query() so it can be correlated to metrics row
  const queryId = crypto.randomUUID()

  try {
    const result = await rag.query({
      query: parsed.query,
      userId: auth.userId,
      topK: parsed.topK,
      scoreThreshold: 0,
    })

    const enrichedSources = await enrichSources(sql, result.sources, auth.scope)

    const response = c.json({
      answer: result.answer,
      sources: enrichedSources,
      citations: result.citations,
      queryVariants: result.queryVariants,
      usage: result.tokenUsage,
      confidence: result.confidence,
    })

    // F-013: fire-and-forget — must not block response
    const metrics = computeProxyMetrics(queryId, auth.userId, parsed.query, result)
    logProxyMetrics(sql, metrics).catch((err) =>
      console.error("eval_metrics write failed", err instanceof Error ? err.message : String(err))
    )

    return response
  } catch (e) {
    console.error("query handler error:", e instanceof Error ? e.message : String(e))
    return c.json({ error: "Internal server error." }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /api/query/stream — F-014 SSE streaming
// ---------------------------------------------------------------------------

query.post("/stream", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  let rawBody: unknown
  try {
    rawBody = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  const parsed = parseQueryBody(rawBody)
  if (!parsed) {
    const b = rawBody as Record<string, unknown>
    if (!b?.query || (b.query as string).trim().length === 0) {
      return c.json({ error: "Query is required." }, 400)
    }
    if ((b.query as string).length > 2000) {
      return c.json({ error: "Query exceeds 2000 character limit." }, 400)
    }
    return c.json({ error: "Invalid request body." }, 400)
  }

  // NEW-005: per-user rate limit — shared with batch endpoint
  const queryRateKey = `rate:query:${auth.userId}`
  try {
    const count = await redis.incr(queryRateKey)
    if (count === 1) await redis.expire(queryRateKey, 60)
    if (count > 60) {
      return c.json({ error: "Query rate limit exceeded. Maximum 60 queries per minute." }, 429)
    }
  } catch (e) {
    console.error("Redis query rate limit check failed, allowing request:", e instanceof Error ? e.message : String(e))
  }

  const embedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const vectorStore = new VectorStoreService({ sql })
  await vectorStore.initialize()

  const docsMeta = await buildDocsMeta(sql, auth.userId)
  const { llmRewrite, llmAnswer } = buildLlmServices(env)
  const reranker = new RerankerService({ apiKey: env.JINA_API_KEY })
  // F-017: pass sql so RagService can resolve child→parent chunks
  const rag = new RagService({ llm: llmRewrite, llmAnswer, embedder, vectorStore, reranker, docsMeta, sql })

  // Build SSE stream with proper event: field and cancel support
  const state = { cancelled: false }
  const stream = new ReadableStream({
    async start(controller) {
      const encode = (event: { type: string } & Record<string, unknown>) => {
        if (state.cancelled) return
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
        controller.enqueue(new TextEncoder().encode(payload))
      }

      try {
        for await (const event of rag.queryStream({
          query: parsed.query,
          userId: auth.userId,
          topK: parsed.topK,
          scoreThreshold: 0,
        })) {
          if (state.cancelled) break
          if (event.type === "sources") {
            const enriched = await enrichSources(sql, event.sources, auth.scope)
            encode({ type: "sources", sources: enriched, queryVariants: event.queryVariants, embeddingTokens: event.embeddingTokens })
          } else {
            encode(event as { type: string } & Record<string, unknown>)
          }
        }
      } catch (err) {
        console.error("SSE stream error:", err instanceof Error ? err.message : String(err))
        encode({ type: "error", message: "Internal server error." })
        encode({ type: "done", llmPromptTokens: 0, llmCompletionTokens: 0, embeddingTokens: 0 })
      }

      if (!state.cancelled) controller.close()
    },
    cancel() {
      state.cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
})
