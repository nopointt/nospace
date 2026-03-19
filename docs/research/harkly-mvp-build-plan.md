# Harkly MVP -- Build Plan
> Date: 2026-03-19
> Stack: SolidStart + CF Workers/Pages + D1 + Vectorize + R2 + Queues + Tauri 2
> Frontend baseline: 77 SolidJS files (canvas + Omnibar + 25+ frame types, ~85% coverage)
> Backend baseline: 0% -- everything from scratch, patterns from research ready

---

## 1. Principles

**Ship fast.** Competitive window is real -- NotebookLM, Perplexity, Khoj could each add a piece of what Harkly does. The moat is doing all five together (any-format ingestion, AI schema, structured DB, MCP/API, spatial canvas) before anyone else ships the combination.

**Use existing code.** 77 SolidJS files from harkly-shell are battle-tested. The harkly-saas React codebase (Next.js/Prisma/Supabase) has proven API patterns, data models (Document, Extraction, Artifact, Note, Source, Workspace), and UI flows (corpus, extract, canvas, notebook, framing). Port logic, not syntax.

**Copy-paste from research.** Every eval document has a "What to Steal" section with exact files and line numbers. Use them. Do not reinvent FTS5 triggers, RRF functions, job queue schemas, or OAuth flows.

**Don't over-engineer.** No microservices. No event sourcing. No CQRS. One SolidStart app, one Worker, one D1 database per user tier, one Vectorize index. Add complexity only when real users hit real limits.

**Test manually.** No test infrastructure in MVP. Each phase has acceptance criteria with exact commands or user actions. Domain Lead writes verification commands into every spec.

**Fail gracefully.** Every external call (LLM, R2, Vectorize, Groq) must have: timeout, retry with backoff, user-visible error message. Silent failures are the worst UX.

---

## 2. Phase 0 -- Scaffold (Day 1-2)

### Goal
SolidStart app deploys to CF Pages, auth works, D1 reads/writes work, wrangler.toml has all bindings.

### Tasks

**2.1. Bootstrap SolidStart + CF Pages**
- Run `npm create cloudflare@latest harkly -- --framework=solid`
- Configure `app.config.ts`: `preset: "cloudflare-pages"`, `compatibilityDate`, middleware path
- Add `nodejs_compat` compatibility flag to `wrangler.toml`
- Verify: `vinxi dev` starts, `wrangler pages deploy` succeeds, site loads at CF Pages URL

**2.2. Add all CF bindings to wrangler.toml**
```toml
[[d1_databases]]
binding = "DB"
database_name = "harkly-prod"

[[d1_databases]]
binding = "AUTH_DB"
database_name = "harkly-auth"

[[kv_namespaces]]
binding = "OAUTH_KV"

[[kv_namespaces]]
binding = "AUTH_KV"

[[r2_buckets]]
binding = "R2"
bucket_name = "harkly-uploads"

[[queues.producers]]
binding = "INGEST_QUEUE"
queue = "harkly-ingest"

[[queues.consumers]]
queue = "harkly-ingest"
max_batch_size = 10
max_retries = 3

[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "harkly-kb"
```

**2.3. D1 schema -- initial migration**
- Create D1 databases via `wrangler d1 create`
- Install Drizzle ORM + drizzle-kit
- Write initial schema (from openai-sdk-knowledge-org pattern + harkly-saas Prisma models):

Core tables:
```
users (id, email, name, created_at)
knowledge_bases (id, user_id, name, status, created_at)
documents (id, kb_id, name, mime_type, r2_key, text_content, status, created_at)
document_chunks (id, doc_id, kb_id, chunk_index, text, created_at)
document_chunks_fts (FTS5 virtual table, content=document_chunks, trigger on insert)
schemas (id, kb_id, name, definition_json, status, created_at)
extracted_rows (id, kb_id, schema_id, doc_id, data_json, confidence, created_at)
ingest_jobs (id, kb_id, doc_id, job_type, status, payload_json, retry_count, created_at, completed_at, error)
query_stats (id, kb_id, query, results_count, response_time_ms, created_at)
```

- Copy FTS5 virtual table + trigger DDL from cloudflare-rag eval
- Run `drizzle-kit generate` then `wrangler d1 migrations apply --local`
- Port `createDb(event)` per-request pattern from solid-pages

**2.4. Auth -- better-auth + D1**
- Install `better-auth`, `better-auth-cloudflare`
- Create auth instance with lazy singleton pattern (D1 binding only available per-request)
- Mount at `/api/auth/[...auth]` via `toSolidStartHandler`
- Enable email+password (MVP -- add OAuth providers later)
- Create `auth-client.ts` with `createAuthClient` for SolidJS
- Verify: register, login, session check all work

**2.5. Middleware -- CF binding injection**
- Port middleware pattern from solid-pages: `wrangler.getPlatformProxy()` for dev, native context for prod
- Chain: cloudflare bindings -> auth session -> db instance -> request handler
- Generate `worker-configuration.d.ts` via `wrangler types`

