# Harkly Research — GitHub / Open Source
> Date: 2026-03-19
> Author: Lead/TechResearch
> Purpose: Find all relevant OSS repos/frameworks/tools for Harkly — a universal data ingestion + AI schema mapping + MCP/API layer platform.
> Stack target: SolidStart + Cloudflare Workers + D1 + R2 + Vectorize + Queues + Tauri
> Research method: WebSearch (20+ queries) + WebFetch (4 deep-dives)

---

## A. Full Solutions (Clone Candidates)

### A1. Unstructured-IO/unstructured
- **URL:** https://github.com/Unstructured-IO/unstructured
- **Stars:** ~11K+
- **Language/Stack:** Python
- **Last updated:** Active (2026)
- **What it does:** Open-source ETL solution for transforming complex documents (PDF, DOCX, HTML, images, audio) into clean, structured formats for LLMs. Handles partitioning, enrichment, chunking, embedding. The gold standard for unstructured-to-structured pipelines.
- **Harkly use:** Core inspiration for the "normalize ANY data to text" pipeline. The partitioning + chunking architecture is directly applicable. Cannot be deployed to CF Workers (Python) — needs Modal.com wrapper.
- **Clone potential:** Partial — architecture patterns + connector ideas

### A2. DocumindHQ/documind
- **URL:** https://github.com/DocumindHQ/documind
- **Stars:** 1.5K
- **Language/Stack:** TypeScript/JavaScript (JS 51%, TS 48%)
- **Last updated:** v1.1.2, Feb 21, 2025
- **License:** AGPL v3.0
- **What it does:** Open-source platform for extracting structured data from documents using AI. Document in → AI auto-generates schema → structured JSON out. Supports PDF, DOCX, PNG, JPG, TXT, HTML. OpenAI + local LLMs (Llava, Llama3.2-vision). Built on Zerox OCR.
- **Harkly use:** CLOSEST match to Harkly's core loop. Same paradigm: upload doc → AI infers schema → structured output. TypeScript, OpenAI-compatible. Worth forking.
- **Clone potential:** Full candidate — architecture almost identical to Harkly's document processing path

### A3. infiniflow/ragflow
- **URL:** https://github.com/infiniflow/ragflow
- **Stars:** ~70K
- **Language/Stack:** Python + TypeScript frontend
- **Last updated:** Very active (2026)
- **What it does:** Leading open-source RAG engine combining deep document understanding with agent capabilities. Handles PDFs, DOCX, Excel, images, audio, video with vision parsing, document layout analysis, table understanding, OCR.
- **Harkly use:** Excellent reference for document understanding pipeline design. The chunking strategies and layout-aware parsing are directly relevant.
- **Clone potential:** Partial — reference architecture for document parsing pipeline

### A4. docling-project/docling
- **URL:** https://github.com/docling-project/docling
- **Stars:** ~25K+
- **Language/Stack:** Python
- **Last updated:** Very active (2025-2026)
- **What it does:** IBM's document parsing library. Parses PDF, DOCX, PPTX, XLSX, HTML, WAV, MP3, WebVTT, images. Advanced PDF understanding with layout analysis. Integrates with LlamaIndex and LangChain.
- **Harkly use:** Best-in-class document parsing for the "normalize to text" step. Python only — wrap as Modal.com microservice.
- **Clone potential:** Component (Modal.com microservice for document parsing)

### A5. langgenius/dify
- **URL:** https://github.com/langgenius/dify
- **Stars:** ~114K
- **Language/Stack:** Python + TypeScript (Next.js)
- **Last updated:** Very active (2026)
- **What it does:** Open-source platform for building generative AI applications with visual workflow builder. Document processing, knowledge base management, RAG, agents.
- **Harkly use:** Reference for full-stack AI application architecture. Too heavy to fork directly but has excellent patterns for knowledge base management and API layer design.
- **Clone potential:** Reference only

### A6. getzep/graphiti
- **URL:** https://github.com/getzep/graphiti
- **Stars:** ~5K+
- **Language/Stack:** Python
- **Last updated:** Active (2025-2026)
- **What it does:** Real-time temporal knowledge graph engine for AI agents. Builds knowledge graphs from unstructured + structured data, preserving full temporal history.
- **Harkly use:** Relevant for the spatial canvas layer — entities and relationships over time. If Harkly evolves toward knowledge graphs, this is the primary reference.
- **Clone potential:** Partial — graph storage patterns

### A7. HKUDS/LightRAG
- **URL:** https://github.com/HKUDS/LightRAG
- **Stars:** ~27K
- **Language/Stack:** Python
- **Last updated:** Active (2025-2026)
- **What it does:** EMNLP 2025 paper. Graph-based RAG approach. Builds knowledge graphs from documents for connected contextual retrieval.
- **Harkly use:** Relevant for entity linking and context retrieval layer.
- **Clone potential:** Reference — graph-aware retrieval patterns

