---
# contexter-supporters-backend.md — CTX-12 Supporters Backend
> Layer: L3 | Epic: CTX-12 | Status: 🔶 IN PROGRESS (W1+W2+W3 deployed, W4 spec ready, W5 pending)
> Created: 2026-04-11 (session 236)
> Last updated: 2026-04-11 (session 238 — W1+W2+W3 autonomous execution complete, W4 spec written, 25 commits, 3 deploys)
> Predecessor: CTX-10 GTM Launch (supporters page + LemonSqueezy frontend done)
---

## Goal

Backend system for the Supporters program: token accounting, ranking engine, webhook processing, dashboard API. Make the frontend /supporters page dynamic instead of hardcoded.

## Context — What's Already Done (session 236)

### Frontend (COMPLETE)
- [x] /supporters page — 8 sections, 120+ i18n keys, tooltips, leaderboard with demo data
- [x] Lemon.js checkout overlay integrated (index.html)
- [x] Checkout URLs → pay.contexter.cc with correct UUID slugs
- [x] Landing pricing → LS checkout for Starter/Pro
- [x] Hero preorder → Supporter LS checkout
- [x] Supporters teaser on landing with 8/100 counter
- [x] Contrast audit — all 33 issues fixed, text-tertiary #767676

### LemonSqueezy (COMPLETE)
- [x] Store: contexter.lemonsqueezy.com, identity verified, Active
- [x] Products: Supporter (PWYW $10+, var 1516645), Starter ($9/mo, var 1516676), Pro ($29/mo, var 1516706)
- [x] Webhook: api.contexter.cc/api/webhooks/lemonsqueezy — receives + logs events
- [x] Custom domain: pay.contexter.cc (A record → 3.33.255.208, SSL active)
- [x] Email marketing enabled ($0/mo, 5K sends)
- [x] Live payment tested: $1.16, webhook confirmed
- [x] Product media v2 uploaded
- [x] API key: ~/.tLOS/lemonsqueezy-api-key
- [x] Webhook secret: ~/.tLOS/lemonsqueezy-webhook-secret

### Design (COMPLETE)
- [x] Product media: gtm_contexter.pen (6 frames), exported PNG
- [x] Supporters spec v2 with research improvements: memory/project_contexter_supporters.md
- [x] DEEP research: docs/research/contexter-supporters-deep-research.md (40+ sources)
- [x] LemonSqueezy research: docs/research/contexter-lemonsqueezy-deep-research.md

## Key Decisions (from session 236)

- D-51: 100 spots, tokens ($1=1tok), 1% rev share quarterly, Diamond/Gold/Silver/Bronze
- D-52: Accelerating earn: Diamond 2x, Gold 1.5x, Silver 1.25x, Bronze 1x
- D-53: Soft demotion: 30-day warning → Bronze → 30 days → exit
- D-54: Task cap: max 50 tokens/month
- D-55: Rev share activates at $10K/month
- D-56: No rev share during freeze
- D-57: Tokens = loyalty points, non-transferable
- D-58: Token-paid subs don't generate tokens
- D-62: Variant IDs: Supporter 1516645, Starter 1516676, Pro 1516706
- D-67: pay.contexter.cc custom domain
- D-68: Webhook at /api/webhooks/lemonsqueezy

## Waves

### Wave 1: Database Schema + Webhook Processing ✅ DEPLOYED 2026-04-11
Make webhooks actually DO something — match payments to users, store in DB.

- [x] W1-01: Migration 0015_supporters.sql — 3 tables + 9 indexes (tokens DESC, joined_at ASC composite for D-AUTO-03) `9f29f24`
- [x] W1-02: supporters.ts service skeleton (types + 6 exports: recordTransaction idempotent, creditTokens upsert, tokensFromCents, matchEmailToUser, reclaimUnmatchedForEmail, genId) `a7e753f`
- [x] W1-03: LS variant mapping + tier thresholds (D-51 + D-62) `13626b4`
- [x] W1-04: matchSupporter with safe fallback (custom_data.user_id → email → null, NO placeholder users) `361190e`
- [x] W1-05: order_created webhook handler `f370ad7`
- [x] W1-06: subscription_created + subscription_payment_success `31a44f2` + fix `e0f2924`
- [x] W1-07: subscription_cancelled/expired + reclaim hook (legacy /register + Google OAuth; better-auth deferred to W5) `9325f0d`
- [x] W1-08: Integration test 10/10 PASS `336f0d5` + fix `13d6011`

