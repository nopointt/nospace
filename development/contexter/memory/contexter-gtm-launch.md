---
# contexter-gtm-launch.md — CTX-10 GTM Launch
> Layer: L3 | Epic: CTX-10 | Status: 🔶 IN PROGRESS (~30% — research + payments + infra done; all launch execution pending)
> Created: 2026-04-01 (session 225)
> Last updated: 2026-04-12 (session 240 — full audit, CTX-12 complete, L3 reconciled)
> Original deadline: 2026-04-08 (missed — replanning needed)
> Predecessor: CTX-08 GTM Strategy (CLOSED — positioning + research + landing page)
---

## Goal

100 paying supporters × $10 via all free channels. $0 marketing budget. EN global market.

## Context

**CTX-08 (closed 2026-03-30)** delivered:
- Positioning: "One memory. Every AI." — white space verified (universal + non-tech = empty quadrant)
- 16 research files from CTX-08 era (market landscape, 6 competitor deep dives, v2 updates, pain research, competitive map, positioning synthesis, landing page structure)
- Copy audit: 50+ jargon issues found, replacements specified (NOT yet applied)
- Financial model: break-even ~100 paying users, ARPU $4.24 (Month 1)
- Product brief: 12-section landing page structure, CTA strategy, copy rules

**CTX-12 (completed 2026-04-12, session 240)** delivered:
- Full supporters backend: tokens, ranking, tasks, admin, referrals, rev share, notifications, soft demotion, token expiry, anti-abuse
- LemonSqueezy full integration: store, 3 products, webhook HMAC, custom domain pay.contexter.cc
- ToS Section 7 "Supporter Program and Loyalty Tokens"
- Chargeback/refund webhook handler
- 40 commits, 7 deploys, 3 migrations, 48 integration tests

**Current product state (2026-04-12):**
- 2 real users (seed), 0 supporters, 0 real revenue ($1.16 test)
- API: healthy (PG + S3 + Redis + Groq + all circuits OK)
- Auth: email+password + Google OAuth + Resend DNS verified
- Payments: LemonSqueezy LIVE (card, Supporter $10+ PWYW / Starter $9/mo / Pro $29/mo)
- Landing: 12+ sections (EN/RU), bilingual, pricing storage-only (1/10/100 GB)
- MCP: 12 tools, Streamable HTTP, ChatGPT /mcp endpoint deployed
- /supporters page: live, dynamic leaderboard, checkout integration
- 0 social accounts, 0 marketing channels, 0 public presence

## Key Decisions

- D-01: **$10 = support donation**, not subscription (D-26). Supporters get Pro manually after launch.
- D-02: **EN global market** primary. RU secondary (landing bilingual, launch content EN).
- D-04: **All free channels**: PH, HN, Reddit, Twitter/X, MCP directories, IndieHackers, Dev.to, AI communities.
- D-05: **Co-founder** — Artem (CPO ProxyMarket), GTM/marketing. Revenue share (% of LTV). Knowledge hub: cdn.contexter.cc/public/artem/
- D-06: **Copy audit MUST be applied** before any public launch — jargon kills non-tech conversion.
- D-07: **Analytics** — basic tracking (Plausible/Umami) needed before launch (NOT yet deployed).
- D-08: **Research** — two-phase SEED→DEEP. Save to `nospace/docs/research/`.
- D-32: **Research restructured** — 11 R-topics → 4 SEED domains + 2 targeted DEEPs.
- D-33: **LemonSqueezy = primary payment** — MoR, KZ+AR payouts, no entity. Crypto-only kills ~93%.
- D-34: **"Founding Supporter"** framing for $10 (20-30% lift). Counter "X/100 spots".
- D-35: **HN > PH** as primary launch channel (10-30K vs 800-1K visitors). Stagger: HN Day 1 → Reddit Day 2 → PH Day 3.
- D-36: **First 100 = 70-80 devs** + 20-30 knowledge workers.
- D-37: **MCP directories + GitHub awesome-mcp** PRs = zero-cost, submit before launch.
- D-38: **MCP connection** — Claude.ai fixed (api.contexter.cc). Perplexity still on workers.dev (NOT fixed).
- D-42: **LemonSqueezy APPROVED** (2026-04-07). Card payments enabled.
- D-44: **ChatGPT MCP compat** — /mcp route + CORS + tool annotations deployed.
- D-45: **OpenAI App Directory** — draft submitted, domain verified. Needs $5 individual verification.
- D-46: **Alpha mode** — 308 text-only formats. Binary deferred.
- D-50: **Pricing** = storage-only: Free 1GB / Starter $9 10GB / Pro $29 100GB.
- D-59: **AI'preneurs 2026** — passed stage 1, diagnostic interview ~April 20.