### A8. OpenQDA/openqda
- **URL:** https://github.com/openqda/openqda
- **Stars:** ~200+
- **Language/Stack:** TypeScript (Vue.js)
- **Last updated:** Active (2025)
- **What it does:** Free/libre open-source collaborative qualitative data analysis software (QDAS). Tag, code, and analyze text documents collaboratively.
- **Harkly use:** Closest analog to Harkly's use case in academic research tools. The tagging/coding paradigm maps to Harkly's schema extraction and annotation system.
- **Clone potential:** Partial — collaborative tagging UX patterns

---

## B. Data Ingestion / Processing

### B1. yt-dlp/yt-dlp
- **URL:** https://github.com/yt-dlp/yt-dlp
- **Stars:** ~100K+
- **Language/Stack:** Python
- **Last updated:** Very active (weekly releases, 2026)
- **What it does:** Feature-rich command-line audio/video downloader. Supports YouTube, Instagram, TikTok, Twitter, and 1000+ sites.
- **Harkly use:** THE foundation for all URL-based media ingestion. Best wrapped via Modal.com microservice (Python). TypeScript wrappers available.
- **Clone potential:** Component (via TypeScript wrapper or Modal.com sidecar)

### B2. iqbal-rashed/ytdlp-nodejs
- **URL:** https://github.com/iqbal-rashed/ytdlp-nodejs
- **Stars:** ~400+
- **Language/Stack:** TypeScript/Node.js
- **Last updated:** Active (2025)
- **What it does:** Node.js/TypeScript wrapper for yt-dlp. Fluent builder API, streaming, quality selection, progress tracking, metadata fetch.
- **Harkly use:** Direct TypeScript integration with yt-dlp for Tauri desktop layer or Node.js sidecar.
- **Clone potential:** Component — production dependency

### B3. microlinkhq/youtube-dl-exec
- **URL:** https://github.com/microlinkhq/youtube-dl-exec
- **Stars:** ~500+
- **Language/Stack:** TypeScript/Node.js
- **Last updated:** Active (2025)
- **What it does:** Simple Node.js wrapper for youtube-dl/yt-dlp. Auto-installs latest yt-dlp. Promise + Stream interfaces.
- **Harkly use:** Lighter alternative to ytdlp-nodejs for the download pipeline.
- **Clone potential:** Component

### B4. instaloader/instaloader
- **URL:** https://github.com/instaloader/instaloader
- **Stars:** ~10K+
- **Language/Stack:** Python
- **Last updated:** Active (2025-2026)
- **What it does:** Download Instagram pictures, videos, stories, reels along with captions and metadata.
- **Harkly use:** Instagram-specific ingestion with deep metadata. Note: yt-dlp also handles Instagram but Instaloader has richer metadata access.
- **Clone potential:** Component (as Modal.com sidecar)

### B5. riad-azz/instagram-video-downloader
- **URL:** https://github.com/riad-azz/instagram-video-downloader
- **Stars:** ~500+
- **Language/Stack:** TypeScript (Next.js)
- **Last updated:** Active (2025)
- **What it does:** Next.js website + REST API for downloading Instagram videos. API endpoints are independently usable.
- **Harkly use:** TypeScript API layer for Instagram downloads — compatible with CF Workers architecture.
- **Clone potential:** Component

### B6. docling-project/docling
- Already listed in A4. Primary document parsing component (PDF, DOCX, PPTX, XLSX, HTML, audio).

### B7. harshankur/officeParser
- **URL:** https://github.com/harshankur/officeParser
- **Stars:** ~600+
- **Language/Stack:** TypeScript/Node.js — runs in browser too
- **Last updated:** Active (v6.0.0 major overhaul, 2025)
- **What it does:** Robust, strictly-typed Node.js + Browser library for parsing DOCX, PPTX, XLSX, ODT, ODP, ODS, PDF, RTF. Produces clean hierarchical AST with rich metadata.
- **Harkly use:** TypeScript-native document parsing that works in Cloudflare Workers (no native deps). The only serious TypeScript-first multi-format parser that can run at the edge.
- **Clone potential:** Component — primary document parser for CF Workers runtime

