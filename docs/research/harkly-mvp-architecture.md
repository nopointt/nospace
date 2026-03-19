# Harkly MVP -- Architecture Overview
> Date: 2026-03-19
> Status: Approved architectural blueprint for MVP implementation

---

## 1. System Overview

Harkly is a data intelligence platform that transforms unstructured inputs (audio, video, PDF, CSV, DOCX, URLs) into structured, queryable knowledge. The pipeline normalizes any data to text, uses AI to propose a relational schema from the content, lets the user confirm and refine that schema, then performs structured extraction into a database. Users access their knowledge through a spatial canvas UI, a built-in LLM chat, hybrid search, and an MCP server that exposes their data to external AI clients (Claude Desktop, ChatGPT, Gemini CLI, Grok).

```
                        +---------------------------+
                        |   MCP Clients (external)  |
                        |  Claude, ChatGPT, Gemini  |
                        +-------------|-------------+
                                      | Streamable HTTP + OAuth 2.1
                        +-------------|-------------+
    +--------+          |  CF Worker: harkly-mcp    |
    | Tauri  |  same    |  workers-oauth-provider   |
    | Desktop|  SolidJS |  + mcp-ts-template        |
    +---|----|  code    +-------------|-------------+
        |    |                        |
    +---|----|------------------------|--------------+
    |              CF Pages / Workers                |
    |   SolidStart (SSR) + SolidJS (client)         |
    |   Omnibar | Canvas (Floors) | Chat | Schema   |
    +-------|----------|----------|------|------------+
            |          |          |      |
    +-------|----------|----------|------|------------+
    |       v          v          v      v           |
    |   +------+  +--------+  +------+  +--------+  |
    |   |  D1  |  |   R2   |  | Vec  |  | Queues |  |
    |   |------+  +--------+  |torize|  +--------+  |
    |   | chunks |  originals | ANN   |  job msgs |  |
    |   | jobs   |            | search|            |  |
    |   | FTS5   |            |       |            |  |
    |   +--------+            +-------+            |  |
    |                Cloudflare Edge               |  |
    +----------------------------------------------|--+
                                                   |
                        +--------------------------|--+
                        |     Modal.com (Python)      |
                        |  Heavy processing:          |
                        |  - yt-dlp + Whisper          |
                        |  - Large PDF (pdfjs-dist)    |
                        |  - Instagram via Apify       |
                        +-----------------------------+
```

---

## 2. Stack Decisions

