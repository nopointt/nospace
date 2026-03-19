---
# harkly-mvp-data-layer.md — Harkly MVP: Data Layer Platform
> Layer: L3 | Epic: HARKLY-18 | Status: 🔶 IN PROGRESS
> Created: 2026-03-18 | Updated: 2026-03-19 (session 174)
> Source: nopoint interview + Copy First research (9 files) + 5 MVP specs
---

## Что это

Платформа для работы со своими данными. Загрузи что угодно — интервью, отчёты, договоры, учебники, тикеты, CSV — Harkly превращает их в структурированную базу данных. Работай с ней через любую LLM (MCP) или визуально на канвасе.

**Harkly продаёт не AI, а правильно структурированные данные.** LLM — commodity. Ценность = маппинг сырья в queryable базу + MCP для подключения любой LLM.

---

## MVP Scope (утверждён 2026-03-19)

**В MVP:**
- Upload: PDF, DOCX, CSV, TXT, аудио (mp3/wav/m4a), YouTube URL (субтитры)
- AI schema discovery → user confirmation → structured extraction to D1
- MCP Server (OAuth 2.1, Streamable HTTP) — Claude, ChatGPT, Grok, Gemini, Copilot
- Spatial canvas (порт harkly-shell 77 файлов → web SolidStart)
- Hybrid search (FTS5 + Vectorize + RRF)

**НЕ в MVP:**
- LLM чат (v1.1 — Omnibar скрыт, доработка позже)
- Видеофайлы, YouTube без субтитров, Instagram (v2 — нужен сервер для ffmpeg/yt-dlp)
- Tauri desktop (v2 — web first)
- Billing / paywall (последнее)
- Коллаборация, real-time sync, кросс-проектный анализ

---

## Стек

| Layer | Technology |
|---|---|
| Frontend | SolidStart 1.3.x + SolidJS 1.9.x + Tailwind 4 |
| Hosting | Cloudflare Pages (web) |
| Database | Cloudflare D1 (AUTH_DB + KB_DB) + Drizzle ORM |
| Vector | Cloudflare Vectorize (1024-dim, cosine, BGE-Large) |
| FTS | D1 FTS5 virtual table + BM25 |
| Storage | Cloudflare R2 (presigned uploads) |
| Queue | Cloudflare Queues + D1 job table |
| Auth (user) | better-auth + D1 |
| Auth (MCP) | workers-oauth-provider (OAuth 2.1) |
| MCP | @cyanheads/mcp-ts-core (Streamable HTTP) |
| Extraction | instructor-js + Zod |
| Embeddings | Workers AI @cf/baai/bge-large-en-v1.5 (free) |
| Transcription | Groq Whisper Large v3 Turbo |
| Schema discovery | Workers AI Llama 3.3 70B / Groq / NIM |

---

## Sub-Epics

| Sub-Epic | File | Status | Scope |
|---|---|---|---|
| **18.1** | [harkly-18-1-scaffold.md](harkly-18-1-scaffold.md) | ✅ DONE | SolidStart + CF + D1 + auth + wrangler |
| **18.2** | [harkly-18-2-upload.md](harkly-18-2-upload.md) | ✅ CODE COMPLETE | R2 upload, Queues, chunking, embedding, audio, YouTube |
| **18.3** | [harkly-18-3-schema.md](harkly-18-3-schema.md) | ✅ CODE COMPLETE | Schema discovery, confirmation UI, Zod, extraction |
| **18.4** | [harkly-18-4-mcp.md](harkly-18-4-mcp.md) | ✅ DEPLOYED | MCP server, OAuth 2.1, 6 tools, consent UI |
| **18.5** | [harkly-18-5-canvas.md](harkly-18-5-canvas.md) | ✅ CODE COMPLETE | Canvas port, D1 integration, dashboard, omnibar |

**Dependency:** 18.1 ✅ → {18.2 ✅ ∥ 18.4 ✅} → 18.3 ✅ → 18.5 ✅

