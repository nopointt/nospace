/**
 * OAuth 2.1 Authorization Server endpoints (RFC 6749 + PKCE RFC 7636)
 *
 * GET  /authorize  — show consent page (HTML)
 * POST /authorize  — validate token, store code, redirect
 * POST /token      — exchange code for access_token (PKCE verified)
 *
 * Mount this router at "/" in index.ts so paths resolve correctly.
 */

import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import type { Context } from "hono"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const oauth = new Hono<AppEnv>()

// --- GET /authorize --- show consent form -----------------------------------

oauth.get("/authorize", async (c) => {
  const redis = c.get("redis")
  const env = c.get("env")
  const q = c.req.query()
  const clientId = q.client_id ?? ""
  const redirectUri = q.redirect_uri ?? ""
  const state = q.state ?? ""
  const codeChallenge = q.code_challenge ?? ""
  const codeChallengeMethod = q.code_challenge_method ?? "S256"
  const responseType = q.response_type ?? "code"

  if (!clientId || !redirectUri || responseType !== "code") {
    return c.text("invalid_request: missing required OAuth params", 400)
  }

  // P1-004: PKCE is required — reject authorization requests without code_challenge
  if (!codeChallenge) {
    return c.text("invalid_request: code_challenge is required (PKCE S256 mandatory)", 400)
  }
  if (codeChallengeMethod !== "S256") {
    return c.text("invalid_request: code_challenge_method must be S256", 400)
  }

  const clientRaw = await redis.get(`oauth_client:${clientId}`)
  if (!clientRaw) {
    return c.text("invalid_client: unknown client_id", 400)
  }

  const clientData = JSON.parse(clientRaw) as { clientName: string; redirectUris: string[] }

  if (!clientData.redirectUris.includes(redirectUri)) {
    return c.text("invalid_request: redirect_uri not registered", 400)
  }

  return c.html(consentPage(env.BASE_URL, {
    clientName: clientData.clientName,
    clientId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
  }))
})

// --- POST /authorize --- validate token, generate code, redirect ------------

oauth.post("/authorize", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")
  const env = c.get("env")

  let form: Record<string, string>
  try {
    const fd = await c.req.formData()
    form = Object.fromEntries(fd.entries()) as Record<string, string>
  } catch {
    return c.text("invalid_request: malformed form body", 400)
  }

  const { client_id, redirect_uri, state, code_challenge, code_challenge_method, token } = form

  if (!client_id || !redirect_uri || !token) {
    return c.text("invalid_request: missing required fields", 400)
  }

  const clientRaw = await redis.get(`oauth_client:${client_id}`)
  if (!clientRaw) {
    return c.text("invalid_client: unknown client_id", 400)
  }

  const clientData = JSON.parse(clientRaw) as { clientName: string; redirectUris: string[] }
  if (!clientData.redirectUris.includes(redirect_uri)) {
    return c.text("invalid_request: redirect_uri mismatch", 400)
  }

  // Validate user token against DB
  const [user] = await sql<{ id: string; api_token: string }[]>`
    SELECT id, api_token FROM users WHERE api_token = ${token}
  `

  if (!user) {
    return c.html(consentPage(env.BASE_URL, {
      clientName: clientData.clientName,
      clientId: client_id,
      redirectUri: redirect_uri,
      state: state ?? "",
      codeChallenge: code_challenge ?? "",
      codeChallengeMethod: code_challenge_method ?? "S256",
      error: "Токен не найден. Проверьте и попробуйте снова.",
    }), 400)
  }

  // Generate authorization code — one-time, 5min TTL
  // P2-014: store only userId, NOT apiToken — fetch from DB at exchange time
  const code = crypto.randomUUID().replace(/-/g, "")
  await redis.set(
    `oauth:code:${code}`,
    JSON.stringify({
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge ?? "",
      codeChallengeMethod: code_challenge_method ?? "S256",
      userId: user.id,
    }),
    "EX",
    300
  )

  const dest = new URL(redirect_uri)
  dest.searchParams.set("code", code)
  if (state) dest.searchParams.set("state", state)

  return c.redirect(dest.toString(), 302)
})

// --- POST /token --- PKCE exchange ------------------------------------------

