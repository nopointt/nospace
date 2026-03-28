Now I have a complete picture of the codebase. Let me produce the review report.

---

# Contexter API Integration Review — Schlemmer

Reviewed files: `src/index.ts`, `src/routes/query.ts`, `src/routes/mcp-remote.ts`, `src/routes/dev.ts`, `src/routes/feedback.ts`, `src/routes/metrics.ts`, `src/routes/health.ts`, `src/routes/documents.ts`, `src/routes/upload.ts`, `src/routes/auth.ts`, `src/routes/auth-social.ts`, `src/routes/oauth.ts`, `src/routes/billing.ts`, `src/routes/webhooks.ts`, `src/routes/pipeline.ts`, `src/routes/retry.ts`, `src/routes/status.ts`, `src/services/llm.ts`, `src/services/nli.ts`

---

### [CRITICAL] — No global Hono error handler: unhandled rejections return empty 500

**File:** `src/index.ts` (no `app.onError` call anywhere)
**Category:** reliability
**Description:** Hono requires an explicit `app.onError()` handler. Without it, unhandled exceptions thrown inside route handlers (after awaiting any async operation) fall through to Hono's built-in minimal handler, which returns a plain-text `Internal Server Error` with a 500 status. This leaks no content, but more critically: routes that do not wrap their entire body in `try/catch` — `documents.ts`, `status.ts`, `pipeline.ts`, `retry.ts`, `auth-social.ts`, `billing.ts` — will produce inconsistent error shapes (plain text vs. JSON) when PostgreSQL throws, breaking any client that parses the response body. Specifically:

- `DELETE /api/documents` (line 21-27): no try/catch around `sql\`DELETE\``
- `GET /api/status/:documentId` (line 18-75): no try/catch around three SQL queries
- `DELETE /api/status/:documentId` (line 82-94): no try/catch
- `GET /api/pipeline/health` (line 18-63): no try/catch around SQL queries
- `POST /api/auth/telegram` (line 41-105): no outer try/catch around SQL
- `GET /api/auth/google/callback` (line 198-291): outer fetch errors caught via redirect, but SQL writes (lines 271-286) are unguarded
- `GET /api/billing/payments` (line 103-115): no try/catch around SQL

**Recommendation:** Add `app.onError((err, c) => { console.error(...); return c.json({ error: "Internal server error." }, 500) })` in `src/index.ts` immediately after `const app = new Hono<AppEnv>()`. Then audit each route above for missing try/catch.

---

### [CRITICAL] — SSE stream missing `event:` field: protocol non-conformant

**File:** `src/routes/query.ts:251-252`
**Category:** correctness
**Description:** The `encode` helper produces:

```
data: {"type":"sources",...}\n\n
```

SSE protocol requires each event to have an `event:` line before `data:` to be addressable by `addEventListener`. The `RagStreamEvent` type union is `sources | token | done | error`. Without the `event:` field, all events arrive as the generic `message` event type and clients must parse the `type` field from the JSON body to distinguish them. This is a contract deviation from the MCP spec and from every documented SSE convention. Compare: `mcp-remote.ts` line 975 correctly sends `event: message\ndata: ...`.

Note: the MCP `/sse` endpoint in `mcp-remote.ts` also uses only `event: message` uniformly, but at least it is consistent. The query stream does not even emit `event:` at all, so clients using `EventSource` and listening on named events (e.g., `evtSource.addEventListener('done', ...)`) will never fire.

**Recommendation:**

```typescript
const encode = (event: RagStreamEvent) => {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
  controller.enqueue(new TextEncoder().encode(payload))
}
```

---

### [CRITICAL] — `chatStream()` fallback throws on dual failure: no passthrough for SSE path

