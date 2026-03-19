# Harkly Eval — RAG Pipeline Repos
> Date: 2026-03-19
> Evaluator: Lead/TechResearch
> Context: Harkly stack = SolidStart + Cloudflare Workers + D1 + Vectorize + R2 + Queues

---

## 1. cloudflare-rag

**Repo:** https://github.com/RafalWilinski/cloudflare-rag
**Stars:** 596
**Stack:** Remix + Cloudflare Pages Functions + D1 + Vectorize + R2 + KV + Workers AI
**Cloned from:** commit at time of eval (depth 1)

### 1.1 Architecture

Pipeline is synchronous and streaming — no async queue. Everything happens inside a single `ctx.waitUntil()` block during upload:

```
User uploads PDF →
  POST /api/upload →
    [parallel] uploadToR2 + extractTextFromPDF (unpdf) →
    insertDocument (D1) →
    RecursiveCharacterTextSplitter (chunkSize=500, overlap=100) →
    insertVectors [batch of 10]:
      AI.run("@cf/baai/bge-large-en-v1.5", { text: batch }) →
      D1 insert documentChunks →
      VECTORIZE_INDEX.insert(vectors with metadata) →
    SSE stream progress back to client
```

Query pipeline (hybrid RAG with RRF):

```
POST /api/stream →
  rewriteToQueries (LLM → 5 query rewrites) →
  [parallel]:
    FTS5 search on document_chunks_fts (D1)
    VECTORIZE_INDEX.query x N queries →
  reciprocalRankFusion(FTS results, vector results) →
  fetch top-10 chunks from D1 by fused IDs →
  stream LLM response via CF AI Gateway (fallback chain)
```

**Key architectural insight:** This is the only repo of the three that implements **hybrid retrieval (FTS5 + vector + RRF)**. The query rewrite to 5 variants before searching is a strong pattern.

### 1.2 D1 Schema

```sql
-- documents: one row per uploaded file
CREATE TABLE `documents` (
  `id` text PRIMARY KEY NOT NULL,    -- ULID
  `name` text,
  `text_content` text,               -- full extracted text stored in D1
  `size` integer,
  `session_id` text,                 -- per-user session isolation
  `r2_url` text                      -- R2 key path
);

-- document_chunks: one row per chunk
CREATE TABLE `document_chunks` (
  `id` text PRIMARY KEY NOT NULL,    -- ULID, also used as Vectorize vector id
  `document_id` text,
  `text` text,
  `session_id` text,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE
);

-- FTS5 virtual table with auto-trigger
CREATE VIRTUAL TABLE document_chunks_fts USING fts5(
  id UNINDEXED,
  document_id UNINDEXED,
  text,
  session_id UNINDEXED,
  content = 'document_chunks'
);

-- trigger to keep FTS in sync
CREATE TRIGGER document_chunks_ai AFTER INSERT ON document_chunks
BEGIN
  INSERT INTO document_chunks_fts(id, document_id, text, session_id)
  VALUES (new.id, new.document_id, new.text, new.session_id);
END;
```

**Notable:** chunk IDs are ULIDs, used directly as Vectorize vector IDs. FTS5 trigger auto-syncs on insert. `session_id` column used for namespace isolation instead of Vectorize namespaces.

### 1.3 Vectorize Usage

**Embedding model:** `@cf/baai/bge-large-en-v1.5` (CF Workers AI, free tier) — 1024-dim
**Insert:** `VECTORIZE_INDEX.insert(vectors[])` — batches of 10 chunks
**Query:** `VECTORIZE_INDEX.query(vector, { topK: 5, returnValues: true, returnMetadata: "all", namespace: "default", filter: { sessionId } })`
**Metadata stored on vector:** `{ sessionId, documentId, chunkId, text }` — text stored in metadata for retrieval without D1 roundtrip
**Namespace:** hardcoded `"default"` (not used for isolation — sessionId in metadata filter instead)

Filtering by `sessionId` in Vectorize metadata is used for per-user document isolation. This is a valid Vectorize pattern but has a caveat: metadata filters are only supported on indexed metadata fields.

### 1.4 Queue Pattern

