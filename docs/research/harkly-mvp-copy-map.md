# Harkly MVP — Copy Map
> Date: 2026-03-19
> Author: Lead/TechResearch
> Sources: harkly-eval-rag-pipeline.md, harkly-eval-schema-extract.md, harkly-eval-mcp-auth.md, harkly-eval-ui-canvas.md, harkly-research-github.md, harkly-research-github-api.md
> Stack target: SolidStart + Cloudflare Workers/Pages + D1 + R2 + Vectorize + Queues + Tauri 2 + better-auth

---

## 1. npm install (ready-to-use packages)

Install these directly. No modification needed — use as published.

| Package | Version | Purpose | Install command |
|---|---|---|---|
| `@cloudflare/workers-oauth-provider` | `^0.3.0` | OAuth 2.1 Authorization Server on CF Workers + KV. PKCE, dynamic client registration, encrypted token props. | `npm i @cloudflare/workers-oauth-provider` |
| `@cyanheads/mcp-ts-core` | `^0.1.6` | MCP Streamable HTTP server for CF Workers. Zod tool builder, JWT/OAuth validation, D1/KV storage providers. | `npm i @cyanheads/mcp-ts-core` |
| `better-auth` | `latest (1.x)` | User authentication (signup/login/session). SolidStart handler included. | `npm i better-auth` |
| `better-auth-cloudflare` | `^0.2.9` | CF Workers adapter for better-auth: D1 adapter via Drizzle, KV rate limiting, geolocation. | `npm i better-auth-cloudflare` |
| `drizzle-orm` | `^0.45.1` | ORM for D1 (sqlite dialect). Matches solid-pages proven version. | `npm i drizzle-orm` |
| `drizzle-kit` | `^0.31.8` | Migration generator for Drizzle. | `npm i -D drizzle-kit` |
| `hono` | `^4.x` | HTTP framework for CF Workers API routes. Used in cloudflare-rag and ai-rag-crawler. | `npm i hono` |
| `@hono/zod-openapi` | `latest` | Hono + Zod schema validation + OpenAPI spec generation. | `npm i @hono/zod-openapi` |
| `instructor` | `latest` | Structured LLM extraction with Zod. Multi-provider (TOOLS/JSON_SCHEMA/MD_JSON modes). Retry with error feedback. | `npm i @instructor-ai/instructor` |
| `unpdf` | `latest` | PDF text extraction that runs in CF Workers without Node.js compat. Zero native deps. | `npm i unpdf` |
| `mammoth` | `^1.x` | DOCX to text/markdown conversion. Works in Node.js / Bun. | `npm i mammoth` |
| `papaparse` | `^5.x` | CSV parsing. Browser + Node.js. | `npm i papaparse` |
| `@types/papaparse` | `latest` | TypeScript types for papaparse. | `npm i -D @types/papaparse` |
| `zod` | `^3.x` | Schema validation. Already in Harkly stack. | `npm i zod` |
| `zod-stream` | `latest` | Streaming partial Zod-typed objects from LLM. For schema proposal streaming UX. | `npm i zod-stream` |
| `jose` | `^5.x` | JWT verification (JWKS, symmetric, asymmetric). Used by mcp-ts-template auth strategies. | `npm i jose` |
| `ulidx` | `latest` | ULID generation. Use as Vectorize vector IDs (avoids UUID collision issues, cloudflare-rag pattern). | `npm i ulidx` |
| `p-limit` | `^5.x` | Concurrency limiter for parallel async operations (embedding batches, document processing). ESM. | `npm i p-limit` |
| `@solidjs/start` | `^1.3.2` | SolidStart framework. Pin to solid-pages proven version. | `npm i @solidjs/start` |
| `solid-js` | `^1.9.11` | SolidJS reactive core. | `npm i solid-js` |
| `vinxi` | `^0.5.11` | Build tool underlying SolidStart. | `npm i vinxi` |
| `@tailwindcss/vite` | `^4.x` | Tailwind v4 Vite plugin (NOT postcss — solid-pages pattern). | `npm i -D @tailwindcss/vite tailwindcss` |
| `@tauri-apps/api` | `^2.x` | Tauri 2.x stable JS/TS API. | `npm i @tauri-apps/api` |
| `wrangler` | `^4.x` | Cloudflare CLI for local dev, migrations, deployment. | `npm i -D wrangler` |
| `@cloudflare/workers-types` | `^4.x` | TypeScript types for CF Workers bindings. | `npm i -D @cloudflare/workers-types` |
| `aws4fetch` | `latest` | AWS Signature V4 fetch. If Harkly uses R2 presigned URLs from the server side. | `npm i aws4fetch` |

---

## 2. Clone & Adapt (copy code, modify for Harkly)

Code that exists in evaluated repos and must be copied + adapted. Not imported as a package.

### 2.1 RAG Pipeline (from cloudflare-rag + openai-sdk-knowledge-org)