**File:** `src/services/llm.ts:106-125`
**Category:** reliability
**Description:** `chat()` (line 80-104) has a three-level fallback chain: primary → fallback → `extractContextPassthrough`. When both providers fail, it returns a degraded response rather than throwing. `chatStream()` (line 106-125) only has two levels: primary → fallback. If the fallback also fails, `chatStream()` re-throws the error. This means the streaming path in `query.ts:258` will catch the exception in the `for await` loop's `try/catch` (line 273), emit `{ type: "error" }`, and then still emit `{ type: "done" }` (line 275). The downstream client receives an error event with a raw provider error message. The non-streaming path would silently return the context passages instead. The behavior is asymmetric. Additionally, the `done` event emitted after an `error` event on line 275 sends zeroed token counts, which is benign but misleading.

**Recommendation:** Add a passthrough fallback to `chatStream()`:

```typescript
} catch (fallbackErr) {
  setGroqLlmFallback(false)
  // yield the same passthrough text the batch path produces
  yield extractContextPassthrough(messages)
}
```

Then expose `extractContextPassthrough` or move it to a shared module so `chatStream` can call it.

---

### [HIGH] — `GROQ_API_URL` default is the audio transcriptions endpoint, not the chat endpoint

**File:** `src/index.ts:72`
**Category:** correctness
**Description:** Line 72 sets:

```typescript
GROQ_API_URL: process.env.GROQ_API_URL ?? "https://api.groq.com/openai/v1/audio/transcriptions",
```

This default points to the Whisper transcription endpoint. `src/services/pipeline.ts` uses `env.GROQ_API_URL` (lines 91, 161, 311, 481) as the base URL for audio processing — which is correct for that use case. However, if `GROQ_API_URL` is ever consumed as a base for chat completions (it is passed as `process.env["GROQ_LLM_URL"] ?? env.GROQ_API_URL` on lines 161/311/481), the URL resolves to `.../audio/transcriptions/chat/completions`, producing a 404. The variable name and its comment say "LLM URL" in some places and "audio" in others. The pipeline uses it for Whisper, but `llm.ts` hardcodes `GROQ_BASE_URL` independently, so chat completions are not actually affected today — but the confusion creates a silent integration error risk if any future code pulls `GROQ_API_URL` expecting a chat base.

**Recommendation:** Split into two distinct env vars: `GROQ_WHISPER_URL` (default `https://api.groq.com/openai/v1/audio/transcriptions`) and keep `GROQ_BASE_URL` as a constant in `llm.ts`. Remove `GROQ_API_URL` from the `Env` interface or rename it unambiguously.

---

### [HIGH] — `isFallbackEligible` regex fails on `LLM stream API error` message format

**File:** `src/services/llm.ts:289-296`
**Category:** correctness
**Description:** The eligibility regex on line 295 is:

```typescript
return /API error (5\d\d|429)/.test(err.message)
```

`fetchChatCompletion` (line 196) throws: `LLM API error ${res.status}: ...`
`fetchChatStream` (line 234) throws: `LLM stream API error ${res.status}: ...`

The regex pattern `API error (5\d\d|429)` matches both because both strings contain `API error`. This works correctly. However, there is a subtle failure mode: if `chatStreamWithProvider` is wrapped by the circuit breaker (`groqLlmPolicy.execute(call)` on line 165), the circuit breaker resolves the promise by calling `call()` to get the generator, not by consuming it. If the generator itself throws during iteration (not during initialization), the exception propagates _outside_ the `groqLlmPolicy.execute` wrapper. This means stream-iteration errors bypass the circuit breaker's tracking, so a sustained stream failure will not open the circuit.

**Recommendation:** The stream circuit breaker should wrap iteration, not just initialization. Consider whether `chatStreamWithProvider` should catch iteration errors and update circuit state. At minimum, document this known gap.

---

### [HIGH] — DELETE `/api/documents` and DELETE `/api/status/:documentId` allow share tokens to delete

