# session-scratch.md
> Axis · contexter · 2026-03-28

<!-- ENTRY:2026-03-28:CHECKPOINT:196:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — checkpoint 196 [Axis]

**Decisions:**
- NOWPayments for crypto billing (not LS — card payments blocked without KYC/KYB/bank)
- Invoice-based subscriptions (not Subscription API — that requires JWT/password)
- Flat tiers: Free 1GB $0, Starter 10GB $9, Pro 50GB $29, Business 200GB $79
- Pricing validated against 6 competitors (Supermemory, Ragie, Morphik, Vectorize, Graphlit, Langbase)
- Google OAuth for social login (Telegram deferred — widget domain issue)
- Email routing: nopoint@contexter.cc → nopointttt@gmail.com (CF Email Routing)
- App page restructured: Header → Drop zone → Documents → Connection → Footer

**Files changed:**
- `drizzle-pg/0002_billing.sql` — NEW: subscriptions + payments tables
- `drizzle-pg/0003_auth_providers.sql` — NEW: telegram_id, google_id, avatar_url on users
- `src/services/billing.ts` — NEW: tier defs, NOWPayments invoice API, IPN verify, DB ops
- `src/routes/billing.ts` — NEW: GET /api/billing, POST /api/billing/subscribe, GET /api/billing/payments
- `src/routes/webhooks.ts` — NEW: POST /webhooks/nowpayments (IPN handler)
- `src/routes/auth-social.ts` — NEW: POST /api/auth/telegram, GET /api/auth/google + callback
- `src/index.ts` — added billing, webhooks, authSocial routes
- `src/routes/upload.ts` — added storage limit check per tier
- `web/src/components/AuthModal.tsx` — rewritten: Google + email login (Telegram removed)
- `web/src/pages/Hero.tsx` — rewritten: new 5-section structure
- `web/src/index.tsx` — added ?token= URL handler for OAuth redirects

**Completed:**
- NOWPayments account setup (API key, IPN secret, custody, TON wallet)
- CF Email Routing for nopoint@contexter.cc
- Billing backend: schema + service + routes + webhook + deploy
- Google OAuth: full flow working (redirect → consent → callback → token → app)
- Storage limit enforcement in upload route
- App page restructure (5 sections)
- All deployed to production (Hetzner + CF Pages)

**In progress:**
- Implementation of 32 features based on deep research

<!-- ENTRY:2026-03-28:CHECKPOINT:197:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — checkpoint 197 [Axis]

**Decisions:**
- Created 6-layer deep research framework (SOTA + frontier + cross-discipline + math + synthesis)
- All 19 deep research studies completed (covering 32 features)
- Remizov ODE method: honest result — no breakthrough for RAG, only marginal connections
- Critical bug found: RRF score threshold 0.3 filters ALL results (max RRF score ~0.033)
- Switch from RRF to Convex Combination recommended (Pinecone/Weaviate standard)

**Files created (19 deep research):**
- `docs/research/deep-research-framework.md` — 6-layer research template
- `docs/research/reranking-deep-research.md` — Jina Reranker v3, +10-20% NDCG
- `docs/research/contextual-chunking-deep-research.md` — Anthropic method + late chunking (Jina)
- `docs/research/streaming-llm-deep-research.md` — SSE streaming, Llama 3.3 70B, DeepInfra fallback
- `docs/research/fts-stemming-deep-research.md` — russian+english stemming, websearch_to_tsquery
- `docs/research/hyde-deep-research.md` — 4th parallel retrieval signal, gated by classifier
- `docs/research/bpe-tokenization-deep-research.md` — gpt-tokenizer cl100k_base, 43-69% error fix
- `docs/research/parent-child-chunks-deep-research.md` — 200-tok children, 1024-tok parents
- `docs/research/answer-grounding-deep-research.md` — inline [1][2] citations, zero-cost prompt rewrite
- `docs/research/mrl-dimensions-deep-research.md` — 1024→512 dims, -50% storage, -0.3% quality
- `docs/research/query-decomposition-deep-research.md` — heuristic classifier + sub-questions
- `docs/research/confidence-scoring-deep-research.md` — 3-tier scoring, traffic light display
- `docs/research/context-diversity-deep-research.md` — MMR λ=0.7, doc-level caps
- `docs/research/embedding-cache-deep-research.md` — SHA256 content hash, Redis, 30-day TTL
- `docs/research/learned-rrf-deep-research.md` — switch to Convex Combination, fix threshold bug
- `docs/research/ocr-deep-research.md` — enable Tesseract in Docling, eng+rus
- `docs/research/feedback-loop-deep-research.md` — thumbs up/down, Beta-Binomial scoring
- `docs/research/circuit-breaker-deep-research.md` — cockatiel library, 97.8→99.8% availability
- `docs/research/ragas-evaluation-deep-research.md` — proxy metrics + LLM-as-judge, ~$1.50/mo
- `docs/research/remizov-rag-deep-research.md` — no breakthrough, honest assessment
- `docs/research/contexter-competitor-sentiment-analysis.md` — user sentiment across 9 competitors