| Source repo | Source file | Target in Harkly | Adaptation needed | Priority |
|---|---|---|---|---|
| cloudflare-rag | `drizzle/20240828100648_skinny_midnight.sql` — FTS5 virtual table + trigger DDL | Harkly D1 migration file for `document_chunks_fts` | Change table/column names to Harkly schema (`kbId` instead of `sessionId`) | CRITICAL |
| cloudflare-rag | `functions/api/stream.ts` lines 80-106 — `performReciprocalRankFusion()` | `src/lib/rag/rrf.ts` | Copy as-is; 40 lines, pure function | CRITICAL |
| cloudflare-rag | `functions/api/stream.ts` lines 12-39 — query rewrite prompt | `src/lib/rag/queryRewrite.ts` | Adapt prompt for Harkly KB domain; replace Groq client with NVIDIA NIM call | HIGH |
| cloudflare-rag | `functions/api/stream.ts` lines 50-77 — FTS5 search function | `src/lib/rag/ftsSearch.ts` | Fix two bugs: (1) `ORDER BY rank ASC` not DESC for BM25, (2) sanitize FTS5 MATCH operators before raw SQL | HIGH |
| cloudflare-rag | `functions/api/upload.ts` lines 47-110 — batch embedding loop with SSE progress | `src/lib/rag/embedBatch.ts` | Replace Workers AI binding pattern, adapt to Harkly's chunk model with `kbId`; keep SSE progress streaming | HIGH |
| cloudflare-rag | `app/lib/aiGateway.ts` — CF AI Gateway universal endpoint waterfall | `src/lib/ai/gateway.ts` | Replace hardcoded provider array with Harkly's provider config (NIM primary, Groq fallback, CF Workers AI embeddings fallback) | MEDIUM |
| openai-sdk-knowledge-org | `src/pipeline/job-queue.ts` — `JobQueue` class | `src/lib/pipeline/jobQueue.ts` | Copy entire class; replace OpenAI-specific job types with Harkly types (`process_document`, `process_chunk_batch`, `process_pending`) | CRITICAL |
| openai-sdk-knowledge-org | `src/rate-limiter.ts` — `RateLimiter` class | `src/lib/pipeline/rateLimiter.ts` | Copy entire class unchanged. Exponential backoff + jitter for Vectorize API calls. | HIGH |
| openai-sdk-knowledge-org | `src/pipeline/token-counter.ts` — `TokenCounter` class | `src/lib/pipeline/tokenCounter.ts` | Copy entire class unchanged. `validateAndTruncateContent()` prevents SQLITE_TOOBIG errors. | HIGH |
| openai-sdk-knowledge-org | `src/storage/vector-store.ts` — `VectorStoreImpl.storeInVectorize()` | `src/lib/rag/vectorStore.ts` | Adapt: replace OpenAI embeddings with `@cf/baai/bge-large-en-v1.5` Workers AI call; keep batch=100, 500ms delay, RateLimiter wrapping | HIGH |
| openai-sdk-knowledge-org | `src/pipeline/processors/id-utils.ts` — `ensureSafeId()` | `src/lib/pipeline/idUtils.ts` | Copy entire file. Required — Vectorize IDs must be alphanumeric + dash/underscore, ≤64 chars. | HIGH |
| openai-sdk-knowledge-org | `migrations/0001_initial_schema.sql` — `job_queue` + `work_items` + `collection_runs` + `query_stats` + `collection_timestamps` tables | Harkly D1 migration for ingest pipeline tables | Rename: `collection_runs` → `ingest_runs`, add `kbId` foreign key column to all tables; drop GitHub/forum-specific columns | HIGH |
| openai-sdk-knowledge-org | `src/storage/d1-database/schema.ts` — Drizzle schema for job tables | `src/db/schema-pipeline.ts` | Copy jobQueue + workItems + collectionRuns tables; adapt column names to Harkly domain | HIGH |
| ai-rag-crawler | `apps/api/src/workflows/rag.ts` — `RagWorkflow extends WorkflowEntrypoint` structure with `step.do()` | `src/workers/ingestWorkflow.ts` | Structural template only: replace web scraper steps with Harkly's document processing steps (R2 read → text extract → chunk → embed → D1 insert → Vectorize upsert); fix transaction-inside-steps bug | MEDIUM |
| ai-rag-crawler | `apps/api/src/routes/workflow.ts` — workflow start + status poll routes | `src/routes/api/ingest.ts` | Adapt for Harkly: `POST /api/kb/ingest` (start) + `GET /api/kb/ingest/:jobId` (status poll) | MEDIUM |
| ai-rag-crawler | `apps/api/wrangler.toml` — `[[workflows]]` binding syntax | `wrangler.toml` | Copy `[[workflows]]` block verbatim; rename binding and class_name to Harkly values | LOW |

### 2.2 Schema Inference & Extraction (from documind + sift-kg + l1m + instructor-js)