**2.6. Tauri 2 dual-build config (stub)**
- Do NOT build Tauri yet -- just prepare `app.config.ts` to switch preset based on `TAURI_ENV_PLATFORM`
- Add placeholder `src-tauri/` directory from quantum template
- Actual Tauri integration = Phase 4

### What to clone/copy from where

| Source | What | Notes |
|---|---|---|
| C3 scaffold | Project skeleton | `npm create cloudflare@latest` |
| solid-pages | `app.config.ts`, `middleware.ts`, `db/client.ts`, `drizzle.config.ts` | Critical CF patterns |
| solid-pages | `wrangler.toml` structure | Extend with all Harkly bindings |
| cloudflare-rag | FTS5 DDL + trigger SQL | Copy verbatim into migration |
| openai-sdk-knowledge-org | `ingest_jobs` + `query_stats` table DDL | Copy, adapt column names |
| better-auth docs | SolidStart integration code | Route handler + client setup |
| harkly-saas | Prisma model names/fields | Reference for D1 schema design |

### Dependencies (none -- this is the foundation)

### Acceptance
- [ ] `vinxi dev` starts without errors, loads in browser
- [ ] `wrangler pages deploy` succeeds, site loads at CF Pages URL
- [ ] Register new user, login, see authenticated page
- [ ] Server function reads/writes to D1 (insert a test row, read it back)
- [ ] `wrangler d1 migrations apply harkly-prod` runs cleanly on remote

---

## 3. Phase 1 -- Upload + Process (Day 3-7)

### Goal
Upload any file -> text extracted -> chunks in D1 + Vectorize -> original in R2. Progress visible to user.

### Tasks

**3.1. R2 presigned upload endpoint**
- Install `aws4fetch`
- Server action: accept filename + content-type -> generate presigned PUT URL (15 min expiry)
- Client uploads directly to R2 (bypasses Worker 100MB body limit)
- On upload complete: client calls server to confirm -> insert `documents` row in D1 with `status: "uploaded"`
- R2 key format: `{userId}/{kbId}/{docId}.{ext}`

**3.2. Queue producer -- enqueue ingest job**
- After document row inserted: `INGEST_QUEUE.send({ jobType: "process_document", docId, kbId })`
- Insert `ingest_jobs` row with `status: "queued"`
- Return `{ jobId, status: "queued" }` to client

**3.3. Queue consumer -- text extraction**
- Separate queue consumer handler in the Worker
- Read file from R2 by key
- Route by MIME type:
  - PDF: `unpdf` (edge-native, from cloudflare-rag)
  - DOCX: `mammoth.js` (extractRawText)
  - CSV/XLSX: `xlsx` (SheetJS) -> convert to text representation
  - TXT/MD: read as-is
  - JSON: JSON.stringify with formatting
  - URL (webpage): Jina Reader API (`r.jina.ai`) -> markdown
- Store extracted `text_content` in `documents` table
- Update document `status: "text_extracted"`
- Copy `TokenCounter.validateAndTruncateContent()` from openai-sdk-knowledge-org to guard D1 row size

**3.4. Queue consumer -- chunking + embedding**
- After text extraction: `RecursiveCharacterTextSplitter(chunkSize=500, overlap=100)`
- For each batch of 10 chunks:
  - `AI.run("@cf/baai/bge-large-en-v1.5", { text: batchTexts })` -> embeddings
  - D1 insert `document_chunks` rows (FTS5 trigger auto-syncs)
  - `VECTORIZE.upsert(vectors)` with metadata: `{ kbId, docId, chunkId, content: text.substring(0, 2000) }`
- Copy `IdUtils.ensureSafeId()` from openai-sdk-knowledge-org for Vectorize ID safety
- Copy `RateLimiter` from openai-sdk-knowledge-org for Vectorize API calls (100 req/min + backoff)
- Batch Vectorize upserts in groups of 100, 500ms delay between batches
- Update document `status: "indexed"`, mark ingest job `status: "completed"`

**3.5. Upload UI (minimal)**
- File picker + drag-and-drop zone
- Progress indicator: "Uploading..." -> "Processing..." -> "Indexed"
- Poll `/api/kb/:kbId/jobs/:jobId` for status (ai-rag-crawler Workflow status poll pattern)
- List of documents in knowledge base with status badges

**3.6. Job status API**
- `GET /api/kb/:kbId/jobs` -- list recent jobs with status
- `GET /api/kb/:kbId/jobs/:jobId` -- single job detail
- Stale job detection: jobs stuck in "running" > 5 min -> reset to "pending" (openai-sdk-knowledge-org pattern)

### What to clone/copy from where

