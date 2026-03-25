---
# contexter-about.md — Contexter Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-03-25 (session 191 — Antigravity MCP, pricing model, production stack)
---

## Identity

Contexter = RAG-as-a-service. Any context → API endpoint with knowledge base. MCP-native.
Team: nopoint (founder). Evolved from Harkly MVP data layer into standalone product.

## Tech Stack (demo/MVP)

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Frontend | SolidJS 1.9 + Vite 8 (static SPA, **deployed**) |
| API | Hono on CF Workers |
| CSS | Tailwind CSS 4 (**deployed**, @theme tokens) |
| ORM | Drizzle ORM (sqlite) |
| Deploy | Cloudflare Pages + Workers |
| Metadata DB | CF D1 |
| Full-text search | D1 FTS5 |
| Vector store | CF Vectorize (1024 dims, cosine) |
| File storage | CF R2 |
| KV | CF KV (sessions, rate limits, OAuth tokens) |
| Embeddings | Jina v4 API (truncate_dim=1024, multimodal) |
| Transcription | Groq Whisper Large v3 API |
| RAG answer | Workers AI / Groq / NIM (fallback chain) |
| User auth | Custom token-based (register → apiToken). OAuth planned (Google/Telegram/Yandex) |
| MCP server | Streamable HTTP (JSON-RPC on /sse, 12 tools) |
| Document parsing | env.AI.toMarkdown() (free, CF native) |

## Key Paths

| Resource | Path |
|---|---|
| Project root | `nospace/development/contexter/` |
| Source code | `development/contexter/src/` |
| Services | `development/contexter/src/services/` (parsers, chunker, embedder, vectorstore, rag, mcp, auth, pipeline) |
| Routes | `development/contexter/src/routes/` (upload, query, status, auth, dev, mcp, mcp-remote, health, **retry**) |
| Frontend | `development/contexter/web/` (SolidJS SPA, 10 components, 5 pages) |
| Frontend build | `development/contexter/web/dist/` (CF Pages deploy source) |
| CTO specs | `development/contexter/FRONTEND-SPEC.md`, `BACKEND-PIPELINE-SPEC.md` |
| Tests (unit) | `development/contexter/tests/` (128 tests) |
| Tests (e2e) | `development/contexter/e2e/` (Playwright) |
| MCP bridge | `development/contexter/mcp-bridge/` (stdio for Claude Desktop) |
| Docs | `nospace/docs/contexter/` |
| Design system | `nospace/design/contexter/` |
| Pencil file | `nospace/design/contexter/contexter-ui.pen` |
| Brand | `development/contexter/brand/` |
| Memory | `development/contexter/memory/` |
| Chronicle | `development/contexter/memory/chronicle/` |

## Deployed

| Resource | URL |
|---|---|
| API | https://contexter.nopoint.workers.dev |
| Dev UI | https://contexter.nopoint.workers.dev/dev |
| Health | https://contexter.nopoint.workers.dev/health |
| MCP endpoint | https://contexter.nopoint.workers.dev/sse?token={TOKEN} |
| GitHub | https://github.com/nopointt/contexter |
| **Frontend** | **https://contexter-web.pages.dev** |

## CF Resources (created)

| Resource | ID/Name |
|---|---|
| D1 Database | contexter-db (26e9545b-9d18-48fc-93b7-4493d505a318) |
| R2 Bucket | contexter-files |
| KV Namespace | 533cd83048f64a4e8d8ed28c01ac32de |
| Vectorize Index | contexter-vectors (1024 dims, cosine) |

## API Keys

| Key | Location |
|---|---|
| Jina | `~/.tLOS/jina-key` |
| Groq | `~/.tLOS/groq-key` |

## Pipeline (9 CJM stages)

```
file → parse (toMarkdown) → chunk (semantic/table/timestamp) → embed (Jina v4) → index (Vectorize + FTS5)
query → rewrite (LLM) → search (FTS5 ∥ Vectorize → RRF) → context → LLM → answer
```

## Supported Formats (12)

PDF, DOCX, XLSX, PPTX, CSV, JSON, TXT, MD, Images (PNG/JPG/WebP/SVG), Audio (MP3/WAV/M4A/OGG), Video (audio only), YouTube URL (subtitles)

## Design System

Swiss/Bauhaus. JetBrains Mono only. B&W (#0A0A0A / #FAFAFA) + blue (#1E3EA0). 0px corners. No shadows.
Tokens inherited from Harkly structure, values adapted for cold palette.
RAG-verified: 8 design decisions with Bauhaus citations.
Pencil: `contexter-ui.pen` (31 recovered nodes, 11 reusable components). Recovery data: `design/contexter/recovery/` (4 files). Docs: `design/contexter/` (12 MD + 2 UX files).

## Pricing Model

Usage-based per-GB storage. Credit system: n = $0.000422. Monthly + Annual (with tier discounts).
Billing: LemonSqueezy. Prepaid + metered usage.
1 GB free. Margin >= 15% at any volume.
Full model: `docs/research/contexter-financial-model.md`
Python models: `docs/research/pricing-*.py`

## Active L3

| Epic | File | Status |
|---|---|---|
| **CTX-01 MVP Pipeline** | [contexter-mvp.md](contexter-mvp.md) | 🔶 IN PROGRESS |

## Write Authority

| File | Owner |
|---|---|
| `memory/contexter-about.md` (L1) | Axis — structural changes |
| `memory/contexter-roadmap.md` (L2) | Axis — epic/stage status |
| `memory/contexter-mvp.md` (L3) | Axis — task tracking |
| `memory/chronicle/contexter-current.md` | Axis — append only |
| `memory/chronicle/index.md` | Axis — append only |
| `memory/session-scratch.md` (L4) | Axis — write during session |

## G3 Rule

**Bauhaus Team (7 permanent Eidolons):**
| Name | Role | Pair |
|---|---|---|
| **Gropius** | Frontend Player (SolidJS/Tailwind) | Breuer |
| **Breuer** | Frontend Coach (visual regression) | Gropius |
| **Itten** | Web Designer Player (composition) | Albers |
| **Albers** | Design Coach (token audit) | Itten |
| **Mies** | Backend Player (Hono/CF/D1) | Schlemmer |
| **Schlemmer** | Backend Coach (API testing) | Mies |
| **Moholy** | QA Engineer (E2E Playwright) | — |

Identities: `nospace/agents/{name}/L0-identity.md`
Claude agents: `~/.claude/agents/{name}.md`

## Pipeline Architecture (async, 2026-03-24)

Upload → R2 store + D1 doc row + 4 job rows (pending) → **return 202 immediately**
→ waitUntil: parse → chunk → embed → index (each stage updates jobs table)
→ Status API returns stages[] from jobs table
→ Retry endpoint resumes from failed stage
→ User isolation: Vectorize filter by userId, FTS5 JOIN by user_id
