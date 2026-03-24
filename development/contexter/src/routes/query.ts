import { Hono } from "hono"
import type { Env } from "../types/env"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"
import { resolveAuth } from "../services/auth"

export const query = new Hono<{ Bindings: Env }>()

query.post("/", async (c) => {
  const auth = await resolveAuth(c.env.DB, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  let body: { query?: string; topK?: number }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  if (!body.query || body.query.trim().length === 0) return c.json({ error: "Query is required." }, 400)
  if (body.query.length > 2000) return c.json({ error: "Query exceeds 2000 character limit." }, 400)

  const embedder = new EmbedderService(c.env.JINA_API_URL, c.env.JINA_API_KEY)
  const vectorStore = new VectorStoreService({ db: c.env.DB, vectorIndex: c.env.VECTOR_INDEX })
  await vectorStore.initialize()

  const rag = new RagService({ ai: c.env.AI, embedder, vectorStore })

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

    return c.json({
      answer: result.answer,
      sources: filteredSources.map((s) => ({
        documentId: s.documentId, content: s.content, score: s.score, source: s.source,
      })),
      queryVariants: result.queryVariants,
      usage: result.tokenUsage,
    })
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