### Wave 2: Ranking Engine + API ✅ DEPLOYED 2026-04-11
Weekly rank recalculation + API endpoints for dashboard.

- [x] W2-01: Weekly ranking cron (BullMQ maintenance, Monday 04:00 UTC) `91f00d6`
- [x] W2-02: Tier assignment verify — 15-row seed test PASS `f7ec6a2`
- [x] W2-03: Tier multiplier for subscription token credit (wired in subscription_payment_success) `4e70777`
- [x] W2-04: Public GET /api/supporters (privacy: no user_id/email, displayName fallback "Anonymous Supporter") `bd7c179`
- [x] W2-05: GET /api/supporters/me authed status `7e8aace`
- [x] W2-06: POST /api/supporters/freeze annual calendar-year check `e770278`
- [x] W2-07: 101st supporter quarantine intake + promotion sweep `f6c1918` + `de67a5c`
- [x] W2-08: Spending cap 500 tok/month with advisory-lock serialization `eccb831` + fix `57de6a8`
- Integration test: 15/15 PASS

### Wave 3: Frontend Integration ✅ DEPLOYED 2026-04-11 (CF Pages)
Replace hardcoded data with live API data.

- [x] W3-01: Live leaderboard fetch (createResource + loading/error/empty/sold-out states, extracted to SupportersLeaderboard.tsx 164 lines) `f813c1b`
- [x] W3-02: Dynamic spots counter (hero + landing teaser from totalCount) `e820851`
- [x] W3-03: Dashboard SupporterStatusCard with freeze button (all 5 status variants handled) `54b195f`
- [x] W3-04: Supporter #N rank pill in Nav (auth-gated createResource, inline styled) `555e42a`
- [x] W3-05: buildCheckoutUrl helper with LS custom_data.user_id (4 CTAs wrapped) `56cd3dd`
- Coach POST-REVIEW: PASS 0 blocking, all 5 deviations accepted. One W5 hardening note: 409 freeze error detection by substring match (`.includes("year")`) is fragile.

### Wave 4: Tasks + Rev Share 🔶 SPEC WRITTEN, NOT EXECUTED
Task submission system + quarterly rev share calculation. Spec at `memory/specs/ctx-12-w4-spec.md` (1000 lines, 6 tasks, all Action+Verify+Done-when, 7 locked W4 decisions D-AUTO-W4-01..07). Player killed mid-Phase Zero by user request at session close. Next session resumes by launching fresh G3 Player with same spec.

- [ ] W4-01: POST /api/supporters/tasks — submit task (bug_report 10t, referral_signup 3t, referral_paid 5t, social_share 2t, review 5t)
- [ ] W4-02: Admin review endpoints (GET /admin/tasks + POST /admin/tasks/:id/approve|reject). Admin via `ADMIN_USER_IDS` env var.
- [ ] W4-03: Monthly task cap 50 tokens (global, no per-category). Advisory-lock serialized.
- [ ] W4-04: Referral tracking — NEW migration `0016_supporter_referrals.sql` (additive, NOT ALTER users). Signup 3t immediate + first-payment 5t trigger. Self-loop + duplicate prevented.
- [ ] W4-05: Quarterly rev share cron `0 5 1 1,4,7,10 *`. MRR gate <$10K/month → skip. Weighted by D-52 multipliers, idempotent via `revshare:${quarter}:${userId}` source_id.
- [ ] W4-06: Email notifications via NEW `src/services/notifications.ts` (own Resend POST, do NOT touch auth/index.ts). 4 templates: task approved, task rejected, referral paid, rev share. Fire-and-forget.
- [ ] W4-07 integration test: 20 assertions covering all above.

