---
# contexter-supporters-backend.md — CTX-12 Supporters Backend
> Layer: L3 | Epic: CTX-12 | Status: ✅ COMPLETE (W1-W5 all deployed 2026-04-12, session 240)
> Created: 2026-04-11 (session 236)
> Last updated: 2026-04-11 (session 239 — W4+W5 autonomous execution, 14 new commits on main, 2 prod deploys, 0 escalations, 0 J3/J5 trips)
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

### Wave 4: Tasks + Admin + Referrals + Rev Share + Notifications ✅ DEPLOYED 2026-04-11 (session 239)
Task submission system + admin review + referrals + quarterly rev share + notifications. Spec at `memory/specs/ctx-12-w4-spec.md` (expanded to 1100+ lines with 8 addenda ADD-1..ADD-8 added by Orchestrator self-audit pre-Player launch closing 5 blocking gaps). 5 atomic commits on main, migration 0016 deployed, all endpoints live.

- [x] W4-01: POST /api/supporters/tasks + requireActiveSupporter gate (ADD-1) + TASK_TOKEN_AMOUNTS + MONTHLY_TASK_CAP + submitTask `0c37181`
- [x] W4-02: Admin review endpoints (GET /admin/tasks + POST approve/reject) + isAdmin helper + Env.ADMIN_USER_IDS `7f97ffa`
- [x] W4-03: Monthly task cap 50 tokens with checkTaskCapForUser + advisory lock (ADD-2) inside approve tx `7f97ffa` (bundled with W4-02)
- [x] W4-04: Migration 0016_supporter_referrals.sql + POST /referral (transactional ADD-3, rate limit user 5/h + IP 20/h, referrer gate ADD-1) + first-payment trigger in webhooks.ts subscription_payment_success (inactive-referrer mark-processed+skip) `26fadc8`
- [x] W4-05: Quarterly rev share cron `0 5 1 1,4,7,10 *` + MRR gate <$10K/month → skip + weighted distribution (D-52 tier units 8/6/5/4) + idempotency via `revshare:${quarter}:${userId}` source_id + startMaintenanceWorker signature extended to accept env `ae9b77a`
- [x] W4-06: notifications.ts (4 Resend email templates + sendEmail helper, PII protection, XSS guard, graceful no-op) + wired all 4 call sites (approve/reject/first-payment/revshare) + scripts/test-ctx-12-w4.ts 24/24 PASS (ADD-8) `ee822e5`
- [x] W4 DEPLOY: pg_dump backup + migration 0016 + 11 files tar-extracted to /opt/contexter/app + ADMIN_USER_IDS=32b533b3 added to /opt/contexter/.env + docker rebuild + smoke all green (401/200 as expected) — LIVE

### Wave 5: Legal + Polish + Deferred Bundle 🔶 PARTIAL (5A deployed, 5B/5C implemented locally, deploy pending)

**5A Deferred Bundle ✅ DEPLOYED 2026-04-11 session 239** — 7 atomic commits addressing Coach review technical debt from W1-W4:
- [x] BB-01 Better-auth email/password reclaim hook — `databaseHooks.user.create.after` in `src/auth/index.ts` calls reclaimUnmatchedForEmail, non-blocking `e9b6db5`
- [x] BB-02 `creditTokensWithQuarantineCheck` honest return type `{status: SupporterStatus, created: boolean}` `784f679`
- [x] BB-03 `runSupportersRanking` extract `promoteQuarantinedAboveThreshold` helper (92→37 lines, pure refactor) `cc28922`
- [x] BB-04 /freeze atomicity — single UPDATE ... WHERE EXTRACT YEAR + classify-SELECT on miss → structured 403/409 with `code` field `15a98b5`
- [x] BB-05 `supporter_transactions.amount_tokens` audit drift — in-tx UPDATE on capped rows + metadata preserves `requested_tokens` + `capped: true` flag `e0b8c5e`
- [x] BB-06 SupporterStatus type widen to include `"quarantined"` (removed ADD-6 string workaround) `e96d2f1`
- [x] BB-07 W3 frontend structured 409 detection — exact match on `already_frozen_this_year`/`already_frozen` (replaces fragile substring) `60ed97f` ← **backend deployed, frontend NOT yet** (needs CF Pages deploy)

