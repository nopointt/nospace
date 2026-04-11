# session-scratch.md
> Axis · 2026-04-11 · session 234
> Last processed checkpoint: #232

<!-- ENTRY:2026-04-11:CHECKPOINT:234:contexter:contexter-gtm-launch [AXIS] -->
## 2026-04-11 — checkpoint 234 [Axis]

**Decisions:**
- D-49: Alpha mode — 308 text-only formats, binary deferred. Source: `web/src/lib/formats.ts`
- D-50: Pricing tiers simplified — storage-only: Free 1GB / Starter $9 10GB / Pro $29 100GB. Unlimited docs & searches.
- D-51: Supporters program — 100 spots, token-based ranking ($1=1 tok), 1% rev share quarterly (Diamond/Gold/Silver/Bronze)
- D-52: Accelerating earn rates — Diamond 2x, Gold 1.5x, Silver 1.25x, Bronze 1x
- D-53: Soft demotion — 30-day warning → Bronze → 30 days → exit (not hard cliff)
- D-54: Task cap — max 50 tokens/month from tasks, human review
- D-55: Rev share activates at $10K/month revenue. Paid quarterly as tokens.
- D-56: Freeze — no rev share during freeze period
- D-57: Tokens = loyalty points, non-transferable, no monetary value (ToS). Withdrawal NOT announced until legal review.
- D-58: Token-paid subscriptions do NOT generate new tokens (anti-circular exploit)
- D-59: AI'preneurs 2026 Astana Hub — passed stage 1, diagnostic interview ~April 20

**Files changed:**
- `web/src/lib/formats.ts` — NEW: 308 text extensions registry (14 categories)
- `web/src/pages/Upload.tsx` — import from formats.ts, removed local SUPPORTED_EXTENSIONS
- `web/src/pages/Hero.tsx` — import from formats.ts, removed local SUPPORTED_EXTENSIONS
- `web/src/pages/Supporters.tsx` — NEW: full page (8 sections, ~750 lines)
- `web/src/pages/Landing.tsx` — replaced SupportSection with SupportersTeaser, nav link added
- `web/src/index.tsx` — added Supporters lazy import + route (was missing, root cause of deploy issue)
- `web/src/App.tsx` — also has route (but not used as entry point)
- `web/src/lib/translations/en.ts` — pricing updated, 120+ supporters keys, tooltip keys, format messaging
- `web/src/lib/translations/ru.ts` — same updates
- `web/public/_headers` — added /supporters cache header
- `ops/deploy-web.sh` — fixed curl -sf double-output bug (lines 86-98, 116)
- `nospace/docs/research/contexter-supporters-deep-research.md` — NEW: 6-layer DEEP research, 40+ sources

**Memory updated:**
- `project_aipreneurs.md` — NEW
- `project_contexter_text_formats.md` — NEW
- `project_contexter_supporters.md` — NEW (full spec v2)

**Completed:**
- Text format restriction (308 formats, frontend-only)
- Pricing tiers update (storage-only)
- Deploy script audit + bug fix
- Supporters DEEP research (airdrops, loyalty programs, IT cases)
- Supporters page creation + deployment
- UX audit (11 issues found, all fixed)
- Abuse vector analysis (8 vectors documented)
- 4 successful deploys to CF Pages

**In progress:**
- Contrast/accessibility audit (next task from nopoint)

**Opened:**
- Backend epic CTX-12: Supporters system (DB, tokens, LemonSqueezy, ranking cron, dashboard)
- ToS update: loyalty points legal clause
- Landing page preorder section in Hero.tsx still has old payment details (functional but messaging updated)
- Deploy script: entry point mismatch (index.tsx vs App.tsx) — both have routes, only index.tsx used

**Notes:**
- Deploy script worked correctly — the bug was in routing (App.tsx unused). index.tsx is the real entry point.
- CF cache propagation: new chunks sometimes need targeted purge, not just purge_everything
- Supporters page i18n: 120+ keys, largest page in the app (87KB i18n bundle total)
- nopoint posted in AI'preneurs 2026 Telegram, mentioned Contexter