**No CF Queues used.** Ingestion happens synchronously in `ctx.waitUntil()`. Progress streaming via SSE uses `TransformStream`. This means the upload must complete within CF Pages Function timeout limits (~30s wall clock, extendable via `waitUntil` to CPU limit).

**Risk for Harkly:** for large documents or many chunks, this will hit the subrequest limit (50 per request on free plan, 1000 on paid). The repo itself has no queue workaround.

### 1.5 R2 Usage

R2 stores the original PDF file. Key format: `{sessionId}/{timestamp}-{filename}`.
The stored R2 key path is saved in `documents.r2_url` column.
R2 is **write-only from the pipeline perspective** — there is no code to read back from R2 during query. The file is available for future download/display only.

### 1.6 API Routes (CF Pages Functions)

```
POST /api/upload  — file ingestion (SSE streaming response, multipart/form-data)
POST /api/stream  — query/chat (SSE streaming response, JSON body)
```

No CRUD for documents. No delete. No list.

### 1.7 CF AI Gateway

The `aiGateway.ts` implements a **universal endpoint waterfall**: one POST to `https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/` with an array of providers. CF AI Gateway tries them in order and returns first success. Supported providers in this implementation: Groq → OpenAI → Anthropic → Workers AI (fallback with no keys).

This is an elegant pattern: single API call handles provider failover with no client-side retry logic.

### 1.8 What to Steal

- **FTS5 virtual table + trigger pattern** — exact SQL is copy-paste ready for Harkly D1
- **Reciprocal Rank Fusion implementation** — 40 lines, clean, directly usable (`functions/api/stream.ts` lines 80-106)
- **Query rewrite to N variants before search** — prompt engineering for better recall
- **Batch embedding with progress SSE** — pattern in `insertVectors()`, streams `Embedding... (X%)` events
- **`@cf/baai/bge-large-en-v1.5` embedding model** — free, CF-native, 1024-dim, already proven
- **`unpdf` for PDF text extraction** — works in Workers without Node.js compat
- **ULID as Vectorize vector ID** — avoids UUID collision issues

### 1.9 What to Skip

- **Remix framework** — Harkly uses SolidStart; only the `functions/` directory is relevant
- **Session-based isolation** — Harkly should use `knowledgeBaseId` as the namespace concept
- **`ctx.waitUntil()` as sole async mechanism** — not suitable for large documents; use CF Queues
- **KV for rate limiting** — acceptable for demo; Harkly should use CF Rate Limiting API or D1-based approach

### 1.10 CF Workflows

Not used. No durable execution.

### 1.11 Key Gotcha

**FTS5 query sanitization is incomplete.** In `searchDocumentChunks()`:
```ts
const sanitizedTerm = term.trim().replace(/[^\w\s]/g, '');
```
This strips special chars but passes result directly into a raw SQL template literal using `MATCH`. SQLite FTS5 MATCH syntax supports operators (`AND`, `OR`, `NOT`, `*`, `"phrase"`). A user query containing these as literal words will be misinterpreted. Also, the `rank` column in FTS5 results is negative (lower = better match) — the sort `ORDER BY rank DESC` is actually **ascending by match quality**, which is the wrong direction for BM25 in SQLite FTS5 where rank = negative BM25 score.

**Subrequest limit:** On Workers free plan, 50 subrequests per request. Each `AI.run()` + `VECTORIZE_INDEX.insert()` + D1 insert = 3 subrequests per batch of 10 chunks. A 100-chunk document = 10 batches = 30+ subrequests. This works on paid plans (1000 limit) but is fragile without queuing.

---

## 2. ai-rag-crawler

**Repo:** https://github.com/dead8309/ai-rag-crawler
**Stars:** 32
**Stack:** Hono + CF Workflows + Drizzle + Neon Postgres + Workers AI + Vercel Next.js (scraper proxy)
**Cloned from:** commit at time of eval (depth 1)

### 2.1 Architecture

Three-app monorepo:
- `apps/api` — CF Worker (Hono) with Workflows binding
- `apps/scraper` — Next.js on Vercel (headless Puppeteer proxy for browser-based scraping)
- `apps/web` — Next.js frontend

Pipeline:

