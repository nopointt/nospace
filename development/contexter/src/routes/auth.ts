import { Hono } from "hono"
import type { Env } from "../types/env"
import { generateToken, resolveAuth } from "../services/auth"

export const auth = new Hono<{ Bindings: Env }>()

/**
 * POST /api/auth/register
 * Create a new user and return API token.
 * Body: { name?: string, email?: string }
 */
auth.post("/register", async (c) => {
  let body: { name?: string; email?: string } = {}
  try { body = await c.req.json() } catch { /* empty body ok */ }

  const userId = crypto.randomUUID().slice(0, 8)
  const apiToken = generateToken()

  await c.env.DB.prepare(
    "INSERT INTO users (id, api_token, name, email) VALUES (?, ?, ?, ?)"
  ).bind(userId, apiToken, body.name ?? null, body.email ?? null).run()

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
  await c.env.DB.prepare(
    "DELETE FROM shares WHERE id = ? AND owner_id = ?"
  ).bind(shareId, authCtx.userId).run()

  return c.json({ deleted: shareId })
})