| Layer | Technology | Why this choice | Alternatives considered |
|---|---|---|---|
| **Frontend framework** | SolidStart 1.3.x + SolidJS 1.9.x | Fine-grained reactivity without virtual DOM; first-class CF Pages support via `preset: "cloudflare-pages"`; SSR for web, static for desktop from same codebase | Next.js (React, heavier bundle), Nuxt (Vue, less CF-native), Remix (React, now merged into React Router) |
| **Desktop shell** | Tauri 2 (stable) | Rust backend, WebView frontend = tiny binary; shares SolidJS code with web; `tauri-specta` for typesafe IPC | Electron (200+ MB binary, higher memory), Neutralinojs (less mature) |
| **Hosting** | Cloudflare Pages + Workers | Edge compute, zero cold starts, native D1/R2/Vectorize/Queues bindings; single vendor = simplified ops | Vercel (no D1/R2/Queues), AWS Lambda (cold starts, complex config), Fly.io (no native D1) |
| **Database** | Cloudflare D1 (SQLite) + Drizzle ORM | Per-user isolation natural for SQLite; D1 collocated with Workers = sub-ms latency; Drizzle = type-safe schema with `sqliteTable` | Supabase Postgres (external latency, 152-FZ concerns), PlanetScale (MySQL, shutting down free tier), Turso (LibSQL, extra vendor) |
| **Object storage** | Cloudflare R2 | S3-compatible, zero egress fees, native Worker binding; presigned URL uploads bypass Worker size limits | AWS S3 (egress fees), Supabase Storage (extra hop) |
| **Vector search** | Cloudflare Vectorize | Zero-latency colocation with Workers AI embeddings; 5M vectors per index; $0.05/M vectors/month | Pinecone (external latency, $50/mo min), Qdrant Cloud (better hybrid search but adds external dependency), pgvector (requires Postgres) |
| **Full-text search** | D1 FTS5 virtual table | Free, runs inside D1, BM25 ranking; combined with Vectorize via RRF for hybrid retrieval | Algolia (SaaS cost), Meilisearch (external service), Typesense (external service) |
| **Queue / async jobs** | CF Queues + D1 job table | At-least-once delivery, pull consumers for Modal.com, D1 gives full job state observability; strictly better than CF Workflows for per-document jobs | CF Workflows (durable but no per-job retry/observability), BullMQ (requires Redis), Inngest (external) |
| **Auth (user identity)** | better-auth + better-auth-cloudflare | Native SolidStart integration (`toSolidStartHandler`); D1 adapter; email+password + OAuth providers; per-request instantiation pattern for CF Workers | Auth.js (partial CF support), Lucia (deprecated as library), Clerk (SaaS, vendor lock-in) |
| **Auth (MCP OAuth)** | workers-oauth-provider | Cloudflare-maintained OAuth 2.1 + PKCE; KV-backed token storage with AES-GCM encryption; dynamic client registration for MCP clients | better-auth OAuth plugin (unverified JWKS support), custom OAuth (security risk) |
| **MCP server** | mcp-ts-template (`@cyanheads/mcp-ts-core`) | Streamable HTTP transport (MCP spec 2025-06-18); Zod tool builder with scope checks; CF Worker entry via `createWorkerHandler()`; pluggable auth strategies | workers-mcp (local stdio only, single-tenant, deprecated), custom implementation (months of work) |
| **Structured extraction** | instructor-js + Zod | Zod schema enforcement on LLM output; retry-with-error-feedback pattern; TOOLS/JSON_SCHEMA mode selection per provider; works with any OpenAI-compatible API | LangChain (heavy, over-abstracted), l1m (AJV not Zod, no schema inference), raw OpenAI SDK (no validation loop) |
| **Schema discovery** | sift-kg pattern (ported to TS) | Discovery-then-constrain: sample documents, LLM designs schema, cache and reuse; prevents type drift across chunks | documind autoschema (simpler but single-document), manual schema only (poor UX) |
| **Embeddings** | Workers AI `@cf/baai/bge-large-en-v1.5` (1024-dim) | Free, CF-native, proven in cloudflare-rag; zero external API dependency | OpenAI `text-embedding-3-small` (1536-dim, $0.02/M tokens, external call), Cohere (external) |
| **LLM (extraction)** | Workers AI Llama 3.3 70B (edge) + NVIDIA NIM fallback | Free Workers AI tier for lightweight tasks; NIM for high-quality extraction via OpenAI-compatible API | OpenAI GPT-4o (expensive at scale), Anthropic Claude (no Workers AI native) |
| **Transcription** | Groq Whisper Large v3 Turbo | $0.04/audio-hour, 216x real-time; 100 MB file limit manageable with chunking | Workers AI Whisper ($0.006/hr but smaller quota), AssemblyAI (more expensive) |
| **Canvas** | Custom SolidJS infinite canvas | Harkly-specific spatial metaphor (Floors, Frames, Branches); transform matrix pan/zoom already implemented in `harkly-shell`; ~600-800 lines | tldraw (React-only, commercial license), solid-flow (abandoned, no zoom/pan), infinitykit (requires extensive building) |
| **CSS** | Tailwind CSS 4 via `@tailwindcss/vite` | Utility-first, tree-shakeable, Vite plugin (not PostCSS); proven in solid-pages reference | UnoCSS (less ecosystem), vanilla CSS (slower development) |
| **Heavy processing** | Modal.com (Python) | Serverless Python functions; yt-dlp + pdfjs-dist + Apify clients; CF Queue pull consumers trigger Modal | Railway (always-on, costs more), self-hosted (ops burden) |

---

## 3. Service Architecture

### What runs where

| Service | Runtime | Responsibility |
|---|---|---|
| **SolidStart web app** | CF Pages (Workers behind the scenes) | SSR, routing, server functions, D1/R2/KV access, better-auth endpoints |
| **MCP server** | CF Worker (`harkly-mcp`) | OAuth 2.1 provider + MCP Streamable HTTP; separate Worker from web app for isolation |
| **Queue consumer** | CF Worker (queue handler) | Receives job messages from CF Queues; processes lightweight jobs (text extraction, chunking, embedding); delegates heavy jobs to Modal |
| **Modal Python worker** | Modal.com (serverless) | yt-dlp video download, Groq Whisper transcription, large PDF parsing, Instagram media via Apify; triggered by CF Queue pull consumer |
| **Tauri desktop** | Local (Rust + WebView) | Same SolidJS UI with `ssr: false` + `preset: "static"`; Tauri IPC for local filesystem, native menus, system tray |
| **Workers AI** | CF edge (implicit) | Embedding generation (`bge-large-en-v1.5`), query rewriting (Llama 3.1 8B), lightweight summarization |

### Worker topology

```
CF Pages Worker (SolidStart)
  bindings: D1(KB_DB), D1(AUTH_DB), R2(FILES), KV(AUTH_KV),
            VECTORIZE(PROD), QUEUE(INGEST), AI

CF Worker (harkly-mcp)
  bindings: D1(KB_DB), KV(OAUTH_KV), KV(MCP_SESSION_KV),
            VECTORIZE(PROD), AI

CF Worker (queue-consumer)
  bindings: D1(KB_DB), R2(FILES), VECTORIZE(PROD), AI
  trigger: QUEUE(INGEST)
```

---

## 4. Data Flow

### 4.1 Upload -> Process -> Store