```
POST /api/scrape/workflow → RagWorkflow.create({ url, strict, type }) →
  CF Workflows durable execution:
    step.do("Check if site exists") → Neon DB
    step.do("Insert a new site") → Neon DB
    step.do("Scrape site") → scrapeSite() [p-limit concurrent] →
      fetchPageData → Vercel scraper proxy (or direct fetch) →
    step.do("Split page content into chunks and insert into db") →
      pages.insert() x N pages →
    step.do("Generate vector embeddings for each page") →
      chunkPageContent (langchain RecursiveCharacterTextSplitter 500/128) →
      AI.run(embeddings_model, { text: chunks }) →
      pageChunks.insert() x N chunks (embedding stored in Neon vector column)
```

Query:

```
POST /api/sites/ask → siteId + question →
  AI.run(embeddings) for question →
  cosineDistance query on Neon pageChunks (drizzle pgvector) →
  filter similarity > 0.5, limit 10 →
  generateText or streamText (DeepSeek/OpenAI via AI SDK) with optional tool calling
```

**Critical issue:** This repo uses **Neon Postgres**, not CF D1. The `vector` column type and `cosineDistance` from drizzle `pg-core` are PostgreSQL-specific. The wrangler.toml has D1 section **commented out** and no Vectorize binding. The schema uses `pgTable`, not `sqliteTable`.

### 2.2 D1 Schema

**Not used.** The API uses `@neondatabase/serverless` with a Postgres connection string (`DATABASE_URL`). The schema is PostgreSQL with `pgvector` extension:

```sql
-- sites table
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- pages table (one per crawled URL)
CREATE TABLE pages (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(site_id, url)
);

-- page_chunks (vector stored in PostgreSQL via pgvector)
CREATE TABLE page_chunks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1024),     -- pgvector column
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
CREATE INDEX embedding_idx ON page_chunks USING hnsw(embedding vector_cosine_ops);
```

**Note:** `chunk_index` is stored as a standalone column, useful for ordered retrieval.

### 2.3 Vectorize Usage

**Not used.** Uses pgvector HNSW index in Neon Postgres. Similarity query:
```ts
const similarity = sql`1 - (${cosineDistance(pageChunks.embedding, questionEmbedding)})`;
```

**Completely incompatible with Harkly's target stack.** The cosine similarity is computed by PostgreSQL at query time, not by Cloudflare Vectorize ANN.

### 2.4 Queue Pattern

**Not used directly.** The async part is handled by **CF Workflows** (`WorkflowEntrypoint`). The Workflow binding is declared in `wrangler.toml`:

```toml
[[workflows]]
name = "ai-docs-rag"
binding = "RAG_WORKFLOW"
class_name = "RagWorkflow"
```

The Workflow is created via `c.env.RAG_WORKFLOW.create({ params })` and tracked via `instance.status()`. Each `step.do(name, fn)` is a durable checkpoint — if the worker crashes, the Workflow resumes from the last completed step.

**Note from code comments:** Workflow retry (`instance.restart()`) is not yet implemented by Cloudflare as of December 2024. The code has it commented out with the error message `"Not implemented yet"`.

### 2.5 R2 Usage

**Not used.** No R2 binding in the repo.

### 2.6 API Routes

```
POST /api/scrape/workflow    — start RagWorkflow (returns instanceId)
GET  /api/scrape/workflow/:id — poll workflow status
GET  /api/sites              — list all sites with page counts
GET  /api/sites/:id          — site detail with page list
DELETE /api/sites/:id        — delete site (cascades to pages/chunks)
GET  /api/pages/:pageId      — page detail with chunks
DELETE /api/pages/:pageId    — delete page
POST /api/sites/ask          — synchronous Q&A
POST /api/sites/ask/stream   — streaming Q&A with tool calling
```

**Hono + OpenAPI Zod** is used for all routes. Schema validation is thorough.

### 2.7 What to Steal

- **CF Workflows pattern** — `WorkflowEntrypoint` + `step.do()` checkpointing is directly applicable to Harkly's ingest pipeline. The pattern in `rag.ts` (lines 25-129) is the only production-quality Workflows implementation in the three repos
- **Workflow status polling API** — `GET /api/scrape/workflow/:id` is a clean UX pattern to show ingestion progress without SSE
- **`p-limit` for concurrent scraping** — clean concurrency control pattern in `scrape.ts`
- **`wrangler.toml` Workflows binding syntax** — correct and minimal example
- **Hono + `@hono/zod-openapi`** — if Harkly needs an API layer with schema validation, this is the cleanest pattern in the set

