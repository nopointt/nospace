// --- Crash handlers — must be first, before any imports that could throw ---
process.on("uncaughtException", (err, origin) => {
  console.error(JSON.stringify({ event: "UNCAUGHT_EXCEPTION", origin, error: err.message, stack: err.stack }))
})
process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason)
  const stack = reason instanceof Error ? reason.stack : undefined
  console.error(JSON.stringify({ event: "UNHANDLED_REJECTION", error: msg, stack }))
})
process.on("exit", (code) => {
  console.log(JSON.stringify({ event: "PROCESS_EXIT", code }))
})

import { Hono } from "hono"
import { cors } from "hono/cors"
import postgres from "postgres"
import { S3Client } from "@aws-sdk/client-s3"
import Redis from "ioredis"
import type { Env } from "./types/env"
import { startPipelineWorker, shutdownQueue } from "./services/queue"
import { health } from "./routes/health"
import { upload } from "./routes/upload"
// query route removed — MCP search_knowledge is the primary query path
import { status } from "./routes/status"
import { documents } from "./routes/documents"
// P1-010: mcp.ts (CF Workers pattern legacy scaffold) removed — use mcpRemote instead
import { mcpRemote } from "./routes/mcp-remote"
import { auth } from "./routes/auth"
import { retry } from "./routes/retry"
import { dev } from "./routes/dev"
import { pipeline } from "./routes/pipeline"
import { oauth } from "./routes/oauth"
import { billing } from "./routes/billing"
import { webhooks } from "./routes/webhooks"
import { authSocial } from "./routes/auth-social"
import { metrics } from "./routes/metrics"
import { startMaintenanceWorker, shutdownMaintenanceQueue } from "./routes/maintenance"
import { feedbackRouter } from "./routes/feedback"
import { createAuth } from "./auth"
import { setBetterAuth } from "./services/auth"
import { startFeedbackDecayWorker, scheduleFeedbackDecay } from "./services/feedback-decay"
import { startLlmEvalWorker, shutdownLlmEvalQueue } from "./services/evaluation/llm-eval"

// P3-015: validate required env vars at startup — fail fast with clear message
const REQUIRED_ENV = [
  "DATABASE_URL",
  "REDIS_URL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "JINA_API_KEY",
  "GROQ_API_KEY",
  "BETTER_AUTH_SECRET",
]
for (const key of REQUIRED_ENV) {
  if (!process.env[key]?.trim()) {
    console.error(`FATAL: Missing or empty required env var: ${key}`)
    process.exit(1)
  }
}

// --- Init services ---
// P2-015: add idle_timeout + connect_timeout so stalled connections don't hold pool slots
// P4-006: pool size configurable via PG_POOL_MAX env var
const sql = postgres(process.env.DATABASE_URL!, {
  max: parseInt(process.env.PG_POOL_MAX ?? "100", 10),
  idle_timeout: 30,
  connect_timeout: 10,
})

const redis = new Redis(process.env.REDIS_URL!)
redis.on("error", (err) => {
  console.error(JSON.stringify({ event: "redis_error", error: err.message }))
})

const storage = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const env: Env = {
  storage,
  storageBucket: process.env.R2_BUCKET ?? "contexter-files",
  redis,
  JINA_API_KEY: process.env.JINA_API_KEY!,
  GROQ_API_KEY: process.env.GROQ_API_KEY!,
  JINA_API_URL: process.env.JINA_API_URL ?? "https://api.jina.ai/v1/embeddings",
  GROQ_API_URL: process.env.GROQ_API_URL ?? "https://api.groq.com/openai/v1/audio/transcriptions",
  GROQ_LLM_URL: process.env.GROQ_LLM_URL ?? "https://api.groq.com/openai/v1",
  GROQ_LLM_MODEL: process.env.GROQ_LLM_MODEL ?? "llama-3.1-8b-instant",
  DOCLING_URL: process.env.DOCLING_URL ?? "http://localhost:5001",
  BASE_URL: process.env.BASE_URL ?? "https://api.contexter.cc",
  ENVIRONMENT: process.env.ENVIRONMENT ?? "production",
  // LLM provider chain: Groq (primary) → NIM (fallback 1) → DeepInfra (fallback 2)
  NIM_API_KEY: process.env.NIM_API_KEY,
  NIM_BASE_URL: process.env.NIM_BASE_URL,
  NIM_MODEL: process.env.NIM_MODEL,
  DEEPINFRA_API_KEY: process.env.DEEPINFRA_API_KEY,
  DEEPINFRA_MODEL: process.env.DEEPINFRA_MODEL,
  // LLM model overrides
  GROQ_REWRITE_MODEL: process.env.GROQ_REWRITE_MODEL,
  GROQ_ANSWER_MODEL: process.env.GROQ_ANSWER_MODEL,
  // Rate limit whitelist
  RATE_LIMIT_WHITELIST_IPS: process.env.RATE_LIMIT_WHITELIST_IPS,
  // CTX-04: better-auth
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
}

