---
# contexter-supporters-backend.md — CTX-12 Supporters Backend
> Layer: L3 | Epic: CTX-12 | Status: 🔶 IN PROGRESS
> Created: 2026-04-11 (session 236)
> Last updated: 2026-04-11 (session 236 — epic created with full spec)
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

### Wave 1: Database Schema + Webhook Processing
Make webhooks actually DO something — match payments to users, store in DB.

- [ ] W1-01: DB migration — supporters table (user_id, tokens, rank, tier, status, freeze_start, freeze_end, joined_at)
- [ ] W1-02: DB migration — supporter_transactions table (user_id, type, amount, source, created_at)
- [ ] W1-03: DB migration — supporter_tasks table (user_id, task_type, tokens, status, reviewed_by, created_at)
- [ ] W1-04: Webhook handler — order_created → match email to user → credit tokens → create supporter entry
- [ ] W1-05: Webhook handler — subscription_created → link LS subscription to user
- [ ] W1-06: Webhook handler — subscription_payment_success → credit monthly tokens
- [ ] W1-07: Webhook handler — subscription_cancelled/expired → start 30-day warning
- [ ] W1-08: Email fallback — if webhook can't match user by email, log for manual review

### Wave 2: Ranking Engine + API
Weekly rank recalculation + API endpoints for dashboard.

- [ ] W2-01: Ranking service — recalculate all ranks weekly (cron or BullMQ scheduled job)
- [ ] W2-02: Tier assignment — Diamond #1-10, Gold #11-30, Silver #31-60, Bronze #61-100
- [ ] W2-03: Accelerating earn rate — apply tier multiplier when crediting tokens
- [ ] W2-04: API: GET /api/supporters — public leaderboard (rank, name, tier, tokens)
- [ ] W2-05: API: GET /api/supporters/me — authenticated user's supporter status
- [ ] W2-06: API: POST /api/supporters/freeze — activate freeze (1x/year check)
- [ ] W2-07: 101st person quarantine logic — 1 month to outbid #100
- [ ] W2-08: Spending cap — max 500 tokens/month from subscriptions

### Wave 3: Frontend Integration
Replace hardcoded data with live API data.

- [ ] W3-01: Leaderboard — fetch from /api/supporters, replace demo data
- [ ] W3-02: Counter — 8/100 → dynamic from API
- [ ] W3-03: Dashboard supporter section — rank, tokens, rev share, freeze button
- [ ] W3-04: Badge "Supporter #N" in profile/nav
- [ ] W3-05: Pass user_id as custom_data in checkout URLs for logged-in users

### Wave 4: Tasks + Rev Share
Task submission system + quarterly rev share calculation.

- [ ] W4-01: API: POST /api/supporters/tasks — submit task (bug report, referral, etc.)
- [ ] W4-02: Task review queue — admin endpoint for approving/rejecting tasks
- [ ] W4-03: Task cap enforcement — max 50 tokens/month, per-category limits
- [ ] W4-04: Referral tracking — link referred user to referrer
- [ ] W4-05: Rev share calculation — quarterly, by tier, distribute as tokens
- [ ] W4-06: Rev share notification — email/Telegram when rev share distributed

### Wave 5: Legal + Polish
- [ ] W5-01: ToS update — loyalty points clause (tokens non-transferable, no monetary value)
- [ ] W5-02: Soft demotion implementation — 30-day warning email, auto-demotion to Bronze
- [ ] W5-03: Token expiry — tokens expire after 12 months if user inactive
- [ ] W5-04: Anti-abuse — same IP/device detection for referrals, 14-day hold for payment tokens
- [ ] W5-05: Deploy script audit — fix SCP/docker rebuild issue

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