| Source repo | Source file | Target in Harkly | Adaptation needed | Priority |
|---|---|---|---|---|
| documind | `extractor/src/prompts.js` — `AUTO_SCHEMA_PROMPT` | `src/lib/schema/prompts.ts` | Port from JS to TS; adapt wording for Harkly's "dataset schema" output format (flat entity types, not nested doc schema) | CRITICAL |
| documind | `extractor/src/prompts.js` — `INSTRUCTIONS_SCHEMA_PROMPT` + two-call pipeline logic | `src/lib/schema/prompts.ts` | Port from JS to TS; the instruction-guided path: extract field names from user instruction → generate schema for those specific fields | HIGH |
| documind | `extractor/src/utils/convertToZodSchema.js` — `convertToZodSchema(fields)` | `src/lib/schema/zodCompiler.ts` | Port from JS to TS (trivial). Recursive field-to-Zod compiler: handles string/number/boolean/array/object/enum with nesting. | CRITICAL |
| documind | `extractor/src/autoschema/generation-schemas/base.js` — `baseSchema` (recursive `z.lazy()`) | `src/lib/schema/baseSchema.ts` | Port from JS to TS. This is the Zod definition that constrains the schema-generation LLM output. | HIGH |
| documind | `extractor/src/prompts.js` — `BASE_EXTRACTION_PROMPT` | `src/lib/schema/prompts.ts` | Port from JS to TS. Extraction system prompt: "return null for missing fields, no placeholders." | HIGH |
| sift-kg | `src/sift_kg/domains/discovery.py` — `build_discovery_prompt()` lines 48-81 | `src/lib/schema/prompts.ts` | Port from Python to TS (pure string template, ~35 lines). Persona: "You are a schema architect." Requires UPPERCASE_SNAKE_CASE entity types with source/target constraints. | CRITICAL |
| sift-kg | `src/sift_kg/extract/extractor.py` — `_generate_doc_context()` | `src/lib/schema/extractor.ts` | Port from Python to TS (~20 lines). One LLM call per document: generates 2-3 sentence summary prepended to every chunk's extraction prompt. | HIGH |
| sift-kg | `src/sift_kg/extract/extractor.py` — `_dedupe_entities()` | `src/lib/schema/extractor.ts` | Port from Python to TS (~30 lines). Dedup by name+type; highest-confidence wins; merge contexts with pipe separator. | MEDIUM |
| sift-kg | `src/sift_kg/extract/llm_client.py` — `parse_llm_json()` | `src/lib/schema/parseJson.ts` | Port from Python to TS (~25 lines). Robust JSON parsing: strip markdown fences, scan for balanced braces. | HIGH |
| l1m | `core/src/schema.ts` — `minimalSchema()` | `src/lib/schema/schemaUtils.ts` | Copy from TS source (zero porting). Converts JSON Schema to compact inline type notation for LLM prompts. | HIGH |
| l1m | `core/src/schema.ts` — `collectDescriptions()` | `src/lib/schema/schemaUtils.ts` | Copy from TS source. Walks JSON Schema, extracts all field descriptions as `path: description` lines. | HIGH |
| l1m | `core/src/model.ts` — multi-attempt feedback loop | `src/lib/schema/extractor.ts` | Copy the retry pattern (~20 lines). Feed previous bad output + AJV/Zod errors back to LLM in subsequent attempt messages. | HIGH |
| instructor-js | `src/instructor.ts` — retry-with-error-feedback pattern | `src/lib/schema/extractor.ts` | Copy pattern (not the whole class). Append `assistant: {bad_json}` + `user: "Please correct; errors: {zodError}"` and retry. Max 3 attempts. | HIGH |
| instructor-js | `src/dsl/validator.ts` — `LLMValidator` | `src/lib/schema/llmValidator.ts` | Copy entire file (TS, zero porting). Semantic field validation via LLM superRefine on Zod fields. | MEDIUM |
| instructor-js | `examples/resolving-complex-entitities/index.ts` — entity schema with `properties[]`, `dependencies[]` | `src/lib/schema/entitySchema.ts` | Copy as reference/starting point for Harkly's entity type with FK resolution pattern. Adapt field names. | MEDIUM |

### 2.3 MCP Server + Auth (from mcp-ts-template + workers-oauth-provider + better-auth-cloudflare)