### B8. getomni-ai/zerox
- **URL:** https://github.com/getomni-ai/zerox
- **Stars:** 12.2K
- **Language/Stack:** TypeScript (primary) + Python
- **Last updated:** Active (2025-2026)
- **What it does:** Dead simple OCR for AI ingestion. Converts PDF/DOCX/images to markdown via vision models (OpenAI, Anthropic, Gemini, Bedrock, Azure). Concurrent processing, structured JSON schema extraction, per-page extraction.
- **Harkly use:** Key tool for PDFs with complex layouts (tables, forms, scanned docs). Uses vision model OCR in a clean TypeScript API. Foundation for Documind.
- **Clone potential:** Component — direct TypeScript integration

### B9. microsoft/markitdown
- **URL:** https://github.com/microsoft/markitdown
- **Stars:** ~35K+
- **Language/Stack:** Python
- **Last updated:** Very active (2025-2026)
- **What it does:** Universal file-to-Markdown converter. Supports PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, XML, audio (via Whisper), images, ZIP.
- **Harkly use:** "Normalize to text" step for ALL formats in one Python tool. Ideal as Modal.com microservice — single endpoint normalizes everything.
- **Clone potential:** Component (as Modal.com sidecar)

### B10. zackees/transcribe-anything
- **URL:** https://github.com/zackees/transcribe-anything
- **Stars:** ~1K+
- **Language/Stack:** Python
- **Last updated:** Active (2025-2026)
- **What it does:** Multi-backend Whisper transcription. Accepts local files OR URLs directly. Completely private. GPU-accelerated. Outputs TXT/SRT/VTT.
- **Harkly use:** URL-based video transcription pipeline that accepts YouTube/Vimeo URLs directly. Complements yt-dlp.
- **Clone potential:** Component (as Modal.com sidecar)

### B11. bugbakery/transcribee
- **URL:** https://github.com/bugbakery/transcribee
- **Stars:** ~1.7K
- **Language/Stack:** TypeScript + Python backend
- **Last updated:** Active (2025-2026)
- **What it does:** Open-source audio/video transcription with collaborative editing. Auto-generates transcripts, speaker diarization, collaborative improvement workflow.
- **Harkly use:** Reference for audio/video transcription pipeline with collaborative editing UI. Good UX patterns for transcript review.
- **Clone potential:** Partial — transcription workflow and collaborative editing patterns

### B12. Web scraping for Cloudflare Workers

#### adamschwartz/web.scraper.workers.dev
- **URL:** https://github.com/adamschwartz/web.scraper.workers.dev
- **Stars:** ~1.8K
- **Language/Stack:** TypeScript/CF Workers
- **What it does:** Cloudflare Worker that scrapes websites for text by CSS selector using HTMLRewriter.
- **Harkly use:** URL scraping microservice pattern for CF Workers. Direct use case for "normalize URL to text".
- **Clone potential:** Component

#### ozanmakes/scrapedown
- **URL:** https://github.com/ozanmakes/scrapedown
- **Stars:** ~200+
- **Language/Stack:** TypeScript/CF Workers
- **What it does:** CF Worker that scrapes web pages and returns markdown-formatted content.
- **Harkly use:** URL → Markdown conversion on the edge. Perfect for the "normalize URLs to text" step.
- **Clone potential:** Component — direct integration

### B13. firecrawl/firecrawl
- **URL:** https://github.com/firecrawl/firecrawl
- **Stars:** ~95K
- **Language/Stack:** TypeScript + Python
- **Last updated:** Very active (2025-2026)
- **License:** AGPL-3.0
- **What it does:** Web Data API for AI. Turns entire websites into LLM-ready markdown or structured data. Crawl + scrape + extract. Self-hostable. TypeScript SDK available.
- **Harkly use:** Best-in-class web scraping for "normalize URL to text". Self-host on Modal.com or use SDK client in CF Workers calling a self-hosted instance.
- **Clone potential:** Full (self-hosted backend) or Component (SDK client)

### B14. yobulkdev/yobulkdev
- **URL:** https://github.com/yobulkdev/yobulkdev
- **Stars:** ~2K+
- **Language/Stack:** TypeScript (Next.js)
- **Last updated:** Active (2025)
- **License:** AGPL 3.0
- **What it does:** Open-source AI-driven Data Onboarding Platform. CSV/Excel flat file import with AI column mapping. Free flatfile.com alternative.
- **Harkly use:** Reference for CSV/Excel column-to-schema AI mapping UX. The "AI proposes column mapping" workflow for tabular data ingestion.
- **Clone potential:** Partial — mapping UX patterns

### B15. tableflowhq/csv-import
- **URL:** https://github.com/tableflowhq/csv-import
- **Stars:** ~1.5K
- **Language/Stack:** TypeScript (React)
- **Last updated:** Active (2025)
- **What it does:** Open-source CSV importer with column mapping, required fields, validation, suggested mappings. Embeddable React component.
- **Harkly use:** Ready-made CSV import UI with schema mapping. Can be adapted for Harkly's tabular data import flow.
- **Clone potential:** Full — embed as Harkly's CSV import component