<!-- ENTRY:2026-04-11:CHECKPOINT:235:contexter:contexter-gtm-launch [AXIS] -->
## 2026-04-11 — checkpoint 235 [Axis]

**Decisions:**
- D-60: LemonSqueezy store = contexter.lemonsqueezy.com (renamed from harkly, subdomain changed). Identity verified, Active.
- D-61: Store currency = USD. Contact email = nopoint@contexter.cc (was danchoachona).
- D-62: 3 LS products created: Supporter Entry (PWYW min $10, variant 1516645), Starter ($9/mo, variant 1516676), Pro ($29/mo, variant 1516706).
- D-63: LS API key + webhook secret saved to ~/.tLOS/
- D-64: Product media v2 — large text, no prices, clean Bauhaus. Supporter=light, Starter=light, Pro=dark.
- D-65: Contrast audit — text-tertiary darkened globally #808080→#767676 (4.54:1 WCAG AA pass). 33 violations fixed across 5 files.
- D-66: text-disabled NEVER for informational text (only disabled UI). Off-scale sizes (11/13/15px) eliminated.

**Files changed:**
- `web/src/index.css` — text-tertiary #808080→#767676
- `web/src/pages/Landing.tsx` — footer contrast fix, supporters teaser, off-scale sizes
- `web/src/pages/Supporters.tsx` — contrast fixes, tooltip shadow removed, off-scale sizes/line-heights
- `web/src/pages/Privacy.tsx` — footer contrast fix
- `web/src/pages/Terms.tsx` — footer contrast fix
- `nospace/design/contexter/gtm_contexter.pen` — NEW: 6 product media frames (v1+v2)
- `~/.tLOS/lemonsqueezy-api-key` — NEW
- `~/.tLOS/lemonsqueezy-webhook-secret` — NEW
- `nospace/docs/research/contexter-lemonsqueezy-deep-research.md` — NEW: 6-layer LS integration research

**Memory updated:**
- feedback_contrast_standards.md — NEW

