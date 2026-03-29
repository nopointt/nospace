---
# contexter-gtm.md — CTX-08 GTM Strategy & Positioning
> Layer: L3 | Epic: CTX-08 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-29 (session 208 — presigned upload, audio segmentation, PDF images, pipeline crash blocker)
---

## Goal

Продакт-бриф для продающего лендинга Contexter. Positioning: "One memory. Every AI." / "Одна память · Все нейросети". Non-tech audience. Global (EN primary, RU secondary).

## Deliverable

Product brief + landing page implementation + deployment.

## Problem Statement

People don't understand what Contexter is on the first screen. Need positioning, copy, landing page.

## Key Decisions (session 194-195)

- **Audience:** non-technical IT/non-IT specialists (not developers)
- **Positioning:** "One memory. Every AI." — not "RAG platform", not "Context Storage"
- **NOT self-hosted:** SaaS product. Self-hosted = internal infra, not user-facing
- **Context = docs + conversations** (not just documents)
- **Killer features:** 1) all LLMs, 2) any format any size
- **Key competitor:** Supermemory ($3M, dev-first, open-core trap)
- **White space:** universal + non-tech = nobody occupies this quadrant

## Phases

### Phase 0: Seed Search
- [x] Market landscape (TAM $2.76-3.33B, MCP de facto standard)
- [x] 5 direct competitors v1 (RAG frame)
- [x] 15 indirect competitors v1
- [x] 5 direct competitors v2 (Context Storage frame): Ragie, Graphlit, Morphik, Vectorize, Langbase, +Supermemory
- [x] 15 indirect competitors v2 (9 categories incl. Second Brain)
- [x] Second Brain deep scan (10 PKM products)
- [x] Non-tech user pain research (17 quotes, 6 workarounds, vocabulary map)

### Phase 1: Deep Competitor Analysis (6 direct)
- [x] Ragie — "Context Engine", $5.5M, $250/connector tax
- [x] Graphlit — "Context Layer", knowledge graph, zero reviews
- [x] Morphik — YC X25, ColPali, BSL license
- [x] Vectorize — "Agent Memory", RAG evaluation, Hindsight pivot
- [x] Langbase Memory — 50MB at $250/mo, ~6 formats
- [x] Supermemory — "Context infrastructure", $19→$399 cliff, open-core

### Phase 2: Synthesis
- [x] Competitive map (non-tech lens) — white space confirmed
- [x] Positioning + hero copy (5 EN + 5 RU variants)
- [x] Landing page structure research

### Phase 3: Implementation
- [x] Product brief written (contexter-product-brief.md)
- [x] Pencil landing page designed (12 sections)
- [x] SolidJS landing page implemented (Landing.tsx)
- [x] Deployed to contexter-landing.pages.dev (test)
- [x] Deployed to contexter.cc (prod, / → Landing, /app → Hero)

### Phase 4: Billing + Auth (session 198)
- [x] NOWPayments crypto billing (flat tiers $9/$29/$79)
- [x] Google OAuth login
- [x] CF Email Routing (nopoint@contexter.cc)
- [x] App page restructure (5 sections)
- [ ] Telegram Login (deferred — widget domain issue)
- [ ] Card payments (blocked — no KYB)

### Phase 5: RAG Quality Deep Research (session 198)
- [x] Deep research framework (6 layers)
- [x] 19 deep research studies (covering 32 features)
- [x] SOTA audit (rag-sota-2026-research.md)
- [x] Competitor sentiment analysis
- [x] Write implementation plan from research
- [x] Spec review (Opus): 2 CRITICAL + 5 HIGH fixed, all 10 specs ready for G3
- [x] F-011 structure-aware chunking implemented (Wave 1E)
- [x] Implement remaining Wave 1 (F-001–F-005, F-008, F-010, F-013, F-022, F-023) ✅ session 204
- [x] Implement Wave 2 (F-006, F-007, F-009, F-017, F-020, F-021, F-024, F-028) ✅ session 204
- [x] Implement Wave 3 (F-030, F-031, F-032, F-023) ✅ session 204
- [x] F-012/014/015/016 LLM provider abstraction + SSE streaming ✅ implemented
- [x] Schlemmer G2: verify F-012/014/015/016 + resolveParents ✅ PASS_WITH_NOTES, 4 defects fixed
- [x] F-018 HyDE (Mies K) ✅ session e329bace
- [x] F-019 query decomposition (Mies K) ✅ session e329bace
- [x] F-025 NLI hallucination detection (Mies M) ✅ session e329bace
- [x] F-026 confidence scoring (Mies M) ✅ session e329bace
- [x] F-027 source attribution (Mies R) ✅ session e329bace
- [x] NLI Python sidecar (Docker) ✅ session e329bace
- [ ] F-029 BM25 conditional (blocked: PG 17+)
- [x] F-033 drift detection + canary queries ✅ session e329bace
- [x] F-031 query.ts sampling enqueue ✅ session 206
- [x] vectorstore/index.ts immutability fix (.toSorted) ✅ session 206
- [x] Build + deploy to Hetzner ✅ session 206
- [x] Fix JINA_DIMENSIONS stale comment + L1 dims (1024→512) ✅ session 206