---

## C. AI Schema Inference / Mapping

### C1. DocumindHQ/documind
- Already listed in A2. THE full-solution closest match: document → AI schema → JSON.

### C2. 567-labs/instructor-js
- **URL:** https://github.com/567-labs/instructor-js
- **Stars:** 781
- **Language/Stack:** TypeScript
- **Last updated:** Jan 28, 2025
- **What it does:** TypeScript library for structured LLM extraction. Zod-based schema validation. Streaming partial JSON. Multi-provider (OpenAI, Anthropic, Azure, Anyscale). Modes: TOOLS, JSON, MD_JSON, JSON_SCHEMA.
- **Harkly use:** THE tool for the "AI extracts structured data according to schema" step. Wraps any LLM with Zod schema enforcement. Production dependency for Harkly's AI extraction layer.
- **Clone potential:** Component — production npm dependency

### C3. google/langextract
- **URL:** https://github.com/google/langextract
- **Stars:** ~500+
- **Language/Stack:** Python
- **Last updated:** Active (2025)
- **What it does:** Google's library for extracting structured information from unstructured text using LLMs with precise source grounding and interactive visualization. Enforces consistent output schema with few-shot examples.
- **Harkly use:** Reference for schema-grounded extraction with source attribution. The "grounding" feature (pointing back to source text) is relevant for Harkly's data provenance tracking.
- **Clone potential:** Reference — architecture patterns

### C4. shcherbak-ai/contextgem
- **URL:** https://github.com/shcherbak-ai/contextgem
- **Stars:** ~1K+
- **Language/Stack:** Python
- **Last updated:** Active (2025)
- **What it does:** Open-source LLM framework for extracting structured data and insights from documents with minimal code. Built-in DOCX converter, concept extraction, structured output enforcement.
- **Harkly use:** Clean API reference for document-to-structured-data pipeline design.
- **Clone potential:** Reference

### C5. katanaml/sparrow
- **URL:** https://github.com/katanaml/sparrow
- **Stars:** 5.1K
- **Language/Stack:** Python + web UI
- **Last updated:** Active (v0.4.4, 2025)
- **License:** GPL 3.0 (free for orgs < $5M revenue)
- **What it does:** Structured data extraction from documents (invoices, receipts, forms, bank statements) using ML, LLM, and Vision LLM. JSON schema-based extraction. Supports MLX, Ollama, vLLM.
- **Harkly use:** Reference for vision-LLM document extraction with JSON schema output. Good patterns for form/invoice-type documents.
- **Clone potential:** Reference

### C6. zjunlp/OneKE
- **URL:** https://github.com/zjunlp/OneKE
- **Stars:** ~800+
- **Language/Stack:** Python
- **Last updated:** Active (WWW 2025)
- **What it does:** Dockerized schema-guided LLM agent-based knowledge extraction system. Multi-agent extraction for NER, RE, event extraction, triple extraction.
- **Harkly use:** Academic reference for schema-guided multi-agent extraction. The "agent proposes schema then extracts" paradigm is directly applicable to Harkly's AI schema inference step.
- **Clone potential:** Reference

### C7. stair-lab/kg-gen
- **URL:** https://github.com/stair-lab/kg-gen
- **Stars:** ~500+
- **Language/Stack:** Python
- **Last updated:** Active (NeurIPS 2025)
- **What it does:** Knowledge Graph Generation from any text. Extracts Subject-Predicate-Object triplets. Handles small and large inputs.
- **Harkly use:** Relevant for the "relationship mapping" layer when Harkly evolves to show entity relationships on the spatial canvas.
- **Clone potential:** Reference

### C8. Addepto/graph_builder
- **URL:** https://github.com/Addepto/graph_builder
- **Stars:** ~300+
- **Language/Stack:** Python
- **Last updated:** Active (2025)
- **What it does:** Open-source toolkit to extract structured knowledge graphs from PDFs, reports, and tabular files. Powers analytics, digital twins, AI-driven assistants.
- **Harkly use:** Document-to-graph extraction pipeline patterns for the spatial canvas layer.
- **Clone potential:** Reference

### C9. amir9480/json-schema-builder
- **URL:** https://github.com/amir9480/json-schema-builder
- **Stars:** ~200+
- **Language/Stack:** TypeScript (web app)
- **Last updated:** Active (2025)
- **What it does:** JSON Schema Builder designed for creating and debugging structured data for LLMs. AI-assisted schema generation from natural language prompts.
- **Harkly use:** Reference for the "AI proposes schema, user refines it" UI/UX. The schema editing interface pattern.
- **Clone potential:** Partial — schema editor UI patterns

