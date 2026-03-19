# Harkly Research — GitHub API Deep Dive (Phase 2)

> Date: 2026-03-19
> Method: gh api search/repositories + search/code + gh api repos/{}/git/trees
> Operator: chief-research / Lead/TechResearch
> Phase 1 base: harkly-research-github.md (do not repeat those repos)

---

## A. Schema Inference / Structured Extraction

**Query A1:** `schema inference documents LLM` (stars sort)
**Query A2:** `AI extract structured data unstructured` (stars sort)
**Query A3:** `schema extraction LLM zod typescript` (stars sort)

### Notable new finds (>50 stars, not in Phase 1)

| Repo | Stars | Lang | Description |
|---|---|---|---|
| `l1m-io/l1m` | 55 | TypeScript | Zero-prompt-engineering structured JSON from text/images via LLM. Simple REST API. |
| `Pankaj3112/pluckr` | 8 | TypeScript | Schema-first, self-healing HTML extraction powered by LLMs |
| `schemaloom/core` | 0 | TypeScript | REST service: unstructured text → schema-validated JSON, Zod validation, Docker |

**l1m-io/l1m** is the most relevant: TypeScript, minimal API surface, extracts structured JSON from unstructured text or images without prompt engineering. Fits Harkly's "document → structured schema → query" pipeline. MIT-adjacent.

Source: https://github.com/l1m-io/l1m (55 stars, updated 2026-01-16)

---

## B. Knowledge Base + MCP

**Query B1:** `knowledge base MCP server` (stars sort)
**Query B2:** `personal knowledge graph AI` (stars sort)
**Query B3:** `remote MCP server typescript` (stars sort)

### Notable new finds

| Repo | Stars | Lang | Description |
|---|---|---|---|
| `nanbingxyz/5ire` | 5119 | TypeScript | Desktop AI assistant + MCP client. Local knowledge base (collections, chunks, SQLite via Drizzle). Electron + React. |
| `PleasePrompto/notebooklm-mcp` | 1468 | TypeScript | MCP server wrapping NotebookLM. Grounded answers from knowledge base via Gemini. |
| `bgauryy/octocode-mcp` | 754 | TypeScript | MCP server: codebase → AI-optimized knowledge. Real-time semantic search. |
| `IlyesTal/akyn-sdk` | 14 | TypeScript | "Turn any data source into MCP server in 5 minutes." Knowledge base builder. Topics: mcp, knowledge-base, ai-agents. |
| `hubertciebiada/context-crystallizer` | 15 | TypeScript | Repo → crystallized AI-consumable knowledge. MCP server. |
| `Foundation42/engram` | 2 | TypeScript | Global memory system: CF Workers + Vectorize + MCP. Semantic search across sessions. |

**5ire (5.1K stars)** is the most architecturally instructive. Its knowledge store is built around:
- `ICollection` / `ICollectionFile` / `IKnowledgeChunk` types
- Zustand store (`useKnowledgeStore`, `useChatKnowledgeStore`)
- SQLite via Drizzle (Electron, local)
- `window.electron.knowledge.*` API for chunk retrieval
- Collections → Files → Chunks hierarchy

This is an exact conceptual mirror of Harkly's knowledge unit model (Sources → Artifacts → Chunks). Can borrow the type architecture even if the transport differs (Harkly uses Cloudflare D1 + Queues instead of Electron SQLite).

Source: https://github.com/nanbingxyz/5ire (5119 stars, updated 2026-03-19)

**akyn-sdk** is notable: "any data source → MCP server in 5 min." Topics include `knowledge-base`, `mcp-server`. Could accelerate Harkly's MCP exposure layer.

Source: https://github.com/IlyesTal/akyn-sdk (14 stars, updated 2026-03-10)

**Foundation42/engram** uses exactly the Harkly CF stack (Workers + Vectorize + MCP), though with 2 stars it is a reference implementation, not production code.

Source: https://github.com/Foundation42/engram (2 stars, updated 2025-11-24)

---

## C. Cloudflare-Specific

**Query C1:** `cloudflare d1 vectorize` (stars sort)
**Query C2:** `cloudflare workers AI pipeline` (stars sort)
**Query C3:** `solidstart cloudflare` (stars sort)
**Query C4:** `cloudflare queues processing pipeline` (stars sort)
**Query C5:** `hono cloudflare workers RAG embedding typescript`

### Notable new finds