## Research Foundation (verified on disk 2026-04-12)

### CTX-08 Era (16 files, ~490K)

| File | Size | Content |
|---|---|---|
| `contexter-gtm-market-landscape.md` | 26K | TAM $2.76-3.33B, MCP standard, 12-18mo window |
| `contexter-gtm-direct-competitors.md` | 17K | Direct competitors overview |
| `contexter-gtm-indirect-competitors.md` | 28K | Indirect competitors |
| `contexter-gtm-v2-direct-competitors.md` | 21K | Updated direct (v2) |
| `contexter-gtm-v2-indirect-competitors.md` | 33K | Updated indirect (v2) |
| `contexter-gtm-v2-second-brain.md` | 32K | Second brain category analysis |
| `contexter-gtm-v2-nontechnical-pain.md` | 28K | 17 user quotes, grief language, workaround patterns |
| `contexter-gtm-synthesis-competitive-map.md` | 26K | White space: universal + non-tech = empty quadrant |
| `contexter-gtm-synthesis-positioning.md` | 39K | "One memory. Every AI." + 5 EN + 5 RU copy variants |
| `contexter-gtm-landing-page-structure.md` | 39K | 12-section landing spec, CTA strategy |
| `contexter-gtm-competitor-supermemory.md` | 32K | Deep dive |
| `contexter-gtm-competitor-ragie.md` | 34K | Deep dive |
| `contexter-gtm-competitor-morphik.md` | 35K | Deep dive |
| `contexter-gtm-competitor-graphlit.md` | 29K | Deep dive |
| `contexter-gtm-competitor-langbase.md` | 33K | Deep dive |
| `contexter-gtm-competitor-vectorize.md` | 34K | Deep dive |

### CTX-10 SEED Research (4 files, ~107K)

| File | Size | Content |
|---|---|---|
| `contexter-gtm-seed-1-distribution.md` | 27K | Channels for first 100, audience mapping |
| `contexter-gtm-seed-2-launch-mechanics.md` | 27K | Solo founder coordinated launch, timing, assets |
| `contexter-gtm-seed-3-payment-conversion.md` | 18K | $10 ask framing, LS vs crypto, friction |
| `contexter-gtm-seed-4-viral-patterns.md` | 34K | 15 case studies, 10 common patterns |

### Additional GTM-Relevant Research (6 files, ~153K)

| File | Size | Content |
|---|---|---|
| `contexter-copy-audit.md` | 21K | 50+ jargon replacements — **INPUT FOR W1-01** |
| `contexter-financial-model.md` | 17K | Break-even ~100 users, ARPU model |
| `contexter-competitor-sentiment-analysis.md` | 26K | User sentiment on competitors |
| `reddit-marketing-guide-smetnyov.md` | 18K | Smetnyov/Skyeng method, 13 chapters |
| `contexter-supporters-deep-research.md` | 38K | 40+ sources, loyalty programs, airdrops |
| `contexter-lemonsqueezy-deep-research.md` | 31K | LS docs, API, webhooks, integration patterns |

### Other Documents

| File | Location | Content |
|---|---|---|
| `contexter-product-brief.md` | `memory/` | 12-section landing structure, video script, objection busters |
| `cofounder-briefing-artem.md` | `docs/` | 11-section co-founder briefing |
| Knowledge hub (29 files) | `cdn.contexter.cc/public/artem/` | HTML copies of all research for Artem |

**Total research corpus: 26 files, ~750K, covering market, competitors, positioning, distribution, payment, conversion, supporters, Reddit, legal.**