### C10. importcsv/importcsv
- **URL:** https://github.com/importcsv/importcsv
- **Stars:** ~500+
- **Language/Stack:** TypeScript (React)
- **Last updated:** Active (2025)
- **What it does:** Open-source CSV importer for React. Uses OpenAI for AI column matching — automatically maps CSV columns to your defined schema.
- **Harkly use:** Reference for AI-powered column-to-schema mapping for tabular data. The "AI matches columns" UX is directly applicable.
- **Clone potential:** Partial — AI column mapping patterns

---

## D. MCP / API Layer

### D1. cloudflare/workers-mcp
- **URL:** https://github.com/cloudflare/workers-mcp
- **Stars:** ~1K+
- **Language/Stack:** TypeScript/CF Workers
- **Last updated:** Active (2025-2026)
- **What it does:** Official Cloudflare tool for exposing CF Workers as MCP servers. CLI tooling + in-Worker logic. Translates TypeScript class methods into MCP tools automatically. Connects to Claude Desktop and any MCP client.
- **Harkly use:** Primary way to expose Harkly as an MCP server from Cloudflare Workers. Direct integration path — most official and most supported.
- **Clone potential:** Full — production integration

### D2. cloudflare/mcp-server-cloudflare
- **URL:** https://github.com/cloudflare/mcp-server-cloudflare
- **Stars:** ~500+
- **Language/Stack:** TypeScript/CF Workers
- **Last updated:** Active (2025-2026)
- **What it does:** Official Cloudflare production-ready MCP server implementation. Exposes CF services (D1, KV, R2, Workers) via MCP protocol.
- **Harkly use:** Reference implementation for production MCP server on CF Workers. Study how CF exposes their own services.
- **Clone potential:** Full — reference implementation

### D3. cyanheads/mcp-ts-template
- **URL:** https://github.com/cyanheads/mcp-ts-template
- **Stars:** 119
- **Language/Stack:** TypeScript
- **Last updated:** Jan 12, 2025
- **License:** Apache 2.0
- **What it does:** TypeScript MCP server template with declarative tools/resources, pluggable auth (JWT + OAuth), multi-backend storage (in-memory, filesystem, Supabase, CF D1/KV/R2), OpenTelemetry, first-class CF Workers support.
- **Harkly use:** Most complete MCP template for Harkly's exact stack (CF D1/KV/R2 backends, TypeScript). Significantly reduces boilerplate. All infrastructure concerns in the package, not project code.
- **Clone potential:** Full — foundation for Harkly MCP server

