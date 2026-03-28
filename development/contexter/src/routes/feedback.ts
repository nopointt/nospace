/**
 * F-030: POST /api/feedback — explicit thumbs-up / thumbs-down on query results.
 *
 * Stores feedback record and updates chunk feedback_score via Beta-Binomial formula.
 * Score range: (0.5, ~1.5) — positive chunks boosted, negative penalised in retrieval.
 */
import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import { randomUUID } from "crypto"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const feedbackRouter = new Hono<AppEnv>()

const feedbackSchema = z.object({
  query_id: z.string().min(1).max(128),
  query_text: z.string().min(1).max(2000),
  answer_text: z.string().min(1).max(10000),
  rating: z.union([z.literal(1), z.literal(-1)]),
  chunk_ids: z.array(z.string().min(1)).min(1).max(50),
})

feedbackRouter.post("/", zValidator("json", feedbackSchema), async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  try {
    const body = c.req.valid("json")
    const feedbackId = randomUUID()

    await sql`
      INSERT INTO feedback (id, query_id, user_id, query_text, answer_text, rating, chunk_ids, source)
      VALUES (
        ${feedbackId},
        ${body.query_id},
        ${auth.userId},
        ${body.query_text},
        ${body.answer_text},
        ${body.rating},
        ${body.chunk_ids},
        'explicit'
      )
    `

    // Update chunk counters and recalculate feedback_score.
    // Security: only update chunks belonging to this user — prevents cross-user score manipulation.
    // Beta-Binomial formula: score = 0.5 + (pos + 1) / (pos + neg + 2)
    // SQL evaluates SET expressions using pre-UPDATE row values, so +2 / +3 offsets account
    // for the counter increment applied in the same statement.
    if (body.rating === 1) {
      await sql`
        UPDATE chunks
        SET
          feedback_pos = feedback_pos + 1,
          feedback_score = 0.5 + (feedback_pos + 2) / (feedback_pos + feedback_neg + 3)
        WHERE id = ANY(${body.chunk_ids}::text[]) AND user_id = ${auth.userId}
      `
    } else {
      await sql`
        UPDATE chunks
        SET
          feedback_neg = feedback_neg + 1,
          feedback_score = 0.5 + (feedback_pos + 1) / (feedback_pos + feedback_neg + 3)
        WHERE id = ANY(${body.chunk_ids}::text[]) AND user_id = ${auth.userId}
      `
    }

    return c.json({ ok: true, feedback_id: feedbackId }, 201)
  } catch (e) {
    console.error("feedback handler error:", e instanceof Error ? e.message : String(e))
    return c.json({ error: "Internal server error" }, 500)
  }
})