| Source | What | Notes |
|---|---|---|
| cloudflare-rag | `unpdf` usage for PDF extraction | Exact import pattern |
| cloudflare-rag | Batch embedding with `AI.run()` | `insertVectors()` pattern |
| cloudflare-rag | ULID as Vectorize vector ID | Use `ulid` package |
| openai-sdk-knowledge-org | `JobQueue` class (`src/pipeline/job-queue.ts`) | Copy, adapt types |
| openai-sdk-knowledge-org | `RateLimiter` class (`src/rate-limiter.ts`) | Copy unchanged |
| openai-sdk-knowledge-org | `TokenCounter` class (`src/pipeline/token-counter.ts`) | Copy unchanged |
| openai-sdk-knowledge-org | `VectorStoreImpl.storeInVectorize()` | Batch=100, 500ms delay |
| openai-sdk-knowledge-org | `IdUtils.ensureSafeId()` | Copy unchanged |
| ai-rag-crawler | Workflow status polling API pattern | `GET /api/.../workflow/:id` |
| harkly-saas | `AddSourcesPanel.tsx`, `CorpusPage.tsx` logic | Port upload UI flow |

### Dependencies
- Phase 0 complete (D1 schema, auth, CF bindings)

### Acceptance
- [ ] Upload a PDF -> appears in R2 -> text extracted -> chunks in D1 -> vectors in Vectorize
- [ ] Upload a DOCX -> same pipeline works
- [ ] Upload a CSV -> parsed to text -> indexed
- [ ] Upload a plain text file -> indexed
- [ ] Paste a URL -> Jina Reader fetches content -> indexed
- [ ] Job status API shows correct transitions: queued -> running -> completed
- [ ] Upload a 5MB PDF -> does not hit D1 row size limit (TokenCounter guards it)
- [ ] Upload 3 files concurrently -> all process correctly via queue

---

## 4. Phase 2 -- Schema + Extract (Day 8-14)

### Goal
Upload documents -> AI proposes schema -> user confirms/edits -> structured extraction to D1 rows. This is the killer feature.

### Tasks

**4.1. Schema discovery endpoint**
- `POST /api/kb/:kbId/schema/discover`
- Sample up to 5 document chunks from the knowledge base (first 3000 chars each)
- LLM call with discovery prompt (hybrid of sift-kg `build_discovery_prompt()` + documind `AUTO_SCHEMA_PROMPT`):
  - Persona: "You are a schema architect"
  - Input: document samples
  - Output: `SchemaField[]` tree -- name, type, description, required, children
- LLM provider: `AI.run("@cf/meta/llama-3.1-70b-instruct")` (free Workers AI) for schema discovery
- Parse response with `parse_llm_json()` pattern (strip fences, scan balanced braces) from sift-kg
- Store proposed schema in `schemas` table with `status: "proposed"`
- Return schema to client for user review

**4.2. Schema representation (intermediate format)**
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
- Serializable to JSON (stored in D1 `schemas.definition_json`)
- Editable by users in UI
- Compilable to Zod via `convertToZodSchema()` from documind

**4.3. Zod schema compilation**
- Port `convertToZodSchema(fields)` from documind (`extractor/src/utils/convertToZodSchema.js`)
- Tree-walk: string, number, boolean, date, enum, object (recursive), array (recursive)
- Compile user-confirmed `SchemaField[]` -> live `ZodObject` for extraction

**4.4. Schema confirmation UI**
- Show proposed schema as editable field list
- User can: rename fields, change types, toggle required, remove fields, add fields, reorder
- "Confirm Schema" button -> update `schemas` status to `confirmed`
- Port UI patterns from harkly-saas `FrameFields.tsx` and `FramingStudio.tsx`

**4.5. Extraction pipeline**
- `POST /api/kb/:kbId/extract` with `schemaId`
- For each document in the knowledge base:
  - Generate document context summary (1 LLM call per doc -- sift-kg `_generate_doc_context()` pattern)
  - For each chunk:
    - Build extraction prompt using `minimalSchema()` from l1m (compact schema representation in prompt)
    - LLM call with MODE=TOOLS or JSON_SCHEMA (instructor-js pattern) via Workers AI
    - Zod `safeParseAsync()` validation
    - On failure: retry with error feedback (instructor-js pattern -- append bad output + Zod errors, retry, max 3 attempts)
    - Insert validated rows into `extracted_rows` table
  - Merge/deduplicate extracted rows per document (sift-kg `_dedupe_entities()` pattern adapted for flat records)
- Track extraction progress in `ingest_jobs` (reuse queue + job table from Phase 1)

**4.6. Extraction results UI**
- Table view of extracted rows (columns from schema, rows from extraction)
- Confidence score per row (color-coded: green > 0.8, yellow > 0.5, red < 0.5)
- Click row -> shows source chunk with highlight
- Export to CSV
- Port patterns from harkly-saas `ExtractPage.tsx` and extraction API routes

**4.7. Instruction-guided schema (alternative to full auto)**
- User types natural language: "I want vendor name, invoice total, line items"
- Two-call pipeline from documind: extract field names from instruction -> generate schema for those fields
- Same confirmation UI, same extraction pipeline

### What to clone/copy from where

