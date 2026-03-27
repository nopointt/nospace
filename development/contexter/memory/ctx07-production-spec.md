# CTX-07: Production Hardening Spec

> Consolidated from 12 independent audits (2026-03-27).
> Self-contained: a G3 Player reading ONLY this spec can implement every fix.

---

## Project Context

- **App:** Contexter (RAG-as-a-service)
- **Stack:** Bun + Hono + PostgreSQL + pgvector + Redis + Docling + Caddy
- **Server:** Hetzner CAX11 (ARM64, 2 vCPU, 4 GB RAM), IP: 46.62.220.214
- **Frontend:** SolidJS + Vite on CF Pages (`contexter.cc`)
- **Backend:** `api.contexter.cc` (Caddy -> Bun on port 3000)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Backend root:** `src/` (relative to project root)
- **Frontend root:** `web/src/` (relative to project root)
- **Docker Compose:** `docker-compose.yml` at project root

---

## 1. Issue Registry

### P0 -- Blockers (system non-functional)

#### P0-001: R2 Token Read-Only -- All Uploads Fail
- **Category:** INFRA
- **Description:** R2 API token has read-only permissions. Every `PutObjectCommand` returns 403 AccessDenied. ALL upload paths (HTTP upload, MCP add_context, MCP upload_document) are broken.
- **Files:** Cloudflare R2 Dashboard (not code)
- **Fix:** CF Dashboard -> R2 -> Manage R2 API Tokens -> find token with access key `81d072c68e325ada8d221b68ff6124ee` -> change permissions from "Object Read" to "Object Read & Write".
- **Verification:** `curl -X PUT "https://<R2_ENDPOINT>/<bucket>/test-write" -H "..." --data "test"` returns 200.

#### P0-002: Health Check Hides S3 Write Failure
- **Category:** BUG
- **Description:** `/health` endpoint catches ALL S3 errors (including 403/network) and reports `s3: "ok"`. Write failures are invisible.
- **Files:** `src/routes/health.ts` (lines 32-35)
- **Fix:** Replace the S3 health check. Instead of only HeadObject (which succeeds with read-only), test with `PutObject` of a small test blob, then `DeleteObject`. If PutObject fails, report `s3: "write-failed"`. At minimum, catch only `NotFound` (404) as OK; rethrow other errors.
- **Verification:** With read-only token: `GET /health` returns `s3: "write-failed"`. After fixing P0-001: returns `s3: "ok"`.

#### P0-003: Docling Endpoint Path Wrong -- All Document Parsing Fails
- **Category:** BUG
- **Description:** `DoclingParser` calls `/api/v1/convert/file` but Docling-serve 1.15.0 API is at `/v1/convert/file` (no `/api` prefix). All Docling parse calls 404.
- **Files:** `src/services/parsers/docling.ts` (line ~37)
- **Fix:** Change `${this.doclingUrl}/api/v1/convert/file` to `${this.doclingUrl}/v1/convert/file`.
- **Verification:** `curl -X POST http://localhost:5001/v1/convert/file -F "files=@test.pdf"` returns `{"document":{"md_content":"..."},"status":"success"}`.

#### P0-004: GET /api/auth/shares Crashes Frontend
- **Category:** COMPATIBILITY
- **Description:** Backend returns `{ shareId, mcpUrl, createdAt }` but frontend reads `{ id, share_token, created_at }`. `share.share_token.slice(0,12)` throws TypeError. Frontend shares page is completely broken.
- **Files:** `src/routes/auth.ts` (lines 153-161), `web/src/pages/ApiPage.tsx` (lines 489-510)
- **Fix (backend -- preferred):** Change the shares map to return `id` (not `shareId`), add `share_token` field, use `created_at` (not `createdAt`):
  ```typescript
  shares: shares.map((s) => ({
    id: s.id,
    share_token: s.share_token,   // ADD this field
    scope: ...,
    permission: ...,
    expires_at: s.expires_at,
    created_at: s.created_at,     // snake_case
    mcpUrl: ...,                  // keep for MCP clients
  }))
  ```
- **Verification:** `GET /api/auth/shares` with valid token returns objects containing `id`, `share_token`, `created_at` fields.

#### P0-005: Frontend Hardcoded API URLs to Old CF Workers
- **Category:** COMPATIBILITY
- **Description:** 5 frontend files hardcode `https://contexter.nopoint.workers.dev` as API base. All API calls from these components hit the dead old endpoint.
- **Files:**
  - `web/src/components/ConnectionModal.tsx` (line 106)
  - `web/src/pages/Hero.tsx` (line 60)
  - `web/src/pages/ApiPage.tsx` (lines 9, 40)
  - `web/src/pages/Settings.tsx` (line 9)
  - `web/src/pages/Dashboard.tsx` (lines 244, 260)
- **Fix:** In every file, replace the hardcoded `API_BASE` constant with:
  ```typescript
  import { API_BASE } from "../lib/api";
  ```
  Export `API_BASE` from `web/src/lib/api.ts` (it already has the correct `import.meta.env.VITE_API_URL || "https://api.contexter.cc"` pattern). Also update the default fallback in `api.ts` from `contexter.nopoint.workers.dev` to `https://api.contexter.cc`. For `ApiPage.tsx` line 40, the hardcoded URL inside the `mcpConfigJson` string literal must use template interpolation with `API_BASE`.
- **Verification:** Build frontend (`bun run build`). Search output JS bundle for `contexter.nopoint.workers.dev` -- zero matches.

---

### P1 -- Critical (security vulnerabilities, data corruption)

#### P1-001: /dev Route Has No Auth -- Full Data Access
- **Category:** SECURITY
- **Description:** `/dev/pipeline` and `/dev/query` have zero authentication. `/dev/query` calls `rag.query()` without userId filter -- searches ALL users' documents. `/dev/pipeline` processes files with no userId bound.
- **Files:** `src/routes/dev.ts` (lines 21-78)
- **Fix:** Add environment guard at the top of the dev route:
  ```typescript
  dev.use("*", async (c, next) => {
    if (c.get("env").ENVIRONMENT !== "development") {
      return c.json({ error: "Dev routes disabled in production" }, 403);
    }
    await next();
  });
  ```
- **Verification:** `GET /dev/debug-env` on production returns 403.

#### P1-002: Registration Returns Existing User's API Token to Anyone
- **Category:** SECURITY
- **Description:** When an email is already registered, `/api/auth/register` returns the full plaintext API token to any requester who knows the email. Token harvesting by guessing emails.
- **Files:** `src/routes/auth.ts` (lines 49-63)
- **Fix:** For existing users, return a generic message without the token:
  ```typescript
  return c.json({ note: "email already registered", userId: existingUser.id }, 200);
  ```
  Remove `apiToken`, `mcpUrl`, `apiBase` from the existing-user response.
- **Verification:** `POST /api/auth/register` with an existing email returns 200 without `apiToken` field.

#### P1-003: MCP search_knowledge Ignores User Scope
- **Category:** SECURITY
- **Description:** MCP `search_knowledge` tool calls `rag.query()` with no userId filter and no scope check. Returns answers from ALL users' documents.
- **Files:** `src/routes/mcp-remote.ts` (search_knowledge case)
- **Fix:** Pass `userId: authCtx.userId` to `rag.query()` and apply the same scope filtering as `src/routes/query.ts`:
  ```typescript
  const result = await rag.query(query, {
    topK: topK ?? 5,
    userId: authCtx.userId,
  });
  // Filter sources by scope
  if (authCtx.scope !== "all") {
    result.sources = result.sources.filter(
      (s) => authCtx.scope.includes(s.documentId)
    );
  }
  ```
- **Verification:** Create two users with different documents. MCP search_knowledge as User A returns only User A's documents.

#### P1-004: PKCE plain Method Accepted -- OAuth Bypass
- **Category:** SECURITY
- **Description:** `verifyPkce()` accepts `code_challenge_method=plain`, sending raw verifier as challenge. RFC 9700 (OAuth 2.1) forbids `plain`.
- **Files:** `src/routes/oauth.ts` (verifyPkce function)
- **Fix:** Reject any method other than `S256`:
  ```typescript
  function verifyPkce(verifier: string, challenge: string, method: string): boolean {
    if (method !== "S256") return false;
    // ...existing S256 logic
  }
  ```
- **Verification:** OAuth token exchange with `code_challenge_method=plain` returns error.