**Plans:** [harkly-18-4-mcp-plan.md](harkly-18-4-mcp-plan.md) | [harkly-18-5-canvas-plan.md](harkly-18-5-canvas-plan.md)

---

## Спецификации (written 2026-03-19)

| Doc | Path | Lines |
|---|---|---|
| Architecture | `docs/research/harkly-mvp-architecture.md` | 709 |
| Copy Map | `docs/research/harkly-mvp-copy-map.md` | ~600 |
| Data Model | `docs/research/harkly-mvp-data-model.md` | 1522 |
| API Spec | `docs/research/harkly-mvp-api-spec.md` | 1615 |
| Build Plan | `docs/research/harkly-mvp-build-plan.md` | ~700 |

---

## Research (completed 2026-03-19)

| File | What |
|---|---|
| `harkly-research-products.md` | 20+ products, gap analysis |
| `harkly-research-github.md` | 50+ repos (WebSearch) |
| `harkly-research-github-api.md` | 10 new repos (GitHub API) |
| `harkly-research-mcp-access.md` | MCP ecosystem 2026, all clients |
| `harkly-research-stack.md` | CF services, tools, 10 gotchas |
| `harkly-eval-rag-pipeline.md` | cloudflare-rag, ai-rag-crawler, openai-sdk eval |
| `harkly-eval-schema-extract.md` | documind, sift-kg, l1m, instructor-js eval |
| `harkly-eval-mcp-auth.md` | mcp-ts-template, workers-oauth-provider eval |
| `harkly-eval-ui-canvas.md` | quantum, solid-pages, solid-flow, better-auth eval |

---

## Конкурентное позиционирование

Ни один продукт не делает все 5 вещей: any-format ingestion + AI schema + structured DB + MCP + canvas.
Ближайшие: Dovetail (UX teams only), HeyMarvin (5-user min), Khoj (dev-only), SecondBrain.io (text only), NotebookLM (no DB/API/schema).

---

## Blockers

- **AUTH REGISTRATION 500** — sign-up/sign-in endpoint crashes on CF Pages. Root cause chain: SolidStart wraps Nitro event (`event.context` empty, bindings on `event.nativeEvent.context.cloudflare.env`), missing BETTER_AUTH_SECRET, D1 needs `withCloudflare` drizzle adapter, geolocation disabled. Still 500 after 6 iterations. Priority: HIGH — blocks all user flows.
- ~~vinxi local dev + CF bindings~~ — workaround: `wrangler pages dev`
- ~~FTS5 в D1~~ — verified working

## Tech Debt

- ~~`tenantId = "demo-user"` hardcoded~~ — ✅ FIXED session 173
- ~~wrangler.jsonc~~ — ✅ FIXED session 173
- ~~Temp spec files~~ — ✅ FIXED session 173
- `src/routes/api/debug.ts` — debug endpoint left in codebase, remove for prod
- Queues commented out in wrangler.toml — need Workers Paid plan for async ingest
- 29 pre-existing TS errors (APIEvent, FetchEvent, entry-server, embedder, zod-compiler)
- ✅ QA Epic complete (session 176): 54 bugs found (7 CRITICAL), 770 auto-tests written, tech debt audited. Report: `harkly-web/QA-REPORT.md`

## Implementation Notes (session 174)

- **Deployed:** `harkly-web.pages.dev` (CF Pages) + `harkly-mcp.nopoint.workers.dev` (CF Worker)
- **Remote D1 migrations:** 5 KB + 1 Auth applied to prod
- **Playwright:** 10/10 smoke tests green (e2e-smoke.spec.ts)
- **Event binding pattern:** `event.nativeEvent.context.cloudflare.env` — the only way to get CF bindings in SolidStart API routes on CF Pages
- **BETTER_AUTH_SECRET:** set as Pages secret via `wrangler pages secret put`
- **CLI agents used:** Qwen (auth fix, 9 files), Opus subagent (canvas Phase 1-2: 22 files, Phase 3-5: ~30 files)
