# STATE — Contexter

## Position
- **Phase:** GTM Launch (CTX-10) — 100 paying supporters by April 8
- **Status:** Product ready. Co-founder briefing + knowledge hub created. Nav fix deployed. Reddit guide extracted. LemonSqueezy pending.
- **Last session:** 2026-04-05 (Axis, session 231 — nav fix, co-founder briefing, knowledge hub cdn.contexter.cc/public/artem/, Reddit guide)
- **Sessions total:** 231

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

## Active Decisions
- D-01 through D-25: unchanged from previous
- D-26: $10 = support donation (not subscription). Supporters get Pro manually after launch.
- D-27: EN global market primary. Launch content EN.
- D-28: All free channels: PH, HN, Reddit, Twitter/X, MCP dirs, IndieHackers, Dev.to
- D-29: Co-founder search: revenue share (% of LTV from attracted users)
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

## Blockers
- Copy audit not applied — jargon kills non-tech conversion (CTX-10 W1-01)
- No social accounts / marketing channels
- LemonSqueezy approval pending (email sent with demo video, pricing, overview)
- Perplexity MCP URL still on old workers.dev (needs same fix as Claude.ai)
- Reddit account u/Cute_Baseball2875: 7 months old, karma=1, 0 posts/comments. Needs warmup (50-100 karma in r/ChatGPT, r/ClaudeAI, r/artificial) before launch posts.
- Solo founder bandwidth

## Deferred
- YouTube + Instagram download (roadmap: after launch)
- NOWPayments fiat on-ramp (no KYB)
- NLI hallucination detection container
- Card payments (no legal entity)
- Full analytics suite (CTX-11)

## Metrics
- Sessions: 231
- Real users: 2 (nopointttt@gmail.com, danchoachona@gmail.com)
- Documents: 26, Chunks: 519
- MCP search p50: 110ms
- GitHub: github.com/nopointt/contexter
- Deployed: contexter.cc + api.contexter.cc
- Server: Hetzner CAX21 (Helsinki)
