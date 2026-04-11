import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { generateToken, resolveAuth } from "../services/auth"
import { getClientIp, checkRateLimit } from "../services/rate-limit"
import { reclaimUnmatchedForEmail } from "../services/supporters"
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const auth = new Hono<AppEnv>()

/**
 * POST /api/auth/register
 * Create a new user and return API token.
 * Body: { name?: string, email?: string }
 * At least one of name or email must be provided.
 * If email already exists, returns the existing user's token (idempotent).
 * Rate limited: max 5 registrations per IP per hour.
 */
auth.post("/register", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")

  // Return 400 on malformed JSON instead of silently swallowing the error
  let body: { name?: string; email?: string } = {}
  const contentType = c.req.header("Content-Type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "неверный JSON в теле запроса" }, 400)
    }
  }

  // Require at least email OR name — no anonymous registrations
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!name && !email) {
    return c.json({ error: "необходимо указать email или name" }, 400)
  }

  // Basic email format guard when email is provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "некорректный формат email" }, 400)
  }

  // Email deduplication — reject if already registered (CTX-04: proper auth later)
  if (email) {
    const [existing] = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${email}
    `
    if (existing) {
      return c.json({ error: "Email already registered." }, 409)
    }
  }

  // Max 20 new registrations per IP per hour. Whitelisted IPs bypass.
  const ip = getClientIp(c)
  const { allowed } = await checkRateLimit(redis, `reg:${ip}`, 20, 3600, ip, env.RATE_LIMIT_WHITELIST_IPS)
  if (!allowed) {
    return c.json({ error: "слишком много регистраций — попробуйте позже" }, 429)
  }

  // P3-013: use 16-char ID for ~2^64 space — 8-char was only ~4 billion values
  const userId = crypto.randomUUID().slice(0, 16)
  const apiToken = generateToken()

  await sql`
    INSERT INTO users (id, api_token, name, email)
    VALUES (${userId}, ${apiToken}, ${name || null}, ${email || null})
  `

  // CTX-12: reclaim any queued Supporter transactions paid before sign-up.
  // Non-fatal: registration must not fail if reclaim errors.
  if (email) {
    try {
      const reclaimedTokens = await reclaimUnmatchedForEmail(sql, userId, email)
      if (reclaimedTokens > 0) {
        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          event: "supporter_tx_reclaimed",
          userId,
          tokens: reclaimedTokens,
        }))
      }
    } catch (err) {
      console.error("supporter reclaim failed", {
        userId,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return c.json({
    userId,
    apiToken,
    mcpUrl: `${env.BASE_URL}/sse?token=${apiToken}`,
    apiBase: `${env.BASE_URL}/api`,
    instructions: "Use the apiToken as Bearer token or ?token= param for all API calls. Add mcpUrl as a Connector in Claude Desktop/Web.",
  }, 201)
})

/**
 * POST /api/auth/share
 * Create a share link for your knowledge base.
 * Body: { scope?: "all" | string[], permission?: "read" | "read_write", expiresInHours?: number }
 */
auth.post("/share", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const authCtx = await resolveAuth(sql, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)
  if (!authCtx.isOwner) return c.json({ error: "Only owners can create shares." }, 403)

  let body: { scope?: "all" | string[]; permission?: "read" | "read_write"; expiresInHours?: number } = {}
  try { body = await c.req.json() } catch { /* defaults */ }

  // P3-013: use 16-char ID — share IDs are URL-exposed and brute-forceable at 8 chars
  const shareId = crypto.randomUUID().slice(0, 16)
  const shareToken = generateToken()
  const scope = body.scope ?? "all"
  const permission = body.permission ?? "read"
  const expiresAt = body.expiresInHours
    ? new Date(Date.now() + body.expiresInHours * 3600_000).toISOString()
    : null

  await sql`
    INSERT INTO shares (id, owner_id, share_token, scope, permission, expires_at)
    VALUES (
      ${shareId}, ${authCtx.userId}, ${shareToken},
      ${typeof scope === "string" ? scope : JSON.stringify(scope)},
      ${permission}, ${expiresAt}
    )
  `

  // P2-010: include shareUrl alias — frontend types expect it
  return c.json({
    shareId,
    shareToken,
    shareUrl: `${env.BASE_URL}/sse?share=${shareToken}`,
    mcpUrl: `${env.BASE_URL}/sse?share=${shareToken}`,
    permission,
    scope,
    expiresAt,
  }, 201)
})

/**
 * GET /api/auth/shares
 * List all your active shares.
 */
auth.get("/shares", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const authCtx = await resolveAuth(sql, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)

  const shares = await sql<{
    id: string; share_token: string; scope: string; permission: string;
    expires_at: string | null; created_at: string
  }[]>`
    SELECT id, share_token, scope, permission, expires_at, created_at
    FROM shares WHERE owner_id = ${authCtx.userId} ORDER BY created_at DESC
  `

  // P0-004: return snake_case fields matching frontend types
  // P2-016: wrap JSON.parse in try/catch for malformed scope
  return c.json({
    shares: shares.map((s) => {
      let parsedScope: "all" | string[]
      try {
        parsedScope = s.scope === "all" ? "all" : JSON.parse(s.scope)
      } catch {
        parsedScope = "all"
      }
      return {
        id: s.id,
        share_token: s.share_token,
        mcpUrl: `${env.BASE_URL}/sse?share=${s.share_token}`,
        scope: parsedScope,
        permission: s.permission,
        expires_at: s.expires_at,
        created_at: s.created_at,
      }
    }),
  })
})

/**
 * DELETE /api/auth/shares/:shareId
 * Revoke a share.
 */
auth.delete("/shares/:shareId", async (c) => {
  const sql = c.get("sql")
  const authCtx = await resolveAuth(sql, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)

  const shareId = c.req.param("shareId")
  const result = await sql`
    DELETE FROM shares WHERE id = ${shareId} AND owner_id = ${authCtx.userId}
    RETURNING id
  `

  if (result.length === 0) {
    return c.json({ error: "ссылка не найдена" }, 404)
  }

  // P2-011: frontend expects { success: boolean }
  return c.json({ success: true, deleted: shareId })
})

/**
 * DELETE /api/auth/account
 * GDPR Article 17: Right to Erasure.
 * Permanently deletes: user account, all documents, chunks, embeddings,
 * jobs, shares, subscriptions, payments, R2 files.
 * Requires Bearer token (owner only). Irreversible.
 */
auth.delete("/account", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const authCtx = await resolveAuth(sql, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)
  if (!authCtx.isOwner) return c.json({ error: "Only account owners can delete their account." }, 403)

  const userId = authCtx.userId

  console.log(JSON.stringify({ event: "account_deletion_start", userId }))

  // 1. Collect R2 keys before deleting DB rows
  const r2Keys = await sql<{ r2_key: string }[]>`
    SELECT r2_key FROM documents WHERE user_id = ${userId}
  `

  // 2. Atomic delete in FK-safe order within transaction
  await sql.begin(async (tx) => {
    await tx`DELETE FROM shares WHERE owner_id = ${userId} OR shared_with_id = ${userId}`
    await tx`DELETE FROM payments WHERE user_id = ${userId}`
    await tx`DELETE FROM subscriptions WHERE user_id = ${userId}`
    // documents CASCADE → chunks + jobs
    await tx`DELETE FROM documents WHERE user_id = ${userId}`
    // user CASCADE → eval_metrics + eval_metrics_daily_agg + feedback
    await tx`DELETE FROM users WHERE id = ${userId}`
  })

  // 3. R2 cleanup (best-effort, async — don't block response)
  const r2Cleanup = async () => {
    // Delete individual document files
    for (const { r2_key } of r2Keys) {
      try {
        await env.storage.send(new DeleteObjectCommand({ Bucket: env.storageBucket, Key: r2_key }))
      } catch (e) {
        console.error(`R2 delete failed for ${r2_key}:`, e instanceof Error ? e.message : String(e))
      }
    }

    // Delete user's image folder (PDF image chunks: {userId}/*/images/*) — paginated
    try {
      let continuationToken: string | undefined
      do {
        const listCmd = new ListObjectsV2Command({
          Bucket: env.storageBucket,
          Prefix: `${userId}/`,
          ContinuationToken: continuationToken,
        })
        const listed = await env.storage.send(listCmd)
        for (const obj of listed.Contents ?? []) {
          if (obj.Key) {
            await env.storage.send(new DeleteObjectCommand({ Bucket: env.storageBucket, Key: obj.Key }))
          }
        }
        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined
      } while (continuationToken)
    } catch (e) {
      console.error(`R2 prefix cleanup failed for ${userId}/:`, e instanceof Error ? e.message : String(e))
    }
  }

  r2Cleanup().catch((e) =>
    console.error("R2 cleanup error (non-fatal):", e instanceof Error ? e.message : String(e))
  )

  console.log(JSON.stringify({
    event: "account_deleted",
    userId,
    documentsDeleted: r2Keys.length,
  }))

  return c.json({
    success: true,
    deleted: {
      userId,
      documents: r2Keys.length,
    },
    message: "Account and all associated data have been permanently deleted.",
  })
})
