# Harkly MVP — API Spec
> Date: 2026-03-19
> Author: Lead/TechResearch
> Status: SPECIFICATION (rewrites previous incorrect Next.js/Vercel/Supabase version)
> Sources: harkly-eval-mcp-auth.md, harkly-eval-rag-pipeline.md, harkly-research-mcp-access.md, harkly-eval-schema-extract.md, harkly-research-stack.md (B5, B3), harkly-mvp-architecture.md (Section 3), harkly-mvp-data-model.md (Section 3)

---

## 1. API Architecture

### Two surfaces, both on Cloudflare

```
+-------------------------------------------------------------------+
|  Surface A: CF Pages Worker (SolidStart SSR)                      |
|  URL: harkly.app                                                  |
|                                                                   |
|  /api/auth/*                  -- better-auth (AUTH_DB)            |
|  /api/upload/presign          -- R2 presigned PUT URL generation  |
|  /api/upload/confirm          -- confirm upload + enqueue job     |
|  /api/projects/*              -- Projects CRUD (KB_DB)            |
|  /api/projects/:id/sources/*  -- Sources CRUD (KB_DB)             |
|  /api/projects/:id/schema/*   -- Schema discovery + confirmation  |
|  /api/projects/:id/extract    -- Extraction trigger (Queue)       |
|  /api/projects/:id/query      -- Hybrid search (FTS5+Vector+RRF)  |
|  /api/projects/:id/chat       -- Fallback LLM (Workers AI / NIM)  |
|  /api/projects/:id/canvas     -- Canvas state (D1)                |
|  /api/jobs/:id                -- Job status polling               |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
|  Surface B: CF Worker (harkly-mcp.workers.dev)                    |
|  URL: harkly-mcp.workers.dev (or mcp.harkly.app via custom domain)|
|                                                                   |
|  /.well-known/oauth-authorization-server  -- RFC 8414 metadata    |
|  /.well-known/oauth-protected-resource    -- RFC 9728 metadata    |
|  /oauth/token                             -- Token exchange        |
|  /oauth/register                          -- Dynamic client reg.  |
|  /authorize                               -- Consent UI + login   |
|  /api/auth/*                              -- better-auth handler  |
|  /mcp                                     -- MCP Streamable HTTP  |
+-------------------------------------------------------------------+
```

### No Vercel. No Supabase. No Next.js. No Prisma.

All compute runs on Cloudflare. Heavy processing (PDF OCR, video transcription, Instagram media) runs on Modal.com Python workers, triggered via CF Queues pull consumers.

### Worker topology (wrangler bindings)

**CF Pages Worker (SolidStart):**
```toml
bindings:
  D1: KB_DB        -- Knowledge base (projects, sources, documents, chunks, schemas, jobs)
  D1: AUTH_DB      -- better-auth (user, session, account, verification)
  R2: HARKLY_R2    -- Original file storage
  KV: AUTH_KV      -- better-auth session cache + rate limiting
  Vectorize: VECTORIZE_INDEX  -- 1024-dim cosine, BGE-Large embeddings
  Queue: INGEST_QUEUE  -- Async processing jobs
  AI               -- Workers AI (embeddings, query rewrite, fallback LLM)
```

**CF Worker (harkly-mcp):**
```toml
bindings:
  D1: KB_DB        -- Shared knowledge base (read-only for MCP tools)
  KV: OAUTH_KV     -- workers-oauth-provider token storage
  KV: SESSION_KV   -- MCP session state (KV-backed, not in-memory)
  Vectorize: VECTORIZE_INDEX
  AI
```

**CF Worker (queue-consumer):**
```toml
bindings:
  D1: KB_DB
  R2: HARKLY_R2
  Vectorize: VECTORIZE_INDEX
  AI
  Queue trigger: INGEST_QUEUE
```

---

## 2. Auth Endpoints — CF Worker (workers-oauth-provider)

These endpoints are served by the `harkly-mcp` CF Worker. Implemented via `@cloudflare/workers-oauth-provider` v0.3.0 (MIT, Cloudflare-maintained). The entire worker entry point is `new OAuthProvider({ ... })`.

OAuth 2.1 + PKCE enforced on all token flows. Access tokens stored as SHA-256 hashes. Grant props encrypted with AES-GCM per-grant key.

---

### GET /.well-known/oauth-authorization-server

**Purpose:** RFC 8414 OAuth authorization server metadata. MCP clients discover all endpoints from here.

**Auth required:** None

**Response 200:**
```typescript
{
  issuer: string                        // "https://mcp.harkly.app"
  authorization_endpoint: string       // "/authorize"
  token_endpoint: string               // "/oauth/token"
  registration_endpoint: string        // "/oauth/register"
  scopes_supported: string[]           // ["knowledge:read", "knowledge:write"]
  response_types_supported: string[]   // ["code"]
  grant_types_supported: string[]      // ["authorization_code", "refresh_token"]
  code_challenge_methods_supported: string[]  // ["S256"]
  token_endpoint_auth_methods_supported: string[]  // ["none"]  // public clients only for MVP
}
```

---

### GET /.well-known/oauth-protected-resource

**Purpose:** RFC 9728 protected resource metadata. MCP clients use this to discover what authorization server protects `/mcp`.

**Auth required:** None

**Response 200:**
```typescript
{
  resource: string                  // "https://mcp.harkly.app"
  authorization_servers: string[]  // ["https://mcp.harkly.app"]
  bearer_methods_supported: string[]  // ["header"]
  scopes_supported: string[]       // ["knowledge:read", "knowledge:write"]
}
```

---

### POST /oauth/register

**Purpose:** RFC 7591 Dynamic Client Registration. MCP clients (Claude Desktop, ChatGPT, Grok) auto-register before the OAuth flow.

**Auth required:** None

**Request body:**
```typescript
{
  redirect_uris: string[]           // required: callback URLs
  client_name?: string              // optional: human-readable name
  client_uri?: string               // optional: client homepage
  scope?: string                    // optional: requested scopes space-separated
  grant_types?: string[]            // default: ["authorization_code"]
  response_types?: string[]         // default: ["code"]
  token_endpoint_auth_method?: string  // default: "none" (public client)
}
```