| Source | What | Notes |
|---|---|---|
| documind | `AUTO_SCHEMA_PROMPT`, `INSTRUCTIONS_SCHEMA_PROMPT` | Schema inference prompts |
| documind | `convertToZodSchema()` | Recursive field -> Zod compiler |
| documind | `BASE_EXTRACTION_PROMPT` | "null for missing" instruction |
| documind | `baseSchema` (Zod recursive) | Constrain schema-gen LLM output |
| sift-kg | `build_discovery_prompt()` lines 48-81 | Schema architect persona + constraints |
| sift-kg | `_generate_doc_context()` | Per-doc summary for extraction context |
| sift-kg | `_dedupe_entities()` | Dedup by name+type, highest confidence |
| sift-kg | `parse_llm_json()` | Robust JSON parsing from LLM output |
| l1m | `minimalSchema()` | Compact schema-to-string for prompts |
| l1m | `collectDescriptions()` | Field descriptions as path:desc lines |
| instructor-js | Retry-with-error-feedback pattern | Append errors, retry up to 3x |
| harkly-saas | `FramingStudio.tsx`, `ExtractPage.tsx`, extraction routes | Port UI and API patterns |

### Dependencies
- Phase 1 complete (documents uploaded and chunked in D1)

### Acceptance
- [ ] Upload 5 PDFs -> click "Discover Schema" -> AI proposes schema with reasonable field names/types
- [ ] Edit proposed schema (rename a field, remove a field, add a field) -> confirm
- [ ] Run extraction -> structured rows appear in table view
- [ ] Each row has confidence score and source link
- [ ] Upload 5 invoices -> schema proposes: vendor, date, total, line_items -> extraction produces correct rows
- [ ] Upload 5 research papers -> schema proposes: title, authors, abstract, methodology -> extraction works
- [ ] Instruction-guided: type "name, email, company" -> schema proposes 3 fields -> extraction works
- [ ] Export extracted data to CSV -> opens correctly in Excel

---

## 5. Phase 3 -- Query + MCP (Day 15-20)

### Goal
Query knowledge base via hybrid search. Expose as MCP server. Claude Desktop / ChatGPT can connect and query.

### Tasks

**5.1. Hybrid search endpoint**
- `POST /api/kb/:kbId/query` with `{ question }`
- Query rewrite: LLM generates 3-5 query variants (cloudflare-rag pattern)
  - Use `AI.run("@cf/meta/llama-3.1-8b-instruct")` for query rewriting (fast, free)
- Parallel search:
  - FTS5 MATCH on `document_chunks_fts` (filtered by `kb_id`) -- fix rank sort to `ORDER BY rank ASC` (cloudflare-rag bug fix)
  - `VECTORIZE.query()` per query variant (topK=10, filter: `{ kbId }`) -- multiple queries bypass topK=20 limit
- Reciprocal Rank Fusion merge (copy 40-line RRF function from cloudflare-rag)
- Fetch top-10 full chunks from D1 by fused IDs
- Batch `WHERE id IN (...)` queries to <=100 IDs (D1 SQLite 999-variable limit)
- Return results: `{ chunks: [...], total, searchTimeMs }`

**5.2. LLM chat with grounded context**
- `POST /api/kb/:kbId/chat` with `{ question, history? }`
- Run hybrid search (5.1) to get context chunks
- Build prompt: system = "Answer based on the following context", user = chunks + question
- Stream LLM response via `AI.run("@cf/meta/llama-3.1-70b-instruct")` with SSE
- Include source citations in response (chunk IDs linked to documents)
- Also support extracted_rows as structured context (query `extracted_rows` by schema match)

**5.3. Chat UI**
- Chat panel with message history
- Citations rendered as clickable links to source documents/chunks
- "Ask about your data" entry point from knowledge base view
- Port from harkly-saas `ChatPanel.tsx` and harkly-shell `Chat.tsx`

**5.4. MCP server -- OAuth layer**
- Install `@cloudflare/workers-oauth-provider`
- Configure as Worker entrypoint wrapper:
  - `apiRoute: '/mcp'` (protected by OAuth)
  - `defaultHandler`: consent UI + better-auth login
  - Token endpoint, authorize endpoint, dynamic client registration
- OAUTH_KV for token storage
- `completeAuthorization()` passes `userId` from better-auth session into `props`

**5.5. MCP server -- tool definitions**
- Install `@cyanheads/mcp-ts-core` (or use `@modelcontextprotocol/sdk` directly)
- Streamable HTTP transport on `POST /mcp`
- Tools:
  - `search_knowledge(query, kbId?, limit?)` -- hybrid search, returns chunks with sources
  - `query_structured(question, kbId?, schemaId?)` -- query extracted rows
  - `list_knowledge_bases()` -- list user's KBs
  - `list_schemas(kbId)` -- list confirmed schemas
- Each tool scoped to `ctx.props.userId` (multi-tenant by construction)
- Port tool builder pattern from mcp-ts-template