### D4. MCPJam/mcp-app-workers-template
- **URL:** https://github.com/MCPJam/mcp-app-workers-template
- **Stars:** ~300+
- **Language/Stack:** TypeScript/CF Workers
- **Last updated:** Active (2025-2026)
- **What it does:** Template for writing MCP Apps deployed on Cloudflare Workers. Exposes MCP Tools, UI Widgets, Resource Handlers.
- **Harkly use:** Alternative MCP server template for CF Workers with UI Widget support (relevant for Harkly's canvas-based UI integration).
- **Clone potential:** Full

### D5. mahmoudfazeli/cloudflare-mcp-template
- **URL:** https://github.com/mahmoudfazeli/cloudflare-mcp-template
- **Stars:** ~200+
- **Language/Stack:** TypeScript
- **Last updated:** Active (2025-2026)
- **What it does:** Reusable serverless MCP server template with provider plugin system. Deployable to CF Workers, Vercel, or any edge runtime.
- **Harkly use:** Provider plugin system maps well to Harkly's multiple data source connectors — each format type could be a plugin.
- **Clone potential:** Full

### D6. modelcontextprotocol/servers — memory module
- **URL:** https://github.com/modelcontextprotocol/servers/tree/main/src/memory
- **Stars:** (parent repo ~20K+)
- **Language/Stack:** TypeScript
- **Last updated:** Active (2025-2026)
- **What it does:** Anthropic's official knowledge graph memory MCP server. Entities + Relations + Observations stored persistently as a local knowledge graph.
- **Harkly use:** Direct reference for Harkly's knowledge graph MCP endpoint. The entity/relation/observation data model maps well to Harkly's structured database output. Fork and adapt for Harkly's schema.
- **Clone potential:** Full — adapt for Harkly's data model

### D7. seratch/openai-sdk-knowledge-org
- **URL:** https://github.com/seratch/openai-sdk-knowledge-org
- **Stars:** 15 (low stars, very high relevance)
- **Language/Stack:** TypeScript (CF Workers, Hono, Drizzle ORM)
- **Last updated:** Active (2025)
- **License:** MIT
- **What it does:** Live MCP server built with Cloudflare Workers + Queues + Vectorize + D1 + OpenAI Agents SDK. 100% TypeScript. Continuous content updates from source repositories.
- **Harkly use:** EXACT same stack as Harkly (CF Workers + D1 + Vectorize + Queues). Proves the architecture works end-to-end. Best architectural reference despite low stars.
- **Clone potential:** Full — closest architectural match to Harkly backend

### D8. RafalWilinski/cloudflare-rag
- **URL:** https://github.com/RafalWilinski/cloudflare-rag
- **Stars:** 596
- **Language/Stack:** TypeScript (Remix + CF Workers + D1 + Vectorize)
- **Last updated:** Active (2025)
- **License:** MIT
- **What it does:** Full-stack "Chat with PDFs" RAG app on Cloudflare. Hybrid search (BM25 via D1 + dense via Vectorize). SSE streaming. Multi-provider AI (OpenAI/Groq/Anthropic via AI Gateway). Rate limiting. OCR via unpdf (runs in Workers).
- **Harkly use:** Best reference implementation for CF-native RAG with D1 + Vectorize. Hybrid search pattern (BM25 + vector + Reciprocal Rank Fusion) is exactly what Harkly needs for its query API.
- **Clone potential:** Full — fork as Harkly's query/search backend foundation

### D9. Cloudflare AutoRAG (managed service)
- **URL:** https://developers.cloudflare.com/autorag/
- **Stars:** N/A (platform feature)
- **Last updated:** Open beta, April 2025
- **What it does:** Fully managed RAG pipeline. R2 bucket upload → auto chunk + embed → Vectorize → semantic retrieval → Workers AI response. Free in open beta. API: `env.AI.autorag('name').aiSearch({query})`.
- **Harkly use:** Could eliminate Harkly's entire RAG infrastructure layer. Upload documents to R2 → AutoRAG handles everything. Trade-off: less control over chunking strategy and schema inference.
- **Clone potential:** N/A — use as managed service

---

## E. Canvas / Visualization

### E1. tldraw/tldraw
- **URL:** https://github.com/tldraw/tldraw
- **Stars:** ~41K
- **Language/Stack:** TypeScript (React)
- **Last updated:** SDK 4.0 released (2025-2026)
- **License:** tldraw commercial license — FREE in development, requires license key in production. ~$10M Series A raised.
- **What it does:** Production-grade infinite canvas SDK for React. Custom shapes, tools, bindings, AI integrations, DOM canvas support. 70K+ weekly npm installs.
- **Harkly use:** Best-in-class infinite canvas for Harkly's spatial canvas. Used by many AI products. However: license requires paid key for production — check cost.
- **Clone potential:** Full (with license) — primary canvas choice if SolidJS adapter exists or is built

### E2. xyflow/xyflow (React Flow / Svelte Flow)
- **URL:** https://github.com/xyflow/xyflow
- **Stars:** ~35.6K (Feb 2026)
- **Language/Stack:** TypeScript (React + Svelte)
- **Last updated:** Very active (2025-2026)
- **License:** MIT
- **What it does:** Powerful open-source libraries for building node-based UIs. Pan/zoom, single/multi selection, custom node/edge types, keyboard shortcuts, plugins (Background, MiniMap). React Flow v12 + Svelte Flow.
- **Harkly use:** Best MIT-licensed node-based canvas. Ideal for Harkly's entity relationship visualization and spatial canvas. MIT license = no production cost. No SolidJS version but can be used with SolidStart.
- **Clone potential:** Full — primary canvas candidate (MIT license advantage over tldraw)

### E3. figureland/infinitykit
- **URL:** https://github.com/figureland/infinitykit
- **Stars:** ~300+
- **Language/Stack:** TypeScript (headless, framework-agnostic)
- **Last updated:** Active (2025)
- **What it does:** Modular TypeScript toolkit for building minimal infinite canvas apps. "Headless" — no assumptions about rendering. Framework-agnostic.
- **Harkly use:** Framework-agnostic infinite canvas that could work with SolidJS. Smaller and more customizable than tldraw/xyflow.
- **Clone potential:** Full — if SolidJS-native canvas is needed

### E4. Flowscape-UI/canvas-react
- **URL:** https://github.com/Flowscape-UI/canvas-react
- **Stars:** ~200+ (Updated Jan 31, 2026)
- **Language/Stack:** TypeScript (React)
- **Last updated:** Jan 31, 2026
- **What it does:** High-performance React library for interactive infinite canvas. Nodes, pan/zoom, selection, history, plugin-friendly architecture.
- **Harkly use:** More recent alternative to React Flow with plugin architecture. Active development.
- **Clone potential:** Full

### E5. robert-mcdermott/ai-knowledge-graph
- **URL:** https://github.com/robert-mcdermott/ai-knowledge-graph
- **Stars:** ~400+
- **Language/Stack:** Python + JavaScript
- **Last updated:** Active (2025)
- **What it does:** AI-powered system that takes unstructured text, uses LLM to extract SPO triplets, and visualizes as interactive knowledge graph.
- **Harkly use:** End-to-end demo of the exact pipeline: text → entity extraction → knowledge graph visualization. Good reference for the full Harkly flow.
- **Clone potential:** Partial — visualization patterns

### E6. uber/graph.gl
- **URL:** https://github.com/uber/graph.gl
- **Stars:** ~1K
- **Language/Stack:** TypeScript (React + deck.gl/WebGL2)
- **Last updated:** Active (2025)
- **What it does:** WebGL2-powered graph visualization components. High-performance rendering for large graphs.
- **Harkly use:** If Harkly's canvas needs to handle very large knowledge graphs (1000+ nodes), WebGL2 rendering is required. graph.gl provides that.
- **Clone potential:** Component — for large-graph rendering

### E7. SolidStart + Tauri templates

#### riipandi/tauri-start-solid
- **URL:** https://github.com/riipandi/tauri-start-solid
- **Language/Stack:** TypeScript (Tauri + SolidJS + Tailwind + Vite)
- **What it does:** Multi-platform desktop application template with tray menu support using Tauri, SolidJS, TypeScript, Tailwind CSS, Vite.
- **Harkly use:** Direct starter for Harkly's Tauri desktop app with SolidJS frontend. Exact stack match.
- **Clone potential:** Full — foundation for Harkly Tauri desktop app

#### atilafassina/quantum
- **URL:** https://github.com/atilafassina/quantum
- **Language/Stack:** TypeScript (Tauri + SolidStart)
- **What it does:** Tauri + SolidStart batteries-included template.
- **Harkly use:** If Harkly uses SolidStart (SSR) inside Tauri, this is the reference template.
- **Clone potential:** Full

---

## Key Repos to Clone/Fork
### Ranked by immediate utility to Harkly

| Rank | Repo | Stars | Why Critical | Action |
|---|---|---|---|---|
| 1 | **RafalWilinski/cloudflare-rag** | 596 | Exact CF stack (D1+Vectorize+R2), hybrid search, TypeScript, MIT | Fork as backend foundation |
| 2 | **seratch/openai-sdk-knowledge-org** | 15 | EXACT stack: CF Workers+Queues+Vectorize+D1, TypeScript, Hono, Drizzle | Fork as MCP backend foundation |
| 3 | **DocumindHQ/documind** | 1.5K | Closest full-solution match: doc→AI schema→JSON, TypeScript, OpenAI | Fork for document processing pipeline |
| 4 | **cloudflare/workers-mcp** | ~1K | Official MCP-from-CF-Workers tool. Required for Harkly MCP layer. | Integrate as production dependency |
| 5 | **cyanheads/mcp-ts-template** | 119 | Complete MCP template with CF D1/KV/R2 backends, Apache 2.0 | Fork as MCP server scaffold |
| 6 | **getomni-ai/zerox** | 12.2K | TypeScript PDF/image OCR via vision models, multi-provider | Integrate as npm dependency |
| 7 | **xyflow/xyflow** | 35.6K | Best MIT-licensed node canvas, React+Svelte, production-ready | Integrate for spatial canvas |
| 8 | **567-labs/instructor-js** | 781 | TypeScript structured LLM extraction with Zod, multi-provider | Integrate as production dependency |
| 9 | **microsoft/markitdown** | ~35K | Universal file→Markdown (ALL formats), Python, Modal.com sidecar | Deploy as Modal.com microservice |
| 10 | **riipandi/tauri-start-solid** | ~300 | Exact Tauri+SolidJS+TypeScript template | Fork as Tauri desktop foundation |

---

## Architecture Pattern — Harkly Data Pipeline (from research)

Based on all repos found, the recommended architecture is:

```
INPUT LAYER (any format)
  Tauri desktop (riipandi/tauri-start-solid)
    └── File drop / URL paste / clipboard

NORMALIZATION LAYER (→ text/markdown)
  CF Workers (harshankur/officeParser) — office docs, runs at edge
  Modal.com microservice (microsoft/markitdown) — universal fallback
  Modal.com microservice (getomni-ai/zerox) — scanned PDFs / images
  Modal.com microservice (yt-dlp + Whisper) — audio/video URLs
  CF Workers scraper (ozanmakes/scrapedown + firecrawl SDK) — web URLs

AI SCHEMA LAYER (text → structured JSON)
  CF Workers AI (567-labs/instructor-js + Zod) — schema inference
  Cloudflare AutoRAG — managed RAG over normalized content
  CF D1 + Vectorize (RafalWilinski/cloudflare-rag patterns) — hybrid search

MCP / API LAYER
  CF Workers (cloudflare/workers-mcp) — expose as MCP server
  Data model: (modelcontextprotocol/servers memory module) — entity/relation/observation

CANVAS LAYER
  SolidStart + xyflow (MIT) or tldraw (commercial) — spatial visualization
  graph.gl — if large knowledge graphs (1000+ nodes)
```

---

## Notes and Warnings

### License risks
- **tldraw**: Requires paid production license. Verify cost before committing.
- **firecrawl**: AGPL-3.0 — self-hosted use fine, but SaaS distribution requires disclosure.
- **yobulkdev**: AGPL 3.0 — same concern.
- **sparrow**: GPL 3.0 — viral license. Use as reference only, do not embed.
- **documind**: AGPL v3.0 — can fork for internal/own SaaS but check AGPL obligations.

### Python vs TypeScript split
Most best-in-class document parsing tools (Docling, Markitdown, Unstructured) are Python. The recommended approach is a Modal.com microservice layer for Python tools, with TypeScript CF Workers handling the edge logic. harshankur/officeParser is the exception — TypeScript-native, runs in CF Workers.

### Cloudflare AutoRAG
Currently free in open beta (April 2025). This could dramatically simplify Harkly's RAG infrastructure. Monitor for GA pricing before building custom RAG pipeline.

### MCP ecosystem maturity
MCP donated to Linux Foundation (Dec 2025), adopted by OpenAI, Google, and Vercel. The ecosystem has matured significantly. Cloudflare has first-class MCP server support. The timing is ideal for Harkly to launch an MCP-native knowledge API.

---

## Sources

- https://github.com/Unstructured-IO/unstructured
- https://github.com/DocumindHQ/documind
- https://github.com/infiniflow/ragflow
- https://github.com/docling-project/docling
- https://github.com/langgenius/dify
- https://github.com/getzep/graphiti
- https://github.com/HKUDS/LightRAG
- https://github.com/openqda/openqda
- https://github.com/yt-dlp/yt-dlp
- https://github.com/iqbal-rashed/ytdlp-nodejs
- https://github.com/microlinkhq/youtube-dl-exec
- https://github.com/instaloader/instaloader
- https://github.com/riad-azz/instagram-video-downloader
- https://github.com/harshankur/officeParser
- https://github.com/getomni-ai/zerox
- https://github.com/microsoft/markitdown
- https://github.com/zackees/transcribe-anything
- https://github.com/bugbakery/transcribee
- https://github.com/adamschwartz/web.scraper.workers.dev
- https://github.com/ozanmakes/scrapedown
- https://github.com/firecrawl/firecrawl
- https://github.com/yobulkdev/yobulkdev
- https://github.com/tableflowhq/csv-import
- https://github.com/567-labs/instructor-js
- https://github.com/google/langextract
- https://github.com/shcherbak-ai/contextgem
- https://github.com/katanaml/sparrow
- https://github.com/zjunlp/OneKE
- https://github.com/stair-lab/kg-gen
- https://github.com/Addepto/graph_builder
- https://github.com/amir9480/json-schema-builder
- https://github.com/importcsv/importcsv
- https://github.com/cloudflare/workers-mcp
- https://github.com/cloudflare/mcp-server-cloudflare
- https://github.com/cyanheads/mcp-ts-template
- https://github.com/MCPJam/mcp-app-workers-template
- https://github.com/mahmoudfazeli/cloudflare-mcp-template
- https://github.com/modelcontextprotocol/servers/tree/main/src/memory
- https://github.com/seratch/openai-sdk-knowledge-org
- https://github.com/RafalWilinski/cloudflare-rag
- https://developers.cloudflare.com/autorag/
- https://github.com/tldraw/tldraw
- https://github.com/xyflow/xyflow
- https://github.com/figureland/infinitykit
- https://github.com/Flowscape-UI/canvas-react
- https://github.com/robert-mcdermott/ai-knowledge-graph
- https://github.com/uber/graph.gl
- https://github.com/riipandi/tauri-start-solid
- https://github.com/atilafassina/quantum
- https://florinelchis.medium.com/top-10-rag-frameworks-on-github-by-stars-january-2026-e6edff1e0d91
- https://blog.cloudflare.com/introducing-autorag-on-cloudflare/
- https://blog.cloudflare.com/remote-model-context-protocol-servers-mcp/