**5B Features + 5C Legal IMPLEMENTED LOCALLY session 239, NOT DEPLOYED** — 5 atomic commits:
- [x] W5-01 ToS Section 7 "Supporter Program and Loyalty Tokens" — non-transferable, no monetary value per D-57, 12-month expiry clause, exit-forfeit, anti-circular, 50/month task cap, 14-day hold — `web/src/pages/Terms.tsx` +80 -9, renumbered sections 7-14 → 8-15, last-updated date → April 11, 2026 `141f714`
- [x] W5-02 Soft demotion cron (D-53) — `src/services/supporters-lifecycle.ts` new with `runSoftDemotion` + `clearReactivatedWarnings` helper + 2 new notification templates (sendDemotionWarningEmail + sendDemotionExitEmail). Stages: 30d warning+email, 60d demote tier to bronze, 90d status='exiting'+email. Daily cron 03:30 UTC jobId `daily-soft-demotion-cron`. Re-activation clears warning if new supporter_transactions row after warning_sent_at. `acc5a01`
- [x] W5-03 Token expiry cron — 365d inactive → tokens=0 (keep row per G1). Uses CTE `WITH before_update AS (SELECT) + updated AS (UPDATE RETURNING)` pattern so logs capture prev_tokens BEFORE zeroing. Weekly cron Sunday 03:45 UTC jobId `weekly-token-expiry-cron`. No email first pass. `ca1ef4e`
- [x] W5-04 Anti-abuse — migration `0017_antiabuse.sql` adds `signup_ip`, `signup_device_hash` to supporter_referrals (+2 indexes) and `held_until` to supporter_transactions (+partial index). POST /referral extracts IP via getClientIp + computes `sha256(user_agent + '|' + accept_language).slice(0,32)` device hash, rejects duplicate IP or device per referrer with structured 409 `duplicate_ip_or_device`. subscription_payment_success sets heldUntil=NOW()+14d at both recordTransaction call sites. Revshare MRR gate + quarter revenue SUMs both add `AND (held_until IS NULL OR held_until <= NOW())`. Refund/chargeback handler deferred to W6+. `907883a`
- [x] W5-05 Deploy script fix — root cause `scp -r LOCAL/src/ HOST:REMOTE/app/src/` path-nesting on repeat deploys (destination exists → copies INTO it → `src/src/` accumulation → Dockerfile COPY bakes stale mix). Fix: `sync_dir()` helper = tar → scp → extract into `.new.$$` staging dir → atomic mv → rm old. Post-build sha256 image verification via `docker compose run --rm --entrypoint sha256sum app src/index.ts` compared to local. Pre-deploy disk guard ≥5GB free. Nested-dir regression check. /api/formats smoke test. `set -euo pipefail`. `016fd20`

**5B/5C Tests (all PASS on contexter_dev):**
- scripts/test-ctx-12-w5.ts — 10/10 PASS (W5-02 stages + W5-03 expiry)
- scripts/test-ctx-12-w5-04.ts — 14/14 PASS (anti-abuse referral + hold filter)

**5D Deploy ✅ DEPLOYED 2026-04-12 session 240:**
- [x] pg_dump backup → /root/backups/ctx12-w5-pre-20260412-062947.dump
- [x] Apply migration 0017 to prod (3 ALTER + 3 CREATE INDEX — all OK)
- [x] Manual tar SCP of 10 backend files + sha256 verification match
- [x] `docker compose build --no-cache app` + `docker compose up -d app` — health green
- [x] 6 BullMQ cron hashes confirmed (daily-retention + daily-soft-demotion + weekly-drift-check + weekly-supporters-ranking + weekly-token-expiry + quarterly-revshare)
- [x] Frontend CF Pages deploy via `ops/deploy-web.sh` — bundle `index-Zintsvz-.js` live, cache purged
- [x] Git push 18 commits to origin/main (`bfe933a..f898e1b`)

**Other open items (infra + housekeeping):**
- [ ] Rotate RESEND_API_KEY (defensive — value leaked into Orchestrator context via grep in session 239, not logged/committed)
- [ ] Hetzner CAX21 38G disk expansion or aggressive docker prune cron (currently 51% after 2 session-239 deploys, was 48% at session start)
- [ ] Delete unverified LS store #333207 (email sent to hello@lemonsqueezy.com session 236, no response)
- [ ] src/routes/supporters.ts 821 lines > 800 soft threshold → future refactor
- [ ] AC-7 soft demotion production validation — deploy first, then wait for organic inactive-user scenarios (or seed test supporter row for ops verification)

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