**5.6. MCP consent UI**
- Simple consent page: "Harkly wants to access your knowledge base"
- Show requested scopes: `knowledge:read`, `knowledge:write`
- "Approve" / "Deny" buttons
- After approval -> `completeAuthorization()` -> redirect back to MCP client

**5.7. Session store -- KV-backed**
- Replace mcp-ts-template in-memory `SessionStore` with KV
- Key: `mcp:session:{sessionId}` -> JSON
- TTL: 24 hours

### What to clone/copy from where

| Source | What | Notes |
|---|---|---|
| cloudflare-rag | `performReciprocalRankFusion()` lines 80-106 | Copy 40-line function |
| cloudflare-rag | Query rewrite prompt (lines 12-39) | Adapt for Harkly |
| cloudflare-rag | FTS5 search (lines 50-77) | Fix rank sort direction |
| workers-oauth-provider | `OAuthProvider` class as entrypoint | Use directly |
| workers-oauth-provider | `tokenExchangeCallback` pattern | Inject userId |
| mcp-ts-template | `createWorkerHandler()`, tool builder, auth middleware | Use as MCP server base |
| mcp-ts-template | `sessionStore.ts` | Replace Map with KV |
| mcp-ts-template | `d1Provider.ts` | Multi-tenant D1 access |
| better-auth-cloudflare | `createAuth(env, cf)` per-request | User auth in consent handler |
| harkly-saas | `ChatPanel.tsx`, `useChatState.ts` | Port chat UI |

### Dependencies
- Phase 2 complete (schema confirmed, extracted rows in D1)
- Phase 1 complete (chunks in D1 + Vectorize)

### Acceptance
- [ ] Query "What invoices are from 2024?" -> returns relevant chunks with source citations
- [ ] Chat streams response with grounded context from knowledge base
- [ ] Chat references extracted structured data when relevant
- [ ] Connect Claude Desktop as MCP client -> OAuth flow completes -> `search_knowledge` tool works
- [ ] Connect ChatGPT as MCP client -> same flow works
- [ ] MCP tool `list_knowledge_bases` returns only the authenticated user's KBs (multi-tenant isolation)
- [ ] Dynamic client registration works (RFC 7591)
- [ ] `/.well-known/oauth-authorization-server` returns correct metadata

---

## 6. Phase 4 -- Canvas + Polish (Day 21-28)

### Goal
Spatial canvas shows entities/relations from extracted data. Existing harkly-shell components adapted for web. Product is usable end-to-end.

### Tasks

**6.1. Port harkly-shell canvas to SolidStart**
- The existing harkly-shell has a complete spatial canvas: `Space.tsx`, `useViewport.ts`, `useFloor.ts`, `useSnap.ts`, `snapUtils.ts`, `coordinates.ts`
- Port to SolidStart route: `/(protected)/canvas.tsx`
- Key components to port:
  - `Space.tsx` -> canvas container with transform matrix (pan/zoom)
  - `useViewport.ts` -> viewport state management
  - `useFloor.ts` -> floor/layer management
  - `frameRegistry.tsx` -> frame type registry
  - `WindowFrame.tsx` -> base frame wrapper (drag, resize)
- Adapt: remove Tauri-specific bindings, connect to D1-backed state

**6.2. Connect canvas to extracted data**
- Each entity type from schema -> node type on canvas
- Each extracted row -> node instance positioned spatially
- Relations between rows -> edges (if schema has FK-like fields)
- Auto-layout: grid arrangement for initial placement, user can drag to rearrange
- Persist canvas state to D1: `canvas_state (id, kb_id, user_id, nodes_json, viewport_json)`

**6.3. Port relevant harkly-shell frames**
- From `components/frames/harkly/`:
  - `SourceCardFrame.tsx` -> show document source card
  - `InsightsFrame.tsx` -> show extraction insights
  - `NotebookFrame.tsx` -> notes attached to entities
  - `RawDataFrame.tsx` -> raw chunk viewer
  - `ArtifactsFrame.tsx` -> exported/generated artifacts
- From core frames:
  - `TextFrame.tsx`, `WindowFrame.tsx` -> base building blocks
- Adapt all to use D1-backed data instead of local state

**6.4. Omnibar integration**
- Port `Omnibar.tsx`, `OmnibarInput.tsx`, `OmnibarBody.tsx` from harkly-shell
- Connect to backend: omnibar commands trigger server actions
  - `/upload` -> file upload flow
  - `/ask <question>` -> chat query
  - `/schema` -> schema discovery
  - `/extract` -> extraction run
- Port `commandRegistry.ts` and `defaultCommands.ts`, adapt for web

**6.5. Dashboard + navigation**
- Dashboard: list of knowledge bases with stats (doc count, extraction count, last updated)
- KB detail page: documents list, schema view, extraction results, chat, canvas
- Navigation: sidebar or top bar with KB switcher
- Port layout patterns from harkly-saas `layout.tsx` and dashboard

**6.6. Polish -- error handling + loading states**
- Every async operation: loading spinner, error toast, retry button
- Optimistic UI for uploads and edits
- Empty states for new users (no KBs, no documents, no extractions)
- Toast notifications for background job completion (via polling or SSE)