**Response 201:**
```typescript
{
  client_id: string                 // generated UUID
  client_id_issued_at: number      // unix timestamp
  // client_secret omitted for public clients (token_endpoint_auth_method=none)
  redirect_uris: string[]
  grant_types: string[]
  response_types: string[]
  scope: string
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `invalid_redirect_uri` | 400 | redirect_uri uses non-HTTPS scheme (except localhost) |
| `invalid_client_metadata` | 400 | Malformed registration request |

---

### GET /authorize

**Purpose:** OAuth authorization endpoint. Browser redirect from MCP client. workers-oauth-provider parses the request, then routes to `defaultHandler` which checks better-auth session and shows consent UI.

**Auth required:** None (browser redirect with session cookie)

**Query params:**
```
client_id        required
redirect_uri     required
response_type    required: "code"
scope            required: space-separated, e.g. "knowledge:read"
state            recommended
code_challenge   required (PKCE)
code_challenge_method  required: "S256"
```

**Flow:**
1. workers-oauth-provider parses request via `env.OAUTH_PROVIDER.parseAuthRequest(request)`
2. `defaultHandler` checks better-auth session: `createAuth(env, cf).api.getSession({ headers })`
3. If no session: redirect to `/login?next=/authorize?...` (302)
4. If session exists: render consent UI (HTML page showing requested scopes + "Authorize" button)
5. On user approval: `env.OAUTH_PROVIDER.completeAuthorization({ request: oauthReq, userId: session.user.id, scope: requestedScope, props: { userId: session.user.id, email: session.user.email } })`
6. Redirect to `redirect_uri?code=...&state=...`

**Error redirect (to redirect_uri):**
```
?error=access_denied&error_description=User+denied+authorization&state=...
```

---

### POST /oauth/token

**Purpose:** Exchange authorization code for access + refresh tokens, or refresh access token.

**Auth required:** None (public client — no client_secret for MVP)

**Request body (grant_type=authorization_code):**
```typescript
{
  grant_type: "authorization_code"
  code: string                      // auth code from /authorize
  redirect_uri: string              // must match registration
  client_id: string
  code_verifier: string             // PKCE verifier
}
```

**Request body (grant_type=refresh_token):**
```typescript
{
  grant_type: "refresh_token"
  refresh_token: string
  client_id: string
}
```

**Response 200:**
```typescript
{
  access_token: string              // opaque bearer token
  token_type: "Bearer"
  expires_in: number               // 3600 (1 hour)
  refresh_token: string
  scope: string                    // granted scopes space-separated
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `invalid_grant` | 400 | Code expired/used, PKCE mismatch, or invalid refresh token |
| `invalid_client` | 401 | Unknown client_id |
| `invalid_request` | 400 | Missing required parameter |
| `unsupported_grant_type` | 400 | Grant type not supported |

---

## 3. User Auth — CF Pages (better-auth + D1)

All `/api/auth/*` routes are handled by better-auth via `toSolidStartHandler(getAuth(env))`. The auth instance is created per-request (required for CF Workers — D1 bindings are request-scoped).

**AUTH_DB tables:** `user`, `session`, `account`, `verification` (standard better-auth schema, SQLite/D1 mode).

The full set of better-auth endpoint paths is generated from the config. Key ones for Harkly MVP:

---

### POST /api/auth/sign-up/email

**Request body:**
```typescript
{
  email: string       // validated email format
  password: string    // min 8 chars
  name: string        // display name
}
```

**Response 200:**
```typescript
{
  user: {
    id: string
    email: string
    name: string
    emailVerified: boolean
    createdAt: string   // ISO 8601
  }
  session: {
    token: string       // session cookie also set
    expiresAt: string
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `USER_ALREADY_EXISTS` | 422 | Email already registered |
| `INVALID_EMAIL` | 400 | Email format validation failed |
| `PASSWORD_TOO_SHORT` | 400 | Password < 8 chars |

---

### POST /api/auth/sign-in/email

**Request body:**
```typescript
{
  email: string
  password: string
}
```

**Response 200:**
```typescript
{
  user: { id: string; email: string; name: string; emailVerified: boolean }
  session: { token: string; expiresAt: string }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `INVALID_EMAIL_OR_PASSWORD` | 401 | Wrong credentials |
| `EMAIL_NOT_VERIFIED` | 403 | Email not verified (if email verification enabled) |

---

### POST /api/auth/sign-out

**Auth required:** Session cookie

**Response 200:** `{}`

---

### GET /api/auth/session

**Auth required:** Session cookie

**Response 200:**
```typescript
{
  user: { id: string; email: string; name: string; emailVerified: boolean }
  session: { token: string; expiresAt: string; ipAddress: string | null; userAgent: string | null }
}
```

**Response 401:** `{ error: "Unauthorized" }` if no valid session

---

### GET /api/auth/callback/:provider

**Purpose:** OAuth social login callback (Google, GitHub). Handled automatically by better-auth.

**Params:** `:provider` = `google` | `github`

**Flow:** better-auth exchanges code, creates/links account, issues session cookie, redirects to `/dashboard`.

---

## 4. REST API — CF Pages (SolidStart server functions)

All routes below are SolidStart API routes (server functions). Auth middleware validates the better-auth session cookie on every request. `tenant_id` is always derived from `session.user.id` — never from the request body.

### Common conventions

**Auth header:** Session cookie (set by `/api/auth/sign-in/email`). All REST endpoints require a valid session.

**Response envelope:**
```typescript
// Success
{ data: T; meta?: { total?: number; page?: number; limit?: number } }

// Error
{ error: { code: string; message: string; details?: unknown } }
```

**Pagination (list endpoints):**
```
?page=1&limit=20     // default: page=1, limit=20, max limit=100
```

**Common error codes:**
| HTTP | Code | Meaning |
|---|---|---|
| 401 | `UNAUTHORIZED` | No valid session |
| 403 | `FORBIDDEN` | Session valid but not authorized for this resource |
| 404 | `NOT_FOUND` | Resource does not exist or belongs to another tenant |
| 422 | `VALIDATION_ERROR` | Request body failed schema validation |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

### 4.1 Projects

#### GET /api/projects

List all projects for the authenticated user.

**Response 200:**
```typescript
{
  data: Array<{
    id: string          // ULID
    title: string
    description: string | null
    frameType: string | null  // 'jtbd' | 'spice' | 'peo' | 'picot' | 'issue_tree' | 'hmw' | 'free_form'
    status: "active" | "archived"
    createdAt: string   // ISO 8601
    updatedAt: string
    _counts: {
      sources: number
      documents: number
    }
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

#### POST /api/projects

Create a new project.

**Request body:**
```typescript
{
  title: string           // required, 1-255 chars
  description?: string    // optional, max 2000 chars
  frameType?: "jtbd" | "spice" | "peo" | "picot" | "issue_tree" | "hmw" | "free_form"
  frameData?: Record<string, unknown>  // framework-specific structure, stored as JSON
}
```

**Response 201:**
```typescript
{
  data: {
    id: string
    title: string
    description: string | null
    frameType: string | null
    frameData: Record<string, unknown> | null
    status: "active"
    createdAt: string
    updatedAt: string
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `VALIDATION_ERROR` | 422 | title empty or too long |

---

#### GET /api/projects/:id

**Response 200:** Same shape as single item from list, plus `frameData`.

**Errors:** 404 if not found or belongs to another tenant.

---

#### PATCH /api/projects/:id

Partial update. Only provided fields are updated.

**Request body:**
```typescript
{
  title?: string
  description?: string | null
  frameType?: string | null
  frameData?: Record<string, unknown> | null
  status?: "active" | "archived"
}
```

**Response 200:** Updated project object.

---

#### DELETE /api/projects/:id

Deletes project and cascades to all sources, documents, chunks, schemas, extracted entities, canvas frames, ingest runs/jobs.

**Response 204:** No content.

---

### 4.2 Sources (Upload)

Upload flow is two-step: presign -> client-side direct R2 PUT -> confirm.

#### POST /api/upload/presign

Request a presigned R2 PUT URL. Must be called before the client uploads the file.

**Request body:**
```typescript
{
  projectId: string      // ULID -- project the source belongs to
  filename: string       // original filename, e.g. "interview.pdf"
  contentType: string    // MIME type, e.g. "application/pdf"
  fileSize: number       // bytes -- validated: max 5 GB (via presigned URL, not Worker body)
}
```

**Server actions:**
1. Validate projectId belongs to tenant
2. Generate sourceId (ULID)
3. Construct R2 key: `{tenantId}/{projectId}/{sourceId}/{filename}`
4. INSERT row into `sources` table with `status='pending'`, `r2Key`
5. Generate presigned PUT URL via `aws4fetch` (15 min expiry)

**Response 201:**
```typescript
{
  data: {
    sourceId: string       // ULID -- use in /api/upload/confirm
    presignedUrl: string   // PUT this URL directly with the file body
    expiresAt: string      // ISO 8601, 15 min from now
    r2Key: string          // for reference
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `FORBIDDEN` | 403 | projectId belongs to another tenant |
| `VALIDATION_ERROR` | 422 | fileSize > 5 GB, missing required fields |

---

#### POST /api/upload/confirm

Call after the client has successfully PUT the file to the presigned URL.

**Request body:**
```typescript
{
  sourceId: string    // ULID from presign response
}
```

**Server actions:**
1. Verify source belongs to tenant
2. Verify R2 object exists at `source.r2Key` via `env.HARKLY_R2.head(key)`
3. UPDATE source `status = 'processing'`
4. INSERT ingest_runs row (`run_type='source_ingest'`, `status='running'`)
5. INSERT ingest_jobs row (`job_type='process_source'`, `payload: { sourceId, runId }`)
6. `env.INGEST_QUEUE.send({ jobId })` -- CF Queue notification

**Response 200:**
```typescript
{
  data: {
    sourceId: string
    runId: string      // ULID -- poll /api/runs/:id for status
    status: "processing"
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `NOT_FOUND` | 404 | sourceId not found or R2 object missing (upload did not complete) |
| `CONFLICT` | 409 | source already confirmed (status != 'pending') |

---

#### GET /api/projects/:id/sources

List all sources for a project.

**Response 200:**
```typescript
{
  data: Array<{
    id: string
    projectId: string
    type: string          // 'pdf' | 'docx' | 'csv' | 'txt' | 'url' | 'audio' | 'video' | 'xlsx'
    title: string | null
    url: string | null
    mimeType: string | null
    fileSize: number | null
    status: "pending" | "processing" | "processed" | "failed"
    errorMessage: string | null
    createdAt: string
    updatedAt: string
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

#### POST /api/projects/:id/sources/url

Add a URL source (no file upload needed -- processed via Jina Reader / readability).

**Request body:**
```typescript
{
  url: string       // required, valid https:// URL
  title?: string    // optional override; scraped title used if omitted
}
```

**Server actions:**
1. INSERT source row (type='url', status='pending')
2. Enqueue `process_source` job

**Response 201:**
```typescript
{
  data: {
    sourceId: string
    runId: string
    status: "processing"
  }
}
```

---

#### DELETE /api/projects/:id/sources/:sourceId

Deletes source, cascades to documents/chunks. Deletes R2 object if `r2Key` is set.

**Response 204:** No content.

---

### 4.3 Documents

#### GET /api/projects/:id/documents

**Query params:**
```
?screening_status=pending|included|excluded|maybe|flagged
&search=<freetext>    // FTS5 search within documents of this project
```

**Response 200:**
```typescript
{
  data: Array<{
    id: string
    sourceId: string
    title: string | null
    wordCount: number | null
    language: string
    screeningStatus: "pending" | "included" | "excluded" | "maybe" | "flagged"
    screeningReason: string | null
    relevanceScore: number | null
    createdAt: string
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

#### PATCH /api/projects/:id/documents/:docId

Update screening status (manual triage).

**Request body:**
```typescript
{
  screeningStatus?: "pending" | "included" | "excluded" | "maybe" | "flagged"
  screeningReason?: string | null
}
```

**Response 200:** Updated document object.

---

### 4.4 Schema Discovery and Confirmation

The 5-stage schema pipeline: discovery -> user confirms -> compile -> extract -> persist.

#### POST /api/projects/:id/schema/discover

Trigger schema discovery from project documents. Samples up to 5 representative chunks, calls LLM with discovery prompt (sift-kg pattern), stores proposed schema.

**Request body:**
```typescript
{
  instructions?: string    // optional: "I want vendor name, invoice total, line items"
                           // if omitted: fully automatic discovery (AUTO_SCHEMA_PROMPT)
  modelHint?: string       // optional: override LLM model for discovery
}
```

**Server actions:**
1. Validate project belongs to tenant and has processed documents
2. INSERT ingest_runs row (`run_type='schema_discovery'`)
3. INSERT ingest_jobs row (`job_type='discover_schema'`, `payload: { projectId, runId, instructions }`)
4. Send jobId to CF Queue

**Response 202:**
```typescript
{
  data: {
    runId: string     // poll /api/runs/:id
    message: "Schema discovery queued"
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `PRECONDITION_FAILED` | 412 | Project has no processed documents |

---

#### GET /api/projects/:id/schema

Get current schema proposals for a project.

**Response 200:**
```typescript
{
  data: Array<{
    id: string          // schema ULID
    projectId: string
    name: string        // e.g. "Interview Analysis v1"
    version: number
    status: "draft" | "confirmed" | "archived"
    discoveryPrompt: string | null
    modelUsed: string | null
    createdAt: string
    updatedAt: string
    fields: Array<{
      id: string
      parentFieldId: string | null
      name: string
      displayName: string | null
      type: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum"
      description: string | null
      required: boolean
      enumValues: string[] | null
      extractionHints: string | null
      sortOrder: number
    }>
  }>
}
```

---

#### PATCH /api/projects/:id/schema/:schemaId

Update schema metadata or field definitions before confirmation.

**Request body:**
```typescript
{
  name?: string
  fields?: Array<{
    id?: string                // omit for new fields
    parentFieldId?: string | null
    name: string
    displayName?: string
    type: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum"
    description?: string
    required?: boolean
    enumValues?: string[]      // for type=enum only
    extractionHints?: string
    sortOrder?: number
    _delete?: boolean          // set true to remove this field
  }>
}
```

**Response 200:** Updated schema with fields.

---

#### POST /api/projects/:id/schema/:schemaId/confirm

Mark schema as confirmed. This locks the schema for extraction.

**Request body:** `{}`

**Response 200:**
```typescript
{
  data: {
    id: string
    status: "confirmed"
    version: number
    confirmedAt: string
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `CONFLICT` | 409 | Schema already confirmed |
| `VALIDATION_ERROR` | 422 | Schema has no fields |

---

### 4.5 Extraction

#### POST /api/projects/:id/extract

Trigger structured extraction using the confirmed schema. Processes all `included` documents in the project.

**Request body:**
```typescript
{
  schemaId: string              // ULID of confirmed schema
  documentIds?: string[]        // optional: extract only these documents; default: all included
  forceReextract?: boolean      // default: false; if true, re-extracts already-extracted docs
}
```

**Server actions:**
1. Validate `schemaId` is confirmed and belongs to this project
2. INSERT `ingest_runs` row (`run_type='extraction'`)
3. For each target document: INSERT `ingest_jobs` row (`job_type='extract_entities'`)
4. Send all jobIds to CF Queue

**Response 202:**
```typescript
{
  data: {
    runId: string
    jobCount: number      // number of documents queued
    message: "Extraction queued"
  }
}
```

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `PRECONDITION_FAILED` | 412 | No confirmed schema with schemaId |
| `PRECONDITION_FAILED` | 412 | No included documents in project |

---

#### GET /api/projects/:id/entities

List extracted entities for a project.

**Query params:**
```
?entity_type=<string>    // filter by entity_type
&schema_id=<ULID>        // filter by schema version
&document_id=<ULID>      // filter by source document
&verified=true|false     // filter by human verification status
&page=1&limit=20
```

**Response 200:**
```typescript
{
  data: Array<{
    id: string
    schemaId: string
    documentId: string
    entityType: string
    data: Record<string, unknown>   // extracted key-value pairs
    confidence: number | null       // 0.0 to 1.0
    evidence: string | null         // supporting quote from source
    verified: boolean
    rejected: boolean
    annotation: string | null
    createdAt: string
  }>
  meta: { total: number; page: number; limit: number }
}
```

---

#### PATCH /api/projects/:id/entities/:entityId

Human review: verify, reject, or annotate an extracted entity.

**Request body:**
```typescript
{
  verified?: boolean
  rejected?: boolean
  annotation?: string | null
  data?: Record<string, unknown>    // allow correction of extracted values
}
```

**Response 200:** Updated entity object.

---

### 4.6 Hybrid Search (Query)

#### POST /api/projects/:id/query

Hybrid FTS5 + Vectorize + RRF search over the project knowledge base, followed by LLM synthesis.

**Request body:**
```typescript
{
  question: string          // required, max 2000 chars
  mode?: "hybrid" | "fts" | "vector"   // default: "hybrid"
  limit?: number            // max chunks to retrieve, default: 10, max: 50
  stream?: boolean          // default: true -- SSE streaming response
}
```

**Response (stream=false) 200:**
```typescript
{
  data: {
    answer: string                  // LLM synthesis
    sources: Array<{
      chunkId: string
      documentId: string
      documentTitle: string | null
      content: string               // full chunk text from D1
      score: number                 // RRF fused score
      ftsRank: number | null        // BM25 rank (negative; lower = better match)
      vectorScore: number | null    // cosine similarity
    }>
    queryStats: {
      ftsTimeMs: number
      vectorTimeMs: number
      rrfTimeMs: number
      totalTimeMs: number
      queryVariants: number         // how many rewrites were used
    }
  }
}
```

**Response (stream=true) 200:** SSE stream

```
Content-Type: text/event-stream

event: sources
data: {"sources": [...]}            // emitted first

event: token
data: {"token": "..."}              // streamed LLM tokens

event: done
data: {"totalTimeMs": 450}
```

**Search algorithm (hybrid mode):**
1. LLM query rewrite: 3 variants via `@cf/meta/llama-3.1-8b-instruct`
2. Parallel:
   - FTS5 MATCH on `document_chunks_fts` filtered by `project_id`, `tenant_id`, ORDER BY rank ASC, LIMIT 20
   - Vectorize.query per variant (topK=10, filter: `{ tenantId, projectId }`)
3. RRF merge (k=60): score(doc) = sum(1 / (k + rank)) across all result lists
4. Fetch top `limit` chunk texts from D1 by merged IDs (batched to <= 100 IDs per IN clause)
5. Inject chunks as context, stream LLM response

**Errors:**
| Code | Status | Condition |
|---|---|---|
| `PRECONDITION_FAILED` | 412 | Project has no indexed documents |
| `VALIDATION_ERROR` | 422 | question empty or too long |

---

### 4.7 Fallback LLM Chat

#### POST /api/projects/:id/chat

Direct LLM chat with optional KB grounding. Falls back to RAG if KB has relevant content; uses pure LLM otherwise.

**Request body:**
```typescript
{
  messages: Array<{
    role: "user" | "assistant"
    content: string
  }>                              // conversation history, max 20 messages
  useKb?: boolean                 // default: true -- attempt KB lookup first
  stream?: boolean                // default: true
}
```

**Response (stream=true) 200:** SSE stream
```
event: token
data: {"token": "..."}

event: done
data: {"model": "llama-3.3-70b", "kbUsed": true, "chunksUsed": 3}
```

**Provider waterfall (CF AI Gateway pattern):**
1. Workers AI `@cf/meta/llama-3.3-70b-instruct` (free tier)
2. NVIDIA NIM `meta/llama-3.3-70b-instruct` (paid, higher quality)
3. Groq `llama-3.3-70b-specdec` (fast fallback)

---

### 4.8 Canvas State

#### GET /api/projects/:id/canvas

Get all canvas frames and viewports for a project (all floors).

**Response 200:**
```typescript
{
  data: {
    frames: Array<{
      id: string
      module: string    // 'framing-studio' | 'corpus-triage' | 'evidence-extractor' | 'insight-canvas' | 'research-notebook' | 'blank'
      title: string
      x: number
      y: number
      width: number
      height: number
      zIndex: number
      minimized: boolean
      floor: number     // 0-5
      frameData: Record<string, unknown> | null
      createdAt: string
      updatedAt: string
    }>
    viewports: Array<{
      id: string
      floor: number
      panX: number
      panY: number
      zoom: number
      updatedAt: string
    }>
  }
}
```

---

#### PUT /api/projects/:id/canvas/frames

Upsert canvas frames (batch).

**Request body:**
```typescript
{
  frames: Array<{
    id?: string         // omit to create new
    module: string
    title: string
    x: number
    y: number
    width: number
    height: number
    zIndex: number
    minimized?: boolean
    floor: number
    frameData?: Record<string, unknown>
  }>
  merge?: boolean       // default: false -- if true, only update provided frames
}
```

**Response 200:**
```typescript
{ data: { updated: number; created: number } }
```

---

#### PUT /api/projects/:id/canvas/viewport

Upsert viewport state for a specific floor (UPSERT by unique(project_id, tenant_id, floor)).

**Request body:**
```typescript
{
  floor: number         // 0-5
  panX: number
  panY: number
  zoom: number          // 0.1 to 10.0
}
```

**Response 200:**
```typescript
{ data: { id: string; floor: number; panX: number; panY: number; zoom: number } }
```

---

### 4.9 Job and Run Status

#### GET /api/jobs/:jobId

Poll status of a single ingest or extraction job.

**Response 200:**
```typescript
{
  data: {
    id: string
    runId: string | null
    jobType: string           // 'process_source' | 'discover_schema' | 'extract_entities' | ...
    status: "pending" | "running" | "completed" | "failed"
    priority: number
    retryCount: number
    startedAt: string | null
    completedAt: string | null
    errorMessage: string | null
    createdAt: string
  }
}
```

---

#### GET /api/runs/:runId

Get high-level ingest run status with job summary.

**Response 200:**
```typescript
{
  data: {
    id: string
    projectId: string
    runType: "source_ingest" | "schema_discovery" | "extraction" | "reindex"
    status: "pending" | "running" | "completed" | "failed" | "cancelled"
    currentPhase: string | null
    totalItems: number
    processedItems: number
    failedItems: number
    startedAt: string | null
    completedAt: string | null
    errorMessage: string | null
    jobs: Array<{ id: string; status: string; jobType: string }>
  }
}
```

---

## 5. MCP Tools — CF Worker (/mcp)

MCP server implemented via `@cyanheads/mcp-ts-core` (mcp-ts-template v0.1.6). Transport: Streamable HTTP (MCP spec 2025-06-18). Entry point: `createWorkerHandler({ tools: [...] })`.

**Endpoint:** `POST /mcp` (also `GET /mcp` for SSE stream, `DELETE /mcp` for session termination)

**Protocol version:** 2025-06-18

**Session tracking:** `Mcp-Session-Id` request/response header. Sessions stored in `SESSION_KV` with TTL=24h and identity binding `{ tenantId, clientId }`. The in-memory `Map<string, Session>` from mcp-ts-template is replaced with KV: key `mcp:session:{sessionId}`.

**Auth:** workers-oauth-provider validates `Authorization: Bearer {access_token}` before routing to MCP handler. `ctx.props.userId` (set by `completeAuthorization` during consent) is the tenant ID for all D1/Vectorize queries. No dual JWT validation for MVP.

**Scope enforcement:** Each tool declares `auth: [scope]`. Framework rejects calls missing required scope before invoking handler.

**inputSchema format** (MCP spec 2025-06-18): JSON Schema object with `type: "object"`, `properties` (per-param type + description), `required` array. Zod schemas are compiled to JSON Schema by mcp-ts-template automatically.

---

### Tool: search_knowledge

```typescript
tool('search_knowledge', {
  title: 'Search Knowledge Base',
  description: 'Search the user\'s Harkly knowledge base using hybrid semantic and keyword search. Returns relevant document chunks with source metadata.',
  input: z.object({
    query: z.string().min(1).max(500).describe('Search query in natural language or keywords'),
    project_id: z.string().optional().describe('ULID of project to scope search; if omitted, searches all user projects'),
    limit: z.number().int().min(1).max(20).default(10).describe('Max results to return (Vectorize topK cap is 20)'),
    mode: z.enum(['hybrid', 'fts', 'vector']).default('hybrid').describe('Retrieval mode'),
  }),
  output: z.object({
    results: z.array(z.object({
      chunk_id: z.string(),
      document_id: z.string(),
      project_id: z.string(),
      content: z.string(),
      score: z.number().describe('RRF fused score, higher = more relevant'),
      source_title: z.string().nullable(),
      source_type: z.string(),
    })),
    total_found: z.number(),
    query_time_ms: z.number(),
  }),
  auth: ['knowledge:read'],
  annotations: { readOnlyHint: true },
})
```

---

### Tool: list_projects

```typescript
tool('list_projects', {
  title: 'List Projects',
  description: 'List all research projects in the user\'s Harkly workspace.',
  input: z.object({
    status: z.enum(['active', 'archived', 'all']).default('active'),
  }),
  output: z.object({
    projects: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      status: z.string(),
      source_count: z.number(),
      document_count: z.number(),
      created_at: z.string(),
    })),
  }),
  auth: ['knowledge:read'],
  annotations: { readOnlyHint: true },
})
```

---

### Tool: get_document

```typescript
tool('get_document', {
  title: 'Get Document',
  description: 'Retrieve the full extracted text content of a document in the user\'s knowledge base.',
  input: z.object({
    document_id: z.string().describe('ULID of the document'),
  }),
  output: z.object({
    id: z.string(),
    project_id: z.string(),
    title: z.string().nullable(),
    content: z.string(),
    word_count: z.number().nullable(),
    language: z.string(),
    source_type: z.string(),
    created_at: z.string(),
  }),
  auth: ['knowledge:read'],
  annotations: { readOnlyHint: true },
})
```

---

### Tool: list_extractions

```typescript
tool('list_extractions', {
  title: 'List Extracted Entities',
  description: 'List structured data entities extracted from project documents. Returns entities conforming to the confirmed schema.',
  input: z.object({
    project_id: z.string().describe('ULID of the project'),
    entity_type: z.string().optional().describe('Filter by entity type (e.g. "invoice", "person", "finding")'),
    limit: z.number().int().min(1).max(50).default(20),
    offset: z.number().int().min(0).default(0),
  }),
  output: z.object({
    entities: z.array(z.object({
      id: z.string(),
      entity_type: z.string(),
      data: z.record(z.unknown()),
      confidence: z.number().nullable(),
      evidence: z.string().nullable(),
      verified: z.boolean(),
      document_id: z.string(),
      created_at: z.string(),
    })),
    total: z.number(),
    schema_name: z.string().nullable(),
  }),
  auth: ['knowledge:read'],
  annotations: { readOnlyHint: true },
})
```

---

### Tool: add_note

```typescript
tool('add_note', {
  title: 'Add Note',
  description: 'Add a text note to the user\'s knowledge base. The note will be chunked, embedded, and become searchable.',
  input: z.object({
    project_id: z.string().describe('ULID of the target project'),
    title: z.string().min(1).max(255).describe('Short title for the note'),
    content: z.string().min(1).max(50000).describe('Note text content (markdown supported)'),
  }),
  output: z.object({
    document_id: z.string(),
    job_id: z.string(),
    message: z.string(),
  }),
  auth: ['knowledge:write'],
  annotations: { readOnlyHint: false, idempotentHint: false },
})
```

---

### Tool: get_schema

```typescript
tool('get_schema', {
  title: 'Get Project Schema',
  description: 'Get the confirmed structured extraction schema for a project, including all field definitions.',
  input: z.object({
    project_id: z.string().describe('ULID of the project'),
  }),
  output: z.object({
    schema_id: z.string().nullable(),
    schema_name: z.string().nullable(),
    version: z.number().nullable(),
    status: z.string().nullable(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().nullable(),
      required: z.boolean(),
      enum_values: z.array(z.string()).nullable(),
    })),
  }),
  auth: ['knowledge:read'],
  annotations: { readOnlyHint: true },
})
```

---

## 6. Queue Consumers — CF Workers

The queue consumer Worker receives messages from `INGEST_QUEUE`. Each message: `{ jobId: string }`. Consumer reads the full job from D1 `ingest_jobs` and routes by `job_type`.

**Stale job reset (run on every consumer invocation, before processing):**
```sql
UPDATE ingest_jobs
SET status = 'pending', started_at = NULL
WHERE status = 'running'
  AND started_at < datetime('now', '-5 minutes')
```

**Dead letter:** After `max_retries` (default 3) failures, job status set to `'failed'` with `error_message`.

---

### Consumer: process_source

**Trigger:** `job_type = 'process_source'`

**Payload:** `{ sourceId: string; runId: string }`

**Logic:**
1. SELECT source from D1 (validate tenant_id matches job tenant_id)
2. `env.HARKLY_R2.get(source.r2Key)` to read file bytes
3. Extract text by MIME type:

| mimeType | Handler | Runtime |
|---|---|---|
| `application/pdf` (< 5 MB) | `unpdf` | CF Worker (edge-native) |
| `application/pdf` (>= 5 MB) | `pdfjs-dist` via Modal | Modal.com Python worker |
| `application/vnd...wordprocessingml.document` | `mammoth.js extractRawText()` | CF Worker |
| `text/csv` | `papaparse` (each row = chunk) | CF Worker |
| `application/vnd.ms-excel` / `xlsx` | SheetJS | CF Worker |
| `text/plain` / `text/markdown` | direct text | CF Worker |
| `audio/*` / `video/*` | yt-dlp + Groq Whisper via Modal | Modal.com |
| source.type = `'url'` | Jina Reader (`r.jina.ai/{url}`) -> fallback `@mozilla/readability` + `linkedom` | CF Worker / external |

4. INSERT `documents` row (content guarded by TokenCounter: max 1.5 MB per row)
5. Enqueue `process_chunks` job

---

### Consumer: process_chunks

**Trigger:** `job_type = 'process_chunks'`

**Payload:** `{ documentId: string; runId: string }`

**Logic:**
1. SELECT document content from D1
2. RecursiveCharacterTextSplitter: `chunkSize=500`, `overlap=100`
3. For each batch of 10 chunks:
   - INSERT `document_chunks` rows (FTS5 `chunks_fts_insert` trigger fires automatically)
   - `env.AI.run('@cf/baai/bge-large-en-v1.5', { text: batchTexts })` -> 1024-dim embeddings
   - `env.VECTORIZE_INDEX.upsert(vectors)` with metadata: `{ tenantId, projectId, documentId, chunkId, chunkIndex, content: text.slice(0, 2000), sourceType }`
   - `RateLimiter.wait()` -- 500ms delay between batches (Vectorize rate: 100 req/min)
4. UPDATE source `status = 'processed'`
5. UPDATE ingest_runs `processed_items++`

**Constraints applied:**
- Vectorize metadata content capped at 2000 chars; full text stored in D1 `document_chunks.content`
- All `IN (id1, id2, ...)` D1 queries batched to <= 100 IDs (SQLite 999-variable limit)
- Vectorize topK hard cap: 20 per query (mitigated at query time by query rewriting to 3-5 variants)

---

### Consumer: discover_schema

**Trigger:** `job_type = 'discover_schema'`

**Payload:** `{ projectId: string; runId: string; instructions?: string }`

**Logic:**
1. Sample up to 5 chunks from `document_chunks` WHERE `project_id = ?` ORDER BY created_at ASC LIMIT 5
2. If `instructions` provided: two-call pipeline (extract field names from instruction -> build schema for those fields)
3. If no `instructions`: single call with AUTO_SCHEMA_PROMPT (sift-kg discovery prompt persona)
4. Parse LLM response to `SchemaField[]` intermediate representation
5. INSERT `project_schemas` row (status='draft')
6. INSERT `schema_fields` rows (recursive for nested fields)

---

### Consumer: extract_entities

**Trigger:** `job_type = 'extract_entities'`

**Payload:** `{ documentId: string; schemaId: string; runId: string }`

**Logic:**
1. SELECT confirmed schema from `project_schemas` + `schema_fields`
2. `convertToZodSchema(fields)` -> live ZodObject (documind pattern)
3. Generate document context: 1 LLM call -> 2-3 sentence summary (sift-kg `_generate_doc_context` pattern)
4. For each chunk of the document:
   - Build prompt: `minimalSchema(zodSchema)` + `collectDescriptions(zodSchema)` + doc_context + chunk_text (l1m pattern)
   - LLM call via Workers AI Llama 3.3 70B with MODE=TOOLS (instructor-js pattern)
   - `zodSchema.safeParseAsync(result)` validation
   - On failure: append assistant bad output + user "Please correct; errors: {zodErrors}" and retry (max 3 attempts)
5. Deduplicate entities: by `entity_type + name`, highest confidence wins (sift-kg `_dedupe_entities` pattern)
6. INSERT `extracted_entities` rows
7. UPDATE ingest_runs `processed_items++`

---

## 7. Request/Response Formats

### Envelope

```typescript
// Success
{
  data: T
  meta?: { total: number; page: number; limit: number }
}

// Error
{
  error: {
    code: string
    message: string
    details?: unknown      // field-level validation errors if VALIDATION_ERROR
    requestId?: string
  }
}
```

### Error codes

| HTTP | Code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Generic malformed request |
| 400 | `VALIDATION_ERROR` | Body failed schema validation; details has field errors |
| 401 | `UNAUTHORIZED` | Missing or expired session |
| 403 | `FORBIDDEN` | Resource belongs to another tenant |
| 404 | `NOT_FOUND` | Resource does not exist for this tenant |
| 409 | `CONFLICT` | State conflict (confirm already-confirmed schema, etc.) |
| 412 | `PRECONDITION_FAILED` | Required precondition not met |
| 429 | `RATE_LIMITED` | Rate limit exceeded; `Retry-After` header set |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 503 | `SERVICE_UNAVAILABLE` | Workers AI / Vectorize temporarily unavailable |

### Pagination

Default: `page=1`, `limit=20`. Max `limit=100`. Uses OFFSET pagination (acceptable at MVP scale with D1).

### SSE format

Used by `/api/projects/:id/query` and `/api/projects/:id/chat`.

```
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no

event: sources
data: {"sources": [...]}

event: token
data: {"token": "Hello"}

event: done
data: {"totalTimeMs": 312, "model": "llama-3.3-70b", "kbUsed": true}

event: error
data: {"code": "SERVICE_UNAVAILABLE", "message": "LLM provider unavailable"}
```

### Content types

| Route group | Request Content-Type | Response Content-Type |
|---|---|---|
| REST API | `application/json` | `application/json` |
| SSE endpoints (?stream=true) | `application/json` | `text/event-stream` |
| R2 presigned PUT | binary (direct from client to R2) | — |
| `/api/auth/*` | `application/json` | `application/json` |
| `/oauth/token` | `application/x-www-form-urlencoded` | `application/json` |
| `/mcp` POST | `application/json` | `application/json` or `text/event-stream` |

---

## 8. Rate Limits

### User-facing REST API (CF Pages Worker)

Rate limiting via better-auth KV-based rate limiter (`AUTH_KV`). Minimum window 60 seconds (CF KV TTL constraint).

| Endpoint group | Limit | Window |
|---|---|---|
| Auth sign-in / sign-up | 10 requests | 60 seconds per IP |
| Query / Chat | 30 requests | 60 seconds per user |
| Upload presign / confirm | 20 requests | 60 seconds per user |
| Schema discovery / extraction trigger | 5 requests | 60 seconds per user |
| General REST (CRUD) | 200 requests | 60 seconds per user |

Rate limit response: HTTP 429 + `Retry-After: <seconds>` header.

### MCP Worker

| Endpoint | Limit | Notes |
|---|---|---|
| `POST /mcp` (tool calls) | 60 requests/minute per OAuth client | Via SESSION_KV token bucket |
| `POST /oauth/token` | 10 requests/minute per client_id | Prevent token endpoint abuse |
| `POST /oauth/register` | 5 requests/minute per IP | Prevent client registration spam |

### Workers AI (internal)

Free tier: 10K neurons/day. Production requires Workers Paid plan. Rate limit errors trigger CF AI Gateway fallback to NIM -> Groq.

### Vectorize (internal)

100 requests/minute hard limit. Queue consumer wraps all Vectorize calls with `RateLimiter` (exponential backoff + jitter, from openai-sdk-knowledge-org). 500ms delay between embedding batches.

---

## 9. Security Notes

### Tenant isolation

All KB_DB queries include `tenant_id = session.user.id` (web app) or `tenant_id = ctx.props.userId` (MCP worker). `tenant_id` is always derived from the authenticated identity, never from request parameters.

Vectorize queries always include `filter: { tenantId: userId, projectId }` to prevent cross-tenant vector retrieval.

### Auth security model

| Layer | Mechanism |
|---|---|
| User sessions (web app) | better-auth session cookie (HttpOnly, Secure, SameSite=Strict). Token stored in D1 `session` table. Revocation: DELETE session row. |
| OAuth tokens (MCP) | workers-oauth-provider opaque tokens stored as SHA-256 hashes in OAUTH_KV. AES-GCM per-grant key encrypts `ctx.props`. Plaintext token never stored. |
| PKCE | Required for all `authorization_code` flows. Code challenge method: S256 only. |
| Refresh token rotation | Grace period: 2 tokens valid simultaneously. Non-compliant with strict OAuth 2.1 single-use requirement; pragmatic trade-off acknowledged by Cloudflare. |

### R2 file access

R2 presigned URLs are `PUT`-only. Files are never served via public read URLs. Worker reads files via `env.HARKLY_R2.get(key)` for processing. On source deletion, `env.HARKLY_R2.delete(key)` called synchronously.

### FTS5 injection prevention

FTS5 MATCH input must be sanitized before use. Wrap query in double quotes for exact phrase matching, escape internal quotes:
```typescript
const safeFts = `"${query.trim().replace(/"/g, '""')}"`;
```
This prevents special FTS5 operators (`AND`, `OR`, `NOT`, `*`, `"phrase"`) from being interpreted. The cloudflare-rag regex strip (`/[^\w\s]/g`) is insufficient -- it passes bare words like AND/OR which FTS5 interprets as operators.

### MCP session anti-hijacking

SESSION_KV entries store `{ tenantId, clientId, subject, lastAccessed }`. On every request, session is validated against current token's `{ tenantId, clientId }`. A session cannot be reused by a different client or tenant (mcp-ts-template identity-binding pattern from `sessionStore.ts`).

### CIMD compatibility

If ChatGPT or other clients use HTTPS URLs as `client_id` (Client ID Metadata Document, RFC 8414 extension), add `global_fetch_strictly_public` compatibility flag to `harkly-mcp` wrangler.toml. Not required for basic OAuth flow.

### KV eventual consistency

KV reads have 1-60 second eventual consistency. Token revocation after user sign-out has a brief grace window. Acceptable for MVP. For sensitive MCP write operations (add_note), add an explicit session validity check against AUTH_DB if immediate revocation is required.

---

## Sources

- `/c/Users/noadmin/nospace/docs/research/harkly-eval-mcp-auth.md` -- workers-oauth-provider, mcp-ts-template, better-auth-cloudflare evaluation; 3-layer Worker architecture; OAuth 2.1 flow; tool definition pattern; SessionStore KV replacement
- `/c/Users/noadmin/nospace/docs/research/harkly-eval-rag-pipeline.md` -- cloudflare-rag (FTS5+RRF+API routes), openai-sdk-knowledge-org (Queue consumers, D1 job schema), ai-rag-crawler (Workflow pattern reference)
- `/c/Users/noadmin/nospace/docs/research/harkly-research-mcp-access.md` -- MCP ecosystem state, recommendation, minimum viable MCP tools list
- `/c/Users/noadmin/nospace/docs/research/harkly-eval-schema-extract.md` -- 5-stage schema/extraction pipeline; documind (convertToZodSchema, prompts); sift-kg (discovery prompt, _dedupe_entities); l1m (minimalSchema, collectDescriptions); instructor-js (retry feedback loop, MODE strategy)
- `/c/Users/noadmin/nospace/docs/research/harkly-research-stack.md` -- B5 (R2 presigned URL flow, aws4fetch), B3 (CF Queues specs, pull consumers for Modal), B6 (Workers limits)
- `/c/Users/noadmin/nospace/docs/research/harkly-mvp-architecture.md` -- Section 3 (Service Architecture), worker topology, binding map, data flows
- `/c/Users/noadmin/nospace/docs/research/harkly-mvp-data-model.md` -- Section 3 (D1 Schema): table names, column names, FTS5 DDL, FTS5 trigger DDL, Vectorize metadata schema, R2 key format
- [MCP Transports spec 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [MCP Tool annotations: readOnlyHint](https://blog.marcnuri.com/mcp-tool-annotations-introduction)
- [Cloudflare Agents MCP transport docs](https://developers.cloudflare.com/agents/model-context-protocol/transport/)
- [MCP Streamable HTTP: single unified endpoint](https://medium.com/@jchris242005/mcp-streamable-http-and-single-unified-endpoint-architecture-46532852b8bb)