oauth.post("/token", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")

  let params: Record<string, string>
  const ct = c.req.header("Content-Type") ?? ""

  if (ct.includes("application/json")) {
    try {
      params = await c.req.json() as Record<string, string>
    } catch {
      return tokenError(c, "invalid_request", "malformed JSON body")
    }
  } else {
    try {
      const fd = await c.req.formData()
      params = Object.fromEntries(fd.entries()) as Record<string, string>
    } catch {
      return tokenError(c, "invalid_request", "malformed form body")
    }
  }

  const { grant_type, code, redirect_uri, client_id, code_verifier } = params

  if (grant_type !== "authorization_code") {
    return tokenError(c, "unsupported_grant_type", "only authorization_code supported")
  }

  if (!code || !redirect_uri || !client_id) {
    return tokenError(c, "invalid_request", "missing required params")
  }

  const codeRaw = await redis.get(`oauth:code:${code}`)
  if (!codeRaw) {
    return tokenError(c, "invalid_grant", "code not found or expired")
  }

  const codeData = JSON.parse(codeRaw) as {
    clientId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    userId: string
  }

  // One-time use — delete before any further checks
  await redis.del(`oauth:code:${code}`)

  if (codeData.clientId !== client_id) {
    return tokenError(c, "invalid_client", "client_id mismatch")
  }
  if (codeData.redirectUri !== redirect_uri) {
    return tokenError(c, "invalid_grant", "redirect_uri mismatch")
  }

  // PKCE verification (required when code_challenge was stored)
  if (codeData.codeChallenge) {
    if (!code_verifier) {
      return tokenError(c, "invalid_request", "code_verifier required")
    }
    const valid = await verifyPkce(code_verifier, codeData.codeChallenge, codeData.codeChallengeMethod)
    if (!valid) {
      return tokenError(c, "invalid_grant", "code_verifier does not match code_challenge")
    }
  }

  // P2-014: fetch token from DB instead of storing it in Redis code payload
  const [user] = await sql<{ api_token: string }[]>`
    SELECT api_token FROM users WHERE id = ${codeData.userId}
  `
  if (!user) {
    return tokenError(c, "invalid_grant", "user not found")
  }

  // P1-009: use c.json() so CORS headers from Hono middleware are included
  return c.json({
    access_token: user.api_token,
    token_type: "Bearer",
    expires_in: 86400,
  })
})

// --- PKCE S256 verification --------------------------------------------------

// P1-004: reject any method other than S256 — plain is forbidden by OAuth 2.1 (RFC 9700)
async function verifyPkce(
  verifier: string,
  challenge: string,
  method: string
): Promise<boolean> {
  if (method !== "S256") {
    // Reject plain and any other method — S256 is required
    return false
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
  const base64url = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

  return base64url === challenge
}

// --- Helpers -----------------------------------------------------------------

// P1-009: use Hono context method so CORS middleware headers are included
function tokenError(c: Context<AppEnv>, error: string, description: string) {
  return c.json({ error, error_description: description }, 400)
}

interface ConsentPageParams {
  clientName: string
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  codeChallengeMethod: string
  error?: string
}

function consentPage(baseUrl: string, p: ConsentPageParams): string {
  const errorHtml = p.error
    ? `<p class="error">${escHtml(p.error)}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contexter — Разрешить доступ</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#FAFAFA;font-family:'Inter',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{background:#fff;border:1px solid #E5E7EB;width:100%;max-width:400px;padding:40px}
.logo{font-size:18px;font-weight:700;color:#1E3EA0;letter-spacing:-0.5px;margin-bottom:32px}
h1{font-size:20px;font-weight:600;color:#111827;margin-bottom:8px}
.sub{font-size:14px;color:#6B7280;margin-bottom:28px;line-height:1.5}
.client{font-weight:600;color:#111827}
label{display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px}
input[type=password]{width:100%;padding:10px 12px;border:1px solid #D1D5DB;font-size:14px;font-family:inherit;color:#111827;background:#fff;outline:none;margin-bottom:20px}
input[type=password]:focus{border-color:#1E3EA0;box-shadow:0 0 0 3px rgba(30,62,160,0.08)}
button{width:100%;padding:11px;background:#1E3EA0;color:#fff;font-size:14px;font-weight:600;font-family:inherit;border:none;cursor:pointer;letter-spacing:0.01em}
button:hover{background:#163080}
.error{font-size:13px;color:#DC2626;margin-bottom:16px;padding:10px 12px;background:#FEF2F2;border:1px solid #FECACA}
.hint{font-size:12px;color:#9CA3AF;margin-top:16px;line-height:1.5}
</style>
</head>
<body>
<div class="card">
  <div class="logo">Contexter</div>
  <h1>Разрешить доступ</h1>
  <p class="sub"><span class="client">${escHtml(p.clientName)}</span> запрашивает доступ к вашей базе знаний.</p>
  ${errorHtml}
  <form method="POST" action="${baseUrl}/authorize">
    <input type="hidden" name="client_id" value="${escHtml(p.clientId)}">
    <input type="hidden" name="redirect_uri" value="${escHtml(p.redirectUri)}">
    <input type="hidden" name="state" value="${escHtml(p.state)}">
    <input type="hidden" name="code_challenge" value="${escHtml(p.codeChallenge)}">
    <input type="hidden" name="code_challenge_method" value="${escHtml(p.codeChallengeMethod)}">
    <label for="token">Ваш токен Contexter</label>
    <input type="password" id="token" name="token" placeholder="Вставьте API-токен" autocomplete="off" required>
    <button type="submit">Разрешить</button>
  </form>
  <p class="hint">Токен можно найти в ответе на регистрацию (<code>apiToken</code>).</p>
</div>
</body>
</html>`
}

function escHtml(s: string | undefined): string {
  if (!s) return ""
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}
