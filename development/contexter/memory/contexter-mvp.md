---
# contexter-mvp.md — CTX-01 MVP Pipeline
> Layer: L3 | Epic: CTX-01 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-25 (session 191 — Antigravity, pricing, 12 MCP tools, account dedup)
---

## Goal

Full pipeline: any file → parse → chunk → embed → index → MCP endpoint + RAG query. Deployed on CF Workers + CF Pages. Connected to ChatGPT/Claude/Perplexity/Cursor. Frontend SPA for demo.

## Status: ~96% complete (MLP stage)

Backend fully async + OAuth 2.1. Frontend deployed with interactive blob cluster, connection modal, document viewer. 26/26 E2E tests pass. 4 full audits applied. Remaining: document viewer content fix, pipeline progress UI, responsive.

## Completed Session 190 (2026-03-25)

- [x] 4 full audits: Gropius visual, Copy dejargon, UX flow, Schlemmer API — ALL applied
- [x] Silicon Sampling: 20 personas × 5 tasks = 100 simulated interactions
- [x] SVG blob cluster: goo filter, proximity gradient, floating, parallax, wobble, real logos
- [x] Pre-qualification ConnectionModal ("какую нейросеть используете?")
- [x] DocumentModal popup (click doc → see content inline)
- [x] "выбрать файлы" button in drop zone
- [x] Pipeline stages translated to Russian
- [x] Trust footer (Cloudflare Europe, no AI training, delete anytime)
- [x] Elevated post-upload query section
- [x] Registration security: rate limit 5/hour + email dedup + input validation
- [x] Pipeline error handling: stage timeouts (25s parse, 5s chunk, 25s embed, 20s index)
- [x] Pipeline health endpoint: GET /api/pipeline/health
- [x] Vectorize post-query userId filtering (critical bug: CF ignores non-indexed metadata)
- [x] OAuth 2.1 server: /authorize + /token + PKCE + consent page (for Perplexity)
- [x] Dynamic Client Registration: POST /register (RFC 7591)
- [x] Favicon: blue [] SVG
- [x] 401 auto-logout on frontend
- [x] E2E 26/26 pass (Moholy rerun + 4 bug fixes)
- [x] Copy: full dejargon (MCP→подключение, чанки→фрагменты, 28+ text edits)
- [x] Nav: onLogin prop, correct routes, settings link
- [x] Document content endpoint: GET /api/documents/:id/content

## Remaining Tasks

- [ ] Document viewer: content shows empty for some docs (backend data issue)
- [ ] Pipeline progress UI: 4-stage progress bar (dots + lines, not text labels)
- [ ] Perplexity OAuth e2e verification (consent page works, full flow untested)
- [ ] Responsive: mobile/tablet (deferred to after Artem usability test)
- [ ] Google + Telegram OAuth (deferred)
- [ ] RAG quality tuning (query rewriter, domain terms)
- [ ] ConnectionModal popup: доработка UX (nopoint попросил вернуться позже)
- [ ] CF Pages custom domain

## Blockers

- CF Vectorize metadata filtering not available → using post-query filter
- Video keyframe extraction impossible in CF Workers
- Perplexity requires full OAuth 2.1 (implemented but untested e2e)

## Production Stack Decision (2026-03-25)

**Target:** 10K users, 1K DAU, ~$117/мес
**Выбран:** Вариант A — Hetzner CAX41 + API inference
- Compute: Hetzner CAX41 (16 ARM vCPU, 32 GB) — $33/мес
- Vector DB: Qdrant self-hosted (SQ) — решает Vectorize metadata bug
- DB: PostgreSQL (вместо D1)
- File storage: R2 или Hetzner Object Storage
- Embeddings: **Jina v4** (primary), **Voyage multimodal-3** (fallback)
- LLM: DeepInfra Llama 3.1 8B Turbo — $46/мес
- Whisper: Groq Turbo — $30/мес
- Parsing: self-hosted marker/docling
- Frontend: CF Pages (бесплатно)

## Pricing Model (2026-03-25)

**Model:** Usage-based storage, credit system. n = $0.000422. Billing: LemonSqueeezy.
**Guarantee:** >= 15% margin at any volume (monthly), >= 29% margin (annual).

| Tier | Monthly $/GB | Annual $/GB | Discount |
|---|---|---|---|
| 0-1 GB | FREE | FREE | — |
| 1-10 GB | $1.30 (3n) | $1.17 (2.7n) | 10% |
| 10-50 GB | $0.86 (2n) | $0.73 (1.7n) | 15% |
| 50-100 GB | $0.65 (1.5n) | $0.52 (1.2n) | 20% |
| 100 GB-1 TB | $0.32 (0.75n) | $0.24 (0.56n) | 25% |
| 1 TB+ | $0.17 (0.40n) | $0.11 (0.26n) | 35% |

**User segments (10K users projection):**

| Segment | Users | % | Avg GB | Bill/mo | Annual % |
|---|---|---|---|---|---|
| Free | 6,000 | 60% | 0.5 | $0 | 0% |
| Small | 1,500 | 15% | 3.5 | $3.24 | 10% |
| Starter | 1,000 | 10% | 7.5 | $8.43 | 20% |
| Medium | 1,000 | 10% | 25 | $24.63 | 30% |
| Large | 400 | 4% | 100 | $78.65 | 50% |
| Enterprise | 100 | 1% | 500 | $208.29 | 80% |

**Free tier policy:**
- 100 free slots max (cap)
- 12h inactivity -> slot released, account -> zero tier
- Zero tier: data stored 7 days (read-only), then deleted
- Return within 7 days: takes new slot (if available), data restored
- Cost: 100 × $0.43 = $43/month (vs $2,567 uncapped)

**Revenue:** MRR $82,662 | ARR $991,939 | Gross margin 77.6%

**Research files:**
- `docs/research/pricing-model.py` — unit economics calculation
- `docs/research/pricing-floor.py` — margin floor analysis
- `docs/research/pricing-final.py` — corrected cost model + annual/monthly
- `docs/research/pricing-annual-tiers.py` — tier discounts
- `docs/research/contexter-financial-model.md` — full P&L
- `docs/research/rag-saas-pricing-competitive-analysis.md` — competitor research
- `docs/research/rag-hosting-pricing-comparison-research.md` — infra comparison
- `docs/research/contexter-inference-pricing-research.md` — LLM/embed pricing
- `docs/research/vector-db-pricing-comparison-research.md` — vector DB comparison

## Acceptance Criteria

| ID | Criteria | Status |
|---|---|---|
| AC-1 | Upload file via API → get documentId | ✅ |
| AC-2 | Pipeline: parse → chunk → embed → index (async) | ✅ |
| AC-3 | Query returns answer with sources | ✅ |
| AC-4 | MCP endpoint works with Claude.ai Connector | ✅ |
| AC-5 | User isolation (Vectorize + FTS5 filter) | ✅ |
| AC-6 | Share link (read-only access) | ✅ |
| AC-7 | 12 file formats supported | ✅ |
| AC-8 | 26/26 E2E tests pass | ✅ |
| AC-9 | RAG quality acceptable for demo | ⬜ |
| AC-10 | Frontend SPA deployed on CF Pages | ✅ |
| AC-11 | Pipeline stage tracking (real-time) | ✅ |
| AC-12 | Document viewer (click → see content) | 🔶 (popup works, content empty for some docs) |
| AC-13 | OAuth 2.1 for Perplexity | 🔶 (implemented, needs e2e test) |
| AC-14 | Interactive blob cluster (hero) | ✅ |
| AC-15 | Connection pre-qualification | ✅ |