```
User drops file in Omnibar or upload zone
  |
  v
SolidStart server action:
  1. Generate presigned R2 PUT URL (aws4fetch)
  2. Return URL to client
  |
  v
Client uploads file directly to R2
  key: {userId}/{kbId}/{fileId}.{ext}
  |
  v
Client confirms upload complete -> server action:
  3. INSERT document row in D1 (id, kbId, userId, name, mimeType, r2Key, status='uploaded')
  4. JobQueue.createJob("process_document", { fileId, kbId, userId })
     -> CF Queue.send({ jobId })
  5. Return { jobId, status: "queued" }
  |
  v
Queue consumer Worker receives message:
  6. Read job from D1 job_queue table
  7. Route by mimeType:
     - PDF:  unpdf (edge) or Modal.com (large files)
     - DOCX: mammoth.js
     - CSV:  papaparse
     - Audio/Video: -> Modal.com (yt-dlp + Groq Whisper)
     - URL:  Jina Reader (r.jina.ai) -> fallback @mozilla/readability
  8. Text output -> RecursiveCharacterTextSplitter (chunkSize=500, overlap=100)
  9. For each batch of 10 chunks:
     - Workers AI embed: @cf/baai/bge-large-en-v1.5 -> 1024-dim vectors
     - D1 INSERT document_chunks (with TokenCounter guard: max 1.5MB per row)
     - FTS5 trigger auto-syncs to document_chunks_fts
     - Vectorize.upsert(vectors, metadata: { kbId, docId, chunkId, content[0:2000] })
  10. markJobCompleted() -> UPDATE document status='indexed'
```

**Source:** cloudflare-rag (FTS5+trigger, batch embed, unpdf), openai-sdk-knowledge-org (JobQueue class, TokenCounter, batch upsert pattern with 500ms delay and RateLimiter).

### 4.2 Schema Discovery -> Confirmation -> Extraction

This is the 5-stage pipeline, combining sift-kg discovery with documind Zod compilation and instructor-js extraction.

```
STAGE 1: Schema Discovery
  Sample up to 5 representative chunks (first 3000 chars each) from the KB
  -> LLM call with discovery prompt (sift-kg pattern):
     "You are a schema architect. Analyze these document samples.
      Design 3-10 entity types with typed fields.
      Return JSON: { entity_types: { TYPE_NAME: { description, fields: [...] } } }"
  -> Parse response -> intermediate SchemaDefinition object
  -> Store proposed schema in D1 (schema_proposals table, status='proposed')

STAGE 2: User Confirmation (Harkly UI)
  Show proposed schema in the Framing Studio frame:
  - Field names, types (string/number/boolean/date/enum/array/object), descriptions
  - User can: accept / rename fields / change types / remove / add fields
  -> UPDATE schema status='confirmed', store user-edited SchemaDefinition

STAGE 3: Zod Schema Compilation (documind pattern)
  Confirmed SchemaDefinition -> convertToZodSchema() -> live ZodObject
  Uses recursive tree-walk: handles string, number, boolean, enum,
  object (recursive z.object), array (recursive z.array)

STAGE 4: Extraction (instructor-js pattern)
  For each document in the KB:
    a. Generate document context (sift-kg): 1 LLM call -> 2-3 sentence summary
    b. For each chunk:
       -> Build prompt: minimalSchema() + collectDescriptions() + doc_context + chunk_text
       -> LLM call via instructor-js MODE=TOOLS (or JSON_SCHEMA for NIM)
       -> Zod safeParseAsync() validation
       -> On failure: retry with error feedback (max 3 attempts)
       -> Extract structured rows
    c. Deduplicate entities by name+type (highest confidence wins)

STAGE 5: Persist to D1
  Validated extracted objects -> D1 INSERT into user's extraction tables
  Schema definition stored in D1 as "dataset schema" with version
  Incremental: track which documents extracted with which schema version
```

**Schema intermediate representation** (serializable, editable, compilable to Zod):
```typescript
type SchemaField = {
  name: string
  type: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum"
  description?: string
  required?: boolean
  children?: SchemaField[]   // for array/object
  enumValues?: string[]      // for enum
}
```

**Source:** sift-kg (build_discovery_prompt, _generate_doc_context, _dedupe_entities), documind (convertToZodSchema, AUTO_SCHEMA_PROMPT, BASE_EXTRACTION_PROMPT), instructor-js (retry-with-error-feedback, MODE strategy), l1m (minimalSchema, collectDescriptions).

### 4.3 Query (hybrid FTS5 + vector + RRF)

```
POST /api/kb/:kbId/query { question }
  |
  v
1. Query rewrite (Workers AI Llama 3.1 8B, free tier):
   LLM generates 3-5 query variants from the user's question
  |
  v
2. Parallel retrieval:
   a. FTS5: for each query variant ->
      SELECT id, text, rank FROM document_chunks_fts
      WHERE document_chunks_fts MATCH ?
      AND kbId = ?
      ORDER BY rank ASC  (BM25: lower rank = better match)
      LIMIT 20
   b. Vectorize: for each query variant ->
      embed query -> Vectorize.query(vector, { topK: 10, filter: { kbId } })
      (topK capped at 20 per Vectorize hard limit;
       multiple queries bypass this via query rewrite)
  |
  v
3. Reciprocal Rank Fusion (RRF):
   Merge FTS5 and Vectorize result lists
   score(doc) = sum( 1 / (k + rank_in_list) ) across all lists
   k = 60 (standard RRF constant)
   Sort by fused score descending -> top 10 chunk IDs
  |
  v
4. Fetch full chunks from D1:
   SELECT * FROM document_chunks WHERE id IN (top_10_ids)
   (batch to stay under SQLite 999-variable limit)
  |
  v
5. Inject as context -> stream LLM response via Workers AI or NIM
```