| Source repo | Source file | Target in Harkly | Adaptation needed | Priority |
|---|---|---|---|---|
| mcp-ts-template | `src/core/worker.ts` — `createWorkerHandler()` factory | `src/workers/mcp-worker.ts` | Use directly as Worker entry point factory. Add Harkly-specific tools array and binding interface. | CRITICAL |
| mcp-ts-template | `src/mcp-server/transports/http/httpTransport.ts` | `src/workers/mcp-worker.ts` (internal to package) | Use via `@cyanheads/mcp-ts-core` package — do not copy manually | CRITICAL (via npm) |
| mcp-ts-template | `src/mcp-server/transports/auth/strategies/oauthStrategy.ts` | Used via npm package | JWKS-based token validation. Point at workers-oauth-provider's JWKS endpoint. | CRITICAL (via npm) |
| mcp-ts-template | `src/mcp-server/transports/http/sessionStore.ts` | `src/workers/sessionStore.ts` | MUST replace in-memory `Map` with KV-backed implementation. Key: `mcp:session:{sessionId}` → TTL = staleTimeoutMs/1000. | CRITICAL (adapt) |
| mcp-ts-template | `src/storage/providers/cloudflare/d1Provider.ts` | Used via npm package | Multi-tenant D1 storage with `{tenantId}:{key}` prefix. | HIGH (via npm) |
| mcp-ts-template | `src/storage/providers/cloudflare/kvProvider.ts` | Used via npm package | Multi-tenant KV storage. | HIGH (via npm) |
| mcp-ts-template | `src/mcp-server/transports/http/protectedResourceMetadata.ts` | Used via npm package | RFC 9728 `/.well-known/oauth-protected-resource` endpoint. Required for MCP client discovery. | HIGH (via npm) |
| mcp-ts-template | `src/mcp-server/transports/auth/lib/claimParser.ts` | Used via npm package | Reuse `buildAuthInfoFromClaims()` for JWT claim extraction. | MEDIUM (via npm) |
| workers-oauth-provider | `new OAuthProvider({...})` Worker entrypoint pattern | `src/workers/auth-worker.ts` | Use package directly; configure `apiRoute: '/mcp'`, `apiHandler: HarklyMcpWorker`, `defaultHandler: consentUiHandler`, scope list. | CRITICAL |
| workers-oauth-provider | `env.OAUTH_PROVIDER.parseAuthRequest()` + `completeAuthorization({userId, scope, props})` | `src/workers/auth-worker.ts` — `/authorize` handler | Copy the integration pattern from eval section 3.10 verbatim. Pass `session.user.id` from better-auth as `userId`. | CRITICAL |
| better-auth-cloudflare | `createAuth(env, cf)` per-request pattern | `src/lib/auth.ts` | Copy the pattern (not the package internals). Create auth instance per request using D1 binding from `event.locals.env`. | HIGH |
| better-auth-cloudflare | `withCloudflare({d1: {db, options}, kv: env.KV})` wrapper | `src/lib/auth.ts` | Use via npm package. Inject D1 adapter + KV rate limiter into better-auth config. | HIGH |

### 2.4 SolidStart + Cloudflare Pages Infrastructure (from solid-pages + quantum)

| Source repo | Source file | Target in Harkly | Adaptation needed | Priority |
|---|---|---|---|---|
| solid-pages | `app.config.ts` — `preset: "cloudflare-pages"`, `compatibilityDate`, `middleware` path | `app.config.ts` | Add TAURI_ENV_PLATFORM env check to switch between `cloudflare-pages` and `static` presets at build time. | CRITICAL |
| solid-pages | `wrangler.toml` — D1 + R2 + KV binding structure, `nodejs_compat` flag, `pages_build_output_dir` | `wrangler.toml` | Copy structure; replace IDs with Harkly's actual CF resource IDs; add Vectorize + AI + Queues bindings. | CRITICAL |
| solid-pages | `src/middleware.ts` — PlatformProxy for dev, native CF context for prod; singleton `globalThis.cfPlatformProxy` | `src/middleware.ts` | Copy verbatim; add Harkly-specific middleware (auth session check, DB init). | CRITICAL |
| solid-pages | `src/db/client.ts` — `createDb(event)` per-request D1 factory | `src/db/client.ts` | Copy verbatim. D1 binding is only available per-request — never module-level. | CRITICAL |
| solid-pages | `src/db/schema.ts` — `customType` UUID blob pattern for D1 | `src/db/schema.ts` | Copy UUID type definition; use as base for Harkly's schema. | HIGH |
| solid-pages | `drizzle.config.ts` — `dialect: "sqlite"` + local wrangler state path | `drizzle.config.ts` | Copy verbatim; update path hash after first `vinxi dev` run. | HIGH |
| solid-pages | npm scripts: `db:generate`, `db:migrate`, `typegen`, `deploy` | `package.json` | Copy scripts section; adapt for Harkly's DB and deployment names. | HIGH |
| solid-pages | `src/worker-configuration.d.ts` generation via `wrangler types` | `src/worker-configuration.d.ts` | Run `wrangler types src/worker-configuration.d.ts` after wrangler.toml is finalized. | HIGH |
| solid-pages | `src/global.d.ts` — `ImportMeta` env var extension | `src/global.d.ts` | Copy; add Harkly-specific VITE_* vars. | MEDIUM |
| solid-pages | `src/entry-server.tsx` — nonce generation pattern | `src/entry-server.tsx` | Copy CSP nonce pattern if Harkly adds CSP headers. | MEDIUM |
| quantum | `app.config.ts` — `ssr: false`, port 1420, `strictPort: true`, `envPrefix: ["VITE_", "TAURI_"]` | `app.config.ts` (TAURI branch) | Merge into the conditional Tauri config branch of Harkly's `app.config.ts`. | HIGH |
| quantum | `src-tauri/src/lib.rs` — `#[specta::specta]` command pattern + specta_builder setup | `src-tauri/src/lib.rs` | Copy Rust IPC scaffold; replace demo command with Harkly Tauri commands (file open, native file drop). | HIGH |
| quantum | `src-tauri/Cargo.toml` — `[profile.release]` binary size opts | `src-tauri/Cargo.toml` | Copy release profile section verbatim: `panic="abort"`, `lto=true`, `opt-level="s"`, `strip=true`. | MEDIUM |
| quantum | `.github/workflows/release.yml` — multi-platform Tauri build + sign | `.github/workflows/release.yml` | Adapt for Harkly: update app name, bundle ID, signing config. | MEDIUM |
| aguywhosaguy | `src/lib/auth.ts` — `betterAuth()` + `drizzleAdapter()` server instance | `src/lib/auth.ts` | Copy pattern; replace Postgres adapter with D1/sqlite adapter; add CF-specific options. | HIGH |
| aguywhosaguy | `src/lib/auth-client.ts` — `createAuthClient()` for SolidJS | `src/lib/auth-client.ts` | Copy verbatim; update `baseURL` to Harkly's env var. Note: client session is `session()?.data?.user`, not `session()?.user`. | HIGH |
| aguywhosaguy | `src/routes/api/auth/[...auth].ts` — `toSolidStartHandler(auth)` route | `src/routes/api/auth/[...auth].ts` | Copy verbatim. This mounts all better-auth endpoints under `/api/auth/*`. | HIGH |