| Repo | Stars | Lang | Description |
|---|---|---|---|
| `dead8309/ai-rag-crawler` | 32 | TypeScript | CF Workflows (beta) + Workers AI + Neon (Postgres) + Drizzle + Hono. Web scrape → embed → RAG. |
| `kristianfreeman/classification-api` | 12 | TypeScript | Classification API: CF Workers + D1 + Vectorize. Simple, clean reference. |
| `lauragift21/cf-fullstack-ai-workshop` | 4 | JavaScript | Full Q&A app: CF Workers + Vectorize + D1 + Workflows + Workers AI. Workshop code. |

**dead8309/ai-rag-crawler** is the most architecturally complete new find for the CF stack.

Architecture (from file tree + source review):
- Monorepo: `apps/api` (CF Worker, Hono) + `apps/scraper` (Next.js)
- CF Workflows (`RagWorkflow` class extending `WorkflowEntrypoint`) for async processing
- Workers AI for embeddings (`AI_MODELS.embeddings` binding)
- Neon Postgres (serverless) via Drizzle ORM for pages + chunks storage
- LangChain `RecursiveCharacterTextSplitter` (chunk 500, overlap 128)
- Steps: check site → insert site → scrape (multi-page, concurrent) → chunk → embed → insert
- Ask endpoint with vector similarity retrieval

Key dependency: uses Neon (Postgres) instead of D1 for storage — workers free plan limits of 50 subrequests motivated this. Relevant constraint for Harkly.

Stack: `hono`, `drizzle-orm`, `@neondatabase/serverless`, `workers-ai-provider`, `langchain`, `ai` (Vercel SDK), `wrangler 3.95`

Source: https://github.com/dead8309/ai-rag-crawler (32 stars, updated 2026-03-03)

---

## D. Audio/Video Processing

**Query D1:** `whisper transcription pipeline typescript` (stars sort)
**Query D2:** `youtube transcript extract API` (stars sort)
**Query D3:** `video to text pipeline AI` (stars sort)
**Query D4:** `audio transcription API service` (stars sort)

### Notable new finds

| Repo | Stars | Lang | Description |
|---|---|---|---|
| `0x6a69616e/youtube-transcript-api` | 89 | JavaScript | Reverse-engineered youtube-transcript.io. Extract transcripts from YouTube. |
| `bellingcat/whisperbox-transcribe` | 68 | Python | Easy-deploy API for audio/video transcription using OpenAI Whisper. REST endpoint. |
| `lucasliet/youtube-transcript-mcp` | 4 | JavaScript | MCP + CLI tool to extract subtitles from YouTube. Based on youtube-transcript-api Python lib. |

**0x6a69616e/youtube-transcript-api** (89 stars) — JavaScript, updated 2026-03-10. Reverse-engineered approach avoids google-api rate limits. Relevant for Harkly's YouTube source type.

**bellingcat/whisperbox-transcribe** (68 stars, Python) — Self-hosted Whisper API as REST service. Drop-in replacement for OpenAI `/audio/transcriptions`. Compatible with Groq's whisper-large-v3 API format used in tLOS stack.

Source: https://github.com/bellingcat/whisperbox-transcribe (68 stars, updated 2026-01-13)

---

## E. Canvas/Spatial

**Query E1:** `infinite canvas solidjs` (stars sort)
**Query E2:** `spatial canvas typescript` (stars sort)
**Query E3:** `knowledge graph visualization interactive` (stars sort)

### Notable new finds

| Repo | Stars | Lang | Description |
|---|---|---|---|
| `ChristopherLyon/graphrag-workbench` | 569 | TypeScript | Interactive 3D visualization of Microsoft GraphRAG output. Next.js + @react-three/drei. Upload corpus, index, chat, visualize. |
| `yWorks/yfiles-graph-for-create-llama` | 50 | TypeScript | yFiles for HTML + LlamaIndex knowledge graph visualization. |

**graphrag-workbench (569 stars)** is architecturally the most instructive canvas/graph find:

Architecture (from full file tree + package.json review):
- Next.js App Router, shadcn/ui, @react-three/drei (3D Three.js integration)
- Full corpus management API: upload, index (stream progress), archive/restore, remove, nuke
- Chat API with entity extraction from LLM answers + context building from graph
- `GraphVisualizer` component with `GalaxyBackground` (3D)
- Data model: entities.json + relationships.json (GraphRAG output format)
- Retrieval: text-match entities → expand relationships → build LLM context

The corpus/index/stream endpoint is a SSE pattern for long-running indexing jobs — directly applicable to Harkly's processing status streaming.