**Source:** cloudflare-rag (RRF implementation in `stream.ts` lines 80-106, query rewrite prompt, FTS5 search pattern). FTS5 rank sort direction bug fixed: use `ORDER BY rank ASC` (BM25 rank is negative in SQLite FTS5).

### 4.4 MCP Access

External AI clients (Claude Desktop, ChatGPT, Gemini CLI) connect to Harkly via MCP:

```
1. Client discovers OAuth metadata:
   GET /.well-known/oauth-authorization-server
   -> token_endpoint, authorization_endpoint, registration_endpoint

2. Client registers (dynamic, RFC 7591):
   POST /oauth/register { redirect_uris, client_name, ... }
   -> client_id, client_secret (if confidential)

3. Authorization (OAuth 2.1 + PKCE):
   Client redirects user browser to /authorize?client_id=...&code_challenge=...
   -> workers-oauth-provider parses request
   -> defaultHandler checks better-auth session
   -> If not logged in: redirect to /login (better-auth handles)
   -> If logged in: show consent UI
   -> User approves: completeAuthorization({ userId, scope, props: { userId } })
   -> Auth code issued -> client exchanges for access + refresh tokens

4. MCP session:
   POST /mcp (Authorization: Bearer {access_token})
   -> workers-oauth-provider validates token
   -> Routes to apiHandler (mcp-ts-template createWorkerHandler)
   -> ctx.props.userId = tenantId for all D1 queries
   -> Tool calls: search_knowledge, list_extractions, get_extraction, add_note
   -> D1 queries scoped: WHERE userId = ctx.props.userId
```

**Source:** workers-oauth-provider (OAuthProvider class, completeAuthorization, KV storage schema), mcp-ts-template (createWorkerHandler, tool builder, Streamable HTTP transport), better-auth-cloudflare (createAuth per-request pattern).

### 4.5 Fallback LLM Chat

When the user types a question in the Omnibar or Chat frame and the KB has no relevant results (or the user explicitly asks for a general question):

```
1. Run hybrid search (Section 4.3) against user's KB
2. If top result RRF score < threshold OR KB is empty:
   -> Route to general LLM chat (no RAG context)
   -> Workers AI Llama 3.3 70B or NIM meta/llama-3.3-70b-instruct
3. If results found:
   -> Standard RAG: inject top chunks as context, stream response
4. Stream response via SSE to the UI (Omnibar inline or Chat frame)
```

The LLM provider waterfall follows the CF AI Gateway pattern from cloudflare-rag: Workers AI (free) -> NIM (paid, higher quality) -> Groq (fast fallback). Single API call to AI Gateway handles provider failover.

---

## 5. Auth Architecture

Three-layer design on a single Cloudflare Worker (`harkly-mcp`), with the web app Worker handling user-facing auth separately.

```
Layer 1: workers-oauth-provider (outermost)
  Purpose: OAuth 2.1 Authorization Server for MCP clients
  Standards: OAuth 2.1 + PKCE, RFC 8414, RFC 9728, RFC 7591
  Storage: KV (OAUTH_KV) -- tokens stored as SHA-256 hashes,
           props encrypted with AES-GCM per-grant
  Endpoints:
    /oauth/token                             -- token exchange
    /oauth/register                          -- dynamic client registration
    /authorize                               -- consent flow entry
    /.well-known/oauth-authorization-server  -- RFC 8414 metadata
    /.well-known/oauth-protected-resource    -- RFC 9728 metadata

Layer 2: better-auth (user identity, inside defaultHandler)
  Purpose: User authentication (signup, login, session management)
  Storage: D1 (AUTH_DB) via Drizzle ORM -- user, session, account tables
  Integration: createAuth(env, cf) per-request (CF Workers pattern)
  Pattern:
    /authorize -> check better-auth session -> if none, redirect /login
    /api/auth/* -> better-auth.handler() (login, signup, OAuth providers)
    On consent: completeAuthorization({ userId: session.user.id, props: { userId } })

Layer 3: mcp-ts-template (MCP server, inside apiHandler)
  Purpose: MCP protocol handler with tool definitions
  Auth: Trust workers-oauth-provider token validation (Option A -- no dual validation)
  Identity: ctx.props.userId from workers-oauth-provider becomes tenantId
  Tools: Zod schemas with scope checks (e.g., auth: ['knowledge:read'])
  Session: KV-backed session store (replace in-memory Map from mcp-ts-template)
```

**Web app auth** (separate from MCP Worker):

```
SolidStart web app (CF Pages Worker):
  /api/auth/[...auth].ts -> toSolidStartHandler(getAuth(env))
  Middleware: cloudflare bindings -> auth session -> db init
  Session: better-auth manages via D1 + KV (rate limiting)
  Client: createAuthClient("better-auth/solid") -> authClient.useSession()
```

