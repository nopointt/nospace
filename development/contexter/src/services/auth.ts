/**
 * Auth service: resolves API tokens and share tokens to user context.
 * Token flow:
 *   - API token (Bearer header or ?token= param) → full access to own data
 *   - Share token (?share= param) → scoped read access to shared data
 */

export interface AuthContext {
  userId: string
  permission: "read" | "read_write"
  scope: "all" | string[] // "all" or array of document IDs
  isOwner: boolean
}

/**
 * Resolve auth from request. Checks:
 * 1. ?share=TOKEN → share token (read-only, scoped)
 * 2. Authorization: Bearer TOKEN → user API token (full access)
 * 3. ?token=TOKEN → user API token (full access, for MCP URLs)
 */
export async function resolveAuth(
  db: D1Database,
  request: Request
): Promise<AuthContext | null> {
  const url = new URL(request.url)

  // 1. Share token
  const shareToken = url.searchParams.get("share")
  if (shareToken) {
    return resolveShareToken(db, shareToken)
  }

  // 2. Bearer token
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    return resolveApiToken(db, token)
  }

  // 3. Query param token
  const queryToken = url.searchParams.get("token")
  if (queryToken) {
    return resolveApiToken(db, queryToken)
  }

  return null
}

async function resolveApiToken(
  db: D1Database,
  token: string
): Promise<AuthContext | null> {
  const user = await db
    .prepare("SELECT id FROM users WHERE api_token = ?")
    .bind(token)
    .first<{ id: string }>()

  if (!user) return null

  return {
    userId: user.id,
    permission: "read_write",
    scope: "all",
    isOwner: true,
  }
}

async function resolveShareToken(
  db: D1Database,
  token: string
): Promise<AuthContext | null> {
  const share = await db
    .prepare(
      "SELECT owner_id, scope, permission, expires_at FROM shares WHERE share_token = ?"
    )
    .bind(token)
    .first<{
      owner_id: string
      scope: string
      permission: string
      expires_at: string | null
    }>()

  if (!share) return null

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null
  }

  const scope = share.scope === "all" ? "all" as const : JSON.parse(share.scope) as string[]

  return {
    userId: share.owner_id,
    permission: share.permission as "read" | "read_write",
    scope,
    isOwner: false,
  }
}

/**
 * Check if a document ID is accessible under current auth scope.
 */
export function canAccessDocument(auth: AuthContext, documentId: string): boolean {
  if (auth.scope === "all") return true
  return auth.scope.includes(documentId)
}

/**
 * Generate a random API token.
 */
export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}