**6.7. Tauri 2 desktop build (optional, time permitting)**
- Merge quantum template into project
- Configure dual-build: CF Pages (web) vs static (Tauri)
- `app.config.ts` switches based on `TAURI_ENV_PLATFORM`
- tauri-specta for typesafe IPC if local features needed
- Desktop benefit: offline canvas, local file watching, native notifications

### What to clone/copy from where

| Source | What | Notes |
|---|---|---|
| harkly-shell | `Space.tsx`, `useViewport.ts`, `useFloor.ts`, `useSnap.ts` | Core canvas |
| harkly-shell | `frameRegistry.tsx`, `WindowFrame.tsx` | Frame system |
| harkly-shell | `Omnibar.tsx`, `OmnibarInput.tsx`, `OmnibarBody.tsx` | Omnibar |
| harkly-shell | `commandRegistry.ts`, `defaultCommands.ts` | Command system |
| harkly-shell | All `frames/harkly/*.tsx` (7 files) | Harkly-specific frames |
| harkly-saas | `Canvas.tsx`, `CanvasFrame.tsx`, `useCanvasState.ts` | Canvas patterns (React, adapt) |
| harkly-saas | Dashboard, project layout, navigation | UI structure patterns |
| quantum | `app.config.ts`, `lib.rs`, `Cargo.toml` | Tauri 2 scaffold |

### Dependencies
- Phase 3 complete (query + chat working)
- Phase 2 complete (extracted data available)

### Acceptance
- [ ] Canvas loads with entities from extracted data displayed as nodes
- [ ] Pan and zoom work smoothly
- [ ] Click node -> shows detail frame with extracted fields and source
- [ ] Drag nodes to rearrange, positions persist on reload
- [ ] Omnibar opens with Cmd+K, accepts commands
- [ ] Dashboard shows list of knowledge bases with correct stats
- [ ] Full flow works end-to-end: upload -> schema -> extract -> query -> canvas
- [ ] No unhandled errors in console during normal usage
- [ ] (Optional) Tauri desktop build produces working .exe/.dmg

---

## 7. Dependency Graph

```
Phase 0: Scaffold
  |
  v
Phase 1: Upload + Process
  |
  v
Phase 2: Schema + Extract ---+
  |                           |
  v                           |
Phase 3: Query + MCP          |
  |                           |
  v                           v
Phase 4: Canvas + Polish (needs both Phase 2 data + Phase 3 queries)
```

### Parallelization opportunities

**Within Phase 0:** All tasks are sequential (each depends on the previous).

**Within Phase 1:**
- 3.1 (R2 upload) and 3.5 (upload UI) can start simultaneously
- 3.3 (text extraction) and 3.4 (chunking) are sequential
- 3.6 (job status API) can be built alongside 3.3/3.4

**Within Phase 2:**
- 4.1 (schema discovery) and 4.3 (Zod compilation) can be built in parallel
- 4.4 (schema UI) can start once 4.2 (schema format) is defined
- 4.5 (extraction pipeline) depends on 4.3 (Zod compilation)
- 4.6 (results UI) can start once 4.5 has test data

**Phase 2 and Phase 3 partial overlap:**
- 5.1 (hybrid search) can start as soon as Phase 1 is complete (does not need extraction)
- 5.4-5.7 (MCP server) can be built in parallel with Phase 2 -- MCP tools call the same search/query APIs

**Phase 4 canvas porting (6.1-6.4) can start during Phase 3** since canvas UI is independent of backend query/MCP work. Canvas just needs D1 data from Phase 2.

### Realistic parallel lanes (2 developers)

```
Developer A (backend):     Phase 0 -> Phase 1 -> Phase 2 backend -> Phase 3 backend
Developer B (frontend):    Phase 0 (assist) -> Phase 1 UI -> Phase 2 UI -> Phase 4 canvas
                                                                     \-> Phase 3 MCP (after Phase 2)
```

Solo developer (realistic for Harkly): strictly sequential with the parallelization gains coming from building UI and backend for the same phase concurrently within a single day.

---

## 8. Risk Mitigation

### From RAG Pipeline Research (harkly-eval-rag-pipeline.md)

| Risk | Severity | Mitigation |
|---|---|---|
| Vectorize `topK` hard limit = 20 | Medium | Multiple query vectors via query rewrite (3-5 variants). 5 queries x topK=10 = 50 candidates before RRF merge. |
| D1 SQLite 999-variable limit | Medium | Batch all `WHERE id IN (...)` queries to <=100 IDs. Copy openai-sdk-knowledge-org pattern. |
| D1 row size `SQLITE_TOOBIG` | High | Copy `TokenCounter.validateAndTruncateContent()`. Enforce `D1_SAFE_CONTENT_SIZE = 1,500,000` bytes. Truncate before insert. |
| FTS5 rank sort direction bug | Low | Use `ORDER BY rank ASC` (not DESC). BM25 rank in SQLite FTS5 is negative -- lower = better. |
| CF Queue free plan: 100K ops/day | Low | Acceptable for pre-launch. Monitor. Upgrade to paid when needed. |
| Vectorize metadata 2000 char limit | Medium | Store full chunk text in D1 `document_chunks.text`. Use Vectorize metadata only for scoring/filtering. Fetch full text from D1 by chunk ID after search. |
| Subrequest limit (50 free, 1000 paid) | Medium | Use CF paid plan from day 1. Batch operations. Queue consumer handles heavy work outside request context. |