**Key design decisions:**

1. **workers-oauth-provider issues opaque tokens, not JWTs.** The MCP server trusts workers-oauth-provider's token validation and reads `ctx.props.userId` directly. No JWKS or dual validation needed for MVP.
2. **better-auth and workers-oauth-provider are complementary, not competing.** better-auth handles user identity (who is this person); workers-oauth-provider handles OAuth token lifecycle (issue, validate, revoke, refresh).
3. **Session store must be KV-backed.** The in-memory `SessionStore` from mcp-ts-template does not survive Worker restarts or multi-instance scaling. Replace with KV: key `mcp:session:{sessionId}`, TTL = staleTimeoutMs.

**Source:** workers-oauth-provider (OAuthProvider, PKCE enforcement, KV storage schema), better-auth-cloudflare (createAuth per-request, withCloudflare), mcp-ts-template (createWorkerHandler, sessionStore, tool builder with scope checks).

---

## 6. Frontend Architecture

### Dual-target build from single codebase

Harkly ships as both a web app (CF Pages) and a desktop app (Tauri 2) from the same SolidJS source code. The build target is selected via environment variable at build time.

**`app.config.ts` (conditional preset):**
```typescript
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

export default defineConfig({
  ssr: !isTauri,
  middleware: isTauri ? undefined : "./src/middleware.ts",
  server: {
    preset: isTauri ? "static" : "cloudflare-pages",
    ...(isTauri ? {} : { compatibilityDate: "2024-11-03" }),
  },
  vite: () => ({
    server: isTauri ? { port: 1420, strictPort: true } : {},
    envPrefix: ["VITE_", "TAURI_"],
    plugins: [tailwindcss()],
  }),
});
```

### Build matrix

| Target | Preset | SSR | D1/R2/KV | Command |
|---|---|---|---|---|
| Cloudflare Pages (web) | `cloudflare-pages` | Yes | Yes (native bindings) | `vinxi build` then `wrangler pages deploy` |
| Tauri desktop | `static` | No | No (API calls to hosted backend) | `tauri build` (calls `vinxi build` with TAURI env) |
| Local dev (web) | `cloudflare-pages` | Yes | Yes (PlatformProxy) | `vinxi dev` (middleware uses `wrangler.getPlatformProxy()`) |
| Local dev (desktop) | `static` | No | No | `tauri dev` (SolidStart on port 1420) |

### CF bindings injection (middleware pattern from solid-pages)

```typescript
// src/middleware.ts
const cloudflare = async (event: FetchEvent): Promise<void> => {
  if (import.meta.env.DEV) {
    const proxy = await wrangler.getPlatformProxy<Env>({ persist: true });
    event.locals.env = proxy.env;
    event.locals.cf = proxy.cf;
  } else {
    const context = event.nativeEvent.context;
    event.locals.env = context.cloudflare.env;
    event.locals.cf = context.cf;
  }
};
```

D1 access is always per-request: `createDb(event) -> drizzle(event.locals.env.DB, { schema })`. Never module-level.

### Canvas architecture

Harkly uses a custom SolidJS infinite canvas -- not solid-flow, not tldraw. The existing `harkly-shell` implementation (77 source files) provides the foundation:

