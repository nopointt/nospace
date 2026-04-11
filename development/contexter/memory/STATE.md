# STATE — Contexter

## Position
- **Phase:** GTM Launch (CTX-10) — 100 paying supporters by April 8
- **Status:** LemonSqueezy LIVE (store verified, 3 products, webhook, custom domain pay.contexter.cc). Alpha text-only (308 formats). Pricing: storage-only (1/10/100 GB). Supporters page live. First revenue: $1.16. Contrast audit complete (WCAG AA).
- **Last session:** 2026-04-11 (Axis, session 236 — text formats, pricing tiers, supporters program, LemonSqueezy full setup, contrast audit, product media, 10 deploys)
- **Sessions total:** 236

## Key Completions
- i18n: EN/RU toggle, 500+ translation keys, all 24 pages/components
- Pricing: Free ($0) / Starter ($9) / Pro ($29) based on verified unit economics
- Pre-order: dynamic NOWPayments invoices + bank transfer (Halyk SWIFT)
- DB cleanup: 871→2 users, 1260→26 docs, 3305→519 chunks (2026-04-01)
- Auth: email+password (better-auth) + Google OAuth + Resend DNS verified
- Pipeline: 23 formats, MCP 12 tools, Streamable HTTP
- Landing: 12+ sections (EN/RU), fully bilingual
- 14 GTM research files (market, competitors, positioning, copy, pain)
- Copy audit: 50+ jargon issues found (NOT YET APPLIED)
- Co-founder briefing: docs/cofounder-briefing-artem.md (11 sections, full product/market/GTM)
- Knowledge hub: cdn.contexter.cc/public/artem/ (29 files as HTML, index page)
- Reddit marketing guide: nospace/docs/research/reddit-marketing-guide-smetnyov.md (Smetnyov/Skyeng, 13 chapters)
- CDN custom domain: cdn.contexter.cc (R2 public access)
- Landing nav fix: absolute centering → flex justify-between (deployed)
- LemonSqueezy approved (2026-04-07): card payments enabled, MoR, no entity needed
- ChatGPT MCP compat: /mcp endpoint + CORS + 15 tool annotations deployed
- OpenAI App Directory: draft complete (app info, MCP server, testing, screenshots), domain verified. Pending: $5 individual verification.
- $300 invested in project total
- Alpha text-only: 308 formats (web/src/lib/formats.ts), binary deferred
- Pricing: storage-only Free 1GB / Starter $9 10GB / Pro $29 100GB, unlimited docs & searches
- Supporters page: /supporters live, 8 sections, 120+ i18n keys, leaderboard with 8 demo users
- Supporters program spec: 100 spots, tokens, 1% rev share, Diamond/Gold/Silver/Bronze
- LemonSqueezy LIVE: store verified, 3 products (Supporter/Starter/Pro), webhook handler deployed
- Custom domain: pay.contexter.cc (A record → 3.33.255.208, SSL active)
- First revenue: $1.16 supporter entry (2026-04-11), webhook confirmed
- Contrast audit: text-tertiary #808080→#767676 (WCAG AA), 33 violations fixed
- Product media: gtm_contexter.pen, 6 frames, exported PNG
- DEEP research: supporters (airdrops, loyalty programs, 40+ sources) + LemonSqueezy (docs, API, webhooks)
- Deploy script: curl -sf bug fixed, webhook route /webhooks→/api/webhooks
- AI'preneurs 2026: passed stage 1, diagnostic interview ~April 20