### From Schema Extraction Research (harkly-eval-schema-extract.md)

| Risk | Severity | Mitigation |
|---|---|---|
| LLM produces invalid JSON for schema | High | Robust JSON parsing: strip markdown fences, scan balanced braces (sift-kg `parse_llm_json()`). Retry up to 3x with error feedback (instructor-js pattern). |
| Schema type drift across chunks | Medium | Discovery-then-constrain pattern: discover schema once on corpus samples, freeze it, use as constraint for all extraction. Never allow per-chunk type invention. |
| Extraction misses fields (null when data exists) | Medium | Document context summary prepended to each chunk (sift-kg `_generate_doc_context()`). Improves LLM recall by providing document-level context. |
| Workers AI model quality insufficient for schema inference | Medium | Start with `@cf/meta/llama-3.1-70b-instruct`. If quality too low, fall back to Groq `llama-3.3-70b` or NVIDIA NIM. Schema inference is infrequent (1 call per KB), so external API cost is negligible. |
| User edits schema after extraction started | Low | Schema versioning. Each extraction references a schema version. Re-extraction required on schema change. Warn user. |

### From MCP + Auth Research (harkly-eval-mcp-auth.md)

| Risk | Severity | Mitigation |
|---|---|---|
| SessionStore is in-memory (mcp-ts-template) | High | Replace with KV-backed store from day 1. Key: `mcp:session:{sessionId}`, TTL: 24h. |
| KV eventual consistency for token revocation | Medium | Acceptable for MVP. Grace period 1-60 seconds. Add immediate revocation via D1 check if needed later. |
| workers-oauth-provider issues opaque tokens (not JWTs) | Low | Trust workers-oauth-provider validation (Option A). Use `ctx.props.userId` directly. No JWKS needed. |
| better-auth per-request instantiation cold-start | Low | CF Workers cache module-level singletons. Per-request auth config is lightweight. |
| Dynamic client registration abuse | Medium | Rate limit `/oauth/register` via KV. Monitor registered client count. Add captcha if needed. |

### From UI + Canvas Research (harkly-eval-ui-canvas.md)

| Risk | Severity | Mitigation |
|---|---|---|
| SolidStart + CF local dev bindings broken (vinxi issue) | High | Use `wrangler pages dev` for local testing. Known open issue, tracked at workers-sdk#5912. Workaround is stable. |
| No SolidStart + D1 + better-auth combined reference exists | Medium | Assemble from parts: solid-pages (D1 pattern) + better-auth docs (SolidStart integration) + better-auth-cloudflare (D1 adapter). Test each layer independently before combining. |
| Port mismatch: vinxi dev port vs tauri.conf.json | Low | Lock vinxi to port 1420 in app.config.ts. Match in tauri.conf.json. Verify after scaffold. |
| Canvas performance with 200+ nodes | Medium | Keep canvas lightweight. No virtualization in v1. If needed: only render nodes in viewport (simple culling). Most users will have <100 entities in a KB. |
| harkly-shell code uses tLOS-specific patterns | Medium | Audit each ported file. Remove kernel, NATS, and agent-specific code. Keep only canvas primitives and Harkly frames. |

### From Product Research (harkly-research-products.md)

| Risk | Severity | Mitigation |
|---|---|---|
| NotebookLM adds CSV + API | High | Ship first. NotebookLM is Google -- slow to add niche features. Harkly's schema inference + MCP combo is the differentiator they are unlikely to build. |
| Perplexity Spaces adds schema inference | Medium | Perplexity focuses on search, not structured extraction. Schema + DB output is far from their core competency. |
| SecondBrain.io adds file upload + audio | Medium | SecondBrain is text-capture focused. Building a full ingestion pipeline is a large engineering effort. Harkly's head start matters. |
| Khoj adds schema inference + video | Low | Khoj is open-source and developer-focused. Consumer UX is not their strength. |

### From Stack Research (harkly-research-stack.md)

| Risk | Severity | Mitigation |
|---|---|---|
| Workers 128 MB memory hard limit | High | Offload heavy processing (large PDFs >10MB, long audio) to queue consumers. Consider Modal.com for audio transcription if Workers AI Whisper times out. |
| D1 10 GB max database size | Low | Fine for MVP. Each user's data is small. If needed later: partition across multiple D1 databases per user. |
| D1 single-threaded per DB | Medium | Per-user DB isolation is the design pattern D1 was built for. Accept serialized writes within a user's scope. |
| phi-ag/solid-pages deprecated | Low | Use only as architecture reference. C3 scaffold + research patterns are the actual base. |
| Groq 100 MB file size limit | Low | Audio chunking at 25-minute boundaries before Groq Whisper. Not needed in MVP (MVP is document upload, not audio). |

