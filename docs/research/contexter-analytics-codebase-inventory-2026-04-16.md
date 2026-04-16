# Contexter Codebase Inventory for CTX-11 Analytics
> Date: 2026-04-16
> Purpose: Ground-truth inventory to inform CTX-11 L3 spec

## 1. Payment Flows (5 Types Found)

### 1.1 LemonSqueezy Webhook Events (src/routes/webhooks.ts:107-675)

Six distinct LS events handled:

| Event | Tokens | Effect | Records |
|---|---|---|---|
| order_created | PWYW (1c=1token) | Credit/quarantine | supporter_transactions |
| subscription_created | 0 | Tier/period set | supporter_transactions |
| subscription_payment_success | Up to 500/mo (D-52 multiplier) | Credit + 14d hold (W5-04) | supporter_transactions + optional referral |
| subscription_cancelled/expired | 0 | Status change | supporter_transactions |
| order_refunded/subscription_payment_refunded | Negative | Deduct (floor 0) | supporter_transactions |

Key mechanics:
- 14-day hold (W5-04): tokens credited immediately but excluded from rev-share SUM until held_until > NOW()
- 500-token monthly cap enforced via pg_advisory_xact_lock to prevent concurrent webhook races
- Referral first-payment bonus (5 tokens) fires inside subscription_payment_success transaction if referrer active

### 1.2 NOWPayments Crypto (webhooks.ts:29-104)
- Terminal statuses: finished/confirmed -> activate sub
- Failure statuses: failed/expired/refunded -> mark status

### 1.3 Task Rewards (supporters.ts:184-256)
Amounts (locked D-54): bug_report:10, referral_signup:3, referral_paid:5, social_share:2, review:5
Monthly cap: 50 tokens (enforced on admin approval, not submission)

### 1.4 Referral Bonuses
- Signup: 3 tokens to referrer when referred user first pays
- First-payment: 5 tokens to referrer inside subscription_payment_success TX
- Anti-abuse (W5-04): signup_ip + signup_device_hash tracked

### 1.5 Unmatched/Reclaim (D-AUTO-04)
- Payment before signup stored with user_id=NULL, email=X
- On registration: reclaimUnmatchedForEmail() credits retroactively, no cap

### 1.6 Subscription Tiers
Free: 1GB / Starter: $9mo 10GB / Pro: $29mo 50GB / Business: $79mo 200GB
NOTE: UI claims Pro=100GB -> DRIFT!

## 2. User Lifecycle States

Registration: email/password OR Google OAuth
Email verification: link via Resend, completion implicit
First payment: triggers reclaimUnmatchedForEmail()

Supporter statuses:
- active: top 100 by tokens, earning rev share
- warning: outside top 100, warning email sent, awaits W2 demotion
- quarantined: > 100 cap intake, awaits W2 ranking sweep
- frozen: 30-day opt-in, 1x/year
- exiting: phase-out

Supporter tiers (D-51):
- diamond: rank ≤ 10 (2x multiplier)
- gold: rank ≤ 30 (1.5x)
- silver: rank ≤ 60 (1.25x)
- bronze: rank ≤ 100 (1x)
- pending: rank > 100 (1x)

Subscription states: active / cancelled (still active until period_end) / expired (downgraded to free by W5 cron)
Token holds: held_until (14d chargeback window, excluded from rev-share SUM)

## 3. Events Currently Logged

- nowpayments_ipn (webhooks:62)
- subscription_activated (webhooks:89)
- ls_supporter_credited (webhooks:193)
- ls_subscription_payment_credited (webhooks:541)
- ls_subscription_payment_capped (webhooks:530)
- referral_paid_credited (webhooks:489)
- task_submitted (supporters:228)
- supporter_freeze_activated (supporters:174)

NOT logged: user registration, email verification, first document, first search, first MCP tool, subscription cancellation, session lifecycle, payment failures

## 4. Pricing Drift

UI claims Pro=100GB, backend enforces 50GB. Action: fix before launch.

## 5. MCP Tools (12 Total)

search_knowledge, list_documents, get_document, add_context, upload_document, delete_document, get_document_content, ask_about_document, get_stats, create_share, summarize_document, rename_document (+ 3 room tools)

Current instrumentation: NONE. Zero event logging per tool.

## 6. Identity Data

users: id (16c UUID), api_token (UNIQUE), name, email (deduped), created_at
supporters: user_id, tokens (BIGINT), rank, tier, status, warning_sent_at, freeze_*, joined_at, updated_at
supporter_transactions: id, user_id (NULLABLE), email, type, amount_tokens (BIGINT), amount_usd_cents, source_type, source_id (idempotency), metadata (JSONB), held_until (W5-04), created_at
supporter_referrals: id, referrer_id, referred_id (UNIQUE), code, signup/payment_credited_at, signup_ip, signup_device_hash
supporter_tasks: id, user_id, task_type, amount_tokens, status, description, reviewer_id, reviewed_at
subscriptions: id, user_id, tier, status, storage_limit_bytes, current_period_start/end
payments: id, user_id, subscription_id, nowpayments_invoice_id, tier, amount_usd, status

MISSING: attribution table (CTX-11 W1), utm_source/medium/campaign, email_verified_at flag, session table

## 7. Existing Telemetry

Current: console.log(JSON.stringify({ ts, event, ...data })) - no external SDK
Logged: webhooks, token ops, task approvals, errors
NOT logged: registration, docs, queries, MCP calls, sessions, attribution

Infrastructure: No PostHog / Grafana / Netdata / Prometheus. Resend for email (errors logged).

## 8. Gaps CTX-11 Must Fill

- Add utm_source/medium/campaign capture on registration
- Pass attribution to LS custom_data
- Instrument registration -> "user_registered" event
- Instrument email verification -> "email_verified"
- Instrument first document, first search, first MCP tool
- Track session lifecycle (login/logout/token refresh)
- Wrap 12 MCP tools with pre/post instrumentation
- Choose analytics SDK (PostHog)
- Create dashboards: revenue by source, cohort retention, tool adoption

## 9. Key Contradictions

1. Pro tier: UI 100GB, backend 50GB - DRIFT!
2. Business tier: $79/mo exists, hidden from UI
3. 14-day hold: tokens credited to balance immediately, excluded from rev-share SUM - must distinguish
4. Referral flow: referral_paid (5) inside subscription_payment_success; referral_signup (3) assignment unclear
5. Task cap: 50-token monthly limit enforced on admin APPROVAL, not submission
6. Quarantine: New > 100 cap enter quarantined, W2 cron sorts (outside CTX-11 scope)

Generated: 2026-04-16 | Migrations: 18 (0000-0017) | Lines: webhooks.ts ~675, supporters.ts ~562