# Contexter — Stack Compatibility Research
> Date: 2026-03-21
> Researcher: Axis

---

## CRITICAL FINDINGS

### 1. Jina v4 dimensions vs Vectorize — INCOMPATIBLE (fixable)

| Model | Default dims | Truncation (Matryoshka) | Multimodal |
|---|---|---|---|
| jina-embeddings-v4 | **2048** | 128, 256, 512, **1024**, 2048 | ✅ text + image |
| jina-embeddings-v5-text-small | **1024** | down to 32 | ❌ text only |
| jina-embeddings-v5-text-nano | **768** | down to 32 | ❌ text only |
| jina-embeddings-v5-multimodal | TBA (not released) | TBA | ✅ (upcoming) |

**CF Vectorize max: 1536 dimensions.**

- Jina v4 at full 2048 dims → **DOES NOT FIT** in Vectorize
- Jina v4 truncated to 1024 → ✅ fits, minimal quality loss (Matryoshka trained)
- Jina v5-small at 1024 → ✅ fits natively, but text-only (no multimodal)
- Jina v5-multimodal → not yet released

**Decision:** Use **Jina v4 at 1024 dims** (truncate_dim=1024). Gets multimodal (text+image) AND fits Vectorize. When v5-multimodal ships, evaluate migration.

Sources:
- https://huggingface.co/jinaai/jina-embeddings-v4
- https://jina.ai/models/jina-embeddings-v4/
- https://jina.ai/news/jina-embeddings-v5-text-distilling-4b-quality-into-sub-1b-multilingual-embeddings/

---

### 2. CF Workers AI toMarkdown — GAME CHANGER (replaces 7+ parsers)

**`env.AI.toMarkdown()`** — FREE built-in service in CF Workers AI.

Supported formats:
- ✅ PDF
- ✅ DOCX
- ✅ XLSX
- ✅ PPTX
- ✅ Images (JPEG, PNG, WebP, SVG) — uses AI for description
- ✅ HTML, XML
- ✅ CSV, JSON
- ✅ ODS, ODT
- ✅ Apple Numbers
- ✅ Plain text

**Impact on architecture:** Replaces officeParser, unpdf, and most custom parsers. One API call converts any supported file to markdown. Free for most conversions (images may use Workers AI quota).

New endpoint (2026-03-04): customizable `conversionOptions` per file type.

**What toMarkdown does NOT cover:**
- ❌ Audio transcription (still need Groq Whisper)
- ❌ Video processing (still need ffmpeg/audio extraction)
- ❌ YouTube URL parsing (still need transcript API)
- ❓ PDF visual (page-as-image OCR) — toMarkdown does text extraction, not visual. For scan-heavy PDFs, still need zerox/vision approach

Sources:
- https://developers.cloudflare.com/workers-ai/features/markdown-conversion/
- https://blog.cloudflare.com/markdown-for-agents/
- https://developers.cloudflare.com/changelog/post/2025-03-20-markdown-conversion/

---

### 3. better-auth 1.5 — Now includes OAuth 2.1 Provider + MCP Auth

better-auth 1.5 (released 2026) adds:
- **OAuth 2.1 Provider plugin** — native OAuth server
- **MCP Auth support** — built-in
- **Cloudflare D1 support** — improved

**Impact:** Potentially eliminates need for `@cloudflare/workers-oauth-provider` as a separate package. One library handles both user auth AND OAuth 2.1 for MCP clients.

**Risk:** Need to verify maturity of better-auth's OAuth provider vs cloudflare's battle-tested workers-oauth-provider. For MVP, using better-auth 1.5 simplifies the stack (one auth library instead of two).

Sources:
- https://better-auth.com/blog/1-5
- https://hono.dev/examples/better-auth-on-cloudflare

---

### 4. CF Workflows — GA, production-ready

| Limit | Free | Paid |
|---|---|---|
| Steps per instance | 650 | 10,000 (configurable to 25,000) |
| Concurrent instances | 25 | 10,000 |
| Instance creation rate | 1/sec | 100/sec |
| CPU per step | 15s | 30s (configurable) |
| Subrequests per instance | 500 | 10,000 (configurable to 10M) |
| State per instance | 100 MB | 1 GB |

**Verdict:** More than sufficient for document processing pipeline. Each step.do() gets its own CPU budget. Long processing = split into multiple steps.

Sources:
- https://developers.cloudflare.com/workflows/reference/limits/
- https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/

---

### 5. unpdf in CF Workers — ✅ CONFIRMED

unpdf works in edge runtimes including CF Workers. Lightweight wrapper around pdf.js. Used in official CF R2 tutorial for PDF processing.

Alternative: `pdfjs-serverless` — redistribution of PDF.js specifically for edge environments.

**But:** With toMarkdown available, unpdf becomes a fallback for cases where toMarkdown insufficient.

Sources:
- https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026
- https://github.com/johannschopplich/pdfjs-serverless

---

### 6. zerox in CF Workers — ❌ NOT COMPATIBLE

zerox requires PDF→PNG conversion (via poppler/ImageMagick/LibreOffice) before sending to vision LLM. These native binaries don't run in CF Workers.

**Alternatives for PDF visual parsing in Workers:**
- CF Browser Rendering API (render PDF pages as images)
- Send PDF directly to vision LLM API (Gemini, GPT-4o) without local conversion
- toMarkdown for most PDFs, vision LLM only for scan-heavy documents

---

### 7. officeParser in CF Workers — ⚠️ UNCONFIRMED

officeParser uses JSZip internally for OOXML parsing. JSZip should work in Workers (no native deps), but not explicitly tested.

**With toMarkdown available, officeParser is unnecessary** for DOCX/PPTX/XLSX.

---

### 8. YouTube transcript — ✅ COMPATIBLE