Source: https://github.com/ChristopherLyon/graphrag-workbench (569 stars, updated 2026-03-18)

---

## F. Full RAG/Knowledge Platforms

**Query F1:** `RAG platform upload documents query` (stars sort)
**Query F2:** `knowledge base builder AI open source` (stars sort)
**Query F3:** `qualitative research AI analysis` (stars sort)
**Query F4:** `document processing pipeline open source` (stars sort)

### Notable new finds

| Repo | Stars | Lang | Description |
|---|---|---|---|
| `juanceresa/sift-kg` | 444 | Python | CLI: any docs → knowledge graph. Domain-configurable entity/relation extraction via LLM. Human-in-loop dedup. |
| `opensemanticsearch/open-semantic-etl` | 278 | Python | ETL pipeline: file crawl + text extraction + OCR + NER + enrichment → Solr/Elasticsearch + RDF graph. |
| `linxule/openinterviewer` | 5 | TypeScript | AI qualitative research platform: study management, AI interviewers (Gemini/Claude), real-time synthesis. |

**juanceresa/sift-kg (444 stars, MIT)** is the highest-signal new find for Harkly's schema/extraction layer:

Architecture (from full source review):
- Domain YAML config defines entity types + relation types + extraction hints
- `DomainConfig` Pydantic model: `entity_types`, `relation_types`, `schema_free: bool`
- `schema_free = True` mode: LLM discovers entity/relation types from data itself
- Extraction pipeline: ingest → chunk (kreuzberg for multi-format extraction) → parallel LLM calls (litellm) → entity/relation merge → graph builder → community detection → export
- Built-in domain bundles: `general`, `academic`, `osint`, `schema-free`
- Dedup with human review approval step
- Outputs: entities.json, relationships.json, graph.html (pyvis interactive)
- Dependencies: `kreuzberg` (multi-format), `pdfplumber`, `litellm` (multi-provider LLM), `networkx`, `semhash` (semantic dedup), `pyvis`

Key insight: **domain YAML = declarative schema definition**. This is a solved pattern for "user defines what to extract, LLM executes." Harkly can adopt this pattern for its schema configuration UI (user describes entities → system extracts them).

Source: https://github.com/juanceresa/sift-kg (444 stars, updated 2026-03-19)

---

## G. Code Search Patterns

**Query G1:** `schema+inference+from+document language:typescript`
**Query G2:** `MCP+server+knowledge+base language:typescript`
**Query G3:** `cloudflare+vectorize+d1+queue language:typescript`

### Repos surfaced via code search

| Repo | Stars | Path Found | Notes |
|---|---|---|---|
| `hubertciebiada/context-crystallizer` | 15 | `src/mcp-server.ts` | Repo → AI knowledge, MCP |
| `IlyesTal/akyn-sdk` | 14 | `src/knowledge-base.ts` | Data source → MCP knowledge base |
| `Foundation42/engram` | 2 | `src/index.ts` | CF Workers + Vectorize + MCP memory |