### 2.8 What to Skip

- **Neon Postgres** — entirely wrong for Harkly. D1 + Vectorize only
- **pgvector** — not applicable; use Vectorize
- **Vercel scraper proxy** — hardcoded to `localhost:3000` in the source; this is unfinished. Web scraping is not Harkly's use case anyway (Harkly builds KB from uploaded documents/data)
- **`DATABASE_URL` in wrangler.toml** — Neon serverless driver in a CF Worker is an anti-pattern for Harkly

### 2.9 CF Workflows — Deep Analysis

This is the **only repo that uses CF Workflows**. Key observations from the code:

1. `WorkflowEntrypoint<Env, Params>` class extends the CF Workflows base
2. Each `step.do(name, asyncFn)` is a **named, durable checkpoint** — name must be unique within a workflow instance
3. Steps are **idempotent by design** — if a step crashes mid-execution, CF replays from the last persisted step result
4. The entire pipeline (scrape + chunk + embed + insert) runs within one Workflow instance — no Queues needed
5. **Critical limitation found:** The entire workflow wraps everything in a single `db.transaction()` — this conflicts with `step.do()` semantics. If a step resumes after crash, the transaction context is gone and the transaction cannot be replayed. This is a **design bug** — `step.do()` should be the atomicity unit, not a DB transaction wrapping multiple steps.
6. Workflows are billed by wall-clock time, not CPU. A long-running scrape/embed job is appropriate for Workflows.

### 2.10 Key Gotcha

**Neon `Pool` + `db.transaction()` inside Workflow steps does not work correctly.** The code comment says: "Had to use pool and transactions as workers free plan only supports 50 subrequests per request." But Workflows have their own execution context and the subrequest limit resets per step. The transaction wrapping all steps (`await db.transaction(async (trx) => { step.do(...) })`) is architecturally incorrect — Drizzle transactions are not serializable across Workflow step boundaries.

**`PROXY_SCRAPER_URL` is hardcoded to `localhost:3000`** in `scrape.ts`. The production URL is commented out. This means the "browser" scraping mode is completely broken in production.

---

## 3. openai-sdk-knowledge-org

**Repo:** https://github.com/seratch/openai-sdk-knowledge-org
**Stars:** 15
**Stack:** CF Workers + D1 + Vectorize + CF Queues + OpenAI API (embeddings + agents)
**Cloned from:** commit at time of eval (depth 1)

### 3.1 Architecture

This is the most architecturally complete and production-ready of the three. It has a **two-mode pipeline**:

**Mode A — Orchestrator (synchronous, used for smaller runs):**
```
Admin triggers → DataPipelineOrchestrator.runDataCollection() →
  collect forum posts (Discourse API, paginated, filtered) →
  collect GitHub issues + repo files →
  TextProcessor.chunkDocuments() →
  EmbeddingGenerator.batchProcess() (OpenAI text-embedding-3-small) →
  VectorStore.store() → Vectorize.upsert() in batches of 100
```

**Mode B — JobProcessor + CF Queues (async, production):**
```
Admin triggers → JobQueue.createJob("github_collect" | "forum_collect") →
  Queue.send({ jobId }) →
  Worker queue handler → JobProcessor.processNextJobs() →
    executeJobLogic():
      "github_collect" → fetch issues/files → create "process_github_batch" jobs →
      "process_github_batch" → create "process_batch_item" jobs per chunk →
      "process_batch_item" → summarize → embed → VectorStore.store()
    markJobCompleted() → checkAndCompleteCollectionRun()
```

Query pipeline:
```
POST /api/search → VectorStore.searchWithOptions(query, options) →
  OpenAI embed query → Vectorize.query(topK=20) →
  return results with metadata
```

Plus a full **OpenAI Agents SDK** layer on top for RAG with guardrails, web search fallback, translation, and result evaluation.

**Also has MCP server** — exposes the vector knowledge base as an MCP tool for AI clients (Claude, Cursor, etc.).

### 3.2 D1 Schema