**File:** `src/routes/documents.ts:21-28`, `src/routes/status.ts:82-94`
**Category:** security
**Description:** Both delete endpoints authenticate via `resolveAuth()` and only check `auth.userId`. They do not check `auth.isOwner` or `auth.permission`. A share token with `permission: "read_write"` can call `DELETE /api/documents` and wipe the owner's entire document set. Similarly, `DELETE /api/status/:documentId` does not check `auth.permission` — a read-only share token holder can also issue this delete since the route only verifies ownership by `user_id`, but `auth.userId` for share tokens is `authCtx.userId` (the owner's userId, line 77 in `auth.ts`).

Checking the auth.ts source: for share tokens, `resolveAuth` sets `userId = owner's userId`. So `WHERE user_id = ${auth.userId}` does successfully restrict to the owner's documents — but there is no `isOwner` or `permission` guard. A read-only share recipient can delete documents.

**Recommendation:** Add `if (!auth.isOwner) return c.json({ error: "Forbidden." }, 403)` to both delete endpoints. The bulk delete (`DELETE /api/documents`) is especially high-risk.

---

### [HIGH] — MCP `upload_document` and `add_context` skip storage limit enforcement

**File:** `src/routes/mcp-remote.ts:461-559`, `src/routes/mcp-remote.ts:402-459`
**Category:** correctness
**Description:** `POST /api/upload` (lines 83-95 in `upload.ts`) calls `getOrCreateSubscription` and `getUserStorageUsed` and rejects uploads that exceed the tier limit. Neither `upload_document` nor `add_context` in the MCP tool handler performs this check. A user on the free tier (1 GB limit) can bypass storage enforcement entirely by using the MCP interface.

**Recommendation:** Extract the storage limit check into a shared helper function and call it from both the REST upload handler and the MCP `upload_document`/`add_context` tool handlers.

---

### [HIGH] — NLI health cache: first-call race condition when sidecar is loading

**File:** `src/services/nli.ts:44-53`
**Category:** reliability
**Description:** On first call, `this.lastHealthCheck = 0` and `this.lastHealthResult = false`. `isAvailable()` returns false. `scorePairs()` checks `(Date.now() - this.lastHealthCheck) >= HEALTH_CACHE_MS` — since 0 is always stale, it calls `checkHealth()`. The health check sends a GET to `/health` with a 2-second timeout. During the Docker container `start_period: 120s`, this will fail for up to 120 seconds. Each incoming request that calls `scorePairs()` will re-trigger the health check (since `lastHealthResult` stays false and the cache never warms). This means 1 health check per NLI call for the first 2 minutes after deployment, under load this is N simultaneous health checks.

**Recommendation:** Track an in-flight health check promise to coalesce concurrent callers:

```typescript
private healthCheckInFlight: Promise<void> | null = null

private async checkHealthOnce(): Promise<void> {
  if (this.healthCheckInFlight) return this.healthCheckInFlight
  this.healthCheckInFlight = this.checkHealth().finally(() => {
    this.healthCheckInFlight = null
  })
  return this.healthCheckInFlight
}
```

---

### [MEDIUM] — Redis connection has no error event handler: unhandled error crashes process

**File:** `src/index.ts:54`
**Category:** reliability
**Description:** ioredis emits `error` events on the connection object when Redis is unreachable (connection refused, timeout, etc.). Node.js will throw an `UnhandledPromiseRejectionWarning` or crash if no `.on('error')` handler is registered on the emitter. The redis instance created on line 54 has no `.on('error', ...)` handler. All routes do individually `try/catch` their Redis calls, but the underlying connection-level `error` event is separate from command promise rejections and can kill the process.

**Recommendation:** Add immediately after line 54:

```typescript
redis.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})
```

---

### [MEDIUM] — `/api/query/stream` does not cancel generator on client disconnect

**File:** `src/routes/query.ts:248-292`
**Category:** reliability
**Description:** The `ReadableStream` constructor accepts a `cancel` callback in the `UnderlyingSource`. This route does not provide one. When a client disconnects mid-stream (user closes tab, timeout), the generator `rag.queryStream()` continues running: it keeps requesting LLM tokens from Groq, consuming rate-limit quota, and holding the Postgres connection open via the VectorStore. For long queries (decomposition path, 5 sub-questions), this waste is significant.