### 2.5 Canvas (from solid-flow)

| Source repo | Source file | Target in Harkly | Adaptation needed | Priority |
|---|---|---|---|---|
| solid-flow | `src/components/Edge.tsx` (or equivalent) — SVG bezier edge rendering | `src/components/canvas/Edge.tsx` (SolidJS) | Port from SolidJS 1.5 → 1.9 (minimal diff). Replace scroll-based container with transform matrix coordinates. | MEDIUM |
| solid-flow | Node component pattern — `transform: translate(x,y)`, port refs via `onMount` | `src/components/canvas/Node.tsx` (SolidJS) | Adapt: keep pointer event handling; replace fixed-size container with Harkly's transform matrix canvas layer. | MEDIUM |

---

## 3. Existing Harkly Code (reuse as-is)

Code already in harkly-shell or harkly-saas that can be moved into the new unified project without modification.

### 3.1 harkly-shell — SolidJS components

Base path: `/c/Users/noadmin/nospace/development/harkly/harkly-shell/src/`

| File | What it is | Status | Notes |
|---|---|---|---|
| `components/Omnibar.tsx` | Omnibar shell container — primary input surface | Ready | Core Harkly UX primitive. Move as-is. |
| `components/OmnibarBody.tsx` | Omnibar body with panel switching | Ready | Move as-is. |
| `components/OmnibarInput.tsx` | Omnibar text input with command parsing | Ready | Move as-is. |
| `components/OmnibarPanelAgent.tsx` | Agent panel inside Omnibar | Ready | Move as-is. |
| `components/OmnibarPanelContext.tsx` | Context panel inside Omnibar | Ready | Move as-is. |
| `components/OmnibarPanelModel.tsx` | Model selector panel inside Omnibar | Ready | Move as-is. |
| `components/Space.tsx` | Spatial canvas container (Floor layer) | Ready | Core spatial primitive. Move as-is. |
| `components/FloorPill.tsx` | Floor indicator pill | Ready | Move as-is. |
| `components/BranchPill.tsx` | Branch/version indicator | Ready | Move as-is. |
| `components/CoordPill.tsx` | Canvas coordinate display | Ready | Move as-is. |
| `components/LatticeStatus.tsx` | Lattice/system status indicator | Ready | Move as-is. |
| `components/ErrorBoundary.tsx` | SolidJS error boundary | Ready | Move as-is. |
| `components/DynamicComponent.tsx` | Dynamic frame component loader | Ready | Move as-is. |
| `components/TrafficLights.tsx` | Window chrome traffic lights (Tauri) | Ready | Move as-is. Tauri desktop only. |
| `components/UUPRenderer.tsx` | Universal UI Protocol renderer | Ready | Move as-is. |
| `components/frameRegistry.tsx` | Frame type → component mapping registry | Ready | Extend with Harkly-specific frames. |
| `components/PatchDialog.tsx` | Patch/update dialog | Ready | Move as-is. |
| `components/Chat.tsx` | Chat UI component | Ready | Move as-is. |
| `commands/commandRegistry.ts` | Command registry for Omnibar | Ready | Move as-is; extend with Harkly KB commands. |
| `commands/defaultCommands.ts` | Default command definitions | Ready | Move as-is; add KB-specific commands. |
| `commands/frameLayouts.ts` | Layout preset definitions for frames | Ready | Move as-is; add Harkly frame layouts. |
| `hooks/useFloor.ts` | Floor state management hook | Ready | Move as-is. |
| `hooks/useViewport.ts` | Canvas viewport (pan/zoom) hook | Ready | Move as-is. Core canvas hook. |
| `hooks/useSnap.ts` | Grid snap hook for frame positioning | Ready | Move as-is. |
| `hooks/snapUtils.ts` | Snap math utilities | Ready | Move as-is. |
| `hooks/useComponents.ts` | Component registry hook | Ready | Move as-is. |
| `hooks/useIntentPipeline.ts` | Intent processing pipeline hook | Ready | Move as-is; wire to Harkly KB API. |
| `hooks/useKernelHealth.ts` | Kernel health check hook | Ready | Move as-is; adapt health endpoint to Harkly backend. |
| `types/frame.ts` | Frame type definitions | Ready | Move as-is; extend with Harkly frame types. |
| `types/intent.ts` | Intent type definitions | Ready | Move as-is. |
| `utils/coordinates.ts` | Canvas coordinate utilities | Ready | Move as-is. |
| `constants.ts` | App-wide constants | Ready | Move as-is; add Harkly-specific constants. |
| `kernel.ts` | Kernel communication layer | Ready | Adapt to call Harkly CF Workers API instead of local NATS. |
| `styles/design-tokens.css` | CSS design tokens (Bauhaus-derived) | Ready | Move as-is. Source of truth for all Harkly UI tokens. |
| `index.css` | Global styles | Ready | Move as-is. |

