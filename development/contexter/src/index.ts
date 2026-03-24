import { Hono } from "hono"
import { cors } from "hono/cors"
import type { Env } from "./types/env"
import { health } from "./routes/health"
import { upload } from "./routes/upload"
import { query } from "./routes/query"
import { status } from "./routes/status"
import { mcp } from "./routes/mcp"
import { mcpRemote } from "./routes/mcp-remote"
import { auth } from "./routes/auth"
import { retry } from "./routes/retry"
import { dev } from "./routes/dev"

const app = new Hono<{ Bindings: Env }>()

app.use("*", cors())

app.route("/health", health)
app.route("/api/upload", upload)
app.route("/api/query", query)
app.route("/api/status", status)
app.route("/mcp", mcp)
app.route("/sse", mcpRemote)
app.route("/api/auth", auth)
app.route("/api/retry", retry)
app.route("/dev", dev)

export default app