type AppEnv = { Variables: { sql: typeof sql; env: Env; redis: typeof redis; requestId: string } }
const app = new Hono<AppEnv>()

// --- CTX-04: better-auth instance (created early, mounted after CORS) ---
const betterAuthInstance = createAuth(env)
setBetterAuth(betterAuthInstance) // inject into resolveAuth for cookie session resolution

app.onError((err, c) => {
  console.error(JSON.stringify({ event: "unhandled_error", error: err.message, stack: err.stack }))
  return c.json({ error: "Internal server error." }, 500)
})

// --- Observability: request logging (P3-010) ---
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID().slice(0, 8)
  c.set("requestId", requestId)
  const start = performance.now()
  await next()
  const duration = Math.round(performance.now() - start)
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    rid: requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    ms: duration,
  }))
})

// P3-006: restrict CORS — credentials: true required for better-auth Set-Cookie cross-origin
app.use("*", cors({
  origin: ["https://contexter.cc", "https://www.contexter.cc"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Mcp-Session-Id"],
  credentials: true,
}))

// CTX-04: better-auth routes — AFTER CORS middleware so Set-Cookie headers reach browser
app.on(["POST", "GET"], "/auth/**", (c) => betterAuthInstance.handler(c.req.raw))

// --- Inject dependencies ---
app.use("*", async (c, next) => {
  c.set("sql", sql)
  c.set("env", env)
  c.set("redis", redis)
  await next()
})

// OAuth 2.1 Authorization Server Metadata (RFC 8414)
app.get("/.well-known/oauth-authorization-server", (c) => {
  const base = env.BASE_URL
  return c.json({
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/token`,
    registration_endpoint: `${base}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
  })
})

// OAuth 2.1 Dynamic Client Registration (RFC 7591)
app.post("/register", async (c) => {
  // P1-005: rate limit client registration — max 10 per IP per hour
  // P2-017: prefer CF-Connecting-IP over X-Forwarded-For (spoofable)
  const ip = c.req.header("CF-Connecting-IP")
    ?? c.req.header("X-Real-IP")
    ?? c.req.header("X-Forwarded-For")?.split(",")[0]?.trim()
    ?? "unknown"
  const rateLimitKey = `rate:client_reg:${ip}`
  try {
    const count = await redis.incr(rateLimitKey)
    if (count === 1) await redis.expire(rateLimitKey, 3600)
    if (count > 10) {
      return c.json({ error: "rate_limit_exceeded", error_description: "Too many client registrations. Try again later." }, 429)
    }
  } catch (e) {
    console.error("Redis rate limit check failed for /register, allowing request:", e instanceof Error ? e.message : String(e))
  }

  let body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid_request", error_description: "malformed JSON body" }, 400)
  }

  const clientName = typeof body.client_name === "string" ? body.client_name : "unknown"
  const redirectUrisRaw = Array.isArray(body.redirect_uris) && body.redirect_uris.length > 0
    ? body.redirect_uris as string[]
    : ["https://www.perplexity.ai/rest/connections/oauth_callback"]

  // P2-018: validate that all redirect_uris use HTTPS (localhost allowed for dev tools)
  for (const uri of redirectUrisRaw) {
    try {
      const parsed = new URL(uri)
      if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
        return c.json({ error: "invalid_redirect_uri", error_description: `Redirect URI must use HTTPS: ${uri}` }, 400)
      }
    } catch {
      return c.json({ error: "invalid_redirect_uri", error_description: `Invalid redirect URI: ${uri}` }, 400)
    }
  }
  const redirectUris = redirectUrisRaw

  const clientId = `contexter-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
  const clientSecret = crypto.randomUUID().replace(/-/g, "")

  try {
    await redis.set(
      `oauth_client:${clientId}`,
      JSON.stringify({ clientId, clientSecret, clientName, redirectUris }),
      "EX", 86400
    )
  } catch (e) {
    console.error("Redis set failed for client registration:", e instanceof Error ? e.message : String(e))
    return c.json({ error: "server_error", error_description: "Failed to register client" }, 500)
  }

  return c.json({
    client_id: clientId,
    client_secret: clientSecret,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: body.grant_types ?? ["authorization_code"],
    response_types: body.response_types ?? ["code"],
    token_endpoint_auth_method: body.token_endpoint_auth_method ?? "none",
  }, 201)
})

app.route("/health", health)
app.route("/api/upload", upload)
// /api/query removed — MCP search_knowledge is the primary query path
app.route("/api/status", status)
app.route("/api/documents", documents)
// P1-010: /mcp route removed (legacy CF Workers scaffold)
app.route("/sse", mcpRemote)
app.route("/api/auth", auth)
app.route("/api/auth", authSocial)
app.route("/api/retry", retry)
app.route("/api/pipeline", pipeline)
app.route("/api/billing", billing)
app.route("/webhooks", webhooks)
app.route("/dev", dev)
app.route("/api/metrics", metrics)
app.route("/api/feedback", feedbackRouter)
app.route("/", oauth)

// --- Start BullMQ pipeline worker ---
let pipelineWorker: Awaited<ReturnType<typeof startPipelineWorker>> | null = null
try {
  pipelineWorker = startPipelineWorker(process.env.REDIS_URL!, env, sql)
  console.log("Pipeline worker started (concurrency: 4)")
} catch (e) {
  console.error("Pipeline worker failed to start — jobs will use direct fallback:", e instanceof Error ? e.message : String(e))
}

// F-013: start maintenance worker (retention cron)
let maintenanceWorker: ReturnType<typeof startMaintenanceWorker> | null = null
try {
  maintenanceWorker = startMaintenanceWorker(process.env.REDIS_URL!, sql)
  console.log("Maintenance worker started")
} catch (e) {
  console.error("Maintenance worker failed to start:", e instanceof Error ? e.message : String(e))
}

// F-030: start feedback decay worker (daily 02:00 UTC cron)
let feedbackDecayWorker: Awaited<ReturnType<typeof startFeedbackDecayWorker>> | null = null
try {
  feedbackDecayWorker = startFeedbackDecayWorker(process.env.REDIS_URL!, sql)
  await scheduleFeedbackDecay(process.env.REDIS_URL!)
  console.log("Feedback decay worker started")
} catch (e) {
  console.error("Feedback decay worker failed to start:", e instanceof Error ? e.message : String(e))
}

// F-031: start LLM eval worker (sampled evaluation — concurrency 1, Groq rate-limit aware)
let llmEvalWorker: ReturnType<typeof startLlmEvalWorker> | null = null
try {
  llmEvalWorker = startLlmEvalWorker(process.env.REDIS_URL!, sql)
  console.log("LLM eval worker started (concurrency: 1)")
} catch (e) {
  console.error("LLM eval worker failed to start:", e instanceof Error ? e.message : String(e))
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...")
  if (pipelineWorker) await shutdownQueue(pipelineWorker)
  if (maintenanceWorker) await shutdownMaintenanceQueue(maintenanceWorker)
  if (feedbackDecayWorker) await feedbackDecayWorker.close()
  if (llmEvalWorker) await shutdownLlmEvalQueue(llmEvalWorker)
  await redis.quit()
  await sql.end()
  process.exit(0)
})

// --- Start Bun server ---
const port = parseInt(process.env.PORT ?? "3000")
console.log(`Contexter API starting on port ${port}...`)

export default {
  port,
  fetch: app.fetch,
}
