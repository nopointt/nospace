# session-scratch.md
> Closed · Axis · 2026-03-25

<!-- ENTRY: 191 -->
## Session 191 (2026-03-25)

### Done
- [x] Antigravity IDE: 5th blob in KnowledgeGraph (logo, position, animation)
- [x] Antigravity: ConnectionModal instructions (serverUrl, 3 steps, MCP config)
- [x] Antigravity: Hero.tsx button + type union
- [x] Frontend build + deploy to CF Pages (contexter-web.pages.dev)
- [x] Capacity analysis: CF limits at 10K users (bottlenecks identified)
- [x] Production stack decision: Hetzner CAX41 + Qdrant + Postgres + DeepInfra + Groq
- [x] Pricing model: usage-based per-GB, credit system n=$0.000422
- [x] 6 tier structure (monthly + annual with tier-scaled discounts 10-35%)
- [x] Margin floor guarantee: >=15% at any volume including 100 TB
- [x] User segment distribution: 60% free, 15% small, 10% starter, 10% medium, 4% large, 1% enterprise
- [x] P&L financial model (12-month projection, break-even month 4)
- [x] Competitor pricing research (20 services analyzed)
- [x] 8 research files saved to docs/research/
- [x] Free tier policy: 100 slots, 12h inactivity -> zero tier, 7 days data retention
- [x] MCP tools: add_context + upload_document (deployed, LLM clients can write to KB)
- [x] Bug fix: waitUntil missing in MCP tool pipeline (docs stuck in pending forever)
- [x] Merged 7 duplicate accounts for danchoachona@gmail.com -> dfe9be94 (39 docs)
- [x] UNIQUE index on users.email (prevents future duplicates)
- [x] Retried "Большие кошки" doc — now ready (4 chunks)
- [x] MCP push notifications: investigated, not possible with stateless HTTP — no change needed

### Decisions
- Jina v4 = primary embeddings, Voyage multimodal-3 = fallback
- Billing via LemonSqueezy (prepaid + metered usage)
- Annual discounts scale with tier: 10% (small) to 35% (enterprise)
- Monthly 1TB+ at 0.40n, Annual 1TB+ at 0.25n (contract guarantees 24-mo retention)
- Smooth tiers: 1.5n (50-100GB) and 0.75n (100-1TB) instead of 1n/0.5n
- Free tier: 100 slots cap, 12h inactivity -> slot freed, 7d zero tier -> data deleted
- MCP live push: deferred to Hetzner migration (persistent SSE), no action now

### Revenue projection (10K users)
- MRR: $82,662 | ARR: $991,939 | Gross margin: 77.6%
- ARPU (paying): $22.54 | Conversion: 40%

<!-- ENTRY:2026-03-25:CLOSE:191:contexter:contexter-mvp [AXIS] -->
## 2026-03-25 — session 191 CLOSE [Axis]

**Decisions:**
- Production stack: Hetzner CAX41 + Qdrant + Postgres + DeepInfra + Groq ($117/mo for 10K users)
- Pricing: n=$0.000422, 6 tiers monthly + annual (10-35% discounts), >=15% margin at any volume
- Free tier: 100 slots, 12h inactivity releases slot, 7d zero tier, then data deleted
- Embeddings: Jina v4 primary, Voyage multimodal-3 fallback
- Billing: LemonSqueezy (prepaid + metered)
- MCP push: deferred to Hetzner migration

**Files changed:**
- `web/src/components/KnowledgeGraph.tsx` — Antigravity 5th blob (logo, position, animation)
- `web/src/components/ConnectionModal.tsx` — Antigravity card + instructions + iconForClient
- `web/src/pages/Hero.tsx` — Antigravity type union + button
- `src/routes/mcp-remote.ts` — 7 new MCP tools (12 total) + waitUntil fix + execCtx propagation
- `memory/contexter-mvp.md` — pricing, free tier, production stack, new remaining tasks
- `memory/contexter-roadmap.md` — prod roadmap with billing/migration phases
- `memory/contexter-about.md` — pricing model section, updated timestamp
- `docs/research/pricing-model.py` — unit economics
- `docs/research/pricing-floor.py` — margin floor analysis
- `docs/research/pricing-final.py` — corrected cost model + monthly/annual
- `docs/research/pricing-annual-tiers.py` — tier discounts
- `docs/research/contexter-financial-model.md` — P&L model
- `docs/research/rag-saas-pricing-competitive-analysis.md` — 20 competitors
- `docs/research/rag-hosting-pricing-comparison-research.md` — infra providers
- `docs/research/contexter-inference-pricing-research.md` — LLM/embed pricing
- `docs/research/vector-db-pricing-comparison-research.md` — vector DB comparison

**Completed:**
- Antigravity IDE: blob cluster + ConnectionModal + Hero + deployed
- Capacity analysis for 10K users (all CF bottlenecks mapped)
- Full pricing model with Python verification (4 scripts)
- P&L financial model (break-even month 4, ARR $992K)
- 12 MCP tools deployed (7 new: delete, content, ask, stats, share, summarize, rename)
- waitUntil bug fix (MCP upload pipeline was silently failing)
- Account dedup: merged 7 dups + UNIQUE index on email
- "Большие кошки" doc retried and processed

**Opened:**
- Document viewer content empty for some docs
- Pipeline progress UI (dots + lines)
- ConnectionModal UX improvements
- Hetzner migration (next phase)
- LemonSqueezy billing integration
- Perplexity OAuth e2e verification

**Notes:**
- Free user cost: $0.43/mo active, $0.08/mo inactive
- 100 free slots = $43/mo max (vs $2,567 uncapped)
- $18 enough to start Hetzner (CAX21 = $8.25/mo, 2 months runway)