Uses D1 for job orchestration state, NOT for vector/chunk storage (those go to Vectorize directly with metadata):

```sql
-- collection_runs: tracks ingestion jobs at run level
CREATE TABLE collection_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,              -- 'github' or 'forum'
  status TEXT NOT NULL,              -- 'running', 'completed', 'failed', 'cancelled'
  current_phase TEXT,
  progress_message TEXT,
  documents_collected INTEGER DEFAULT 0,
  documents_processed INTEGER DEFAULT 0,
  total_estimated INTEGER DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT
);

-- job_queue: D1-backed job queue (used alongside CF Queues binding)
CREATE TABLE job_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,              -- 'pending', 'running', 'completed', 'failed'
  priority INTEGER DEFAULT 0,
  payload TEXT NOT NULL,             -- JSON blob
  collection_run_id INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  FOREIGN KEY (collection_run_id) REFERENCES collection_runs(id)
);

-- work_items: individual documents to process
CREATE TABLE work_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_run_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,           -- 'github_issue', 'github_file', 'forum_post'
  item_id TEXT NOT NULL,
  status TEXT NOT NULL,              -- 'pending', 'processing', 'completed', 'failed', 'skipped'
  source_data TEXT NOT NULL,         -- full JSON of source content
  processed_data TEXT,               -- JSON of processed result
  retry_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  error_message TEXT,
  FOREIGN KEY (collection_run_id) REFERENCES collection_runs(id)
);

-- collection_timestamps: ETag/Last-Modified cache to avoid re-processing unchanged data
CREATE TABLE collection_timestamps (
  source TEXT PRIMARY KEY,
  last_successful_collection TEXT NOT NULL,
  etag TEXT,
  last_modified TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- query_stats: observability for search performance
CREATE TABLE query_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  search_type TEXT,
  vector_time_ms INTEGER,
  keyword_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL
);

-- api_tokens, mcp_clients, mcp_authorization_codes: auth/MCP (see schema.ts)
```

**Key insight:** D1 is used as a **job orchestration layer** (job_queue, work_items, collection_runs). Vector data itself lives only in Vectorize, with content embedded in metadata (up to 2000 chars per vector). This is a correct separation for CF's primitives.

### 3.3 Vectorize Usage

**Embedding model:** OpenAI `text-embedding-3-small` (1536-dim) — external API, not CF Workers AI
**Insert:** `vectorize.upsert(vectors)` in batches of 100 with 500ms delay between batches
**Query:** `vectorize.query(embedding, { topK: min(limit, 20), returnMetadata: "all" })` — **topK capped at 20 (Vectorize hard limit)**
**Metadata on vector:** `{ content: doc.content.substring(0, 2000), ...doc.metadata }` — content truncated to 2000 chars
**Rate limiter:** 100 req/min to Vectorize with exponential backoff + jitter
**Two indexes:** separate `VECTORIZE_PROD` and `VECTORIZE_DEV` bindings selected by `ENVIRONMENT` env var
**No filtering:** vectors are not namespaced per user/tenant — global index

Vectorize metadata field `content` holds a 2000-char snippet of the document. The full content is NOT stored in D1 separately, meaning retrieval is limited to 2000 chars per result. For Harkly this is likely sufficient.

### 3.4 Queue Pattern

Uses **dual queue system**: CF Queues binding (`JOB_QUEUE`) AND D1-backed job table. When a job is created:

```ts
// 1. Insert to D1 job_queue table
const jobId = await drizzleDb.insert(jobQueue).values({...}).run();
// 2. Send to CF Queue
await this.queue.send({ jobId });
```

The CF Queue trigger calls the worker, which reads the jobId from the message, looks up the full job from D1, and executes it. D1 acts as the durable state store; CF Queue is just the notification mechanism.

**Stale job detection:** `getNextJobs()` resets jobs stuck in `running` state for more than 5 minutes back to `pending`. This handles worker crashes.

**Job types hierarchy:**
```
github_collect → process_github_batch → process_batch_item
forum_collect  → process_forum_batch  → process_batch_item
process_pending_work_items (fallback recovery)
process_item   (legacy single-item processing)
```

**CF Queues + D1 is strictly better than Workflows for this use case** because:
- Jobs can be retried individually without replaying the full pipeline
- D1 gives full visibility into job state
- Queues have guaranteed delivery