Code search also surfaced `tylergibbs1/schemasniff` (0 stars but interesting concept: auto-infer scraping schemas from pages with repeated content — relevant to Harkly's web source ingest).

---

## Top New Repos (not in Phase 1) — Ranked

Ranked by relevance to Harkly architecture + signal quality (stars + recency + stack alignment):

| Rank | Repo | Stars | Primary Value |
|---|---|---|---|
| 1 | `juanceresa/sift-kg` | 444 | Domain YAML → entity/relation extraction. Schema-free mode. Python pipeline. |
| 2 | `dead8309/ai-rag-crawler` | 32 | CF Workflows + Workers AI + Drizzle + Hono. Most complete CF RAG pipeline found. |
| 3 | `ChristopherLyon/graphrag-workbench` | 569 | Corpus upload+index+archive+chat+3D graph UI. SSE streaming for indexing status. |
| 4 | `nanbingxyz/5ire` | 5119 | Collection/File/Chunk knowledge architecture. MCP client. Drizzle migrations. |
| 5 | `l1m-io/l1m` | 55 | Zero-config structured JSON from unstructured text/images. TypeScript REST API. |
| 6 | `0x6a69616e/youtube-transcript-api` | 89 | JavaScript YouTube transcript extraction, no Google API needed. |
| 7 | `bellingcat/whisperbox-transcribe` | 68 | Self-hosted Whisper REST API. OpenAI-compatible endpoint. |
| 8 | `opensemanticsearch/open-semantic-etl` | 278 | Mature Python ETL: crawl+OCR+NER+enrich. Reference for pipeline stages. |
| 9 | `Foundation42/engram` | 2 | CF Workers + Vectorize + MCP exact stack match. Reference implementation. |
| 10 | `IlyesTal/akyn-sdk` | 14 | Data source → MCP server SDK. TypeScript, topics: knowledge-base, mcp-server. |

---

## Deep Dive on Top 5

### 1. juanceresa/sift-kg

**Repo:** https://github.com/juanceresa/sift-kg
**Stars:** 444 | **License:** MIT | **Language:** Python 3.11+ | **Updated:** 2026-03-19

**File tree highlights:**
```
src/sift_kg/
  cli.py                      # typer CLI entry
  config.py                   # pydantic-settings, sift.yaml loader
  domains/
    bundled/                  # general, academic, osint, schema-free domain YAMLs
    models.py                 # EntityTypeConfig, RelationTypeConfig, DomainConfig
    loader.py                 # domain YAML → DomainConfig
  extract/
    extractor.py              # orchestration: chunk → LLM → merge
    llm_client.py             # litellm wrapper (multi-provider)
    models.py                 # ExtractedEntity, ExtractedRelation, DocumentExtraction
    prompts.py                # build_combined_prompt()
  ingest/
    chunker.py                # TextChunk, chunk_text()
    kreuzberg_extractor.py    # multi-format doc extraction
    ocr.py                    # Google Vision / pymupdf
  graph/
    builder.py                # networkx graph construction
    knowledge_graph.py        # KnowledgeGraph class
    communities.py            # community detection
    postprocessor.py          # entity merge, dedup
  export.py                   # entities.json, relationships.json, graph.html
```

**Dependencies:** typer, pydantic v2, litellm (multi-provider LLM), kreuzberg (multi-format extraction), pdfplumber, networkx, semhash (semantic hash dedup), pyvis, python-docx

**Domain YAML pattern (key concept for Harkly):**
```yaml
name: osint
entity_types:
  person:
    description: "Individual humans..."
    extraction_hints: ["Look for full names, aliases, nicknames"]
  organization:
    description: "Companies, agencies, groups..."
relation_types:
  works_for:
    source_types: [person]
    target_types: [organization]
    extraction_hints: ["employment, membership"]
system_context: "You are analyzing OSINT documents..."
schema_free: false  # set true for LLM to discover types
```

**Clone potential:** Partial. The domain YAML pattern and `DomainConfig` Pydantic model are directly adoptable. The extraction pipeline (chunk → litellm → structured output → graph) is a proven reference for Harkly's Python processing pipeline. The `schema_free` mode (LLM discovers entity types) is directly applicable to Harkly's "no-schema" onboarding mode.

**Harkly mapping:**
- `DomainConfig` → Harkly's "Project Schema" (user-defined entity types)
- `sift.yaml` → Harkly's project configuration
- `schema_free: true` → Harkly's auto-discovery mode for new users
- `kreuzberg` extractor → Harkly's multi-format ingestion (replaces or supplements docling/markitdown)
- `litellm` → multi-provider LLM (aligns with Harkly's provider-agnostic approach)

---

### 2. dead8309/ai-rag-crawler

**Repo:** https://github.com/dead8309/ai-rag-crawler
**Stars:** 32 | **License:** not specified | **Language:** TypeScript | **Updated:** 2026-03-03

**File tree highlights:**
```
apps/api/                          # CF Worker (Hono)
  src/
    index.ts                       # Hono app, routes registration
    routes/
      ask.ts                       # RAG retrieval + streaming answer
      workflow.ts                  # trigger RagWorkflow
    workflows/rag.ts               # RagWorkflow (WorkflowEntrypoint)
    db/schema.ts                   # Drizzle schema: sites, pages, pageChunks
    scrape.ts                      # multi-page scraper (Puppeteer or fetch)
    constants.ts                   # AI_MODELS
    types.ts                       # Bindings type
  drizzle/                         # 7 migrations
  wrangler.toml                    # CF Workflows, Workers AI binding
apps/scraper/                      # Next.js frontend
```

**Dependencies (api):** hono, drizzle-orm, @neondatabase/serverless, workers-ai-provider, langchain (text splitter only), ai (Vercel AI SDK), @hono/zod-openapi, zod, wrangler 3.95

**RagWorkflow steps (from source review):**
1. `step.do("Check if site exists")` → upsert to sites table
2. `step.do("Scrape site")` → multi-page scrape (up to maxDepth=3)
3. `step.do("Split page content into chunks and insert into db")` → chunk + insert pages
4. `step.do("Generate vector embeddings for each page")` → Workers AI embed → insert pageChunks

**Key constraint identified:** Workers free plan = 50 subrequests/request → uses Neon (serverless Postgres) instead of D1, wrapped in a transaction. Harkly likely hits same constraint on free Workers plan.

**Clone potential:** High for the workflow pattern. The `RagWorkflow extends WorkflowEntrypoint` pattern with nested `step.do()` calls is a direct reference for Harkly's async document processing pipeline on CF Workflows. The DB schema (sites/pages/chunks) maps to Harkly's (sources/artifacts/chunks).

**Harkly delta:**
- Replace Neon with Supabase (Harkly's existing stack) or D1 (if constraints allow)
- Replace web scraper with document uploader / file reader
- Add schema inference step between chunk and embed
- Add MCP exposure layer

---

### 3. ChristopherLyon/graphrag-workbench

**Repo:** https://github.com/ChristopherLyon/graphrag-workbench
**Stars:** 569 | **License:** FUNDING only | **Language:** TypeScript | **Updated:** 2026-03-18

**File tree highlights:**
```
app/
  api/
    chat/route.ts              # entity extraction from LLM answer + graph context build
    chat/stream/route.ts       # SSE streaming chat
    corpus/
      upload/route.ts          # file upload handler
      index/stream/route.ts    # SSE streaming index progress
      index/stop/route.ts      # cancel indexing
      state/route.ts           # corpus state polling
      archive/                 # create, delete, list, rename, restore
      kg/rename/route.ts       # knowledge graph rename
      file/route.ts            # file operations
      remove/route.ts          # corpus removal
      nuke/route.ts            # full reset
  page.tsx                     # main app
components/
  ChatPanel.tsx                # chat UI
  CorpusPanel.tsx              # corpus management
  GraphVisualizer.tsx          # 3D graph visualization
  Controls.tsx                 # graph controls
  Inspector.tsx                # entity inspection
  GalaxyBackground.tsx         # Three.js background
```

**Dependencies:** next.js, @react-three/drei, shadcn/ui (radix + tailwind), recharts

**Retrieval logic (from chat/route.ts source review):**
- Extract entity IDs from LLM answer + question text (text normalization + substring match)
- Load entities.json + relationships.json from corpus output dir
- Build context: selected entities + their relationships (up to 100 relations)
- Pass as context to LLM for follow-up synthesis

**Clone potential:** Partial — UI patterns are React/Next.js, not SolidJS. But the API route patterns (upload, index/stream SSE, archive, state) are directly translatable to SolidJS server functions or a separate API layer. The corpus management domain model (upload → index → archive/restore lifecycle) is exactly Harkly's source lifecycle.

**Harkly value:**
- `corpus/index/stream` SSE pattern → Harkly's processing status streaming
- Archive/restore lifecycle → Harkly's source management
- Entity text-match retrieval → baseline retrieval before adding vector search
- 3D graph visualization approach (Three.js) → potential Harkly canvas layer

---

### 4. nanbingxyz/5ire

**Repo:** https://github.com/nanbingxyz/5ire
**Stars:** 5119 | **License:** Modified Apache-2.0 | **Language:** TypeScript | **Updated:** 2026-03-19

**Stack:** Electron + React + Drizzle (SQLite local) + Zustand + MCP client + rsbuild

**Knowledge store architecture (from useKnowledgeStore.ts source review):**
```typescript
// Core types
ICollection    // knowledge collection (named group)
ICollectionFile // file within collection
IKnowledgeChunk // chunk of text with embedding

// Store interface
createCollection(partial) → ICollection
listCollections() → ICollection[]
createFile({collectionId, name}) → ICollectionFile
listFiles(collectionId) → ICollectionFile[]
deleteFile(id) → boolean
getChunk(id) → IKnowledgeChunk | null  // cached in-memory
cacheChunks(chunks[]) → void
showCitation(content) / hideCitation() // citation overlay
```

- IDs use `typeid` library (type-prefixed UUIDs: `kc_...` for knowledge collections)
- SQLite via `window.electron.db.run()` + `window.electron.knowledge.*`
- Drizzle ORM migrations (11 migrations in drizzle/)
- Zustand stores: `useKnowledgeStore`, `useChatKnowledgeStore` (per-chat KB selection)

**intellichat directory** contains the AI request/response pipeline: `readers/` (format-specific readers), `services/` (provider adapters), `types/` (message types).

**Clone potential:** Architecture only — Electron transport is not applicable to Harkly's web/CF deployment. But the `Collection → File → Chunk` type hierarchy, citation overlay pattern, and per-conversation KB selection (`useChatKnowledgeStore`) are directly applicable to Harkly's data model and UX.

**Harkly delta:**
- Replace Electron IPC with CF Workers API
- Replace SQLite with Supabase (Harkly's DB)
- Keep: Collection/File/Chunk hierarchy, typeid IDs, citation UI pattern

---

### 5. l1m-io/l1m

**Repo:** https://github.com/l1m-io/l1m
**Stars:** 55 | **License:** not specified | **Language:** TypeScript | **Updated:** 2026-01-16

**Concept:** Submit text or image + a JSON Schema → receive validated structured JSON. No prompt engineering required. Provider-agnostic (any OpenAI-compatible endpoint).

**API signature (from description):**
```typescript
// Client
const result = await l1m.extract({
  input: "text or base64 image",
  schema: { /* JSON Schema */ },
  provider: "openai" | "anthropic" | ...
})
// Returns: validated JSON matching schema
```

**Relevance to Harkly:**
- This is the minimal viable "document → structured data" primitive
- User provides schema (or Harkly auto-generates it), l1m does the extraction
- Could underpin Harkly's "extract structured data from source" feature
- TypeScript, REST, no framework coupling

**Clone potential:** High as a component. Either use the package directly or adopt the API design pattern for Harkly's own extraction endpoint.

---

## Summary: Cross-Phase Synthesis

Phase 2 found 10 significant new repos not in Phase 1. Combined with Phase 1 results:

### Recommended architecture components (by Harkly layer)

| Layer | Best options found across Phase 1+2 |
|---|---|
| Multi-format extraction | docling (Phase 1), kreuzberg (via sift-kg), microsoft/markitdown (Phase 1) |
| PDF OCR | getomni-ai/zerox (Phase 1, 12.2K), sift-kg/ocr.py (Google Vision) |
| Structured extraction / schema inference | instructor-js (Phase 1), l1m-io/l1m (Phase 2), sift-kg domain pattern |
| YouTube transcript | yt-dlp (Phase 1), 0x6a69616e/youtube-transcript-api (Phase 2) |
| Audio transcription | Groq whisper (tLOS stack), bellingcat/whisperbox-transcribe (Phase 2) |
| CF async processing | cloudflare/workers-mcp (Phase 1), dead8309/ai-rag-crawler (Phase 2 — Workflows pattern) |
| Knowledge graph / entity extraction | sift-kg (Phase 2), infiniflow/ragflow (Phase 1) |
| Canvas UI | xyflow/xyflow (Phase 1, 35.6K), graphrag-workbench 3D pattern (Phase 2) |
| Knowledge data model | 5ire Collection/File/Chunk (Phase 2), documind (Phase 1) |
| MCP server | cloudflare/workers-mcp (Phase 1), akyn-sdk (Phase 2) |

### Top recommendation for immediate PoC

For Harkly's Phase 1 PoC (document → structured data → query):

1. **Processing pipeline:** `dead8309/ai-rag-crawler` as the CF Workflows reference. Adapt RagWorkflow to accept file uploads instead of URL scrapes.
2. **Schema extraction:** `sift-kg` domain pattern — define entity types in config, use LLM to extract. Start with `schema_free: true` for onboarding.
3. **Data model:** `5ire`'s Collection/File/Chunk hierarchy with typeid IDs.
4. **Unstructured text primitive:** `l1m-io/l1m` pattern for schema-constrained JSON extraction.
5. **Knowledge graph visualization:** `graphrag-workbench` SSE streaming + entity-relationship visualization patterns.

---

---

## Appendix: HONC Stack

`dead8309/ai-rag-crawler` uses the **HONC stack**: Hono + OpenAI + Neon + Cloudflare. This is a Fiberplane-promoted pattern for CF Workers + Neon Postgres + Hono + AI SDK. Not a library, just a naming convention for the combination. The stack is relevant because it sidesteps D1's 50 subrequest limit by using Neon serverless Postgres directly from a Worker.

Fiberplane itself (https://github.com/fiberplane/fiberplane, 367 stars) is a local dev tooling suite for CF Workers with observability/OpenTelemetry — the `@fiberplane/hono-otel` and `@fiberplane/studio` packages seen in `ai-rag-crawler`'s dependencies. Useful for debugging Workers during Harkly development.

---

*Research conducted 2026-03-19 by Lead/TechResearch. All star counts as of query time.*