## Waves

### Wave 0: Research ✅ PARTIAL (SEED done, DEEP not done)

**SEED (completed 2026-04-01):**
- [x] S1: Distribution — channels for first 100 (27K)
- [x] S2: Launch Mechanics — solo launch sequencing (27K)
- [x] S3: Payment & Conversion — $10 framing, LS (18K)
- [x] S4: Viral Patterns — 15 case studies (34K)

**DEEP (NOT DONE):**
- [ ] D-DEEP-1: Reddit post anatomy — r/ChatGPT, r/ClaudeAI successful product posts, format, rules, what gets deleted
- [ ] D-DEEP-2: HN Show HN optimization — top 20 MCP/RAG Show HN posts, title patterns, timing, comment strategy
- [ ] Reddit warmup: u/Cute_Baseball2875 (7mo, karma=1, 0 posts). Needs 50-100 karma via helpful comments before ANY launch post

### Wave 1: Product Readiness ❌ NOT DONE

- [ ] W1-01: **Apply copy audit** — replace ALL 50+ jargon items (from `contexter-copy-audit.md`). CRITICAL — blocks all public-facing work.
- [ ] W1-02: Playwright full site audit — screenshot every page, identify visual bugs
- [ ] W1-03: Full user flow test — register → upload → MCP connect → query in Claude/Perplexity
- [ ] W1-04: Fix any issues found in W1-02 and W1-03
- [ ] W1-05: Deploy basic analytics (Plausible Cloud free or Umami self-hosted)
- [x] ~~W1-06: Add "Support Us — $10" page/section~~ → ✅ DONE via CTX-12 (full /supporters page + LemonSqueezy checkout + backend)
- [ ] W1-07: **Add OG/social meta tags** (og:image, og:title, og:description, twitter:card) — currently MISSING on contexter.cc
- [x] ~~W1-08: Verify pricing page~~ → ✅ Pricing resolved (D-50: storage-only 1/10/100 GB)
- [ ] W1-09: Ensure landing page hero variant is the strongest

### Wave 2: Channel Setup ❌ NOT DONE (except co-founder)

