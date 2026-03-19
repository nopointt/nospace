---
# harkly-mvp-data-layer.md — Harkly MVP: Data Layer Platform
> Layer: L3 | Epic: HARKLY-18 | Status: 🔶 IN PROGRESS
> Created: 2026-03-18 | Updated: 2026-03-19
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
| **18.1** | [harkly-18-1-scaffold.md](harkly-18-1-scaffold.md) | 🔜 NEXT | SolidStart + CF + D1 + auth + wrangler |
| **18.2** | [harkly-18-2-upload.md](harkly-18-2-upload.md) | ⬜ BLOCKED by 18.1 | R2 upload, Queues, chunking, embedding, audio, YouTube |
| **18.3** | [harkly-18-3-schema.md](harkly-18-3-schema.md) | ⬜ BLOCKED by 18.2 | Schema discovery, confirmation UI, Zod, extraction |
| **18.4** | [harkly-18-4-mcp.md](harkly-18-4-mcp.md) | ⬜ BLOCKED by 18.1 | MCP server, OAuth 2.1, 6 tools, consent UI |
| **18.5** | [harkly-18-5-canvas.md](harkly-18-5-canvas.md) | ⬜ BLOCKED by 18.3 | Canvas port, connect to data, Omnibar (hidden) |

**Dependency:** 18.1 → {18.2 ∥ 18.4} → 18.3 → 18.5

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

- FTS5 в D1 — нужно верифицировать (cloudflare-rag использует, но CF не документирует явно)
- vinxi local dev + CF bindings — известный баг, workaround через `wrangler pages dev`