### 3.5 R2 Usage

**Not used.** All content ingested from GitHub API and Discourse API. No file uploads, no R2.

### 3.6 API Routes

```
-- Pipeline management (admin)
POST   /api/admin/pipeline/collect       — start collection run
POST   /api/admin/pipeline/collect/jobs  — start job-based collection
GET    /api/admin/pipeline/runs          — list collection runs
GET    /api/admin/pipeline/runs/:id      — run detail
POST   /api/admin/pipeline/runs/:id/cancel — cancel run
GET    /api/admin/pipeline/jobs          — list jobs
POST   /api/admin/pipeline/jobs/process  — trigger job processing

-- Search / RAG
POST   /api/search                       — vector search
POST   /api/agent/query                  — OpenAI Agents SDK query (with RAG tool)
POST   /api/agent/query/stream           — streaming agent query

-- Auth
POST   /api/auth/login
POST   /api/auth/token

-- MCP
GET    /mcp/...                          — MCP server endpoints

-- Admin UI (SSR pages)
GET    /admin, /admin/*, /playground
```

### 3.7 What to Steal

- **D1-backed job queue schema** (`job_queue` + `work_items` + `collection_runs`) — production-grade observability for ingest jobs. Directly applicable to Harkly's KB build pipeline.
- **`JobQueue` class** (`src/pipeline/job-queue.ts`) — full implementation: createJob, getNextJobs, markJobRunning/Completed/Failed, stale job reset. Copy-paste ready.
- **`RateLimiter` class** (`src/rate-limiter.ts`) — exponential backoff + jitter + configurable strategy. Clean, tested, directly usable for Vectorize API calls.
- **`TokenCounter` class** (`src/pipeline/token-counter.ts`) — `validateAndTruncateContent()` is critical for D1: enforces `D1_SAFE_CONTENT_SIZE = 1_500_000` bytes. Will prevent SQLITE_TOOBIG errors.
- **`VectorStoreImpl.storeInVectorize()`** — batch=100, 500ms delay, rate limiter wrapping `vectorize.upsert()`. Correct production pattern.
- **`collection_timestamps` table** — ETag/Last-Modified caching to avoid re-processing unchanged sources. Smart deduplication pattern.
- **`query_stats` table** — logging search latency/cache hits. Zero-cost observability in D1.
- **Prod/Dev Vectorize index separation** — two bindings, one per environment. Prevents dev data polluting prod index.
- **`TextProcessor.chunkDocuments()`** — Jupyter notebook parsing is a bonus; the base chunker with `filterOSRuntimeMetadata()` and language detection is useful for multi-format KB.
- **`IdUtils.ensureSafeId()`** — normalizes arbitrary strings to Vectorize-safe IDs (Vectorize IDs must be alphanumeric + dash/underscore, ≤64 chars)

### 3.8 What to Skip

- **OpenAI Agents SDK** (`@openai/agents`) — Harkly uses its own LangGraph pipeline; the agent orchestration layer is not needed
- **GitHub/Forum collectors** — Harkly ingests uploaded documents, not crawled repos/forums
- **MCP server** — not in Harkly's scope
- **Google OAuth auth** — Harkly has its own auth
- **OpenAI embeddings** — Harkly should use `@cf/baai/bge-large-en-v1.5` (free CF Workers AI) to avoid external API dependency for embeddings

### 3.9 CF Workflows

**Not used.** The async processing is done via CF Queues + D1 job table, which is actually more flexible.

### 3.10 Key Gotcha

**Vectorize `topK` hard limit is 20.** This is explicitly noted in the code:
```ts
topK: (options.limit && options.limit > 20 ? 20 : options.limit) || 10,
```
If Harkly needs more than 20 results for re-ranking, it must do multiple Vectorize queries with different query vectors (as cloudflare-rag does with 5 query rewrites).

**SQLite 999-variable limit.** The code has explicit comments and workarounds: `filterExistingFiles()` batches in groups of 100 IDs, `createWorkItems()` uses chunk size of 50. Any `WHERE id IN (...)` query with D1 must batch to stay under SQLite's `SQLITE_MAX_VARIABLE_NUMBER = 999`.