**Recommendation:**

```typescript
let cancelled = false
const stream = new ReadableStream({
  async start(controller) { /* existing code checking cancelled */ },
  cancel() { cancelled = true }
})
// Inside the for-await loop: if (cancelled) break
```

---

### [MEDIUM] — `feedback.ts` has no try/catch around DB writes: SQL errors return 500 plain text

**File:** `src/routes/feedback.ts:36-71`
**Category:** reliability
**Description:** The entire feedback route body (lines 36-73) is not wrapped in try/catch. There are two SQL writes (INSERT into feedback, UPDATE on chunks) that can fail if: the `query_id` or `chunk_ids` do not exist (foreign key violation), the DB is down, or the user submits chunk IDs belonging to different documents. Without try/catch, a SQL exception will propagate to Hono's default handler, producing a 500 plain-text response instead of a JSON error.

**Recommendation:** Wrap the entire handler body after auth check in try/catch and return `c.json({ error: "Internal server error." }, 500)`.

---

### [MEDIUM] — `rename_document` MCP tool does not sanitize `newName`

**File:** `src/routes/mcp-remote.ts:797-831`
**Category:** security
**Description:** `add_context` and `upload_document` correctly call `sanitizeFileName()` before using the name in R2 keys. `rename_document` (line 824) writes `newName` directly into the documents table (`UPDATE documents SET name = ${newName}`) without sanitization. The `name` field is displayed in document listings and used to construct status messages. If the user sets a name with `<script>` tags, it could create stored XSS in any frontend that renders document names without escaping (a concern especially since the dev UI at `dev.ts` renders document output with `escapeHtml`, but MCP tool responses are returned as text and may be rendered differently).

**Recommendation:** Apply `sanitizeFileName(newName)` before the UPDATE, and add a max-length check (e.g., 255 chars).

---

### [MEDIUM] — `vectorStore.initialize()` is called per-request: not thread-safe and wasteful

**File:** `src/routes/query.ts:152`, `src/routes/query.ts:239`
**Category:** performance
**Description:** Both the batch and stream query handlers instantiate `new VectorStoreService({ sql })` and immediately call `await vectorStore.initialize()` on every request. If `initialize()` runs DDL or schema validation queries (common for pgvector setup), this is a per-request DB round-trip. More importantly, there is no check whether initialization has already been done. Under concurrent requests, multiple simultaneous calls to `initialize()` may race on schema creation. The same pattern appears in `mcp-remote.ts:332`.

**Recommendation:** Move `VectorStoreService` construction and initialization to module startup (singleton pattern), or memoize the initialization promise inside the class.

---

### [MEDIUM] — `health.ts` Groq check is key presence only, not liveness

**File:** `src/routes/health.ts:54-56`
**Category:** reliability
**Description:** The Groq health check (lines 54-56) only verifies that `env.GROQ_API_KEY` is a non-empty string:

```typescript
checks.groq = env.GROQ_API_KEY ? "ok" : "missing"
```

It does not make a real API call. The health endpoint will report `groq: "ok"` even when Groq is fully unreachable (network partition, API outage), while all query endpoints are failing. Operators relying on `/health` for alerting will miss Groq degradation.

**Recommendation:** Make a cheap `/models` or minimal completions probe call to Groq with a short timeout (1-2s). Cache the result for 30s to avoid health check load. Degrade status to `"unreachable"` rather than crashing the check.

---

### [MEDIUM] — `auth-social.ts` Telegram redirect handler logs raw query params including `hash`

**File:** `src/routes/auth-social.ts:116`
**Category:** security
**Description:** Line 116 logs:

```typescript
console.log(JSON.stringify({ event: "telegram_redirect_params", params: q }))
```

