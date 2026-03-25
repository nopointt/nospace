import { Hono } from "hono"
import type { Env } from "../types/env"
import { generateToken, resolveAuth } from "../services/auth"

export const auth = new Hono<{ Bindings: Env }>()

/**
 * POST /api/auth/register
 * Create a new user and return API token.
 * Body: { name?: string, email?: string }
 * At least one of name or email must be provided.
 * If email already exists, returns the existing user's token (idempotent).
 * Rate limited: max 5 registrations per IP per hour.
 */
auth.post("/register", async (c) => {
  // Fix 4: return 400 on malformed JSON instead of silently swallowing the error
  let body: { name?: string; email?: string } = {}
  const contentType = c.req.header("Content-Type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "неверный JSON в теле запроса" }, 400)
    }
  }

  // Fix 1: require at least email OR name — no anonymous registrations
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!name && !email) {
    return c.json({ error: "необходимо указать email или name" }, 400)
  }

  // Basic email format guard when email is provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "некорректный формат email" }, 400)
  }

  // Fix 2: email deduplication — return existing token if email already registered.
  // Check BEFORE rate limit to not penalize repeated registrations with the same email.
  if (email) {
    const existing = await c.env.DB.prepare(
      "SELECT id, api_token FROM users WHERE email = ?"
    ).bind(email).first<{ id: string; api_token: string }>()

    if (existing) {
      return c.json({
        userId: existing.id,
        apiToken: existing.api_token,
        mcpUrl: `https://contexter.nopoint.workers.dev/sse?token=${existing.api_token}`,
        apiBase: "https://contexter.nopoint.workers.dev/api",
        instructions: "Use the apiToken as Bearer token or ?token= param for all API calls. Add mcpUrl as a Connector in Claude Desktop/Web.",
        note: "email already registered — returning existing account",
      }, 200)
    }
  }

  // Fix 3: max 5 new registrations per IP per hour (only incremented for truly new users)
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown"
  const rateKey = `reg:${ip}`
  const count = await c.env.KV.get(rateKey)
  if (count && parseInt(count) >= 5) {
    return c.json({ error: "слишком много регистраций — попробуйте позже" }, 429)
  }
  await c.env.KV.put(rateKey, String((parseInt(count ?? "0")) + 1), { expirationTtl: 3600 })

  const userId = crypto.randomUUID().slice(0, 8)
  const apiToken = generateToken()

  await c.env.DB.prepare(
    "INSERT INTO users (id, api_token, name, email) VALUES (?, ?, ?, ?)"
  ).bind(userId, apiToken, name || null, email || null).run()

  return c.json({
    userId,
    apiToken,
    mcpUrl: `https://contexter.nopoint.workers.dev/sse?token=${apiToken}`,
    apiBase: "https://contexter.nopoint.workers.dev/api",
    instructions: "Use the apiToken as Bearer token or ?token= param for all API calls. Add mcpUrl as a Connector in Claude Desktop/Web.",
  }, 201)
})

/**
 * POST /api/auth/share
 * Create a share link for your knowledge base.
 * Body: { scope?: "all" | string[], permission?: "read" | "read_write", expiresInHours?: number }
 */
auth.post("/share", async (c) => {
  const authCtx = await resolveAuth(c.env.DB, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)
  if (!authCtx.isOwner) return c.json({ error: "Only owners can create shares." }, 403)

  let body: { scope?: "all" | string[]; permission?: "read" | "read_write"; expiresInHours?: number } = {}
  try { body = await c.req.json() } catch { /* defaults */ }

  const shareId = crypto.randomUUID().slice(0, 8)
  const shareToken = generateToken()
  const scope = body.scope ?? "all"
  const permission = body.permission ?? "read"
  const expiresAt = body.expiresInHours
    ? new Date(Date.now() + body.expiresInHours * 3600_000).toISOString()
    : null

  await c.env.DB.prepare(
    "INSERT INTO shares (id, owner_id, share_token, scope, permission, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    shareId, authCtx.userId, shareToken,
    typeof scope === "string" ? scope : JSON.stringify(scope),
    permission, expiresAt
  ).run()

  return c.json({
    shareId,
    shareToken,
    mcpUrl: `https://contexter.nopoint.workers.dev/sse?share=${shareToken}`,
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
  const authCtx = await resolveAuth(c.env.DB, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)

  const shares = await c.env.DB.prepare(
    "SELECT id, share_token, scope, permission, expires_at, created_at FROM shares WHERE owner_id = ? ORDER BY created_at DESC"
  ).bind(authCtx.userId).all<{
    id: string; share_token: string; scope: string; permission: string;
    expires_at: string | null; created_at: string
  }>()

  return c.json({
    shares: (shares.results ?? []).map((s) => ({
      shareId: s.id,
      mcpUrl: `https://contexter.nopoint.workers.dev/sse?share=${s.share_token}`,
      scope: s.scope === "all" ? "all" : JSON.parse(s.scope),
      permission: s.permission,
      expiresAt: s.expires_at,
      createdAt: s.created_at,
    })),
  })
})

/**
 * DELETE /api/auth/shares/:shareId
 * Revoke a share.
 */
auth.delete("/shares/:shareId", async (c) => {
  const authCtx = await resolveAuth(c.env.DB, c.req.raw)
  if (!authCtx) return c.json({ error: "Unauthorized." }, 401)

  const shareId = c.req.param("shareId")
  const result = await c.env.DB.prepare(
    "DELETE FROM shares WHERE id = ? AND owner_id = ?"
  ).bind(shareId, authCtx.userId).run()

  if (!result.meta.changes || result.meta.changes === 0) {
    return c.json({ error: "ссылка не найдена" }, 404)
  }

  return c.json({ deleted: shareId })
})