### 3.2 harkly-shell — Harkly-specific frames (new, purpose-built)

Base path: `/c/Users/noadmin/nospace/development/harkly/harkly-shell/src/components/frames/harkly/`

| File | What it is | Status | Notes |
|---|---|---|---|
| `ArtifactsFrame.tsx` | Artifacts browser frame | Ready | Core Harkly frame. Move as-is. |
| `CollectionPlanFrame.tsx` | Collection plan frame | Ready | Move as-is. |
| `FramingStudioFrame.tsx` | Framing studio frame | Ready | Move as-is. |
| `InsightsFrame.tsx` | Insights view frame | Ready | Move as-is. |
| `NotebookFrame.tsx` | Research notebook frame | Ready | Move as-is. |
| `RawDataFrame.tsx` | Raw data viewer frame | Ready | Move as-is. |
| `SourceCardFrame.tsx` | Source card frame | Ready | Move as-is. |

### 3.3 harkly-shell — General-purpose frames (reusable)

Base path: `/c/Users/noadmin/nospace/development/harkly/harkly-shell/src/components/frames/`

| File | What it is | Status | Notes |
|---|---|---|---|
| `WindowFrame.tsx` | Generic windowed frame container | Ready | Move as-is. Used by all other frames. |
| `TextFrame.tsx` | Plain text display frame | Ready | Move as-is. |
| `PanelFrame.tsx` | Panel container frame | Ready | Move as-is. |
| `ChatFrame.tsx` | Chat UI frame | Ready | Move as-is; wire to Harkly AI endpoint. |
| `HelpFrame.tsx` | Help / documentation frame | Ready | Move as-is. |
| `NotesFrame.tsx` | Notes frame | Ready | Move as-is. |
| `ImageViewerFrame.tsx` | Image viewer frame | Ready | Move as-is. |
| `DiffViewerFrame.tsx` | Diff viewer frame | Ready | Move as-is. |
| `FileBrowserFrame.tsx` | File browser frame | Ready | Move as-is; wire to R2. |
| `AgentStatusFrame.tsx` | Agent status frame | Ready | May adapt for Harkly ingest job status. |
| `ButtonFrame.tsx` | Interactive button frame | Ready | Move as-is. |

### 3.4 harkly-shell — Data/scenario files

| File | What it is | Notes |
|---|---|---|
| `data/g3-frames.ts` | G3 frame layout data | Move; may need scenario update for Harkly. |
| `data/kernel-frames.ts` | Kernel frame layout data | Move; adapt to Harkly KB frames. |
| `data/mcb-frames.ts` | MCB frame layout data | Move as legacy; MCB frames still valid. |
| `data/scenario.ts` | Demo scenario data | Replace with Harkly demo scenario. |

---

## 4. Port from harkly-saas (React → SolidJS)

Code in harkly-saas that was written in React and must be ported to SolidJS for the new unified project.

Base path: `/c/Users/noadmin/nospace/development/harkly/harkly-saas/src/`

### 4.1 Canvas types (zero porting — TypeScript, framework-agnostic)

| Source file | What it contains | Porting effort |
|---|---|---|
| `types/canvas.ts` | `CanvasFrame`, `CanvasViewport`, `CanvasStore` interfaces; `FrameModuleType` union; `CANVAS_DEFAULTS` constants | None — pure TypeScript types. Copy to `src/types/canvas.ts` unchanged. |

### 4.2 Canvas components (React → SolidJS)

| Source file | What it contains | Porting effort |
|---|---|---|
| `components/canvas/Canvas.tsx` (93 lines) | Main infinite canvas container. Transform matrix pan/zoom. Pointer event handling. | Medium. Replace `useState`/`useRef`/`useEffect` with `createSignal`/`createStore`; pointer events mostly identical; `ref=` syntax differs slightly. |
| `components/canvas/CanvasFrame.tsx` (149 lines) | Individual frame on canvas. Drag handle, resize, bring-to-front, minimize. | Medium. Same signal/store substitution. Frame lifecycle events need SolidJS `onCleanup`. |
| `components/canvas/CanvasGrid.tsx` (36 lines) | SVG/CSS grid background. | Low. Mostly JSX; signal subscriptions differ. |
| `components/canvas/CanvasToolbar.tsx` (69 lines) | Toolbar with zoom controls, layout actions. | Low. Pure UI, minimal state. |
| `components/canvas/FloorBadge.tsx` (41 lines) | Floor label badge overlaid on canvas. | Low. Display-only component. |
| `components/canvas/FrameContentRouter.tsx` (103 lines) | Routes `module` type to the correct frame component. | Low. Replace React `switch`/lazy with SolidJS `<Switch><Match>` or dynamic import pattern. |
| `components/canvas/ProjectPicker.tsx` (104 lines) | Project selection dropdown on canvas. | Medium. Replace React state with SolidJS signals; dropdown interaction differs. |

