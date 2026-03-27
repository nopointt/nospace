import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"
import { LlmService } from "../services/llm"
import { resolveAuth } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const query = new Hono<AppEnv>()

query.post("/", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  let body: { query?: string; topK?: number }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  if (!body.query || body.query.trim().length === 0) return c.json({ error: "Query is required." }, 400)
  if (body.query.length > 2000) return c.json({ error: "Query exceeds 2000 character limit." }, 400)

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

  // Fetch document metadata for context enrichment
  // P1-008: COUNT(*) returns bigint — cast to int
  const docsMeta = (await sql<{ name: string; mime_type: string; status: string; chunk_count: number }[]>`
    SELECT d.name, d.mime_type, d.status,
      (SELECT COUNT(*)::int FROM chunks WHERE document_id = d.id) as chunk_count
    FROM documents d WHERE d.user_id = ${auth.userId} ORDER BY d.created_at DESC LIMIT 50
  `)
    .map((d) => `- ${d.name} (${d.mime_type}, ${d.status}, ${d.chunk_count} chunks)`)
    .join("\n")

  const llm = new LlmService(env.GROQ_API_KEY)
  const rag = new RagService({ llm, embedder, vectorStore, docsMeta })

  try {
    const result = await rag.query({
      query: body.query.trim(),
      userId: auth.userId,
      topK: Math.min(body.topK ?? 5, 20),
      scoreThreshold: 0,
    })

    // Filter sources by user scope
    const filteredSources = result.sources.filter((s) => {
      if (auth.scope === "all") return true
      return auth.scope.includes(s.documentId)
    })

    // P2-012: enrich sources with document_name so frontend shows filename not raw ID
    const docIds = [...new Set(filteredSources.map((s) => s.documentId))]
    const docs = docIds.length > 0
      ? await sql<{ id: string; file_name: string }[]>`
          SELECT id, name as file_name FROM documents WHERE id = ANY(${docIds})`
      : []
    const nameMap = Object.fromEntries(docs.map((d) => [d.id, d.file_name]))

    return c.json({
      answer: result.answer,
      sources: filteredSources.map((s) => ({
        documentId: s.documentId,
        document_name: nameMap[s.documentId] ?? s.documentId,
        content: s.content,
        score: s.score,
        source: s.source,
      })),
      queryVariants: result.queryVariants,
      usage: result.tokenUsage,
    })
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