**Also created earlier this session:**
- `docs/research/rag-sota-2026-research.md` — full SOTA RAG landscape

**Completed:**
- 19/19 deep research studies
- NOWPayments billing (deployed)
- Google OAuth (deployed)
- CF Email Routing
- App page restructure

**Next:**
- Write implementation plan based on all 19 research files
- Prioritize and sequence 32 features into phases
- Begin implementation (Phase 1: critical bug fix + quick wins)

**Opened:**
- Telegram Login Widget domain issue (deferred)
- LemonSqueezy application pending (Harkly store, needs redirect to Contexter)
- Card payments blocked until LS approved or alternative found
- NOWPayments fiat on-ramp requires KYB (company registration)

**Notes:**
- NOWPayments keys stored: ~/.tLOS/nowpayments-api-key, nowpayments-public-key, nowpayments-ipn-secret
- Google OAuth keys: ~/.tLOS/google-client-id, google-client-secret
- Telegram bot: @contexterrbot, token in ~/.tLOS/telegram-bot-token
- Test invoice created: https://nowpayments.io/payment/?iid=6247103383
- Production .env updated with NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET, TELEGRAM_BOT_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

<!-- ENTRY:2026-03-28:CLOSE:198:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 198 CLOSE [Axis]

**Decisions:**
- NOWPayments for crypto billing (LS blocked without KYB)
- Invoice-based subscriptions, flat tiers ($9/$29/$79)
- Google OAuth (Telegram deferred)
- 6-layer deep research framework created
- 19 deep research studies completed for 32 planned features
- Remizov ODE: no RAG breakthrough (honest assessment)
- Critical RRF threshold bug found (0.3 vs max ~0.033)
- NEVER launch agents without explicit nopoint confirmation

**Files changed (code — deployed to production):**
- `drizzle-pg/0002_billing.sql` — subscriptions + payments tables
- `drizzle-pg/0003_auth_providers.sql` — telegram_id, google_id, avatar_url
- `src/services/billing.ts` — tier defs, NOWPayments API, IPN verify
- `src/routes/billing.ts` — billing API (GET status, POST subscribe, GET payments)
- `src/routes/webhooks.ts` — NOWPayments IPN handler
- `src/routes/auth-social.ts` — Google OAuth + Telegram redirect
- `src/index.ts` — new routes wired
- `src/routes/upload.ts` — storage limit enforcement
- `web/src/components/AuthModal.tsx` — Google + email login
- `web/src/pages/Hero.tsx` — 5-section app page
- `web/src/index.tsx` — ?token= URL handler

**Files changed (research — 21 files):**
- `docs/research/deep-research-framework.md`
- `docs/research/rag-sota-2026-research.md`
- `docs/research/contexter-competitor-sentiment-analysis.md`
- 18x `docs/research/*-deep-research.md` (all 19 feature studies)

**Completed:**
- Billing: NOWPayments setup + backend + webhook + deploy
- Auth: Google OAuth full flow in production
- Email: nopoint@contexter.cc (CF Email Routing)
- UI: App page restructure (5 sections)
- Research: 19/19 deep research studies, SOTA audit, competitor sentiment

**Opened:**
- Write implementation plan (prioritize 32 features into phases)
- Fix critical RRF threshold bug (immediate)
- Implement Phase 1 quick wins (FTS stemming, BPE tokenizer, reranking, streaming)
- Telegram Login (deferred — widget domain issue)
- Card payments (blocked — no KYB)
- LemonSqueezy application pending

**Notes:**
- Keys: ~/.tLOS/nowpayments-*, google-*, telegram-bot-token
- All research in docs/research/*-deep-research.md (19 files, ~8000 lines total)
- Memory saved: feedback_always_wait_confirmation.md
