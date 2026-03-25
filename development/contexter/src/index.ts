import { Hono } from "hono"
import { cors } from "hono/cors"
import type { Env } from "./types/env"
import { health } from "./routes/health"
import { upload } from "./routes/upload"
import { query } from "./routes/query"
import { status } from "./routes/status"
import { documents } from "./routes/documents"
import { mcp } from "./routes/mcp"
import { mcpRemote } from "./routes/mcp-remote"
import { auth } from "./routes/auth"
import { retry } from "./routes/retry"
import { dev } from "./routes/dev"
import { pipeline } from "./routes/pipeline"
import { oauth } from "./routes/oauth"

const app = new Hono<{ Bindings: Env }>()

app.use("*", cors())

// OAuth 2.1 Authorization Server Metadata (RFC 8414)
app.get("/.well-known/oauth-authorization-server", (c) => {
  const base = "https://contexter.nopoint.workers.dev"
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
  let body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid_request", error_description: "malformed JSON body" }, 400)
  }

  const clientName = typeof body.client_name === "string" ? body.client_name : "unknown"
  const redirectUris = Array.isArray(body.redirect_uris) && body.redirect_uris.length > 0
    ? body.redirect_uris as string[]
    : ["https://www.perplexity.ai/rest/connections/oauth_callback"]

  const clientId = `contexter-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
  const clientSecret = crypto.randomUUID().replace(/-/g, "")

  await c.env.KV.put(
    `oauth_client:${clientId}`,
    JSON.stringify({ clientId, clientSecret, clientName, redirectUris }),
    { expirationTtl: 86400 }
  )

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
app.route("/api/query", query)
app.route("/api/status", status)
app.route("/api/documents", documents)
app.route("/mcp", mcp)
app.route("/sse", mcpRemote)
app.route("/api/auth", auth)
app.route("/api/retry", retry)
app.route("/api/pipeline", pipeline)
app.route("/dev", dev)

// OAuth 2.1 authorization + token endpoints (mounted at root — paths are /authorize and /token)
app.route("/", oauth)

export default app