#### P1-005: OAuth Client Registration Unlimited and Unauthenticated
- **Category:** SECURITY
- **Description:** `/register` (RFC 7591) and MCP `client/register` accept unlimited registrations from any source. Redis flooding with 24h TTL entries.
- **Files:** `src/routes/oauth.ts` (register handler), `src/routes/mcp-remote.ts` (handleClientRegister)
- **Fix:** Add IP-based rate limiting (max 10 registrations per IP per hour) using Redis:
  ```typescript
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For")?.split(",")[0] || "unknown";
  const key = `rate:client_reg:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  if (count > 10) return c.json({ error: "rate_limit_exceeded" }, 429);
  ```
- **Verification:** 11th client registration from same IP within 1 hour returns 429.

#### P1-006: No Host Firewall (ufw Inactive)
- **Category:** INFRA / SECURITY
- **Description:** No host-level firewall. Protection relies entirely on Docker not publishing ports. Accidental `ports:` in compose = instant internet exposure.
- **Files:** Server config (not code)
- **Fix:** `ufw allow 22,80,443/tcp && ufw enable`
- **Verification:** `ufw status` shows active with rules for 22, 80, 443.

#### P1-007: Redis Has No Password
- **Category:** SECURITY
- **Description:** Redis `requirepass` is empty. Anyone on the Docker bridge network can read/write all OAuth tokens, rate limits, etc.
- **Files:** `docker-compose.yml` (redis service), `.env`
- **Fix:** Add `command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--maxmemory", "64mb", "--maxmemory-policy", "allkeys-lru"]` to docker-compose redis service. Set `REDIS_PASSWORD=<generated>` in `.env`. Update `REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379` in `.env`.
- **Verification:** `redis-cli -h redis PING` returns `(error) NOAUTH`. `redis-cli -h redis -a <password> PING` returns `PONG`.

#### P1-008: Bigint COUNT(*) Returns String -- Arithmetic Bug in pipeline.ts
- **Category:** BUG
- **Description:** PostgreSQL `COUNT(*)` returns bigint, which postgres.js serializes as a string. In `pipeline.ts` line 42, `stuckResult.reduce((sum, r) => sum + r.count, 0)` does string concatenation instead of addition (e.g., `"032"` instead of `5`). Same issue in 6+ other files.
- **Files:**
  - `src/routes/pipeline.ts` (lines 26, 34, 42) -- **arithmetic bug**
  - `src/routes/query.ts` (line 38)
  - `src/routes/status.ts` (lines 37, 85)
  - `src/routes/dev.ts` (lines 96-97)
  - `src/routes/mcp-remote.ts` (lines 340, 607, 611)
- **Fix:** Cast COUNT to integer in SQL everywhere: `COUNT(*)::int as count`. Search all `.ts` files for `COUNT(*)` and add `::int` cast. This is safe for counts under 2 billion.
- **Verification:** `GET /api/status` returns `chunks` as a number (not a string). `typeof response.documents[0].chunks === "number"`.

#### P1-009: OAuth /token Response Bypasses Hono CORS
- **Category:** BUG
- **Description:** `oauth.ts` line 197 uses `Response.json()` instead of `c.json()`. This bypasses Hono middleware chain including CORS headers. Browser-based OAuth flows break.
- **Files:** `src/routes/oauth.ts` (lines 197-201, 226-228)
- **Fix:** Replace all `Response.json(...)` with `c.json(...)` and all `new Response(...)` returns with Hono context methods. Also replace `tokenError()` function to use `c.json()`.
- **Verification:** `POST /token` response headers include `Access-Control-Allow-Origin`.