---

## 9. What NOT to Build in MVP

**Collaboration / multi-user editing.** Single user per knowledge base. No sharing, no permissions, no real-time cursors. Durable Objects + Yjs is ready for later.

**Real-time sync.** Polling is fine. SSE for chat streaming is enough. No WebSocket infrastructure.

**Audio/video ingestion.** MVP handles documents only (PDF, DOCX, CSV, TXT, MD, URL). Audio/video pipeline (Groq Whisper, yt-dlp) is Phase 2 of the product roadmap, not MVP.

**Instagram/YouTube integration.** Same rationale -- document upload first, media platforms later.

**Advanced analytics / dashboards.** `query_stats` table is there for observability but no user-facing analytics UI. Just raw extracted data.

**Mobile app.** Desktop web + optional Tauri desktop. No iOS/Android.

**Custom domains.** Deploy to `harkly.pages.dev` or similar. Custom domain support is a Cloudflare Pages setting, not code work.

**Billing / payments.** Free during beta. Add Stripe later.

**Email notifications.** No transactional email. Users see status in-app.

**Rate limiting per user.** Basic CF-level protection only. Per-user quotas come after billing.

**Multi-language support.** UI in Russian only (per brand decision). Schema/extraction handles any language the LLM supports.

**Vector index per knowledge base.** Single Vectorize index with `kbId` metadata filter. Separate indexes per KB only if metadata filtering proves too slow.

**Graph visualization.** Canvas shows flat entity nodes, not knowledge graph with community detection. Graph features are post-MVP.

**Undo/redo on canvas.** Canvas state is persisted but no history stack.

**Dark theme toggle.** Light theme only (per workspace rule).

---

## 10. Go-Live Checklist

### Security
- [ ] No API keys or secrets in source code (all in CF Worker secrets / env vars)
- [ ] better-auth session cookies: `httpOnly`, `secure`, `sameSite: lax`
- [ ] OAuth tokens stored as SHA-256 hashes in KV (workers-oauth-provider handles this)
- [ ] D1 queries use parameterized statements (Drizzle ORM enforces this)
- [ ] File uploads validated: MIME type whitelist, max size enforcement (100 MB via R2 presigned URL expiry)
- [ ] MCP tools scoped to `ctx.props.userId` -- no cross-tenant data access
- [ ] FTS5 query sanitization: strip operators, escape special chars (fix cloudflare-rag incomplete sanitization)
- [ ] CORS configured: only allow origin domains, no `*`
- [ ] CSP headers on all pages
- [ ] `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

### Performance
- [ ] LLM calls have timeout (30s for schema/extraction, 60s for chat)
- [ ] Vectorize queries have timeout (5s)
- [ ] D1 queries have timeout (10s)
- [ ] R2 presigned URLs expire in 15 minutes
- [ ] Queue consumer retries with exponential backoff (max 3 retries)
- [ ] No N+1 queries -- batch D1 reads where possible
- [ ] Static assets served from CF Pages CDN (automatic)
- [ ] Bundle size checked: SolidStart should be <200KB gzipped for initial load

### Monitoring
- [ ] `ingest_jobs` table provides job-level observability
- [ ] `query_stats` table tracks search latency
- [ ] CF Analytics dashboard shows request counts, error rates, worker CPU time
- [ ] Console errors during manual testing: zero
- [ ] Workers Logpush or Tail for debugging production issues

### Data
- [ ] D1 backup strategy: `wrangler d1 export` scheduled (manual for MVP, automate later)
- [ ] R2 has no automatic backup -- document this risk. R2 data is original uploads, recoverable by re-upload.
- [ ] Vectorize index can be rebuilt from D1 chunks -- document the rebuild procedure

### Deployment
- [ ] `wrangler pages deploy` succeeds from CI (or manual)
- [ ] D1 migrations applied to production database
- [ ] All CF secrets set: `GROQ_API_KEY` (if using Groq fallback), better-auth secrets
- [ ] DNS configured for custom domain (if applicable)
- [ ] Test full flow on production: register -> upload -> schema -> extract -> query -> MCP connect

### Manual QA script
1. Register new account with email/password
2. Create knowledge base "Test KB"
3. Upload 3 different file types (PDF, CSV, TXT)
4. Wait for all 3 to reach "indexed" status
5. Click "Discover Schema" -- verify proposed fields make sense
6. Edit one field name, confirm schema
7. Run extraction -- verify rows appear in table
8. Open chat, ask a question about the data -- verify grounded response
9. Open canvas -- verify entities appear as nodes
10. Drag a node, reload page, verify position persisted
11. Connect Claude Desktop via MCP -- verify search tool returns data
12. Try accessing another user's KB via API -- verify 403