### Wave 5: Legal + Polish + Deferred Bundle 🔶 PENDING
- [ ] W5-01: ToS update — loyalty points clause (tokens non-transferable, no monetary value per D-57)
- [ ] W5-02: Soft demotion implementation — 30-day warning email, auto-demotion to Bronze (D-53)
- [ ] W5-03: Token expiry — tokens expire after 12 months if user inactive
- [ ] W5-04: Anti-abuse — same IP/device detection for referrals, 14-day hold for payment tokens
- [ ] W5-05: Deploy script audit — fix SCP/docker rebuild issue
- **W5 deferred bundle from W1/W2/W3/W4 Coach reviews:**
  - [ ] Better-auth email/password reclaim hook (add `databaseHooks.user.create.after` to `src/auth/index.ts`)
  - [ ] `creditTokensWithQuarantineCheck` return type says `"active" | "quarantined"` but returns "active" for frozen/warning/exiting — type lie, log-only but should be fixed
  - [ ] `runSupportersRanking` 92 lines > 50 guideline — extract quarantine promotion sweep into helper
  - [ ] Concurrent /freeze returns 500 instead of 409 — merge SELECT+UPDATE into atomic `UPDATE ... WHERE (freeze_start IS NULL OR EXTRACT(YEAR FROM ...)) RETURNING`
  - [ ] `supporter_transactions.amount_tokens` stores REQUESTED not CREDITED on capped rows — audit drift. Fix: store `toCredit` or add `credited_tokens` column
  - [ ] `SupporterStatus` TypeScript type missing `quarantined` value (DB column accepts text, type behind)
  - [ ] W3 freeze 409 detection via `.includes("year")` substring match — fragile, use structured backend error codes
  - [ ] **Infra**: Hetzner CAX21 38G disk needs expansion or aggressive docker prune cron (100% full during W1 deploy, cleaned 35GB manually)

## Blockers

- Webhook handler currently only logs — no user matching (W1-04 critical path)
- No DB schema for supporters yet
- Deploy script unreliable — manual SCP + rebuild needed sometimes

## AC

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | Webhook processes real payment → supporter created in DB | `SELECT * FROM supporters WHERE user_id = X` |
| AC-2 | Leaderboard shows real data from API | `curl api.contexter.cc/api/supporters` → JSON with ranks |
| AC-3 | Counter on /supporters is dynamic | Screenshot comparison |
| AC-4 | Supporter gets Pro features on Starter subscription | Login as supporter on Starter → verify Pro features |
| AC-5 | Weekly rank recalculation runs | Check BullMQ scheduled job logs |
| AC-6 | Freeze works — rank preserved, no rev share | Freeze → verify rank unchanged, rev share = 0 |
| AC-7 | Soft demotion — 30-day email sent | Check email logs after 30 days no payment |
| AC-8 | Task submission + approval flow | POST task → admin approve → tokens credited |

## Dependencies

- **CTX-04 (Auth):** User matching by email requires auth system ✅ (better-auth deployed)
- **CTX-10 (GTM Launch):** Frontend + LS setup ✅ (session 236)
- **LemonSqueezy:** Store, products, webhook ✅ (session 236)

## LS Integration Reference

| Resource | Value |
|---|---|
| Store ID | 309186 |
| Store URL | contexter.lemonsqueezy.com |
| Custom domain | pay.contexter.cc |
| Supporter variant | 1516645 (slug: 40f7293e-...) |
| Starter variant | 1516676 (slug: 104ceab1-...) |
| Pro variant | 1516706 (slug: 08f48e34-...) |
| Webhook URL | api.contexter.cc/api/webhooks/lemonsqueezy |
| Webhook secret | ~/.tLOS/lemonsqueezy-webhook-secret |
| API key | ~/.tLOS/lemonsqueezy-api-key |
| Webhook signing | HMAC-SHA256, header x-signature, raw body (c.req.text()) |