### 4.3 Canvas state (React Zustand → SolidJS createStore)

| Source file | What it contains | Porting effort |
|---|---|---|
| `components/canvas/useCanvasState.ts` (97 lines) | Zustand store implementing `CanvasStore`. Frame CRUD, viewport mutations, zIndex management, zoom-to-center math. | High. Zustand → SolidJS `createStore` + `produce`. All mutation methods must be wrapped in SolidJS setter calls. The `zoomTo(zoom, centerX, centerY)` math is framework-agnostic — copy that function body as-is. |

---

## 5. Build from Scratch

Components with no existing code or suitable OSS source. Must be written net-new.

| Component | Why no existing code | Estimated complexity |
|---|---|---|
| Schema confirmation UI | Harkly-specific UX: AI proposes schema fields → user edits/accepts. No OSS equivalent matches Harkly's design language. | High (~600 lines across 4-5 SolidJS components) |
| Upload UI (drag-drop + progress) | Requires Harkly design tokens + SSE progress streaming integration. Generic libraries clash with design system. | Medium (~300 lines) |
| Schema field editor (add/remove/rename/type fields) | Interactive field tree editor. No SolidJS-native field editor OSS. | High (~400 lines) |
| Fallback LLM chat (when no schema/KB) | Harkly-specific conversation interface with KB context injection. | Medium (~250 lines) |
| Consent UI for MCP OAuth | Required by workers-oauth-provider `defaultHandler`. Harkly design system. | Medium (~200 lines) |
| Login / signup pages | better-auth endpoints exist; Harkly design system UI layer needed. | Low (~150 lines) |
| Ingest progress dashboard | Job status polling + SSE streaming display. Based on `collection_runs` D1 table. | Medium (~300 lines) |
| KB query UI (chat with KB) | Retrieval UI: input → hybrid search → streaming LLM response display. | Medium (~350 lines) |
| Source lifecycle management UI | Archive/restore/delete sources. Based on graphrag-workbench patterns but SolidJS + Harkly design. | Medium (~400 lines) |
| KV-backed MCP SessionStore | Replaces mcp-ts-template's in-memory `Map`. CF KV with TTL. Required for multi-instance Workers scaling. | Low (~100 lines) |
| D1 Harkly-specific schema | `knowledge_bases`, `sources`, `chunks`, `schemas` tables. Combines cloudflare-rag + openai-sdk-knowledge-org patterns. | Medium (SQL + Drizzle schema, ~200 lines) |
| Vectorize `kbId` metadata filter | Namespace isolation per knowledge base. Not a separate index — metadata filter pattern from cloudflare-rag with Harkly's `kbId`. | Low (~50 lines integrated into vectorStore.ts) |
| MCP tool definitions | `search_knowledge`, `add_note`, `list_sources`, `get_schema` — Harkly-specific tool handlers using `D1Provider` with `tenantId`. | Medium (~300 lines across 4 tool files) |
| Tauri file drop + native file picker commands | Rust Tauri commands for native OS file operations. tauri-specta bindings. | Medium (~150 lines Rust + 50 lines TS bridge) |

---

## 6. Cloned Repos Reference

All repos cloned into `/c/Users/noadmin/nospace/docs/research/_eval/`. Status of each.