`youtube-caption-extractor` npm package explicitly supports CF Workers and Edge Runtime.

Also: existing CF Worker project `remote-cloudflare-youtube-transcript-mcp-server` demonstrates YouTube transcript extraction running on CF Workers.

Sources:
- https://github.com/youtube-transcript-plus/youtube-transcript-api
- https://github.com/objones25/remote-cloudflare-youtube-transcript-mcp-server

---

### 9. SolidStart + CF Pages — ⚠️ WORKS WITH GOTCHAS

Known issues:
- **vinxi diverged from nitro** → `nitro-cloudflare-dev` doesn't work for local CF bindings
- **Workaround for local dev:** `wrangler pages dev` or special async-local-storage config
- **Deploy works** but needs `nodejs_compat` flag in Pages project settings
- **D1 binding access** requires `getRequestEvent().nativeEvent.context.cloudflare.env.DB` pattern

**Issue tracker:** https://github.com/cloudflare/workers-sdk/issues/5912

**Alternative consideration:** Use Hono on CF Workers directly (skip SolidStart SSR). Simpler binding access, no vinxi issues. Frontend = static SolidJS SPA served from Pages.

Sources:
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-solid-start-site/
- https://github.com/solidjs/solid-start/issues/1833

---

### 10. mcp-ts-template — ✅ CONFIRMED CF Workers

First-class CF Workers support. Build: `bun run build:worker`. Deploy with wrangler. Streamable HTTP transport, Zod tool definitions, pluggable auth.

Sources:
- https://github.com/cyanheads/mcp-ts-template

---

## Revised Parser Architecture (post-research)

### Before research: 12 separate parsers
### After research: 4 services

| # | Service | Formats | Technology |
|---|---|---|---|
| 1 | **toMarkdown** (CF native) | PDF, DOCX, XLSX, PPTX, CSV, JSON, images, HTML, TXT, MD, ODS, ODT | `env.AI.toMarkdown()` — FREE |
| 2 | **PDF Visual** | Scanned PDFs, image-heavy PDFs | Vision LLM API (send PDF pages as base64) |
| 3 | **Audio Transcription** | MP3, WAV, M4A, OGG | Groq Whisper API |
| 4 | **YouTube Parser** | YouTube URLs | youtube-caption-extractor (CF Workers compatible) |

Video: extract audio track → send to Groq Whisper. In demo/CF: skip video, audio only.

---

## Revised Auth Architecture (post-research)

### Before: 3 libraries
- better-auth (user identity)
- workers-oauth-provider (OAuth 2.1 server)
- mcp-ts-core (MCP server + auth validation)

### After: 2 libraries (potentially)
- **better-auth 1.5** (user identity + OAuth 2.1 Provider + MCP Auth)
- **mcp-ts-core** (MCP server + tool definitions)

Need to verify: does better-auth 1.5 OAuth Provider produce tokens compatible with mcp-ts-core validation?

---

## Compatibility Matrix

| Component A | Component B | Compatible? | Notes |
|---|---|---|---|
| Jina v4 (1024 truncated) | CF Vectorize | ✅ | Use truncate_dim=1024 |
| SolidStart 1.3 | CF Pages | ⚠️ | Works but vinxi binding issues in dev |
| SolidStart 1.3 | Bun (local) | ✅ | Standard |
| toMarkdown | CF Workers | ✅ | Native binding, free |
| unpdf | CF Workers | ✅ | Edge-compatible |
| zerox | CF Workers | ❌ | Needs native binaries |
| officeParser | CF Workers | ❓ | Unconfirmed, unnecessary with toMarkdown |
| youtube-caption-extractor | CF Workers | ✅ | Explicitly supported |
| CF Workflows | CF Workers | ✅ | GA, production-ready |
| CF Queues | CF Workflows | ✅ | Can trigger workflows from queue |
| better-auth 1.5 | CF D1 | ✅ | Native adapter |
| better-auth 1.5 | CF KV | ✅ | Rate limiting, sessions |
| workers-oauth-provider | CF KV | ✅ | Token storage |
| mcp-ts-core | CF Workers | ✅ | First-class support |
| Drizzle ORM | CF D1 | ✅ | sqlite dialect |
| Groq Whisper API | CF Workers | ✅ | External API call |
| Jina API | CF Workers | ✅ | External API call |
| Tailwind CSS 4 | SolidStart | ✅ | @tailwindcss/vite |

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Jina v4 at 1024 dims loses quality vs 2048 | LOW | Matryoshka-trained, minimal loss documented |
| toMarkdown quality insufficient for complex PDFs | MEDIUM | Fallback to vision LLM for problematic documents |
| SolidStart vinxi binding issues in local dev | MEDIUM | Use `wrangler pages dev` or switch to Hono |
| better-auth 1.5 OAuth Provider immaturity | MEDIUM | Fallback to workers-oauth-provider if issues found |
| Video processing impossible in CF Workers | LOW | Demo: audio only. Prod: VPS with ffmpeg |
| CF Workflows step CPU limit (30s) | LOW | Split heavy processing into multiple steps |
| Jina API rate limits / pricing at scale | MEDIUM | Benchmark early, cache embeddings aggressively |

---

## Key Architecture Decision: SolidStart vs Hono

Given the vinxi/CF bindings friction, consider:

**Option A — SolidStart (current plan):**
- Pro: SSR, file-based routing, server functions
- Con: vinxi binding issues, CF dev experience poor

**Option B — Hono (API) + Static SolidJS (frontend):**
- Pro: Perfect CF Workers compatibility, clean binding access, Hono is first-class CF citizen
- Con: No SSR (fine for SPA), separate API and frontend

**For Contexter MVP (3 screens, dashboard):** Option B may be simpler and more reliable.