**Completed:**
- Bayer contrast audit (33 findings, all fixed)
- text-tertiary global token fix (#767676)
- LemonSqueezy store setup (rename, currency, email)
- 3 products created + published
- Product media v1 + v2 designed, exported as PNG
- LemonSqueezy DEEP research (docs, API, webhooks, SolidJS integration)
- LS credentials saved

**In progress:**
- Frontend Lemon.js integration (checkout overlay)
- Backend webhook handler
- E2E payment test

**Opened:**
- CTX-12 backend: webhook handler at api.contexter.cc/api/webhooks/lemonsqueezy
- Custom domain pay.contexter.cc (CNAME → stores.lemonsqueezy.com)
- Delete unverified LS store #333207 (email sent to hello@lemonsqueezy.com)

**Notes:**
- Session very long (~300K+ context). Recommend new dialog after LS integration.
- LS fees: 7%+$0.50 worst case (international + subscription). $9 Starter → $7.87 net.
- Webhook signing: HMAC-SHA256, header x-signature, use c.req.text() not c.req.json() (Hono gotcha).

<!-- ENTRY:2026-04-11:CLOSE:236:contexter:contexter-gtm-launch [AXIS] -->
## 2026-04-11 — session 236 CLOSE [Axis]

**Decisions:**
- D-49: Alpha = 308 text-only formats, binary deferred. Source: web/src/lib/formats.ts
- D-50: Pricing = storage-only: Free 1GB / Starter $9 10GB / Pro $29 100GB. Unlimited docs & searches.
- D-51: Supporters program — 100 spots, token-based ranking, 1% rev share quarterly
- D-52: Accelerating earn rates — Diamond 2x, Gold 1.5x, Silver 1.25x, Bronze 1x
- D-53: Soft demotion — 30-day warning, not hard cliff
- D-54: Task cap — max 50 tokens/month from tasks
- D-55: Rev share activates at $10K/month revenue
- D-56: No rev share during freeze
- D-57: Tokens = loyalty points, non-transferable, no monetary value
- D-58: Token-paid subs don't generate tokens (anti-circular)
- D-59: AI'preneurs 2026 — passed stage 1, diagnostic ~April 20
- D-60: LemonSqueezy store = contexter.lemonsqueezy.com, verified, Active
- D-61: Store currency = USD, contact = nopoint@contexter.cc
- D-62: 3 LS products: Supporter (PWYW $10+), Starter ($9/mo), Pro ($29/mo)
- D-63: LS API key + webhook secret in ~/.tLOS/
- D-64: Product media v2 — large text, Bauhaus, no prices
- D-65: text-tertiary #808080→#767676 (WCAG AA 4.54:1)
- D-66: text-disabled NEVER for info text, off-scale sizes eliminated
- D-67: Custom domain pay.contexter.cc → A record 3.33.255.208
- D-68: Webhook route /webhooks → /api/webhooks (align with LS dashboard URL)

**Files changed:**
- web/src/lib/formats.ts — NEW: 308 text extensions registry
- web/src/pages/Upload.tsx — import from formats.ts
- web/src/pages/Hero.tsx — import formats, preorder→supporters CTA, LS checkout
- web/src/pages/Supporters.tsx — NEW: full page, 8 sections, tooltips, leaderboard data
- web/src/pages/Landing.tsx — pricing tiers, supporters teaser, LS checkout URLs, contrast fixes
- web/src/pages/Privacy.tsx — footer contrast fix
- web/src/pages/Terms.tsx — footer contrast fix
- web/src/lib/translations/en.ts — 120+ supporter keys, pricing, format messaging, tooltips
- web/src/lib/translations/ru.ts — same
- web/src/index.tsx — Supporters route added
- web/src/index.css — text-tertiary #767676
- web/index.html — Lemon.js script
- web/public/_headers — /supporters cache
- ops/deploy-web.sh — curl -sf bug fix
- src/routes/webhooks.ts — LemonSqueezy webhook handler
- src/index.ts — webhook route /webhooks → /api/webhooks
- src/services/billing.ts — NOWPayments callback URL updated
- nospace/design/contexter/gtm_contexter.pen — NEW: product media
- nospace/docs/research/contexter-supporters-deep-research.md — NEW
- nospace/docs/research/contexter-lemonsqueezy-deep-research.md — NEW

**Completed:**
- 308 text format restriction (frontend) + deploy
- Pricing tiers (storage-only 1/10/100 GB) + deploy
- Deploy script bug fix (curl double-output)
- Supporters DEEP research (40+ sources, airdrops, loyalty programs)
- Supporters page (8 sections, 111 translation keys) + deploy
- UX audit (11 issues fixed)
- Abuse vector analysis (8 vectors documented)
- Bayer contrast audit (33 findings, all fixed)
- text-tertiary global token fix (#767676)
- LemonSqueezy full setup (store, products, media, webhook, custom domain)
- Live payment test ($1.16 successful, webhook received)
- Product media v1+v2 designed in Pencil, exported as PNG
- LS research (docs, API, webhooks, SolidJS integration)
- Custom domain pay.contexter.cc configured + verified
- 10 successful deployments (frontend + backend)
- First real revenue: $1.16 from Supporter Entry

**Opened:**
- CTX-12: Backend supporters system (DB schema, tokens, ranking, user matching)
- ToS loyalty points clause (before public launch)
- Deploy script full audit (user requested)
- Delete unverified LS store #333207 (email sent to LS support)

**Notes:**
- Most productive session to date — from format restriction to live payments in one session
- Deploy script SCP works but docker doesn't always rebuild — manual SCP + rebuild needed once
- Entry point mismatch: index.tsx is real entry, App.tsx is dead code (both have routes)
- LS checkout uses UUID slugs, not numeric variant IDs (documentation misleading)
- LS test mode requires separate test products, can't use live products with test cards
- First revenue earned: $1.16 (supporter entry) — Contexter is monetizing