| Repo | Clone path | What was evaluated | Keep / Delete |
|---|---|---|---|
| `RafalWilinski/cloudflare-rag` | `_eval/cloudflare-rag/` | FTS5 DDL, RRF function, query rewrite, batch embed, SSE progress, AI Gateway pattern. Multiple files to copy. | **KEEP** — source files actively referenced |
| `seratch/openai-sdk-knowledge-org` | `_eval/openai-sdk-knowledge-org/` | JobQueue class, RateLimiter, TokenCounter, VectorStoreImpl, id-utils, D1 migrations, Drizzle schema. Multiple classes to copy. | **KEEP** — source files actively referenced |
| `dead8309/ai-rag-crawler` | `_eval/ai-rag-crawler/` | CF Workflows pattern (RagWorkflow), workflow route handlers, wrangler.toml `[[workflows]]` binding. | **KEEP** — structural template reference |
| `DocumindHQ/documind` | `_eval/documind/` | AUTO_SCHEMA_PROMPT, INSTRUCTIONS_SCHEMA_PROMPT, convertToZodSchema, baseSchema, BASE_EXTRACTION_PROMPT. | **KEEP** — prompts + utilities to port |
| `juanceresa/sift-kg` | `_eval/sift-kg/` | build_discovery_prompt, _generate_doc_context, _dedupe_entities, parse_llm_json, DomainConfig models. | **KEEP** — prompts + patterns to port from Python |
| `l1m-io/l1m` | `_eval/l1m/` | minimalSchema(), collectDescriptions(), multi-attempt feedback loop, parseJsonSubstring. | **KEEP** — utility functions to copy |
| `567-labs/instructor-js` | `_eval/instructor-js/` | retry-with-error-feedback, LLMValidator, entity resolution example schema, mode strategy. | **KEEP** — patterns + code to copy |
| `cyanheads/mcp-ts-template` | `_eval/mcp-ts-template/` | httpTransport, oauthStrategy, authMiddleware, claimParser, d1Provider, kvProvider, sessionStore. Available via npm — eval dir is reference only. | **KEEP** (reference) — main usage via `@cyanheads/mcp-ts-core` npm |
| `cloudflare/workers-oauth-provider` | `_eval/workers-oauth-provider/` | OAuthProvider class, KV storage schema, tokenExchangeCallback, PKCE flow. Available via npm. | **KEEP** (reference) — main usage via `@cloudflare/workers-oauth-provider` npm |
| `zpg6/better-auth-cloudflare` | `_eval/better-auth-cloudflare/` | createAuth per-request pattern, withCloudflare() wrapper, D1 adapter, CLI template. Available via npm. | **KEEP** (reference) — main usage via `better-auth-cloudflare` npm |
| `phi-ag/solid-pages` | `_eval/solid-pages/` | app.config.ts, wrangler.toml, middleware.ts, db/client.ts, db/schema.ts, drizzle.config.ts, npm scripts. | **KEEP** — multiple config files to copy |
| `atilafassina/quantum` | `_eval/quantum/` | app.config.ts (Tauri branch), lib.rs specta pattern, Cargo.toml release opts, CI release workflow. | **KEEP** — Tauri config files to copy |
| `cloudflare/workers-mcp` | `_eval/workers-mcp/` | Evaluated and rejected. stdio-only, single-tenant, no OAuth, incompatible architecture. | **DELETE** — do not use |
| `miguelsalesvieira/solid-flow` | `_eval/solid-flow/` | SVG edge rendering pattern, node component with transform:translate. Canvas layer is unusable (no infinite scroll, no zoom). Only steal edge SVG pattern. | **KEEP** (partial) — SVG edge pattern only |

---

## Architecture Notes

### Key file dependency order (what to build first)

1. `wrangler.toml` + `app.config.ts` (from solid-pages + quantum) — infra foundation
2. `src/db/schema.ts` + migrations — D1 schema (cloudflare-rag FTS5 DDL + openai-sdk-knowledge-org job tables)
3. `src/middleware.ts` — CF bindings in SolidStart (from solid-pages)
4. `src/lib/auth.ts` + auth route — better-auth setup (from aguywhosaguy + better-auth-cloudflare)
5. `src/lib/pipeline/` — JobQueue, RateLimiter, TokenCounter, IdUtils (from openai-sdk-knowledge-org)
6. `src/lib/schema/` — prompts, zodCompiler, extractor, schemaUtils (from documind + sift-kg + l1m + instructor-js)
7. `src/lib/rag/` — embedBatch, ftsSearch, rrf, queryRewrite, vectorStore (from cloudflare-rag + openai-sdk-knowledge-org)
8. `src/workers/mcp-worker.ts` — MCP server (from mcp-ts-template + workers-oauth-provider)
9. Canvas components — port from harkly-saas; integrate with harkly-shell hooks
10. Build-from-scratch UI — schema confirmation, upload, consent pages

### Critical gotchas to not repeat

| Gotcha | Source | Correct behavior |
|---|---|---|
| FTS5 BM25 rank sort direction | cloudflare-rag bug | `ORDER BY rank ASC` (rank is negative BM25 score — lower is better) |
| D1 is per-request only | solid-pages pattern | Always `createDb(event)` — never module-level `drizzle()` |
| SessionStore is in-memory | mcp-ts-template | Replace with KV-backed implementation before production |
| Vectorize topK hard limit | openai-sdk-knowledge-org | Cap at 20; use multiple query vectors (query rewrite) to compensate |
| D1 999-variable SQLite limit | openai-sdk-knowledge-org | Batch all `WHERE id IN (...)` queries to ≤100 IDs |
| D1 row size limit | openai-sdk-knowledge-org | `TokenCounter.validateAndTruncateContent()` before any insert |
| Vectorize metadata 2000 char limit | openai-sdk-knowledge-org | Store full chunk text in D1; use metadata only for ANN scoring |
| CF Workflows transaction bug | ai-rag-crawler | Do NOT wrap `step.do()` calls in a `db.transaction()` — they are different atomicity units |
| Tauri port mismatch | quantum template | Ensure `tauri.conf.json` `devUrl` matches `app.config.ts` port (1420) |
| better-auth client session path | SolidStart docs | Client-side: `session()?.data?.user` not `session()?.user` |
| solid-pages wrangler state path | solid-pages | `drizzle.config.ts` `dbCredentials.url` hash changes per project — find actual path after first `vinxi dev` |
| Schema discovery must run once | sift-kg pattern | Never run schema discovery per-chunk; discover once per dataset, cache, constrain all extraction to discovered schema |
