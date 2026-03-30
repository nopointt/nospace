import type { Sql } from "postgres"
import type { Auth } from "../auth"

/**
 * Auth service: resolves API tokens, share tokens, and better-auth sessions.
 *
 * Priority order:
 * 1. ?share=TOKEN → share token (read-only, scoped)
 * 2. Authorization: Bearer TOKEN → legacy API token (full access, for API/MCP clients)
 * 3. ?token=TOKEN → legacy API token (full access, for MCP URLs)
 * 4. Cookie session → better-auth session (full access, for browser)
 */

export interface AuthContext {
  userId: string
  permission: "read" | "read_write"
  scope: "all" | string[]
  isOwner: boolean
}

// Set by index.ts after creating auth instance
let _betterAuth: Auth | null = null

export function setBetterAuth(auth: Auth): void {
  _betterAuth = auth
}

export async function resolveAuth(
  sql: Sql,
  request: Request
): Promise<AuthContext | null> {
  const url = new URL(request.url)

  // 1. Share token (highest priority — explicit sharing)
  const shareToken = url.searchParams.get("share")
  if (shareToken) return resolveShareToken(sql, shareToken)

  // 2. Bearer token (legacy API/MCP clients)
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return resolveApiToken(sql, authHeader.slice(7))
  }

  // 3. Query token (MCP URLs)
  const queryToken = url.searchParams.get("token")
  if (queryToken) return resolveApiToken(sql, queryToken)

  // 4. Better-auth session cookie (browser)
  if (_betterAuth) {
    return resolveSessionCookie(request)
  }

  return null
}

async function resolveSessionCookie(request: Request): Promise<AuthContext | null> {
  if (!_betterAuth) return null

  try {
    const session = await _betterAuth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) return null

    return {
      userId: session.user.id,
      permission: "read_write",
      scope: "all",
      isOwner: true,
    }
  } catch {
    return null
  }
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