### Phase 6: Iteration (open)
- [ ] Landing page copy/design iterations based on feedback
- [ ] Product video (deferred)
- [ ] Testimonials collection (Artem demo + early users)
- [ ] A/B testing hero variants

### Phase 7: Unlimited Upload + Audio Segmentation + PDF Images (session 208)

**Goal:** Убрать лимит 100MB, поддержать файлы любого размера. Сегментация аудио для Whisper. Извлечение картинок из PDF с мультимодальным embedding.

**Architecture decisions:**
- Presigned R2 upload (браузер → R2 напрямую, сервер не трогает байты)
- Audio: silence-detect → segment ≤23MB mid-silence → parallel Whisper → merge
- PDF images: Docling `image_export_mode=embedded` (poppler не нужен)
- Multimodal embed: Jina v4 (text + image в одном vector space)
- Старый upload path остаётся для файлов ≤50MB и MCP (лимит 200MB)

**Wave 0 (Axis):**
- [x] CORS на R2 bucket contexter-files
- [x] Docling image extraction test → подходит (image_export_mode=embedded, классификация, chart data)
- [x] Спека в L3

**Wave 1 (parallel Domain Leads):**
- [x] Backend: `/api/upload/presign` + `/api/upload/confirm` + @aws-sdk/s3-request-presigner + лимиты 200MB
- [x] Frontend: Upload.tsx XHR presigned flow + progress bar (PRESIGN_THRESHOLD=50MB)

**Wave 2 (parallel Domain Leads):**
- [x] AudioParser v2: silence-detect → segment ≤23MB mid-silence → parallel Whisper (concurrency 3) → merge
- [x] VideoParser v2: ffmpeg extract → size check → segmenter if >23MB
- [x] PDF image extraction: Docling to_formats=json + image_export_mode=embedded → filter → R2 → image chunks
- [x] ImageEmbedderService: jina-clip-v2 for multimodal (text model = jina-embeddings-v4, separate)
- [x] Pipeline: storeImagesToR2 + buildImageChunks + dual embed (text + image)

**Wave 3 (Axis):**
- [x] Deploy backend (Hetzner) + frontend (CF Pages) ✅ session 208
- [x] Health check: all services ok
- [x] Smoke test: /api/upload/presign returns 401 (correct auth gate)

**Audio segmentation spec:**
- WAV 16kHz mono = 32KB/s = ~12min per 23MB
- silencedetect: noise=-30dB, min_duration=0.3s
- Split at mid-silence, target ≤11min per segment (margin)
- No silence in 11min → force-split
- Empty segments (>95% silence) → skip Whisper
- Parallel Whisper: concurrency 3, retry 2x per segment
- Language: detect from first non-empty segment, pass to rest
- Progress: segments_done / total_segments
- verbose_json format for timestamp-accurate merge

**PDF image spec:**
- Docling image_export_mode=embedded + to_formats=json
- Filter: skip <150×150 or <5KB (icons, decorative)
- Classify via PictureClassificationLabel (skip: icon, logo, bar_code, qr_code, stamp)
- Store images to R2: {userId}/{documentId}/images/p{page}_i{index}.png
- Image chunk: content = caption + page context, chunkType = "image", metadata: imageR2Key
- Embed: Jina v4 multimodal (image input alongside text)

## Research Files (14)

`nospace/docs/research/`:
- `contexter-gtm-market-landscape.md` (446 lines)
- `contexter-gtm-direct-competitors.md` (v1 RAG frame)
- `contexter-gtm-indirect-competitors.md` (v1)
- `contexter-gtm-v2-direct-competitors.md` (v2 Context Storage)
- `contexter-gtm-v2-indirect-competitors.md` (v2, 9 categories)
- `contexter-gtm-v2-second-brain.md` (10 PKM + Supermemory)
- `contexter-gtm-v2-nontechnical-pain.md` (17 quotes, workarounds)
- `contexter-gtm-competitor-ragie.md`
- `contexter-gtm-competitor-graphlit.md`
- `contexter-gtm-competitor-morphik.md`
- `contexter-gtm-competitor-vectorize.md`
- `contexter-gtm-competitor-langbase.md`
- `contexter-gtm-competitor-supermemory.md`
- `contexter-gtm-landing-page-structure.md`
- `contexter-gtm-synthesis-competitive-map.md`
- `contexter-gtm-synthesis-positioning.md`

## Blockers

- None

## AC

| ID | Criteria | Status |
|---|---|---|
| AC-1 | Direct competitors identified | ✅ 6 with deep dives |
| AC-2 | Indirect competitors identified | ✅ 15 across 9 categories |
| AC-3 | Competitors analyzed (3 dimensions) | ✅ 6 reports |
| AC-4 | Positioning variants | ✅ 5 EN + 5 RU |
| AC-5 | Landing page deployed | ✅ contexter.cc |