`q` is the full query parameter object from the Telegram redirect, which includes `hash` — the HMAC-SHA256 authentication signature over the user's identity data. If logs are forwarded to a centralized logging service, the hash is stored in plaintext. An attacker with log access could replay the hash before the 24-hour expiry window. The hash is a sensitive value for the duration of `auth_date + 86400s`.

**Recommendation:** Redact the hash before logging:

```typescript
const { hash: _redacted, ...safeParams } = q
console.log(JSON.stringify({ event: "telegram_redirect_params", params: safeParams }))
```

---

### [MEDIUM] — `billing.ts` subscribe endpoint: unguarded `createInvoice` and `createPaymentRecord`

**File:** `src/routes/billing.ts:76-98`
**Category:** reliability
**Description:** `createInvoice()` (line 76) calls the NOWPayments API. `createPaymentRecord()` (line 83) writes to PostgreSQL. Neither call is wrapped in try/catch. If the NOWPayments API returns an error (network failure, invalid API key, tier not configured), the exception propagates uncaught and produces a 500 plain-text response. If `createInvoice` succeeds but `createPaymentRecord` throws, the invoice is created externally but not recorded — the payment cannot be matched when the IPN webhook arrives.

**Recommendation:** Wrap both calls in try/catch. On `createInvoice` failure, return `{ error: "Payment provider unavailable" }` with status 502. On `createPaymentRecord` failure after successful invoice creation, log the invoice ID prominently for manual recovery.

---

### [LOW] — `dev.ts` query error returns 200 with error field instead of 4xx/5xx

**File:** `src/routes/dev.ts:84-87`
**Category:** correctness
**Description:** The dev query endpoint catches errors and returns status 200 with an `error` field in the body. While this endpoint is blocked in production, returning 200 on error makes it impossible to distinguish success from failure via HTTP status codes in any test harness that checks status codes.

**Recommendation:** Return 500 on internal errors. This is a dev-only route so the fix is low-risk.

---

### [LOW] — `upload.ts` JSON text upload path skips magic byte validation

**File:** `src/routes/upload.ts:112-148`
**Category:** security
**Description:** When the Content-Type is `application/json`, the handler processes the `body.text` field directly and creates a text/plain file. This path does not call `validateMimeTypeByMagicBytes()`. This is reasonable since the content is explicitly a string — but it means an attacker can upload a string that is valid base64-encoded binary content, which the pipeline might later misinterpret. This is a low-risk vector since the pipeline treats all `.txt` files as plain text, but the inconsistency is worth noting.

**Recommendation:** No code change required for this specific path. Document the intentional skip in a comment.

---

### [LOW] — `index.ts` SIGTERM handler does not close Redis connection

**File:** `src/index.ts:255-263`
**Category:** reliability
**Description:** The SIGTERM handler (lines 255-263) closes the pipeline worker, maintenance worker, feedback decay worker, LLM eval worker, and the PostgreSQL pool — but not the Redis connection. ioredis connections are not closed, leaving them in a TIME_WAIT state until the OS reclaims them.

**Recommendation:** Add `await redis.quit()` before `process.exit(0)`.

---

### [LOW] — `metrics.ts` error response leaks raw SQL error message

**File:** `src/routes/metrics.ts:77-79`
**Category:** security
**Description:** The catch block on line 78 returns `e instanceof Error ? e.message : String(e)` directly in the error response. A SQL error will contain the query structure, table names, and column names. While this endpoint requires authentication, it still violates the principle of not leaking internal details in API responses.

**Recommendation:** Log the detailed error server-side and return a generic message: `c.json({ error: "Failed to load metrics." }, 500)`.

---

## Summary Table