- [ ] W2-01: Twitter/X account — profile, bio, header, pin tweet draft
- [ ] W2-02: ProductHunt maker page — logo, tagline, screenshots (4-6), first comment draft
- [ ] W2-03: Reddit — warm up account (50-100 karma), draft "I built X" posts for 4-5 subreddits
- [ ] W2-04: HackerNews — draft "Show HN" post title + comment
- [ ] W2-05: MCP directories — submit to all (PulseMCP, mcp.so, glama.ai, smithery, MCPHub, etc.)
- [ ] W2-05b: Register on ALL platforms from R11 checklist (BetaList, AlternativeTo, SaaSHub, There's An AI For That, etc.)
- [ ] W2-06: IndieHackers profile + launch story draft
- [ ] W2-07: Dev.to — article "I built an AI memory that works with every LLM"
- [ ] W2-08: GitHub README optimization — badges, demo GIF, clear value prop
- [x] W2-09: Co-founder found — Artem (CPO ProxyMarket)
- [x] W2-10: Artem briefing + knowledge hub deployed

### Wave 3: Launch Execution ❌ NOT DONE

- [ ] W3-01: HackerNews "Show HN" (D-35: HN first, not PH)
- [ ] W3-02: Reddit posts (stagger across subreddits, 2-3 hour gaps)
- [ ] W3-03: ProductHunt launch
- [ ] W3-04: Twitter/X launch thread
- [ ] W3-05: IndieHackers + Dev.to publish
- [ ] W3-06: Cross-post to AI Discord/Telegram communities
- [ ] W3-07: Engage with every comment, reply within 30 min

### Wave 4: Post-Launch ❌ NOT DONE

- [ ] W4-01: Analyze traffic + conversion data
- [ ] W4-02: Collect testimonials
- [ ] W4-03: Follow-up content based on feedback
- [ ] W4-04: Comparison articles: "Contexter vs NotebookLM", "Contexter vs Claude Projects"
- [ ] W4-05: Second wave of community posts (different angle)
- [ ] W4-06: Daily progress thread on Twitter/X

## Blockers (verified 2026-04-12)

**Active:**
- **Copy audit not applied** (W1-01) — 50+ jargon items on landing kill non-tech conversion. BLOCKS all launch.
- **No OG/social meta tags** (W1-07) — shares without preview = 0 clicks. BLOCKS all social channel launch.
- **No analytics** (W1-05) — launching blind without tracking. Should deploy before launch.
- **0 social accounts** — no Twitter/X, no PH maker page, no IndieHackers profile. BLOCKS W2+W3.
- **Reddit account karma=1** — u/Cute_Baseball2875, 7 months old, 0 posts/comments. Instant shadowban if posting launch content. Needs 50-100 karma warmup.
- **Perplexity MCP URL** — still on old workers.dev, needs fix to api.contexter.cc/sse
- **OpenAI App Directory** — needs $5 individual verification to submit
- **Solo founder bandwidth** — all execution on nopoint

**Resolved:**
- ~~LemonSqueezy approval~~ → ✅ APPROVED 2026-04-07
- ~~LemonSqueezy billing integration~~ → ✅ FULL (CTX-12): store, products, webhooks, custom domain, chargeback handler
- ~~No supporters page~~ → ✅ /supporters live with dynamic leaderboard + checkout
- ~~ChatGPT MCP incompatible~~ → ✅ /mcp endpoint + CORS + tool annotations
- ~~No co-founder materials~~ → ✅ Briefing + knowledge hub live
- ~~Pricing needs review~~ → ✅ D-50 storage-only (1/10/100 GB)
- ~~Nav overlap on landing~~ → ✅ flex fix deployed
- ~~MCP connection broken (Claude.ai)~~ → ✅ Fixed to api.contexter.cc
- ~~ToS missing loyalty tokens clause~~ → ✅ Section 7 deployed (CTX-12)

## DEEP Research Plan (deferred from W0)

### D-DEEP-1: Reddit Post Anatomy
- **Scope:** Analyze 20+ successful "I built X" / product posts in r/ChatGPT, r/ClaudeAI, r/artificial, r/SideProject. What format works (text vs link vs image). Self-promotion rules per subreddit. What gets deleted. Account age/karma requirements.
- **Input:** `reddit-marketing-guide-smetnyov.md` (already have), `contexter-gtm-seed-1-distribution.md`
- **Output:** `contexter-gtm-deep-reddit-anatomy.md`

### D-DEEP-2: HN Show HN Optimization
- **Scope:** Top 20 MCP/RAG/AI-tool Show HN posts 2024-2026. Title patterns, timing (day/hour), first comment strategy, how to handle "why not just use X" objections.
- **Input:** `contexter-gtm-seed-2-launch-mechanics.md`
- **Output:** `contexter-gtm-deep-hn-showhn.md`

## AC

| ID | Criteria | Status |
|---|---|---|
| AC-1 | Research files complete | ✅ 26 files (DEEP pending) |
| AC-2 | Copy audit applied (0 jargon in frontend) | ❌ NOT DONE |
| AC-3 | All MCP directories submitted | ❌ NOT DONE |
| AC-4 | ProductHunt page live | ❌ NOT DONE |
| AC-5 | Twitter/X account with >10 tweets | ❌ NOT DONE |
| AC-6 | HN "Show HN" posted | ❌ NOT DONE |
| AC-7 | Reddit posts in ≥3 subreddits | ❌ NOT DONE |
| AC-8 | Analytics deployed | ❌ NOT DONE |
| AC-9 | ≥100 registered users | ❌ (current: 2) |
| AC-10 | ≥100 supporters ($10 each) | ❌ (current: 0) |

## Dependencies

- **CTX-04 (Auth):** ✅ Deployed
- **CTX-08 (GTM Strategy):** ✅ All research available (16 files)
- **CTX-09 (UI/UX Polish):** ✅ Complete
- **CTX-12 (Supporters Backend):** ✅ Complete (2026-04-12) — full supporters system deployed
- **CTX-11 (Analytics):** ❌ Not started — basic tracking needed for W1-05