**D1 row size limit.** `TokenCounter.D1_MAX_ROW_SIZE = 2_000_000` bytes, `D1_SAFE_CONTENT_SIZE = 1_500_000`. The code truncates source content before inserting into `work_items.source_data`. Without this guard, long documents will fail with `SQLITE_TOOBIG`.

**Vectorize metadata content truncated at 2000 chars.** This is a Vectorize metadata size limit issue. If the chunk content is longer than 2000 chars, retrieval returns truncated text. Harkly must store full chunk text in D1 and use vector metadata only for filtering/scoring.

---

## Copy Map — What to Take

| Source repo | File/pattern | Use in Harkly |
|---|---|---|
| cloudflare-rag | `drizzle/20240828100648_skinny_midnight.sql` (FTS5 table + trigger) | Copy FTS5 DDL into Harkly D1 migrations |
| cloudflare-rag | `functions/api/stream.ts` lines 80-106 (RRF function) | Copy `performReciprocalRankFusion()` as-is |
| cloudflare-rag | `functions/api/stream.ts` lines 12-39 (query rewrite) | Adapt query rewrite prompt for Harkly |
| cloudflare-rag | `functions/api/stream.ts` lines 50-77 (FTS5 search) | Adapt FTS5 search with proper sanitization |
| cloudflare-rag | `functions/api/upload.ts` lines 47-110 (batch embed) | Adapt embedding batch loop with progress SSE |
| cloudflare-rag | `app/lib/aiGateway.ts` (CF AI Gateway universal endpoint) | Adapt for Harkly's LLM provider strategy |
| ai-rag-crawler | `apps/api/src/workflows/rag.ts` (Workflow structure) | Template for Harkly's CF Workflow ingest |
| ai-rag-crawler | `apps/api/src/routes/workflow.ts` (workflow route handlers) | Pattern for workflow start + status poll API |
| ai-rag-crawler | `apps/api/wrangler.toml` (Workflows binding syntax) | Copy `[[workflows]]` block |
| openai-sdk-knowledge-org | `src/pipeline/job-queue.ts` (`JobQueue` class) | Copy entire class, adapt to Harkly types |
| openai-sdk-knowledge-org | `src/rate-limiter.ts` (`RateLimiter` class) | Copy entire class unchanged |
| openai-sdk-knowledge-org | `src/pipeline/token-counter.ts` (`TokenCounter` class) | Copy entire class unchanged |
| openai-sdk-knowledge-org | `src/storage/vector-store.ts` (`VectorStoreImpl.storeInVectorize()`) | Adapt for Harkly's batch upsert to Vectorize |
| openai-sdk-knowledge-org | `migrations/0001_initial_schema.sql` (job_queue + work_items + collection_runs + query_stats + collection_timestamps) | Use as Harkly D1 migration for ingest pipeline tables |
| openai-sdk-knowledge-org | `src/storage/d1-database/schema.ts` (Drizzle schema) | Copy jobQueue + workItems + collectionRuns tables |
| openai-sdk-knowledge-org | `src/pipeline/processors/id-utils.ts` | Copy `ensureSafeId()` — required for Vectorize IDs |
| openai-sdk-knowledge-org | Prod/Dev Vectorize binding pattern | Add `VECTORIZE_PROD`/`VECTORIZE_DEV` to wrangler.toml |
| openai-sdk-knowledge-org | `collection_timestamps` table + ETag pattern | Implement in Harkly for incremental KB updates |

---

## Architecture Recommendation

### Recommended Harkly Pipeline Architecture

Based on analysis of all three repos, the following hybrid design is recommended:

**Ingestion pipeline (CF Queues + D1 + Vectorize):**