| # | Severity | File | Title |
|---|---|---|---|
| 1 | CRITICAL | `src/index.ts` | No global Hono error handler: unhandled rejections return plain text |
| 2 | CRITICAL | `src/routes/query.ts:251` | SSE stream missing `event:` field: protocol non-conformant |
| 3 | CRITICAL | `src/services/llm.ts:106` | `chatStream()` no passthrough fallback on dual provider failure |
| 4 | HIGH | `src/index.ts:72` | `GROQ_API_URL` default is audio transcriptions endpoint, not chat |
| 5 | HIGH | `src/services/llm.ts:295` | Circuit breaker does not track stream-iteration failures |
| 6 | HIGH | `src/routes/documents.ts:21`, `src/routes/status.ts:82` | Share tokens can delete documents (missing `isOwner` check) |
| 7 | HIGH | `src/routes/mcp-remote.ts:461` | MCP upload tools bypass storage limit enforcement |
| 8 | HIGH | `src/services/nli.ts:44` | NLI health check storms during 120s sidecar startup |
| 9 | MEDIUM | `src/index.ts:54` | Redis has no `.on('error')` handler: connection errors crash process |
| 10 | MEDIUM | `src/routes/query.ts:248` | SSE stream has no `cancel` handler: generator runs after disconnect |
| 11 | MEDIUM | `src/routes/feedback.ts:36` | No try/catch around DB writes: SQL errors return plain-text 500 |
| 12 | MEDIUM | `src/routes/mcp-remote.ts:824` | `rename_document` does not sanitize `newName` |
| 13 | MEDIUM | `src/routes/query.ts:152,239` | `vectorStore.initialize()` called per-request: wasteful and not thread-safe |
| 14 | MEDIUM | `src/routes/health.ts:54` | Groq health check is key presence only, not API liveness |
| 15 | MEDIUM | `src/routes/auth-social.ts:116` | Telegram redirect logs raw `hash` parameter |
| 16 | MEDIUM | `src/routes/billing.ts:76` | Unguarded `createInvoice`/`createPaymentRecord`: partial failure leaves orphaned invoice |
| 17 | LOW | `src/routes/dev.ts:86` | Dev query error returns 200 with error field |
| 18 | LOW | `src/routes/upload.ts:112` | JSON text upload path skips magic byte validation (intentional, undocumented) |
| 19 | LOW | `src/index.ts:261` | SIGTERM handler does not close Redis connection |
| 20 | LOW | `src/routes/metrics.ts:78` | Error response leaks raw SQL error message |

---

Relevant files for Mies to action:

- `/c/Users/noadmin/nospace/development/contexter/src/index.ts` — add `app.onError`, Redis `.on('error')`, `redis.quit()` in SIGTERM
- `/c/Users/noadmin/nospace/development/contexter/src/routes/query.ts` — fix `event:` field, add `cancel` handler, singleton vectorStore
- `/c/Users/noadmin/nospace/development/contexter/src/services/llm.ts` — add passthrough fallback to `chatStream`, fix circuit breaker stream tracking
- `/c/Users/noadmin/nospace/development/contexter/src/routes/mcp-remote.ts` — add storage limit check to upload tools, sanitize `newName`
- `/c/Users/noadmin/nospace/development/contexter/src/services/nli.ts` — coalesce concurrent health checks
- `/c/Users/noadmin/nospace/development/contexter/src/routes/documents.ts` — add `isOwner` check to DELETE
- `/c/Users/noadmin/nospace/development/contexter/src/routes/status.ts` — add permission check to DELETE, add try/catch
- `/c/Users/noadmin/nospace/development/contexter/src/routes/feedback.ts` — wrap in try/catch
- `/c/Users/noadmin/nospace/development/contexter/src/routes/billing.ts` — wrap createInvoice/createPaymentRecord in try/catch
- `/c/Users/noadmin/nospace/development/contexter/src/routes/auth-social.ts` — redact hash from log
- `/c/Users/noadmin/nospace/development/contexter/src/routes/health.ts` — add real Groq liveness probe
- `/c/Users/noadmin/nospace/development/contexter/src/routes/metrics.ts` — sanitize error response