#### P1-010: mcp.ts Uses CF Workers Bindings Pattern
- **Category:** BUG
- **Description:** `mcp.ts` uses `Hono<{ Bindings: Env }>` (CF Workers pattern) instead of `Hono<AppEnv>`. The route has no access to `sql`, `env`, or `redis` injected via middleware.
- **Files:** `src/routes/mcp.ts` (line 7)
- **Fix:** Either delete `mcp.ts` entirely (it's a legacy scaffold) and remove the `app.route("/mcp", mcp)` line from `index.ts`, or update to `Hono<{ Variables: { sql: Sql; env: Env; redis: Redis } }>`.
- **Verification:** After removal: `GET /mcp` returns 404. If kept: `GET /mcp/tools` returns valid tool list.

#### P1-011: pipeline.ts resumePipelineFromStage Omits userId in Vector Metadata
- **Category:** BUG
- **Description:** `resumePipelineFromStage` creates `VectorRecord[]` without `userId` in metadata (line ~375), while normal pipeline includes it (line ~186). Retried documents have broken user scoping in vector search.
- **Files:** `src/services/pipeline.ts` (line ~373-376)
- **Fix:** Add `userId` to the metadata in `resumePipelineFromStage`:
  ```typescript
  metadata: { documentId: doc.id, userId: doc.user_id, source: chunk.metadata?.source }
  ```
- **Verification:** Retry a document. Query its chunks in PG: `SELECT metadata FROM chunks WHERE document_id = '<id>'` -- all rows have `userId` set.

#### P1-012: MIME Type Fully Trusted from Client
- **Category:** SECURITY
- **Description:** `resolveMimeType()` returns browser-supplied `file.type` as-is. Attacker can upload HTML/SVG with wrong MIME type.
- **Files:** `src/routes/upload.ts` (resolveMimeType function)
- **Fix:** Add magic byte validation using the `file-type` npm package:
  ```typescript
  import { fileTypeFromBuffer } from "file-type";
  const detected = await fileTypeFromBuffer(buffer);
  if (detected && detected.mime !== clientMime) {
    mimeType = detected.mime; // trust magic bytes over client
  }
  ```
  Also strip `text/html` and `image/svg+xml` from accepted MIME types unless sanitized.
- **Verification:** Upload a file with `Content-Type: text/plain` but containing `<script>` tag. Verify it's rejected or classified as HTML.

#### P1-013: auth.ts expires_at Cast to String -- Expired Tokens May Be Valid
- **Category:** BUG
- **Description:** `new Date(share.expires_at as string)` in auth service. postgres.js returns Date objects, not strings. If it ever returns a Date, the `as string` cast produces `new Date("[object Object]")` = `Invalid Date`, which always fails the `<` comparison, meaning ALL expired share tokens appear valid.
- **Files:** `src/services/auth.ts` (line ~59)
- **Fix:** Remove the cast:
  ```typescript
  const expiresAt = share.expires_at instanceof Date ? share.expires_at : new Date(share.expires_at);
  if (expiresAt < new Date()) return null;
  ```
- **Verification:** Create a share with 1-second expiry. Wait 2 seconds. Use share token. Returns 401.

---

### P2 -- High (significant bugs, major UX issues)

#### P2-001: Missing DELETE /api/status/:documentId Route
- **Category:** COMPATIBILITY
- **Description:** Frontend calls `DELETE /api/status/:id` to delete documents. Route doesn't exist in new backend.
- **Files:** `src/routes/status.ts`
- **Fix:** Add DELETE handler:
  ```typescript
  status.delete("/:documentId", async (c) => {
    const sql = c.get("sql");
    const auth = await resolveAuth(sql, c.req);
    if (!auth) return c.json({ error: "Unauthorized" }, 401);
    const { documentId } = c.req.param();
    const result = await sql`DELETE FROM documents WHERE id = ${documentId} AND user_id = ${auth.userId}`;
    if (result.count === 0) return c.json({ error: "Document not found" }, 404);
    return c.json({ success: true });
  });
  ```
- **Verification:** `DELETE /api/status/<docId>` with valid token returns `{ success: true }` and document is removed from DB.

#### P2-002: Missing DELETE /api/documents (Bulk Delete)
- **Category:** COMPATIBILITY
- **Description:** Frontend Settings page calls `DELETE /api/documents` to delete all data. Route doesn't exist.
- **Files:** `src/routes/documents.ts`
- **Fix:** Add DELETE handler:
  ```typescript
  documents.delete("/", async (c) => {
    const sql = c.get("sql");
    const auth = await resolveAuth(sql, c.req);
    if (!auth) return c.json({ error: "Unauthorized" }, 401);
    const result = await sql`DELETE FROM documents WHERE user_id = ${auth.userId}`;
    return c.json({ success: true, deleted: result.count });
  });
  ```
- **Verification:** `DELETE /api/documents` with valid token returns `{ success: true }`. `GET /api/status` returns empty list.

#### P2-003: Sequential Chunk INSERT + UPDATE -- N+1 Performance Bug
- **Category:** PERFORMANCE
- **Description:** Pipeline inserts chunks one-by-one in a `for` loop (~200 round-trips for a typical document), then `upsertEmbeddings` updates each one individually (~200 more). Total: ~400 SQL queries per document.
- **Files:**
  - `src/services/pipeline.ts` (lines ~257-264) -- sequential INSERT
  - `src/services/vectorstore/vector.ts` (lines ~18-25) -- sequential UPDATE
- **Fix for INSERT (pipeline.ts):** Batch insert chunks:
  ```typescript
  if (chunks.length > 0) {
    await sql`
      INSERT INTO chunks ${sql(chunks.map(chunk => ({
        id: chunk.id,
        document_id: documentId,
        content: chunk.content,
        metadata: JSON.stringify(chunk.metadata),
        token_count: chunk.tokenCount,
      })))}
    `;
  }
  ```
  **Fix for UPDATE (vector.ts):** Batch upsert embeddings:
  ```typescript
  async upsertEmbeddings(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;
    const values = records.map(r => ({
      id: r.id,
      embedding: `[${r.values.join(",")}]`,
    }));
    await this.sql`
      UPDATE chunks SET embedding = v.embedding::vector
      FROM (SELECT * FROM unnest(
        ${this.sql.array(values.map(v => v.id))}::text[],
        ${this.sql.array(values.map(v => v.embedding))}::text[]
      ) AS t(id, embedding)) v
      WHERE chunks.id = v.id
    `;
  }
  ```
- **Verification:** Upload a document with 100+ chunks. Check PG logs -- should see 1-2 batch queries instead of 200+.

#### P2-004: Sequential Embed Batches -- Jina API Calls Not Parallelized
- **Category:** PERFORMANCE
- **Description:** `embedBatch` calls Jina API sequentially in a `for` loop. For 5 batches at 300ms each = 1.5s that could be 300ms.
- **Files:** `src/services/embedder/index.ts`
- **Fix:** Replace sequential loop with parallel:
  ```typescript
  const batchPromises = [];
  for (let i = 0; i < texts.length; i += JINA_MAX_BATCH) {
    const batch = texts.slice(i, i + JINA_MAX_BATCH);
    batchPromises.push(this.embedSingle(batch));
  }
  const results = await Promise.all(batchPromises);
  return results.flat();
  ```
- **Verification:** Upload a large document. Observe embed stage duration reduced by 3-5x.

#### P2-005: Missing PG Indexes on High-Traffic Columns
- **Category:** PERFORMANCE
- **Description:** No indexes on `documents.user_id`, `documents.status`, `jobs.user_id`, `jobs.status`. All user-scoped queries do sequential scans.
- **Files:** `src/db/schema.ts`, migration SQL
- **Fix:** Create a new migration file:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_user_id_status ON jobs(user_id, status);
  ```
- **Verification:** `\di documents*` in psql shows new indexes. `EXPLAIN SELECT * FROM documents WHERE user_id = 'x'` shows Index Scan.

#### P2-006: Docling OOM Risk Under Load
- **Category:** PERFORMANCE
- **Description:** Docling uses 1.04 GiB at idle / 2 GiB limit. 2 workers each load separate model copies. Two concurrent PDFs can OOM-kill the container.
- **Files:** `docker-compose.yml` (docling service env)
- **Fix:** Add to docling environment in docker-compose:
  ```yaml
  DOCLING_SERVE_ENG_LOC_SHARE_MODELS: "true"
  DOCLING_SERVE_ENG_LOC_NUM_WORKERS: "1"
  OMP_NUM_THREADS: "2"
  ```
  This shares model weights (saves ~500-800 MB), uses 1 worker (safe for 2 vCPU), and sets OMP threads to match physical CPU count.
- **Verification:** After restart: `docker stats docling` shows RSS < 1.5 GiB. Upload 2 PDFs concurrently -- no OOM.

#### P2-007: Docling Fetch Has No Timeout
- **Category:** BUG
- **Description:** `docling.ts` fetch to Docling has no AbortSignal timeout. If Docling hangs (not connection refused, but TCP-level stall), the fetch blocks indefinitely. The outer 120s pipeline timeout eventually catches it, but 120s is too long.
- **Files:** `src/services/parsers/docling.ts` (line ~37)
- **Fix:** Add `AbortSignal.timeout(90_000)` to the fetch:
  ```typescript
  const res = await fetch(`${this.doclingUrl}/v1/convert/file`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(90_000),
  });
  ```
- **Verification:** Block Docling port with iptables temporarily. Upload triggers timeout after 90s, not 120s.

#### P2-008: Redis Failure Causes Unhandled 500s + Rate Limit Bypass
- **Category:** BUG
- **Description:** No try/catch around Redis calls. If Redis is down: registration throws 500 with raw ioredis error message, rate limiting is completely bypassed, OAuth flows crash.
- **Files:** `src/routes/auth.ts` (lines ~69-73), `src/routes/oauth.ts`
- **Fix:** Wrap all Redis operations in try/catch. For rate limiting, fail-open (allow the request but log the error):
  ```typescript
  let isRateLimited = false;
  try {
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, 60);
    isRateLimited = count > 5;
  } catch (e) {
    console.error("Redis rate limit check failed, allowing request:", e);
  }
  ```
- **Verification:** Stop Redis container. `POST /api/auth/register` returns 201 (not 500).

#### P2-009: Groq LLM Calls Have No Retry Logic
- **Category:** BUG
- **Description:** `LlmService.chat()` has zero retry logic. A transient 429 from Groq immediately fails the query, returning 500 to the user. Jina embedder has retry; LLM does not.
- **Files:** `src/services/llm.ts` (lines ~28-44)
- **Fix:** Add retry with exponential backoff (same pattern as embedder):
  ```typescript
  const MAX_RETRIES = 3;
  const BACKOFF = [1000, 2000, 4000];
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(...);
    if (response.status === 429 && attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, BACKOFF[attempt]));
      continue;
    }
    if (!response.ok) throw new Error(`Groq API error ${response.status}`);
    // ...process response
  }
  ```
- **Verification:** Mock Groq returning 429 twice then 200. Query succeeds.

#### P2-010: Frontend Shares Response Type Mismatch (POST /api/auth/share)
- **Category:** COMPATIBILITY
- **Description:** Backend returns `mcpUrl` but frontend types expect `shareUrl`. Not a crash (frontend doesn't use `shareUrl`), but TypeScript contract is violated.
- **Files:** `src/routes/auth.ts` (lines 124-131)
- **Fix:** Add `shareUrl` as an alias:
  ```typescript
  return c.json({
    shareId,
    shareToken,
    shareUrl: `${env.BASE_URL}/sse?share=${shareToken}`,
    mcpUrl: `${env.BASE_URL}/sse?share=${shareToken}`,
    // ...
  }, 201);
  ```
- **Verification:** `POST /api/auth/share` response contains both `shareUrl` and `mcpUrl`.

#### P2-011: DELETE /api/auth/shares/:id Returns Wrong Shape
- **Category:** COMPATIBILITY
- **Description:** Backend returns `{ deleted: shareId }` but frontend types `{ success: boolean }`. No crash (frontend ignores body), but contract violated.
- **Files:** `src/routes/auth.ts` (line 183)
- **Fix:** `return c.json({ success: true, deleted: shareId });`
- **Verification:** `DELETE /api/auth/shares/<id>` response contains `success: true`.

#### P2-012: POST /api/query Sources Missing document_name
- **Category:** COMPATIBILITY
- **Description:** Backend returns sources without `document_name` field. Frontend shows raw documentId (e.g., `a3f2c1b9`) instead of filename.
- **Files:** `src/routes/query.ts` (lines 62-65)
- **Fix:** Join documents table to get filename:
  ```typescript
  // After getting filteredSources, enrich with document names
  const docIds = [...new Set(filteredSources.map(s => s.documentId))];
  const docs = docIds.length > 0
    ? await sql`SELECT id, file_name FROM documents WHERE id = ANY(${docIds})`
    : [];
  const nameMap = Object.fromEntries(docs.map(d => [d.id, d.file_name]));

  sources: filteredSources.map((s) => ({
    documentId: s.documentId,
    document_name: nameMap[s.documentId] ?? s.documentId,
    content: s.content,
    score: s.score,
    source: s.source,
  }))
  ```
- **Verification:** `POST /api/query` with a query that has results returns sources with `document_name` as the original filename.

#### P2-013: Mobile Layout Overflow
- **Category:** UX
- **Description:** Dashboard uses fixed `padding: "32px 64px"` with no responsive breakpoints. ConnectionModal has `width: 560px` with no `max-width`. On mobile screens, content overflows.
- **Files:**
  - `web/src/pages/Dashboard.tsx` (lines 283-291)
  - `web/src/components/ConnectionModal.tsx` (lines 370-374)
  - `web/src/pages/DocumentViewer.tsx` (lines 93-95)
  - `web/src/components/DocumentModal.tsx` (lines 98-102)
- **Fix:** Add responsive styles:
  ```typescript
  // Dashboard
  padding: "32px max(16px, min(64px, 5vw))"

  // ConnectionModal
  width: "min(560px, 95vw)"

  // DocumentModal
  width: "min(720px, 95vw)"
  ```
- **Verification:** Open `contexter.cc` on a 375px-wide viewport. No horizontal scrollbar.

#### P2-014: OAuth Code Stores Full apiToken in Redis
- **Category:** SECURITY
- **Description:** Authorization code payload in Redis includes `apiToken: user.api_token` in plaintext. Redis has no password (P1-007). If Redis is exposed, all tokens are trivially extractable.
- **Files:** `src/routes/oauth.ts` (code storage)
- **Fix:** Store only `userId` in the code payload. At token exchange time, fetch the token from DB:
  ```typescript
  // In code storage:
  await redis.setex(`oauth:code:${code}`, 60, JSON.stringify({ userId: user.id, scope, codeChallenge, ... }));
  // In token exchange:
  const user = await sql`SELECT api_token FROM users WHERE id = ${codeData.userId}`;
  ```
- **Verification:** `redis-cli GET oauth:code:*` shows `userId` but NOT `apiToken`.

#### P2-015: PG Connection Pool No Timeouts
- **Category:** BUG
- **Description:** postgres.js pool has no `idle_timeout` or `connect_timeout`. Stalled connections hold slots indefinitely. Pool of 10 can saturate under load.
- **Files:** `src/db/connection.ts` (lines ~10-14), `src/index.ts` (line ~21)
- **Fix:** Add timeouts to postgres config:
  ```typescript
  const sql = postgres(url, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  ```
- **Verification:** Kill a PG connection from server side. After 30s, the pool recycles the slot.

#### P2-016: JSON.parse(scope) No Try/Catch
- **Category:** BUG
- **Description:** Two locations parse `scope` from DB with no error handling. Malformed JSON crashes with 500.
- **Files:** `src/routes/auth.ts` (line 156), `src/services/auth.ts` (line ~63)
- **Fix:** Wrap in try/catch:
  ```typescript
  let parsedScope: string[];
  try {
    parsedScope = s.scope === "all" ? ["all"] : JSON.parse(s.scope);
  } catch {
    parsedScope = ["all"]; // fallback
  }
  ```
- **Verification:** Insert a share with invalid JSON in scope column. `GET /api/auth/shares` returns 200 (not 500).

#### P2-017: Rate Limit Uses X-Forwarded-For (Spoofable Behind CF)
- **Category:** SECURITY
- **Description:** Rate limiting keys on `X-Forwarded-For` which is trivially spoofable when Cloudflare is in front. Should use `CF-Connecting-IP`.
- **Files:** `src/routes/auth.ts` (rate limit logic)
- **Fix:** Change IP extraction:
  ```typescript
  const ip = c.req.header("CF-Connecting-IP")
    || c.req.header("X-Real-IP")
    || c.req.header("X-Forwarded-For")?.split(",").pop()?.trim()
    || "unknown";
  ```
- **Verification:** Send request with spoofed `X-Forwarded-For: 1.2.3.4` header. Rate limit tracks the real IP, not the spoofed one.

#### P2-018: MCP redirect_uri No Validation
- **Category:** SECURITY
- **Description:** `handleClientRegister` accepts any `redirectUris` with no validation. Attacker can register `http://attacker.com/cb` and redirect victim tokens there.
- **Files:** `src/routes/mcp-remote.ts` (handleClientRegister), `src/routes/oauth.ts` (register)
- **Fix:** Validate redirect URIs:
  ```typescript
  for (const uri of redirectUris) {
    const parsed = new URL(uri);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      return { error: "invalid_redirect_uri", error_description: "Only HTTPS redirect URIs allowed" };
    }
  }
  ```
- **Verification:** Register client with `http://evil.com/cb`. Returns error.

---

### P3 -- Medium (improvements, degraded UX)

#### P3-001: Frontend API Error Body Parsing
- **Category:** UX
- **Description:** `api.ts` throws `new Error(text)` where `text` may be raw JSON like `{"error":"..."}`. Toast shows raw JSON.
- **Files:** `web/src/lib/api.ts` (lines 35-36)
- **Fix:**
  ```typescript
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try { const json = JSON.parse(text); message = json.error || json.message || text; } catch {}
    throw new Error(message || `Error ${res.status}`);
  }
  ```
- **Verification:** Backend returns `{"error":"quota exceeded"}`. Toast shows "quota exceeded" not raw JSON.

#### P3-002: Dashboard Delete Uses Raw Fetch (Bypasses 401 Handler)
- **Category:** BUG
- **Description:** `handleDelete` in Dashboard uses raw `fetch()` bypassing `api.ts` wrapper. No 401 auto-logout.
- **Files:** `web/src/pages/Dashboard.tsx` (lines 236-257)
- **Fix:** Replace raw `fetch` with `api()` from `../lib/api`:
  ```typescript
  const result = await api<{ success: boolean }>(
    `/api/status/${id}`,
    { method: "DELETE", token: auth.apiToken }
  );
  ```
- **Verification:** Delete document with expired token. User is redirected to login.

#### P3-003: Dead Code Files (CF Workers Parsers)
- **Category:** BUG
- **Description:** `parsers/tomarkdown.ts` and `parsers/pdf-visual.ts` use CF Workers `Ai` type. Not imported anywhere. Confusing dead code.
- **Files:** `src/services/parsers/tomarkdown.ts`, `src/services/parsers/pdf-visual.ts`
- **Fix:** Move to `src/services/parsers/_archive/` directory.
- **Verification:** `import` search finds no references to these files.

#### P3-004: LLM Empty Response Silently Returns Empty String
- **Category:** BUG
- **Description:** If Groq returns 200 but empty `choices` array (content filtering), response is silently empty with no warning.
- **Files:** `src/services/llm.ts` (line ~50)
- **Fix:** Check for empty choices and log:
  ```typescript
  if (!data.choices?.length) {
    console.warn("Groq returned empty choices -- possible content filtering");
    return "";
  }
  ```
- **Verification:** Query returns empty answer -- server logs show warning.

#### P3-005: PG Not Tuned for NVMe
- **Category:** PERFORMANCE
- **Description:** Default PG settings optimized for spinning disks. `shared_buffers=128MB`, `work_mem=4MB`, `random_page_cost=4`, `effective_io_concurrency=1`.
- **Files:** `docker-compose.yml` (postgres service)
- **Fix:** Add PG command with tuned settings:
  ```yaml
  command: >
    postgres
    -c shared_buffers=512MB
    -c work_mem=32MB
    -c random_page_cost=1.1
    -c effective_io_concurrency=200
    -c maintenance_work_mem=128MB
  ```
- **Verification:** `SHOW shared_buffers;` returns `512MB`.

#### P3-006: CORS Wildcard on All Routes
- **Category:** SECURITY
- **Description:** `cors()` with no options applies `Access-Control-Allow-Origin: *` globally. Any website can call authenticated endpoints using query-param token auth.
- **Files:** `src/index.ts` (line 53)
- **Fix:** Configure CORS with specific origin:
  ```typescript
  app.use("*", cors({
    origin: ["https://contexter.cc", "https://www.contexter.cc"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }));
  ```
- **Verification:** `OPTIONS /api/status` from `evil.com` origin returns no CORS headers.

#### P3-007: Caddy Uses Self-Signed TLS
- **Category:** INFRA
- **Description:** `tls internal` generates self-signed cert. Works with CF Flexible/Full SSL but breaks with Full-Strict.
- **Files:** `Caddyfile`
- **Fix:** Change `tls internal` to `tls` (ACME/Let's Encrypt). Caddy auto-manages certs. Or if staying behind CF proxy, keep internal but document the CF SSL mode requirement.
- **Verification:** `curl -v https://api.contexter.cc` shows valid Let's Encrypt cert (or CF cert).

#### P3-008: Jina Embed API Non-429 Errors Not Retried
- **Category:** BUG
- **Description:** Only 429 errors trigger retry in embedder. A transient 500/503 from Jina permanently fails the pipeline.
- **Files:** `src/services/embedder/index.ts` (lines ~95-100)
- **Fix:** Extend retry to include 500, 502, 503:
  ```typescript
  if ([429, 500, 502, 503].includes(response.status) && attempt < MAX_RETRIES) {
    await new Promise(r => setTimeout(r, BACKOFF[attempt]));
    continue;
  }
  ```
- **Verification:** Mock Jina returning 503 once then 200. Embedding succeeds.

#### P3-009: TextParser Claims to Handle ODS
- **Category:** BUG
- **Description:** ODS (OpenDocument Spreadsheet) is a ZIP-based format listed in TextParser's MIME types. `TextDecoder` produces garbage on binary ZIP content.
- **Files:** `src/services/parsers/docling.ts` (line ~74 in TextParser)
- **Fix:** Move `application/vnd.oasis.opendocument.spreadsheet` from TextParser to DoclingParser's format list.
- **Verification:** Upload a `.ods` file. Parsed by Docling, not TextParser.

#### P3-010: Observability -- No Structured Request Logging
- **Category:** OBSERVABILITY
- **Description:** Zero HTTP access logging. No request IDs. Cannot correlate errors with requests.
- **Files:** `src/index.ts`
- **Fix:** Add Hono middleware:
  ```typescript
  app.use("*", async (c, next) => {
    const requestId = crypto.randomUUID().slice(0, 8);
    c.set("requestId", requestId);
    const start = performance.now();
    await next();
    const duration = Math.round(performance.now() - start);
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      rid: requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: duration,
    }));
  });
  ```
- **Verification:** Any API request produces a JSON log line with `rid`, `method`, `path`, `status`, `ms`.

#### P3-011: Observability -- No Caddy Access Log
- **Category:** OBSERVABILITY
- **Description:** Caddy HTTPS terminator is silent. No request volume visibility.
- **Files:** `Caddyfile`
- **Fix:** Add to Caddyfile:
  ```
  log {
    output stdout
    format json
  }
  ```
- **Verification:** `docker logs caddy-1` shows JSON access log entries.

#### P3-012: Observability -- Docker Log Rotation Not Configured
- **Category:** OBSERVABILITY
- **Description:** Logs use Docker daemon defaults. Unknown retention policy.
- **Files:** `docker-compose.yml`
- **Fix:** Add logging config to each service:
  ```yaml
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "5"
  ```
- **Verification:** `docker inspect --format '{{.HostConfig.LogConfig}}' contexter-app-1` shows json-file with max-size.

#### P3-013: userId Only 8 Hex Chars (Collision Risk)
- **Category:** SECURITY
- **Description:** `crypto.randomUUID().slice(0, 8)` produces only ~4 billion values. Same pattern for documentId and shareId.
- **Files:** `src/routes/auth.ts` (register), `src/routes/upload.ts`, `src/routes/auth.ts` (share)
- **Fix:** Use 16 chars: `.slice(0, 16)` for 2^64 space, or use full UUID.
- **Verification:** New registrations produce 16-char IDs.

#### P3-014: Pipeline buffer.buffer as ArrayBuffer -- Unsafe Slice
- **Category:** BUG
- **Description:** `transformToByteArray()` returns a `Uint8Array`. `buffer.buffer` may be larger than the typed array view. Using it as-is can include extra bytes.
- **Files:** `src/services/pipeline.ts` (line ~316)
- **Fix:**
  ```typescript
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  ```
- **Verification:** Upload a file via retry path. Compare parsed content with direct upload -- identical.

#### P3-015: Env Vars Not Validated at Startup
- **Category:** INFRA
- **Description:** `DATABASE_URL!` (non-null assertion). Missing env vars crash with raw stack trace.
- **Files:** `src/index.ts`
- **Fix:** Add startup validation:
  ```typescript
  const REQUIRED_ENV = ["DATABASE_URL", "R2_ENDPOINT", "R2_ACCESS_KEY", "R2_SECRET_KEY", "JINA_API_KEY", "GROQ_API_KEY"];
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      console.error(`Missing required env var: ${key}`);
      process.exit(1);
    }
  }
  ```
- **Verification:** Start app without `GROQ_API_KEY`. Clean error message, exit code 1.

---

### P4 -- Low (nice-to-have, cosmetic)

#### P4-001: FTS sanitizeFtsQuery Drops CJK/Arabic/Hebrew
- **Category:** BUG
- **Description:** Regex strips all non-Latin/Cyrillic characters. CJK document content is unsearchable via FTS.
- **Files:** `src/services/vectorstore/fts.ts`
- **Fix:** Remove the manual regex or expand to include Unicode Letter class: `/[^\p{L}\p{N}\s]/gu`.
- **Verification:** Search for a Chinese term returns FTS results.

#### P4-002: Duplicated streamToBuffer Utility
- **Category:** BUG
- **Description:** Same function defined in `docling.ts`, `audio.ts`, `youtube.ts`, and dead files.
- **Files:** `src/services/parsers/docling.ts`, `audio.ts`, `youtube.ts`
- **Fix:** Extract to `src/services/parsers/utils.ts` and import.
- **Verification:** `grep -r "streamToBuffer" src/` shows only one definition.

#### P4-003: YouTube Parser Fragile HTML Scraping
- **Category:** BUG
- **Description:** Regex scraping of YouTube page breaks when YouTube changes HTML format.
- **Files:** `src/services/parsers/youtube.ts` (line ~72)
- **Fix:** Accept as known limitation. Add fallback error message: "YouTube caption extraction failed -- please upload a transcript directly."
- **Verification:** N/A (fragility is inherent).

#### P4-004: db/schema.ts r2_key Column Name
- **Category:** BUG
- **Description:** Column named `r2_key` references old Cloudflare R2. Now using S3-compatible storage.
- **Files:** `src/db/schema.ts` (line ~32)
- **Fix:** Rename to `storage_key` via migration. Low priority -- cosmetic.
- **Verification:** `\d documents` shows `storage_key` column.

#### P4-005: RAG Token Estimation ~30% Undercount
- **Category:** PERFORMANCE
- **Description:** Token counter uses ~1 token per word. English averages ~1.3 tokens/word. Context may exceed budget.
- **Files:** `src/services/rag/context.ts` (line ~44)
- **Fix:** Change multiplier from 1.0 to 1.3: `Math.ceil(text.split(/\s+/).length * 1.3)`.
- **Verification:** Context stays within token budget for long documents.

#### P4-006: db/connection.ts Pool Size Hardcoded
- **Category:** INFRA
- **Description:** `max: 10` hardcoded. Should be configurable.
- **Files:** `src/db/connection.ts`
- **Fix:** `max: parseInt(process.env.PG_POOL_MAX || "10", 10)`
- **Verification:** Set `PG_POOL_MAX=20` in env. Verify with `SHOW max_connections;` approach.

#### P4-007: Embedder outdated CF Workers comment
- **Category:** BUG
- **Description:** Comment references "CF Workers 30s wall clock" but code runs on Bun.
- **Files:** `src/services/embedder/index.ts` (line ~70)
- **Fix:** Update comment to remove CF Workers reference.
- **Verification:** Code review.

#### P4-008: LLM Base URL Hardcoded
- **Category:** INFRA
- **Description:** Groq LLM base URL hardcoded in `llm.ts`. Not configurable from env.
- **Files:** `src/services/llm.ts` (line ~25)
- **Fix:** `const baseUrl = env.GROQ_LLM_URL || "https://api.groq.com/openai/v1";`
- **Verification:** Set `GROQ_LLM_URL` in env. LLM calls use new URL.

#### P4-009: Registration Accepts Empty Email/Name
- **Category:** BUG
- **Description:** No validation on email or name fields in registration.
- **Files:** `src/routes/auth.ts` (register handler)
- **Fix:** Add validation:
  ```typescript
  if (!body.email || !body.email.includes("@")) {
    return c.json({ error: "Valid email required" }, 400);
  }
  ```
- **Verification:** `POST /api/auth/register` with empty email returns 400.

---

## 2. Dependency Graph

```
P0-001 (R2 token read-only)
  |-- blocks ALL upload testing
  |-- blocks ALL pipeline testing
  |-- blocks P2-003 verification (batch INSERT)
  |-- blocks P2-004 verification (parallel embed)

P0-003 (Docling endpoint wrong)
  |-- blocks ALL document parsing
  |-- blocks pipeline parse stage testing

P0-004 (shares response crash)
  |-- blocks frontend shares page

P0-005 (hardcoded URLs)
  |-- blocks ALL frontend-to-backend communication in production

P1-008 (bigint COUNT)
  |-- blocks accurate display of all counts
  |-- P2-001 and P2-002 should include ::int in their COUNT queries

P2-005 (PG indexes)
  |-- should be done before P3-005 (PG tuning) for full effect

P1-006 (ufw) -- independent, server config only
P1-007 (Redis password) -- independent, infra only
```

---

## 3. Work Packages

### WP-1: Infrastructure Blockers
- **Assigned to:** Lead-DevOps (manual, not code)
- **Issues:** P0-001, P1-006, P1-007, P2-006, P3-007, P3-011, P3-012
- **Scope:** Cloudflare dashboard, server SSH, docker-compose.yml, Caddyfile
- **Effort:** 1-2 hours manual work

### WP-2: Backend Critical Fixes
- **Assigned to:** Mies (Player) + Schlemmer (Coach)
- **Issues:** P0-002, P0-003, P0-004, P1-008, P1-009, P1-010, P1-011, P1-013, P2-001, P2-002, P2-007, P2-008, P2-009, P2-010, P2-011, P2-012, P2-015, P2-016, P3-001, P3-003, P3-004, P3-008, P3-009, P3-014, P3-015, P4-001, P4-002, P4-004, P4-005, P4-006, P4-007, P4-008, P4-009
- **Scope:** All `src/` files
- **Effort:** 4-6 hours implementation

### WP-3: Frontend Fixes
- **Assigned to:** Gropius (Player) + Breuer (Coach)
- **Issues:** P0-005, P2-013, P3-001, P3-002
- **Scope:** All `web/src/` files
- **Effort:** 2-3 hours implementation

### WP-4: Security Hardening
- **Assigned to:** Security pair
- **Issues:** P1-001, P1-002, P1-003, P1-004, P1-005, P1-012, P2-014, P2-017, P2-018, P3-006, P3-013
- **Scope:** `src/routes/auth.ts`, `src/routes/oauth.ts`, `src/routes/mcp-remote.ts`, `src/routes/dev.ts`, `src/routes/upload.ts`, `src/index.ts`
- **Effort:** 3-4 hours implementation

### WP-5: Performance
- **Assigned to:** Performance pair
- **Issues:** P2-003, P2-004, P2-005, P3-005, P3-014
- **Scope:** `src/services/pipeline.ts`, `src/services/vectorstore/vector.ts`, `src/services/embedder/index.ts`, `src/db/schema.ts`, `docker-compose.yml`
- **Effort:** 3-4 hours implementation

### WP-6: Observability
- **Assigned to:** Lead-Monitoring
- **Issues:** P3-010, P3-011, P3-012
- **Scope:** `src/index.ts`, `Caddyfile`, `docker-compose.yml`
- **Effort:** 1-2 hours implementation

---

## 4. Execution Order

```
Phase 1 (Day 1 -- prerequisite):
  WP-1: Infrastructure Blockers          [MANUAL, nopoint]
    P0-001 (R2 token) -- FIRST, blocks everything
    P1-006 (ufw)
    P1-007 (Redis password)
    P2-006 (Docling config)
    P3-007, P3-011, P3-012 (Caddy + logs)

Phase 2 (Day 1 -- after WP-1 done, ALL PARALLEL):
  WP-2: Backend Critical Fixes           [Mies + Schlemmer]
  WP-3: Frontend Fixes                   [Gropius + Breuer]
  WP-4: Security Hardening               [Security pair]
  WP-6: Observability                    [Lead-Monitoring]

Phase 3 (Day 2 -- after WP-2 merged):
  WP-5: Performance                      [Performance pair]
    (depends on WP-2 for batch INSERT/UPDATE pattern)

Phase 4 (Day 2 -- integration):
  End-to-end CJM walkthrough
  All acceptance criteria verified
```

**Parallel execution rules:**
- WP-2, WP-3, WP-4, WP-6 can run in parallel (no file conflicts)
- WP-5 must wait for WP-2 (P2-003 changes `pipeline.ts` and `vector.ts` which WP-2 also touches)
- WP-1 must complete before any verification of upload/pipeline features

---

## 5. Acceptance Criteria

### AC-1: Upload Path Works End-to-End
- `POST /api/upload` with a PDF file returns 202
- `GET /api/status/<docId>` transitions through `processing` -> `ready`
- `GET /api/documents/<docId>/content` returns non-empty chunks
- **Verifies:** P0-001, P0-002, P0-003, P1-008, P1-011

### AC-2: Frontend Points to New Backend
- Build frontend, search JS bundle for `contexter.nopoint.workers.dev` -- zero matches
- All API calls from `contexter.cc` reach `api.contexter.cc`
- **Verifies:** P0-005

### AC-3: Shares Page Loads Without Crash
- Create a share, navigate to API page, shares list renders correctly
- `share.share_token` displays first 12 chars
- Delete share works
- **Verifies:** P0-004, P2-010, P2-011

### AC-4: Security Endpoints Protected
- `GET /dev/debug-env` returns 403 in production
- `POST /api/auth/register` with existing email does NOT return apiToken
- MCP `search_knowledge` as User A does NOT return User B's content
- OAuth with `code_challenge_method=plain` is rejected
- `POST /register` (OAuth) rate-limited after 10 requests
- **Verifies:** P1-001, P1-002, P1-003, P1-004, P1-005

### AC-5: Infrastructure Hardened
- `ufw status` shows active
- `redis-cli PING` without auth returns NOAUTH error
- Docling RSS < 1.5 GiB at idle
- **Verifies:** P1-006, P1-007, P2-006

### AC-6: Counts Are Numbers, Not Strings
- `GET /api/status` returns `chunks` as `typeof number`
- Pipeline `/api/pipeline/health` returns correct numeric `totalStuck`
- **Verifies:** P1-008

### AC-7: Delete Document Works
- Dashboard delete button removes document
- Settings "delete all" removes all user documents
- **Verifies:** P2-001, P2-002, P3-002

### AC-8: Performance Baseline Met
- 200-chunk document indexed in < 5 SQL queries (not 400)
- PG `EXPLAIN` on user document query shows Index Scan
- Embed stage for 5 batches completes in < 1s (parallel)
- **Verifies:** P2-003, P2-004, P2-005

### AC-9: Resilience
- Redis stopped -> registration still works (fail-open)
- Groq 429 -> query retries and succeeds
- Docling hung -> parse times out in < 90s
- **Verifies:** P2-007, P2-008, P2-009

### AC-10: Observability
- Every API request produces a JSON log line with request ID
- Caddy logs HTTP traffic to stdout
- Docker logs have rotation configured
- **Verifies:** P3-010, P3-011, P3-012

### AC-11: Health Check Accurate
- With read-only R2 token: `/health` reports `s3: "write-failed"`
- With read-write R2 token: `/health` reports `s3: "ok"`
- **Verifies:** P0-002

### Final Smoke Test (All ACs passed):
1. Register new user via `POST /api/auth/register` -> get token
2. Upload a PDF via `POST /api/upload` -> 202
3. Poll `GET /api/status/<id>` until `ready`
4. Query `POST /api/query` with relevant question -> answer with sources showing filename
5. View document content via frontend DocumentViewer -> chunks visible
6. Create share via `POST /api/auth/share` -> get shareToken
7. List shares via `GET /api/auth/shares` -> correct fields
8. MCP `search_knowledge` via `POST /sse` -> results scoped to user
9. Delete document via frontend -> removed from list
10. Health check `GET /health` -> all green

---

## Architect Review (Verification Pass)

> Reviewer: Senior Architect (Opus 4.6)
> Date: 2026-03-27
> Method: Read full spec (989 lines, 60 issues), cross-checked against all 13 audit reports line by line.

### Missing Issues (not in spec)

#### Security

- **[NEW-001]** Priority: P1 | Category: SECURITY | Description: `.env` file has world-readable permissions (`-rw-r--r-- 644`). Any process on the host can read PostgreSQL password, R2 keys, Jina key, Groq key. | Source: Security (original) audit | File: Server `/opt/contexter/.env` | Fix: `chmod 600 /opt/contexter/.env`. Should be in WP-1.

- **[NEW-002]** Priority: P1 | Category: SECURITY | Description: All containers run as root (`uid=0`). If attacker achieves RCE via API, they are root inside the container. Privilege escalation to host is significantly easier. | Source: Security (original) audit | File: `docker-compose.yml` | Fix: Add `user: "1000:1000"` to `app` and `redis` services. Create non-root user in Dockerfile for app. Should be in WP-1.

- **[NEW-003]** Priority: P2 | Category: SECURITY | Description: API token accepted via `?token=` query parameter. Leaks token into server access logs, Cloudflare logs, browser history, and any proxy. | Source: Security (original) audit | File: `src/services/auth.ts`, `src/routes/mcp-remote.ts` | Fix: Document as known MCP limitation. At minimum, ensure structured logging (P3-010) strips `?token=` values from logged URLs. Add `Authorization: Bearer` header as preferred auth method in docs.

- **[NEW-004]** Priority: P2 | Category: SECURITY | Description: Upload endpoint (`/api/upload`) has no per-user rate limiting. Authenticated user can upload continuously, exhausting Jina API quota, Groq quota, R2 storage, and CPU via Docling. 100 MB size limit exists but no frequency limit. | Source: Security (original) audit | File: `src/routes/upload.ts` | Fix: Add Redis-based rate limiter: max 20 uploads per user per hour.

- **[NEW-005]** Priority: P2 | Category: SECURITY | Description: Query endpoint (`/api/query`) has no rate limiting. Authenticated user can spam queries exhausting Groq LLM quota. | Source: Security (original) audit | File: `src/routes/query.ts` | Fix: Add Redis-based rate limiter: max 60 queries per user per hour.

- **[NEW-006]** Priority: P2 | Category: SECURITY | Description: No `read_only` filesystem, `no-new-privileges`, or CPU limits on containers. Docling has memory limit but no CPU cap -- malicious file could peg CPU and starve other containers. | Source: Security (original) audit | File: `docker-compose.yml` | Fix: Add `security_opt: ["no-new-privileges:true"]` and `cpus: "1.0"` to Docling. Consider `read_only: true` with tmpfs where needed.

- **[NEW-007]** Priority: P2 | Category: SECURITY | Description: No zip bomb / decompression bomb protection. Upload 100 MB check is on compressed/raw upload size. DOCX (ZIP container) can expand to many GiB when extracted by Docling. | Source: Security (v2) audit | File: `src/routes/upload.ts`, Docling pipeline | Fix: Add decompressed-size cap in pipeline parser or limit acceptable zip entry sizes. Docling's container memory limit (2 GiB) acts as partial safeguard.

- **[NEW-008]** Priority: P3 | Category: SECURITY | Description: PostgreSQL connection has no SSL/TLS. Traffic between app and postgres containers is unencrypted on Docker bridge. Any compromised container on the same bridge can sniff traffic. | Source: Security (original) audit | File: `.env` (`DATABASE_URL`) | Fix: Accept risk given single-host topology, or enable PG SSL with self-signed certs and add `?sslmode=require` to DATABASE_URL.

- **[NEW-009]** Priority: P3 | Category: SECURITY | Description: MCP `tools/list` and `initialize` respond without authentication. Any unauthenticated client can enumerate all 12 tool names and schemas. Aids reconnaissance. | Source: Security (v2) audit | File: `src/routes/mcp-remote.ts` (lines 256-258) | Fix: Require auth for `tools/list`. Allow `initialize` unauthenticated per MCP spec.

- **[NEW-010]** Priority: P3 | Category: SECURITY | Description: `/dev/debug-env` leaks first 10 characters of Jina API key (`jinaKeyPrefix`) and key length. Even partial key exposure reduces brute-force space. | Source: Security (v2) audit, Backend Routes audit | File: `src/routes/dev.ts` (line ~82-91) | Fix: Already mitigated by P1-001 (dev route blocked in production), but if dev route is kept for development, remove `jinaKeyPrefix` from the response entirely.

- **[NEW-011]** Priority: P3 | Category: SECURITY | Description: R2 storage key includes raw `file.name` without sanitization: `${auth.userId}/${documentId}/${file.name}`. Filenames like `../../admin/secret.pdf` or Unicode chars may cause key collisions. S3 metadata values are restricted to ASCII; non-ASCII bytes in Metadata header may be truncated or error. | Source: Security (v2) audit, Edge Cases audit | File: `src/routes/upload.ts` (line ~94) | Fix: `encodeURIComponent(file.name)` or replace all non-`[a-zA-Z0-9._-]` chars.

- **[NEW-012]** Priority: P3 | Category: SECURITY | Description: esbuild <= 0.24.2 (CVE GHSA-67mh-4wv8-2f99) bundled transitively via `drizzle-kit` and `wrangler`. CORS bypass on dev server. Dev-only impact, not production. | Source: Security (v2) audit | File: `package.json` dependencies | Fix: `bun update drizzle-kit wrangler` to pull esbuild >= 0.25.0.

#### Backend Bugs

- **[NEW-013]** Priority: P2 | Category: BUG | Description: `index.ts` line 35 sets `db: null as any` in the Env. The `Env` interface defines `db: PostgresJsDatabase<typeof schema>`. If any service accesses `env.db`, it crashes at runtime. Latent crash path not protected by type system. | Source: Backend Routes audit | File: `src/index.ts` (line 35) | Fix: Either remove `db` from `Env` interface entirely, or initialize it properly. If unused, delete the field.

- **[NEW-014]** Priority: P3 | Category: BUG | Description: Upload.ts `runPipelineAsync(...).catch(console.error)` is fire-and-forget. If `createPendingJobs` fails on line 70, the error propagates (500 returned), but the document row is orphaned in "processing" status with no jobs. No cleanup path. | Source: Backend Routes audit, Edge Cases audit | File: `src/routes/upload.ts` (lines 66-71) | Fix: Wrap document creation + job creation in a transaction. If job creation fails, rollback document insert.

- **[NEW-015]** Priority: P3 | Category: BUG | Description: Pipeline runs as detached async task. If document is deleted mid-pipeline, `INSERT INTO chunks` throws FK violation (referencing deleted document). Pipeline silently dies via `.catch(console.error)`. No cancellation mechanism -- embed/parse stages that already ran waste CPU/API calls. | Source: Edge Cases audit | File: `src/services/pipeline.ts`, `src/routes/upload.ts` | Fix: Check document existence before each stage. Low priority since FK violation is safely caught, but wasteful.

- **[NEW-016]** Priority: P3 | Category: BUG | Description: `retry.ts` line 65 `await c.req.json<{ stage?: string }>()` with empty POST body throws, caught by empty catch block (falls through to auto-detect). Functional but should return 400 on malformed JSON with Content-Type application/json. | Source: Backend Routes audit | File: `src/routes/retry.ts` (line 65) | Fix: Minor -- add explicit handling for malformed JSON body.

- **[NEW-017]** Priority: P4 | Category: BUG | Description: `oauth.ts` ConsentPageParams types `state`, `codeChallenge`, `codeChallengeMethod` as non-optional `string`, but form values could be empty strings or missing. `escHtml` handles undefined so no crash, but hidden form fields may contain "undefined" text. | Source: Backend Routes audit | File: `src/routes/oauth.ts` (lines 230-238) | Fix: Default to empty string: `state || ""`.

- **[NEW-018]** Priority: P4 | Category: BUG | Description: `LlmService` default `maxTokens = 1024` may be insufficient for longer RAG answers. 1024 tokens is ~750 words. Complex multi-source answers may truncate. | Source: Backend Services audit | File: `src/services/llm.ts` (line ~28) | Fix: Increase to 2048 or make configurable via env.

#### Frontend

- **[NEW-019]** Priority: P3 | Category: UX | Description: `DocumentViewer.tsx` `formatDateFull` calls `new Date(iso)` without null-safe check (unlike DocumentModal which has null-safe version). If `created_at` is null/undefined from new PG backend, throws `Invalid Date`. | Source: Frontend audit | File: `web/src/pages/DocumentViewer.tsx` (lines 24-29) | Fix: Add null check: `created_at ? new Date(created_at) : null`.

- **[NEW-020]** Priority: P3 | Category: UX | Description: `Dashboard.tsx` line 161-163 error catch shows toast "ne udalos' zagruzit' dokumenty" but swallows error without retry button or inline error state. User sees loading skeleton then nothing. | Source: Frontend audit | File: `web/src/pages/Dashboard.tsx` (lines 161-163) | Fix: Add retry button or show error state in document table.

- **[NEW-021]** Priority: P3 | Category: UX | Description: `DocumentModal.tsx` `createResource` triggers on `props.docId` change. Rapid clicks on multiple docs may cause stale request overwriting newer result. No AbortController cancellation. | Source: Frontend audit | File: `web/src/components/DocumentModal.tsx` (lines 77-85) | Fix: Add AbortController to cancel previous request on new docId.

- **[NEW-022]** Priority: P4 | Category: UX | Description: `Upload.tsx` `mapApiStages` maps backend stage statuses (`pending/processing/completed/done/error`). If new backend uses different stage status strings (e.g., `queued`, `failed`), mapping silently falls back to `"pending"`. | Source: Frontend audit | File: `web/src/pages/Upload.tsx` (lines 71-94) | Fix: Verify stage status strings match between new backend and frontend mapping. Add `console.warn` for unknown statuses.

- **[NEW-023]** Priority: P4 | Category: UX | Description: `Settings.tsx` "zapros" usage card is hardcoded at `value={0} max={100}` -- never updated. No API endpoint to fetch query count. Known deferred feature but misleading UI. | Source: Frontend audit | File: `web/src/pages/Settings.tsx` (line ~200-204) | Fix: Either hide the card or add a TODO comment. Low priority.

#### Performance

- **[NEW-024]** Priority: P3 | Category: PERFORMANCE | Description: HNSW index built with default params `m=16, ef_construction=64`. For 1024-dim vectors at scale (100K+ chunks), `m=32, ef_construction=128` provides better recall. Set `hnsw.ef_search=64` at query time. | Source: Performance audit | File: `src/db/schema.ts` or migration SQL | Fix: Low priority until scale warrants it. Add to future optimization backlog.

- **[NEW-025]** Priority: P3 | Category: PERFORMANCE | Description: Upload path loads entire file into RAM (`await file.arrayBuffer()`) before any pipeline starts. No streaming to R2. Concurrent large uploads (e.g., 3 x 100 MB) cause ~300 MB memory spike in Bun process. | Source: Edge Cases audit | File: `src/routes/upload.ts` (line ~93) | Fix: Stream upload to R2 instead of buffering. Lower priority given 99 MiB baseline for Bun.

#### Observability

- **[NEW-026]** Priority: P2 | Category: OBSERVABILITY | Description: Async pipeline errors only logged to `console.error`. Background tasks (`upload.ts:71`, `retry.ts:109`) fail silently. Errors disappear when Docker logs rotate. Pipeline failure error should be written to `jobs` table with full stack trace. | Source: Observability audit | File: `src/routes/upload.ts` (line 71), `src/routes/retry.ts` (line 109) | Fix: Already partially addressed by pipeline writing to `jobs.error_message`, but stack trace is truncated. Ensure full error message + stack stored in DB.

- **[NEW-027]** Priority: P3 | Category: OBSERVABILITY | Description: No error aggregation or alerting. Errors scattered across console, DB, Docker logs. No single view of failures. If 10% of uploads fail silently, no notification until users complain. | Source: Observability audit | Fix: Add periodic DB query for error counts (`SELECT status, COUNT(*) FROM jobs WHERE status='error' AND updated_at > NOW() - INTERVAL '1 hour' GROUP BY status`). Expose in `/api/pipeline/health`.

- **[NEW-028]** Priority: P3 | Category: OBSERVABILITY | Description: No performance metrics surfaced. Pipeline timings (`durationMs`) are recorded in `jobs` table but not aggregated. No percentiles (p50, p95, p99). | Source: Observability audit | Fix: Expose per-stage latency stats in `/api/pipeline/health` response.

- **[NEW-029]** Priority: P3 | Category: OBSERVABILITY | Description: No Groq/Jina API call logging. No visibility into external service timeouts, rate limits, 429 responses. Cannot distinguish "app slow" from "Jina slow". | Source: Observability audit | File: `src/services/llm.ts`, `src/services/embedder/index.ts` | Fix: Log API calls with URL, status code, latency. Log 429 with rate-limit headers.

#### Infrastructure

- **[NEW-030]** Priority: P3 | Category: INFRA | Description: No automated PostgreSQL backups. No `pg_dump` cron job to R2 or local storage. Data loss risk on disk failure. | Source: Backlog audit | Fix: Add cron job for `pg_dump` to R2. Should be in WP-1.

- **[NEW-031]** Priority: P4 | Category: INFRA | Description: UDP receive buffer too small for HTTP/3 QUIC (416 KiB vs recommended 7168 KiB). Minor performance impact on QUIC/H3 connections. | Source: Infrastructure audit | Fix: `sysctl -w net.core.rmem_max=7500000` in `/etc/sysctl.conf`.

- **[NEW-032]** Priority: P4 | Category: INFRA | Description: Caddy logs cosmetic warning "Caddyfile input is not formatted". Not functional but noisy. | Source: Infrastructure audit | Fix: `caddy fmt --overwrite Caddyfile`.

---

### Priority Disagreements

- **[P3-006] CORS Wildcard on All Routes**: Current P3, should be **P1**. Wildcard CORS combined with `?token=` query-param auth means ANY website can call ANY authenticated endpoint from a user's browser. This is not just a "nice to have" -- it is an active cross-origin data exfiltration vector. The Security (original) audit rated this CRITICAL. Fix is trivial (2 lines). Should be in WP-4 with P1 priority.

- **[P3-013] userId Only 8 Hex Chars**: Current P3, should be **P2**. The same 8-char pattern is used for `documentId` and `shareId`. Share tokens are URL-exposed (`/sse?share=<shareToken>`), and share IDs used in `DELETE /api/auth/shares/:id`. With ~4 billion values, brute-force enumeration of share IDs is feasible. Especially since there is no rate limiting on share endpoints.

- **[P2-014] OAuth Code Stores Full apiToken in Redis**: Current P2, should be **P1**. Combined with P1-007 (Redis no password), this means the full API token is stored in plaintext in an unauthenticated Redis. Any container on the Docker bridge network can `KEYS oauth:code:* | MGET` and harvest all active tokens. The dependency on P1-007 does not reduce severity -- it amplifies it.

- **[P4-009] Registration Accepts Empty Email/Name**: Current P4, should be **P3**. Empty email means duplicate detection (`WHERE email = ''`) returns all empty-email users' tokens. Combined with P1-002 (token leaking on duplicate registration), an attacker can POST register with empty email and get a real user's token. The fix for P1-002 mitigates this, but defense-in-depth says validate email at input.

---

### Specification Gaps

- **[P0-002] Health Check Fix:** Fix says "test with PutObject of a small test blob, then DeleteObject". This requires the R2 token to also have Delete permission. If token is changed to "Object Read & Write" per P0-001, delete may not be included. Fix should clarify: use PutObject + HeadObject (verify write), not PutObject + DeleteObject. Or explicitly state the token needs Read+Write+Delete.

- **[P1-005] OAuth Client Registration Rate Limiting:** Fix uses `CF-Connecting-IP` as primary header. But the Hetzner server is behind Caddy, not directly behind Cloudflare. The `CF-Connecting-IP` header is set by Cloudflare's proxy, and Caddy forwards it. This works IF traffic always goes through CF. If someone hits the server IP directly (bypassing CF), the header is absent and falls through to `"unknown"`, sharing a single rate limit bucket for all direct-IP requests. Fix should also block direct IP access (either via Caddy `@blocked` matcher or ufw rules that only allow CF IP ranges on 80/443).

- **[P1-009] OAuth /token Response Bypasses Hono CORS:** Fix says replace `Response.json(...)` with `c.json(...)` and replace `tokenError()`. But `tokenError()` is also used in other contexts where it returns error JSON. The fix needs to refactor `tokenError()` to accept the Hono context `c` as a parameter so it can use `c.json()`. Currently `tokenError()` is a standalone function that constructs `Response.json(...)`. The fix should show the refactored function signature.

- **[P2-003] Sequential Chunk INSERT + UPDATE:** Fix code for batch UPDATE uses `unnest()` with text arrays. The `embedding` value is passed as text `[0.1,0.2,...]::vector`. This works but postgres.js may double-escape the array contents. The fix should be tested carefully -- an alternative is to use `sql.unsafe()` for the batch update or use `VALUES` list construction.

- **[P2-006] Docling OOM Risk Under Load:** Fix sets `OMP_NUM_THREADS: "2"`. The Performance audit measured 22 threads with `OMP_NUM_THREADS=4`. Setting to 2 is correct for 2 vCPU, but the spec should note that the default was 4, not 2, to avoid confusion.

- **[P2-017] Rate Limit Uses X-Forwarded-For:** Fix shows `.split(",").pop()?.trim()` (rightmost IP). The Security (original) audit recommends using `CF-Connecting-IP` as primary, which the spec does, but the fallback to `X-Forwarded-For.pop()` (rightmost) is the opposite of standard `X-Forwarded-For` convention (leftmost = client). Behind Cloudflare+Caddy, the rightmost is the last proxy, not the client. Fix should use `.split(",")[0]?.trim()` or better yet, only trust `CF-Connecting-IP` and `X-Real-IP` (set by Caddy), rejecting `X-Forwarded-For` entirely.

- **[P3-006] CORS Wildcard on All Routes:** Fix specifies `origin: ["https://contexter.cc", "https://www.contexter.cc"]`. But `mcp-remote.ts` line 816 also hardcodes `"Access-Control-Allow-Origin": "*"` in `sseResponse()`. The spec fix only addresses `index.ts` but not the SSE response header. Both locations must be fixed.

- **[P3-015] Env Vars Not Validated at Startup:** The `REQUIRED_ENV` list is missing `REDIS_URL` and `BASE_URL`. Both are used at runtime (Redis for rate limiting/OAuth, BASE_URL for MCP URLs in share responses). Add them to the validation list.

---

### Work Package Issues

- **WP-2 (Backend Critical Fixes):** Contains P3-014 (buffer.buffer slice) which is also assigned to WP-5 (Performance). Remove from one to avoid duplicate work. Since P3-014 is a correctness bug (not performance), it belongs in WP-2.

- **WP-2 (Backend Critical Fixes):** Contains P3-001 (Frontend API Error Body Parsing). But P3-001 affects `web/src/lib/api.ts` -- a frontend file. It should be in WP-3 (Frontend Fixes), not WP-2. WP-3 already lists P3-001, so it is double-assigned.

- **WP-4 (Security Hardening):** Missing NEW-001 (`.env` file permissions), NEW-002 (containers run as root), NEW-004/NEW-005 (upload/query rate limiting). These are security issues that should be added to WP-4 or WP-1 (for infra-level fixes).

- **WP-1 (Infrastructure Blockers):** Missing NEW-001 (`.env` chmod 600), NEW-002 (non-root containers in docker-compose), NEW-030 (pg_dump backup).

- **WP-5 (Performance):** Lists P3-014 which is already in WP-2. Remove duplicate. WP-5 should NOT contain P3-014 since the pipeline.ts file is already modified by WP-2.

- **WP-6 (Observability):** Only has P3-010, P3-011, P3-012. Missing NEW-026 (pipeline error logging to DB), NEW-027 (error aggregation), NEW-028 (metrics), NEW-029 (API call logging). These should be added or explicitly deferred.

- **Execution Phase 2 parallelism:** WP-4 (Security) modifies `src/routes/auth.ts`, `src/routes/upload.ts`, and `src/index.ts`. WP-2 (Backend) also modifies `src/routes/auth.ts` (P1-013, P2-016) and `src/index.ts` (P3-015). These files conflict -- WP-2 and WP-4 cannot safely run in parallel without merge conflicts. Either: (a) move P1-013 and P2-016 from WP-2 to WP-4, or (b) sequence WP-4 after WP-2.

---

### Verdict

**PASS WITH AMENDMENTS**

The spec is thorough and well-structured. The 60 core issues are correctly identified, well-described with concrete fixes and verification commands. The dependency graph and execution order are sound. However:

1. **32 missing issues** from audit reports were not captured. Most are P3/P4, but NEW-001 (`.env` permissions) and NEW-002 (root containers) are P1 security issues that should be added to WP-1.
2. **4 priority disagreements** -- P3-006 (CORS wildcard) should be P1, P2-014 (OAuth token in Redis) should be P1.
3. **7 specification gaps** in existing fix descriptions that could lead to incorrect implementation.
4. **6 work package issues** including file conflicts between WP-2 and WP-4 that break the parallel execution assumption.

The spec is production-ready after addressing the P1-level amendments (NEW-001, NEW-002, P3-006 upgrade, WP-2/WP-4 file conflict resolution). P3+ amendments can be deferred to a follow-up pass.