```
1. User uploads file (PDF/MD/CSV/etc.) to Harkly API
   POST /api/kb/ingest
     → store original file in R2 (key: {kbId}/{fileId}.{ext})
     → insert document row in D1
     → JobQueue.createJob("process_document", { fileId, kbId }) → CF Queue send
     → return { jobId, status: "queued" }

2. CF Queue consumer (Worker) → JobProcessor.processNextJobs()
   "process_document":
     → read file from R2
     → extract text (unpdf for PDF, remark for MD, papaparse for CSV)
     → RecursiveCharacterTextSplitter (chunkSize=500, overlap=100)
     → for each batch of 10 chunks:
         AI.run("@cf/baai/bge-large-en-v1.5") → embeddings
         D1 insert chunks (with TokenCounter guard)
         FTS5 trigger auto-syncs
         Vectorize.upsert(batch, metadata: { kbId, docId, chunkId, content[0:2000] })
     → markJobCompleted()
     → update document status = "indexed"

3. Query pipeline (hybrid retrieval)
   POST /api/kb/:kbId/query { question }
     → rewriteToQueries (3-5 variants via LLM)
     → parallel:
         FTS5 MATCH queries on D1 (filtered by kbId)
         Vectorize.query x N (topK=10, filter: { kbId })
     → RRF merge → top 10 IDs
     → fetch full chunks from D1 by IDs
     → inject as context → stream LLM response
```

**D1 Tables (merged from all three repos):**

```sql
-- Core document storage (from cloudflare-rag, adapted)
documents (id, kbId, name, mimeType, r2Key, textContent, status, createdAt)
document_chunks (id, docId, kbId, chunkIndex, text, createdAt)
document_chunks_fts (FTS5 virtual, content=document_chunks, with trigger)

-- Ingest job orchestration (from openai-sdk-knowledge-org)
ingest_jobs (id, jobType, status, priority, payload, docId, retryCount, ...)
ingest_runs (id, kbId, status, currentPhase, docsTotal, docsProcessed, ...)
query_stats (id, kbId, query, resultsCount, responseTimeMs, ...)
```

**Key design decisions:**

1. **CF Queues over CF Workflows** for ingestion — Workflows are appropriate for long multi-step scraping (ai-rag-crawler pattern), but Harkly's per-document ingestion is shorter and benefits from the retry/observability of the Queues + D1 job table pattern (openai-sdk-knowledge-org pattern).

2. **FTS5 + Vectorize hybrid** — from cloudflare-rag. FTS5 is free and runs in D1. Combined with Vectorize ANN via RRF, this gives significantly better recall than either alone. No other repo implements this.

3. **`@cf/baai/bge-large-en-v1.5` for embeddings** — free, CF-native, 1024-dim. cloudflare-rag proves it works. Avoid OpenAI embeddings API to eliminate external dependency cost and latency for embedding generation.

4. **R2 for originals, D1 for chunks, Vectorize for vectors** — clean separation. R2 = raw files. D1 = chunk text + job state + FTS5 index. Vectorize = ANN search with 2000-char content snippets in metadata.

5. **Vectorize metadata filter by `kbId`** — namespace isolation per knowledge base without separate indexes. Vectorize supports metadata filtering as of 2024.

6. **TokenCounter + IdUtils** — copy directly from openai-sdk-knowledge-org. Both are critical guards against D1 row size errors and Vectorize ID format violations.

7. **Query rewrite to N variants** — from cloudflare-rag. Even 3 rewrites significantly improve recall. Use `@cf/meta/llama-3.1-8b-instruct` (free Workers AI) for query rewriting, not an external LLM.

8. **Progress tracking** — either SSE streaming (cloudflare-rag pattern, simpler) or job status polling (ai-rag-crawler Workflow pattern, more reliable for long jobs). For Harkly, SSE during upload + job status poll for background indexing is the right hybrid.

**Risk table:**

| Risk | Source | Mitigation |
|---|---|---|
| Vectorize topK hard limit = 20 | openai-sdk-knowledge-org | Multiple query vectors via query rewrite |
| D1 SQLite 999-variable limit | openai-sdk-knowledge-org | Batch all `IN (...)` queries to ≤100 IDs |
| D1 row size (SQLITE_TOOBIG) | openai-sdk-knowledge-org | TokenCounter.validateAndTruncateContent() before insert |
| FTS5 rank sort direction | cloudflare-rag (bug) | `ORDER BY rank ASC` not DESC for BM25 |
| CF Queue free plan: 100k ops/day | — | Acceptable for pre-launch; upgrade when needed |
| Vectorize metadata 2000 char limit | openai-sdk-knowledge-org | Store full text in D1; use metadata only for scoring |
| CF Workflow retry not implemented | ai-rag-crawler (note) | Use Queues + D1 retry logic instead |
