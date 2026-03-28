import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import crypto from "crypto"
import { generateToken } from "../services/auth"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

export const authSocial = new Hono<AppEnv>()

// --- Telegram Login Widget ---
// Docs: https://core.telegram.org/widgets/login

interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const secretKey = crypto.createHash("sha256").update(botToken).digest()

  // Build check string: all fields except hash, sorted alphabetically, joined by \n
  const checkArr: string[] = []
  for (const key of Object.keys(data).sort()) {
    if (key === "hash") continue
    checkArr.push(`${key}=${(data as Record<string, unknown>)[key]}`)
  }
  const checkString = checkArr.join("\n")

  const hmac = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex")
  return hmac === data.hash
}

// POST /api/auth/telegram — verify Telegram Login Widget data, create/login user
authSocial.post("/telegram", async (c) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return c.json({ error: "Telegram auth not configured" }, 500)

  let data: TelegramAuthData
  try {
    data = await c.req.json()
  } catch {
    return c.json({ error: "invalid JSON" }, 400)
  }

  if (!data.id || !data.hash || !data.auth_date) {
    return c.json({ error: "missing required fields (id, hash, auth_date)" }, 400)
  }

  // Verify signature
  if (!verifyTelegramAuth(data, botToken)) {
    return c.json({ error: "invalid Telegram auth data" }, 403)
  }

  // Check auth_date is not too old (24 hours)
  const now = Math.floor(Date.now() / 1000)
  if (now - data.auth_date > 86400) {
    return c.json({ error: "auth data expired" }, 403)
  }

  const sql = c.get("sql")
  const telegramId = String(data.id)
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ")
  const avatarUrl = data.photo_url ?? null

  // Find existing user by telegram_id
  const [existing] = await sql`
    SELECT id, api_token, name FROM users WHERE telegram_id = ${telegramId}
  `

  if (existing) {
    // Update name/avatar if changed
    await sql`
      UPDATE users SET name = ${name}, avatar_url = ${avatarUrl} WHERE id = ${existing.id}
    `
    return c.json({
      userId: existing.id,
      apiToken: existing.api_token,
      name,
      isNew: false,
    })
  }

  // Create new user
  const userId = crypto.randomUUID().slice(0, 16)
  const apiToken = generateToken()

  await sql`
    INSERT INTO users (id, api_token, name, telegram_id, avatar_url)
    VALUES (${userId}, ${apiToken}, ${name}, ${telegramId}, ${avatarUrl})
  `

  return c.json({
    userId,
    apiToken,
    name,
    isNew: true,
  }, 201)
})

// GET /api/auth/telegram-redirect — Telegram Login Widget callback (redirect mode)
authSocial.get("/telegram-redirect", async (c) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return c.json({ error: "Telegram auth not configured" }, 500)

  // Telegram sends auth data as query params
  const url = new URL(c.req.url)
  const q = Object.fromEntries(url.searchParams.entries())

  const { hash: _redacted, ...safeParams } = q
  console.log(JSON.stringify({ event: "telegram_redirect_params", params: safeParams }))

  if (!q.id || !q.hash || !q.auth_date) {
    console.error("Telegram redirect missing params:", Object.keys(q))
    return c.redirect("https://contexter.cc/app?auth=error")
  }

  const data: TelegramAuthData = {
    id: Number(q.id),
    first_name: q.first_name ?? "",
    last_name: q.last_name,
    username: q.username,
    photo_url: q.photo_url,
    auth_date: Number(q.auth_date),
    hash: q.hash,
  }

  if (!data.id || isNaN(data.id) || !data.hash || !data.auth_date) {
    return c.redirect("https://contexter.cc/app?auth=error")
  }

  if (!verifyTelegramAuth(data, botToken)) {
    return c.redirect("https://contexter.cc/app?auth=error")
  }

  const now = Math.floor(Date.now() / 1000)
  if (now - data.auth_date > 86400) {
    return c.redirect("https://contexter.cc/app?auth=expired")
  }

  const sql = c.get("sql")
  const telegramId = String(data.id)
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ")
  const avatarUrl = data.photo_url ?? null

  const [existing] = await sql`
    SELECT id, api_token FROM users WHERE telegram_id = ${telegramId}
  `

  let apiToken: string

  if (existing) {
    apiToken = existing.api_token as string
    await sql`UPDATE users SET name = ${name}, avatar_url = ${avatarUrl} WHERE id = ${existing.id}`
  } else {
    const userId = crypto.randomUUID().slice(0, 16)
    apiToken = generateToken()
    await sql`
      INSERT INTO users (id, api_token, name, telegram_id, avatar_url)
      VALUES (${userId}, ${apiToken}, ${name}, ${telegramId}, ${avatarUrl})
    `
  }

  return c.redirect(`https://contexter.cc/app?token=${apiToken}`)
})

// --- Google OAuth 2.0 ---

// GET /api/auth/google — redirect to Google consent screen
authSocial.get("/google", async (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return c.json({ error: "Google auth not configured" }, 500)

  const redis = c.get("redis")
  const state = crypto.randomBytes(16).toString("hex")
  await redis.set(`oauth_state:${state}`, "1", "EX", 600)

  const redirectUri = `${process.env.BASE_URL ?? "https://api.contexter.cc"}/api/auth/google/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// GET /api/auth/google/callback — handle Google OAuth callback
authSocial.get("/google/callback", async (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return c.json({ error: "Google auth not configured" }, 500)

  const code = c.req.query("code")
  const state = c.req.query("state")
  const error = c.req.query("error")

  if (error) return c.redirect("https://contexter.cc/app?auth=error")
  if (!code || !state) return c.json({ error: "missing code or state" }, 400)

  // Verify state
  const redis = c.get("redis")
  const stateValid = await redis.get(`oauth_state:${state}`)
  if (!stateValid) return c.json({ error: "invalid or expired state" }, 403)
  await redis.del(`oauth_state:${state}`)

  const redirectUri = `${process.env.BASE_URL ?? "https://api.contexter.cc"}/api/auth/google/callback`

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", await tokenRes.text())
    return c.redirect("https://contexter.cc/app?auth=error")
  }

  const tokens = await tokenRes.json() as { access_token: string }

  // Get user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userInfoRes.ok) {
    console.error("Google userinfo failed:", await userInfoRes.text())
    return c.redirect("https://contexter.cc/app?auth=error")
  }

  const userInfo = await userInfoRes.json() as {
    id: string
    email: string
    name: string
    picture?: string
  }

  const sql = c.get("sql")
  const googleId = userInfo.id

  // Find existing user by google_id or email
  const [existing] = await sql`
    SELECT id, api_token, name FROM users
    WHERE google_id = ${googleId} OR email = ${userInfo.email}
    LIMIT 1
  `

  let apiToken: string

  if (existing) {
    apiToken = existing.api_token as string
    // Link google_id if not yet linked, update name/avatar
    await sql`
      UPDATE users SET
        google_id = ${googleId},
        name = COALESCE(name, ${userInfo.name}),
        email = ${userInfo.email},
        avatar_url = ${userInfo.picture ?? null}
      WHERE id = ${existing.id}
    `
  } else {
    // Create new user
    const userId = crypto.randomUUID().slice(0, 16)
    apiToken = generateToken()

    await sql`
      INSERT INTO users (id, api_token, name, email, google_id, avatar_url)
      VALUES (${userId}, ${apiToken}, ${userInfo.name}, ${userInfo.email}, ${googleId}, ${userInfo.picture ?? null})
    `
  }

  // Redirect to frontend with token
  return c.redirect(`https://contexter.cc/app?token=${apiToken}`)
})