**Already implemented (port from harkly-shell):**
- `Space.tsx`: Canvas 2D grid background with viewport-aware rendering (Cosmic Latte #FFF8E7)
- `useViewport.ts`: Pan (drag/middle-click), zoom (Ctrl+scroll toward cursor), horizontal pan (Shift+scroll); transform matrix: `{ x, y, zoom }`
- `useFloor.ts`: Floor system (Framing, Planning, Raw Data, Insights, Artifacts, Notebook) with branch management
- `useSnap.ts` + `snapUtils.ts`: Frame snapping and layout
- Frame system: `WindowFrame.tsx` as container, `frameRegistry.tsx` for component dispatch, 40+ frame types
- `Omnibar.tsx` + `OmnibarInput.tsx` + `OmnibarBody.tsx`: Primary input with command registry, context panels
- `useIntentPipeline.ts`: Intent-based command routing

**Canvas rendering approach:**
```
Container div (overflow: hidden, position: relative)
  <canvas> layer (Space.tsx) -- grid background, redrawn on viewport change
  Content div (transform: translate(x,y) scale(zoom))
    Frame components (position: absolute, left/top per frame)
  SVG overlay (same transform) -- edges/connections if needed
```

**Porting strategy:**
- `harkly-shell` is Tauri + plain SolidJS (no SolidStart)
- `harkly-saas` is Next.js/React with similar canvas concepts (Canvas.tsx, useCanvasState.ts, CanvasFrame.tsx)
- New codebase: SolidStart, unifying both into one source; canvas components port directly from harkly-shell's SolidJS code

### Tauri desktop bridge

Uses `tauri-specta` for typesafe IPC (from quantum template):
- Rust side: `#[tauri::command] #[specta::specta] fn command_name(...)`
- Build step generates `src/bindings.ts` with typed `commands` and `events`
- Frontend: `import { commands } from "~/bindings"` -- no raw invoke strings
- Desktop-only features: local filesystem access, system tray, native menus, auto-updates

### Project structure

```
harkly/
  app.config.ts             -- dual-target (CF Pages / static)
  wrangler.toml             -- D1 + R2 + KV + Vectorize + Queues + AI bindings
  drizzle.config.ts         -- sqlite dialect, local wrangler state path
  drizzle/                  -- migration SQL files
  src-tauri/                -- Rust (Tauri 2)
    Cargo.toml
    src/lib.rs, main.rs
    tauri.conf.json         -- devUrl:1420, frontendDist:../.output/public
  src/
    app.tsx                 -- ErrorBoundary + Router + FileRoutes
    entry-client.tsx
    entry-server.tsx
    middleware.ts            -- CF bindings + auth session + db init
    bindings.ts              -- generated by tauri-specta
    worker-configuration.d.ts -- generated by wrangler types
    components/
      canvas/               -- custom infinite canvas (ported from harkly-shell)
        Space.tsx            -- grid background
        Canvas.tsx           -- transform layer, pan/zoom handlers
        Frame.tsx            -- draggable frame container
        FrameRegistry.tsx    -- component dispatch by frame type
      omnibar/              -- primary input (ported from harkly-shell)
        Omnibar.tsx
        OmnibarInput.tsx
        CommandRegistry.ts
      schema/               -- schema discovery + confirmation UI
        SchemaEditor.tsx     -- edit proposed schema fields
        SchemaPreview.tsx    -- visualize schema as table structure
      frames/               -- frame type implementations
        harkly/             -- Harkly-specific frames
    db/
      client.ts             -- createDb(event): per-request D1
      schema.ts             -- Drizzle schema (KB tables)
      auth-schema.ts        -- better-auth generated schema
    lib/
      auth.ts               -- getAuth(env): lazy singleton
      auth-client.ts        -- createAuthClient (better-auth/solid)
    routes/
      api/
        auth/[...auth].ts   -- toSolidStartHandler
        kb/
          ingest.ts         -- upload + queue job
          query.ts          -- hybrid search + LLM
          schema/           -- discovery, confirm, extract
      (protected)/          -- auth-gated
        canvas.tsx
        ...
      (public)/
        index.tsx
        login.tsx
```

---

## 7. Processing Pipeline

### CF Queues + D1 job table pattern

The ingestion pipeline uses CF Queues as the notification mechanism and D1 as the durable state store. This is the pattern from openai-sdk-knowledge-org, which proved strictly better than CF Workflows for per-document jobs: individual job retry, full state observability, and no issues with transaction boundaries across durable steps.

**D1 job orchestration schema:**

```sql
-- Ingestion runs: one per user-triggered batch
CREATE TABLE ingest_runs (
  id TEXT PRIMARY KEY,              -- ULID
  kb_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,             -- 'running' | 'completed' | 'failed' | 'cancelled'
  current_phase TEXT,
  docs_total INTEGER DEFAULT 0,
  docs_processed INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT
);

-- Job queue: individual processing tasks
CREATE TABLE job_queue (
  id TEXT PRIMARY KEY,              -- ULID
  job_type TEXT NOT NULL,           -- 'process_document' | 'embed_chunks' | 'extract_schema'
  status TEXT NOT NULL,             -- 'pending' | 'running' | 'completed' | 'failed'
  priority INTEGER DEFAULT 0,
  payload TEXT NOT NULL,            -- JSON blob
  run_id TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  FOREIGN KEY (run_id) REFERENCES ingest_runs(id)
);

-- Documents: one row per uploaded file
CREATE TABLE documents (
  id TEXT PRIMARY KEY,              -- ULID
  kb_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT,
  mime_type TEXT,
  r2_key TEXT,
  text_content TEXT,                -- full extracted text (with TokenCounter guard)
  status TEXT NOT NULL,             -- 'uploaded' | 'processing' | 'indexed' | 'failed'
  created_at TEXT NOT NULL
);

-- Document chunks: one row per chunk
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY,              -- ULID, also used as Vectorize vector ID
  doc_id TEXT NOT NULL,
  kb_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- FTS5 virtual table with auto-sync trigger
CREATE VIRTUAL TABLE document_chunks_fts USING fts5(
  id UNINDEXED,
  doc_id UNINDEXED,
  kb_id UNINDEXED,
  text,
  content = 'document_chunks'
);

CREATE TRIGGER document_chunks_ai AFTER INSERT ON document_chunks
BEGIN
  INSERT INTO document_chunks_fts(id, doc_id, kb_id, text)
  VALUES (new.id, new.doc_id, new.kb_id, new.text);
END;

-- Query stats: observability for search performance
CREATE TABLE query_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kb_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  fts_time_ms INTEGER,
  vector_time_ms INTEGER,
  created_at TEXT NOT NULL
);

-- Schema proposals: AI-generated + user-confirmed schemas
CREATE TABLE schema_proposals (
  id TEXT PRIMARY KEY,              -- ULID
  kb_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,             -- 'proposed' | 'confirmed' | 'archived'
  schema_definition TEXT NOT NULL,  -- JSON SchemaField[]
  version INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  confirmed_at TEXT
);
```

**Source:** cloudflare-rag (FTS5 DDL + trigger), openai-sdk-knowledge-org (job_queue, ingest_runs, query_stats tables, stale job detection).

### Format handlers

| Format | Handler | Runtime | Notes |
|---|---|---|---|
| PDF (small, <5MB) | `unpdf` | CF Worker (edge) | Designed for edge runtimes, unjs ecosystem |
| PDF (large, >5MB) | `pdfjs-dist` | Modal.com (Python) | Avoids Worker 128MB memory limit |
| DOCX | `mammoth.js` | CF Worker | `extractRawText({ buffer })` -> plain text |
| CSV / XLSX | `papaparse` / SheetJS | CF Worker | Parse to rows, each row becomes a chunk |
| Audio / Video (direct upload) | Groq Whisper via Modal | Modal.com | Split at 25-min intervals (100MB limit) |
| YouTube URL | `youtube-transcript-api` -> fallback yt-dlp + Groq Whisper | Modal.com | Captions first (free), audio fallback |
| Web URL | Jina Reader (`r.jina.ai`) -> fallback `@mozilla/readability` + `linkedom` | CF Worker / external | Jina free tier: 1M tokens/month |
| Instagram Reel | Apify API -> Groq Whisper | Modal.com | Pay-as-you-go, graceful degradation |

### Queue consumer flow

```
CF Queue message received: { jobId }
  |
  v
Read job from D1: SELECT * FROM job_queue WHERE id = ?
  |
  v
Check for stale jobs: UPDATE job_queue SET status='pending'
  WHERE status='running' AND started_at < datetime('now', '-5 minutes')
  |
  v
Mark job running: UPDATE job_queue SET status='running', started_at=now()
  |
  v
Route by job_type:
  "process_document":
    -> read file from R2
    -> extract text (format handler by mimeType)
    -> chunk text (RecursiveCharacterTextSplitter, 500/100)
    -> batch embed + D1 insert + Vectorize upsert (batches of 10, 500ms delay)
    -> update document status='indexed'

  "extract_schema":
    -> sample 5 chunks from KB
    -> LLM discovery call -> SchemaDefinition
    -> D1 INSERT schema_proposals (status='proposed')

  "run_extraction":
    -> load confirmed schema from D1
    -> convertToZodSchema()
    -> for each document: extract chunks per schema
    -> D1 INSERT extraction results
  |
  v
Mark job completed/failed: UPDATE job_queue SET status=?, completed_at=now()
```

---

## 8. Limits & Constraints

| Constraint | Value | Impact on Harkly | Mitigation |
|---|---|---|---|
| **D1 max DB size** | 10 GB | Sufficient for MVP; text chunks + metadata well under 10 GB for thousands of documents | Monitor usage; if approaching, shard by user (one D1 per power user) -- D1 supports 50,000 DBs per account |
| **D1 single-threaded** | One write at a time per DB | Concurrent writes from multiple users serialized | Per-user D1 databases if contention becomes measurable; for MVP, single DB is fine |
| **D1 row size** | Max ~2 MB per row | Large document text_content field | TokenCounter.validateAndTruncateContent() enforces 1.5 MB safe limit before insert |
| **D1 SQLite 999-variable limit** | `WHERE id IN (...)` max 999 params | Batch queries for chunk retrieval | Batch all `IN` queries to 100 IDs per statement (openai-sdk-knowledge-org pattern) |
| **Vectorize topK hard limit** | 20 results per query | Single query returns max 20 vectors | Multiple query vectors via query rewrite (3-5 variants) effectively returns 60-100 candidates before RRF dedup |
| **Vectorize max vectors/index** | 5,000,000 | ~10M chunks across all users in one index | Filter by userId/kbId in metadata; if approaching limit, create per-tenant indexes |
| **Vectorize metadata** | ~2000 chars per vector | Full chunk text may exceed this | Store full text in D1 `document_chunks.text`; use metadata only for quick snippet display and filtering |
| **Workers memory** | 128 MB hard limit | Large PDF parsing in a Worker is risky | Offload files >5 MB to Modal.com via Queue pull consumer |
| **Workers CPU time** | 30s default, up to 5 min configurable (paid) | Embedding 100+ chunks in one request may hit limit | Queue-based: each job processes one document, not entire KB |
| **Workers subrequest limit** | 50 (free) / 1000 (paid) | Each AI.run + Vectorize.upsert + D1 insert = 3 subrequests per batch | Queue consumer processes in batches of 10; 100-chunk doc = 10 batches = ~30 subrequests. Paid plan (1000) is required |
| **Workers compressed size** | 10 MB (paid) | With dependencies (mammoth, unpdf, Drizzle, etc.) | Tree-shake aggressively; offload heavy deps to Modal |
| **R2 request body size** | 100 MB via Worker, 5 GB via presigned URL | Direct upload to Worker limited | Presigned URL flow for all file uploads (client -> R2 direct) |
| **CF Queues message limit** | 128 KB per message | Job payload must be compact | Store minimal data in message (jobId only); full payload in D1 job_queue.payload |
| **CF Queues free plan** | Not available; paid only ($0.40/M messages) | Must be on Workers Paid plan | Cost is negligible: 100K messages/month = $0.04 |
| **Groq file size** | 100 MB per request | Long audio must be chunked | Split audio at ~25-minute intervals before sending to Whisper |
| **Workers AI free tier** | 10K neurons/day | Development only; production hits this quickly | Budget Workers AI for embeddings + query rewrite only; use NIM/Groq for heavy LLM tasks |
| **FTS5 rank semantics** | Rank = negative BM25 score | `ORDER BY rank DESC` is WRONG (ascending quality) | Always use `ORDER BY rank ASC` for best-match-first |
| **KV eventual consistency** | 1-60 second propagation | Token revocation has brief grace window | Acceptable for MVP; add explicit revocation check on sensitive operations if needed |

**Source:** openai-sdk-knowledge-org (topK limit, 999-variable limit, row size guard), cloudflare-rag (subrequest limit, FTS5 rank bug), harkly-research-stack Section B (all CF service limits).

---

## 9. Risk Register

| # | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | **Vinxi/SolidStart local dev + CF bindings broken.** `nitro-cloudflare-dev` does not work with vinxi. | High | Confirmed | Use `wrangler pages dev` or middleware PlatformProxy pattern from solid-pages. Cloudflare tracking fix in workers-sdk #5912. |
| R2 | **D1 10 GB limit reached as user base grows.** Single shared DB for all users. | Medium | Low (MVP) | Monitor via D1 dashboard. Migration path: per-user D1 databases (50K DBs per account supported). |
| R3 | **Workers 128 MB memory OOM on large file processing.** PDF/DOCX parsing of 50+ page documents in-Worker. | High | Medium | Route files >5 MB to Modal.com; unpdf for small PDFs only. Queue consumer never processes multiple large files concurrently. |
| R4 | **Vectorize topK=20 limits recall quality.** Single query returns max 20 results. | Medium | Confirmed | Query rewrite to 3-5 variants before searching; each variant gets topK=10; RRF merges all results. Effective pool: 30-50 unique chunks. |
| R5 | **MCP SessionStore is in-memory (mcp-ts-template).** Sessions lost on Worker restart or scale-out. | High | Certain | Replace with KV-backed SessionStore. Key: `mcp:session:{sessionId}`, value: JSON, TTL = staleTimeoutMs. |
| R6 | **better-auth + D1 per-request instantiation cold-start cost.** Auth object created on every request. | Low | Confirmed | CF Workers cache module-level singletons; per-request cost is config assembly only, not full init. Benchmark and cache if measurable. |
| R7 | **Schema discovery quality varies by document type.** LLM may propose poor schemas for unusual data. | Medium | Medium | User confirmation step is mandatory; users edit before extraction runs. Add preset templates for common types (invoices, contacts, research notes). |
| R8 | **FTS5 query injection via MATCH operator keywords.** User query containing AND/OR/NOT misinterpreted. | Medium | Medium | Sanitize FTS5 queries: escape all special characters, wrap terms in double quotes for exact matching. Fix cloudflare-rag's incomplete sanitization. |
| R9 | **Instagram scraping blocked by ToS enforcement.** Apify endpoints change or get blocked. | Medium | Medium | Build with graceful degradation: if Apify fails, return clear error to user. Instagram is not a core pipeline; URL and file upload are primary. |
| R10 | **workers-oauth-provider refresh token non-compliance.** Grace period approach deviates from OAuth 2.1 single-use requirement. | Low | Confirmed | Pragmatic trade-off acknowledged by Cloudflare. Two valid refresh tokens at any time. Acceptable for MVP. |
| R11 | **Dual build target (CF Pages + Tauri) config complexity.** Single `app.config.ts` must handle both presets. | Medium | Confirmed | Env-flag conditional (`TAURI_ENV_PLATFORM`) tested in quantum template. CI must run both builds separately. |
| R12 | **CF Queues + D1 job table stale job accumulation.** Worker crashes leave jobs in 'running' state. | Low | Low | Stale job detection: reset jobs stuck in 'running' > 5 minutes to 'pending' on every consumer invocation (openai-sdk-knowledge-org pattern). |
| R13 | **Vectorize metadata 2000-char truncation.** Chunk content longer than 2000 chars in metadata is silently truncated. | Low | Confirmed | Full chunk text stored in D1 `document_chunks.text`. Vectorize metadata holds only a snippet for scoring and quick preview. Retrieval always fetches from D1. |
| R14 | **CIMD (Client ID Metadata Document) requires `global_fetch_strictly_public` flag.** ChatGPT and other clients may use HTTPS URLs as client_id. | Low | Low | Add compatibility flag to wrangler.toml when enabling CIMD. Not required for MVP dynamic client registration flow. |

---

*Architecture grounded in: harkly-eval-rag-pipeline.md, harkly-eval-mcp-auth.md, harkly-eval-ui-canvas.md, harkly-eval-schema-extract.md, harkly-research-stack.md. Every claim traces to a specific research finding from these files.*
