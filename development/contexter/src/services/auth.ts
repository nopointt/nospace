import type { Sql } from "postgres"

/**
 * Auth service: resolves API tokens and share tokens to user context.
 */

export interface AuthContext {
  userId: string
  permission: "read" | "read_write"
  scope: "all" | string[]
  isOwner: boolean
}

/**
 * Resolve auth from request. Checks:
 * 1. ?share=TOKEN → share token (read-only, scoped)
 * 2. Authorization: Bearer TOKEN → user API token (full access)
 * 3. ?token=TOKEN → user API token (full access, for MCP URLs)
 */
export async function resolveAuth(
  sql: Sql,
  request: Request
): Promise<AuthContext | null> {
  const url = new URL(request.url)

  const shareToken = url.searchParams.get("share")
  if (shareToken) return resolveShareToken(sql, shareToken)

  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return resolveApiToken(sql, authHeader.slice(7))
  }

  const queryToken = url.searchParams.get("token")
  if (queryToken) return resolveApiToken(sql, queryToken)

  return null
}

async function resolveApiToken(sql: Sql, token: string): Promise<AuthContext | null> {
  const [row] = await sql`SELECT id FROM users WHERE api_token = ${token}`
  if (!row) return null

  return {
    userId: row.id as string,
    permission: "read_write",
    scope: "all",
    isOwner: true,
  }
}

async function resolveShareToken(sql: Sql, token: string): Promise<AuthContext | null> {
  const [share] = await sql`
    SELECT owner_id, scope, permission, expires_at
    FROM shares WHERE share_token = ${token}
  `
  if (!share) return null

  // P1-013: postgres.js returns Date objects, not strings — handle both
  if (share.expires_at) {
    const expiresAt = share.expires_at instanceof Date
      ? share.expires_at
      : new Date(share.expires_at as string)
    if (expiresAt < new Date()) return null
  }

  // P2-016: wrap JSON.parse in try/catch — malformed scope should not crash
  let scope: "all" | string[]
  try {
    scope = share.scope === "all" ? "all" as const : JSON.parse(share.scope as string) as string[]
  } catch {
    scope = "all"
  }

  return {
    userId: share.owner_id as string,
    permission: share.permission as "read" | "read_write",
    scope,
    isOwner: false,
  }
}

export function canAccessDocument(auth: AuthContext, documentId: string): boolean {
  if (auth.scope === "all") return true
  return auth.scope.includes(documentId)
}

export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}