## Active Decisions
- D-01 through D-25: unchanged from previous
- D-26: $10 = support donation (not subscription). Supporters get Pro manually after launch.
- D-27: EN global market primary. Launch content EN.
- D-28: All free channels: PH, HN, Reddit, Twitter/X, MCP dirs, IndieHackers, Dev.to
- D-29: Co-founder FOUND: Artem (CPO ProxyMarket), GTM/marketing, revenue share (% of LTV from attracted users)
- D-30: Copy audit MUST be applied before public launch
- D-31: Analytics = separate epic (CTX-11), basic tracking in CTX-10
- D-32: Research plan restructured — 11 R-topics → 4 SEED domains + 2 targeted DEEPs
- D-33: 2 DEEP needed: Reddit post anatomy (r/ChatGPT, r/ClaudeAI) + HN Show HN optimization
- D-34: LemonSqueezy = primary payment (MoR, KZ+AR payouts, no entity). Crypto-only kills 93% conversion.
- D-35: "Founding Supporter" framing for $10 (20-30% lift). Counter "X/100 spots".
- D-36: HN > PH as primary launch channel. Stagger: HN Day 1 → Reddit Day 2 → PH Day 3.
- D-37: First 100 audience = 70-80 developers + 20-30 knowledge workers
- D-38: MCP directories (7+) + GitHub awesome-mcp PRs = submit before launch
- D-39: Artem (CPO ProxyMarket) = co-founder GTM/marketing. Revenue share model.
- D-40: cdn.contexter.cc = R2 custom domain for public assets (video, knowledge hub)
- D-41: Knowledge hub at cdn.contexter.cc/public/artem/ — shared materials for co-founder
- D-42: LemonSqueezy APPROVED (2026-04-07). Primary payment processor. Card payments enabled.
- D-43: $300 invested in project (infrastructure + services)
- D-44: ChatGPT MCP compat: /mcp route + CORS (chatgpt.com, chat.openai.com) + 15 tool annotations. Deployed.
- D-45: OpenAI App Directory: draft submitted, domain verified. Needs $5 individual verification to complete.
- D-46: Alpha mode — 308 text-only formats. No Docling/Whisper/ffmpeg. Frontend restriction only, backend untouched.
- D-47: ~~Pricing tiers need review~~ → RESOLVED: storage-only (1/10/100 GB), unlimited docs & searches.
- D-48: ~~Pro Launch Special~~ → REPLACED by Supporters program (D-51).
- D-49: 308 text formats registry in web/src/lib/formats.ts (14 categories)
- D-50: Pricing = storage-only: Free 1GB / Starter $9 10GB / Pro $29 100GB
- D-51: Supporters program — 100 spots, tokens ($1=1tok), 1% rev share quarterly, Diamond/Gold/Silver/Bronze
- D-52: Accelerating earn rates — Diamond 2x, Gold 1.5x, Silver 1.25x, Bronze 1x
- D-53: Soft demotion — 30-day warning → Bronze → 30 days → exit
- D-54: Task cap — max 50 tokens/month from tasks, human review
- D-55: Rev share activates at $10K/month revenue, paid quarterly as tokens
- D-56: No rev share during freeze period
- D-57: Tokens = loyalty points, non-transferable, no monetary value (ToS)
- D-58: Token-paid subscriptions do NOT generate new tokens (anti-circular)
- D-59: AI'preneurs 2026 Astana Hub — passed stage 1, diagnostic ~April 20
- D-60: LemonSqueezy store = contexter.lemonsqueezy.com, identity verified, Active
- D-61: Store currency USD, contact nopoint@contexter.cc
- D-62: 3 LS products: Supporter (PWYW $10+, var 1516645), Starter ($9/mo, var 1516676), Pro ($29/mo, var 1516706)
- D-63: LS API key + webhook secret saved to ~/.tLOS/
- D-64: Product media v2 — large text, Bauhaus, designed in Pencil
- D-65: text-tertiary #808080→#767676 globally (WCAG AA 4.54:1)
- D-66: text-disabled NEVER for informational text, off-scale sizes (11/13/15px) eliminated
- D-67: Custom domain pay.contexter.cc → A record 3.33.255.208
- D-68: Webhook route /webhooks → /api/webhooks

## Blockers
- Copy audit not applied — jargon kills non-tech conversion (CTX-10 W1-01)
- No social accounts / marketing channels
- ~~LemonSqueezy approval pending~~ → RESOLVED 2026-04-07
- Perplexity MCP URL still on old workers.dev (needs same fix as Claude.ai)
- Reddit account u/Cute_Baseball2875: 7 months old, karma=1, 0 posts/comments. Needs warmup (50-100 karma in r/ChatGPT, r/ClaudeAI, r/artificial) before launch posts.
- OpenAI App Directory: needs $5 for individual verification (draft saved)
- ~~LemonSqueezy billing integration not yet configured~~ → RESOLVED 2026-04-11 (store, products, webhook, custom domain, live payment tested)
- Solo founder bandwidth
- CTX-12: Backend supporters system (DB, tokens, ranking cron, user matching)
- ToS: loyalty points / tokens clause needed before public launch
- Deploy script audit (SCP works but docker doesn't always rebuild)
- Delete unverified LS store #333207 (email sent to hello@lemonsqueezy.com)

## Deferred
- YouTube + Instagram download (roadmap: after launch)
- NOWPayments fiat on-ramp (no KYB)
- NLI hallucination detection container
- Card payments (no legal entity)
- Full analytics suite (CTX-11)

## Metrics
- Sessions: 236
- Real users: 2 (nopointttt@gmail.com, danchoachona@gmail.com)
- Documents: 26, Chunks: 519
- MCP search p50: 110ms
- Revenue: $1.16 (1 supporter entry, 2026-04-11)
- GitHub: github.com/nopointt/contexter
- Deployed: contexter.cc + api.contexter.cc + pay.contexter.cc
- Server: Hetzner CAX21 (Helsinki)
- LemonSqueezy: contexter.lemonsqueezy.com (store #309186)
