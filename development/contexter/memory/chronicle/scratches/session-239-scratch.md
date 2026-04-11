# session-scratch.md
> Axis · 2026-04-11 · session 239
> Last processed checkpoint: #238 → new CLOSE: #239

<!-- ENTRY:2026-04-11:CLOSE:239:contexter:ctx-12-supporters-backend [AXIS] -->
## 2026-04-11 — сессия 239 CLOSE [Axis]

**Mode:** Full autonomous CTX-12 continuation (W4 + W5). Activated by nopoint "продолжаем в автономном режиме ctx 12" + "иди к wave 5" + "провод большой аудит" + "нового диалога не будет проводи большой аудит" + "пока не надо закончи с этим плеером и закрывай сессию нормально и основательно".

**Decisions (5 new D-AUTO-W5 locked + 8 spec addenda):**
- D-AUTO-W4-01..07: W4 implementation decisions (rev share tier weights, task types, admin allowlist, notifications placement, referral tracking via new table, cron pattern, referral code = userId)
- ADD-1..ADD-8 spec addenda for W4 closing 5 blocking gaps discovered in Orchestrator self-audit (phantom supporter risk, advisory lock placement, referral tx wrap, revshare email loop, outside-tx email lookup, SupporterStatus type gap, rate limit semantics, test expansion 20→24 assertions)
- D-W5-01: ToS Section 7 "Supporter Program and Loyalty Tokens" — non-transferable, no monetary value, 12-month expiry, exit-forfeit, anti-circular, 50/month task cap, 14-day payment hold
- D-W5-02: Soft demotion activity=MAX(supporter_transactions.created_at) fallback joined_at. Stage 1 (30d) warning email, Stage 2 (60d) demote tier to bronze, Stage 3 (90d) status=exiting. Daily cron 03:30 UTC. Re-activation clears warning on new activity.
- D-W5-03: 365d inactive → tokens=0 (keep row per G1). Weekly cron Sunday 03:45 UTC. No email first pass.
- D-W5-04: Migration 0017 adds signup_ip+signup_device_hash to supporter_referrals, held_until to supporter_transactions. Referral rejects duplicate IP or device per referrer (null-aware guards). Subscription payments set held_until=NOW()+14d. Revshare MRR + quarter revenue SUMs exclude held rows.
- D-W5-05: Deploy script audit — root cause `scp -r LOCAL/src/ HOST:REMOTE/app/src/` path-nesting on repeat deploys. Fix via tar+atomic staging dir + post-build sha256 image verification + disk pre-check + health smoke.

**Files changed (session 239):**
- `memory/specs/ctx-12-w4-spec.md` — appended 8 addenda (ADD-1..ADD-8) pre-Player launch
- `memory/ctx-12-autonomous-report.md` — appended full Wave 4, Wave 5-5A, Wave 5-5B/C sections
- `memory/session-scratch.md` — this CLOSE entry
- `src/services/supporters.ts` — W4-01 (requireActiveSupporter/TaskType/MONTHLY_TASK_CAP/submitTask), W4-02 (isAdmin/checkTaskCapForUser/Env import), BB-02 (honest return type), BB-06 (SupporterStatus widen incl quarantined), W5-04 (RecordTransactionInput.heldUntil)
- `src/services/supporters-ranking.ts` — BB-03 promoteQuarantinedAboveThreshold helper extraction (92→37 lines)
- `src/services/supporters-revshare.ts` — NEW W4-05 (runQuarterlyRevShare + quarter boundaries + weighted distribution + idempotency) + W4-06 email wire + W5-04 held filter on MRR/pool SUMs
- `src/services/notifications.ts` — NEW W4-06 (4 Resend email templates + sendEmail helper) + W5-02 (sendDemotionWarning/Exit)
- `src/services/supporters-lifecycle.ts` — NEW W5-02 (runSoftDemotion + clearReactivatedWarnings) + W5-03 (runTokenExpiry with CTE pre-update snapshot)
- `src/routes/supporters.ts` — W4-01 (POST /tasks), W4-02 (3 admin routes with advisory lock), W4-04 (POST /referral with rate limit + ADD-1 gate + ADD-3 tx), BB-04 (/freeze atomic WHERE EXTRACT YEAR + structured 403/409), W5-04 (computeDeviceHash + anti-abuse SELECT + structured 409), reject handler email wire
- `src/routes/webhooks.ts` — W4-04 first-payment referral trigger (inside cap-tx, inactive-referrer handled), W4-06 CapOutcome.credited.referrerPaidEmailTarget, BB-05 capped-row in-tx UPDATE with metadata, W5-04 heldUntil at both recordTransaction call sites
- `src/routes/maintenance.ts` — W4-05 quarterly-revshare schedule+dispatch + startMaintenanceWorker signature extended to accept env + W5-02 daily-soft-demotion + W5-03 weekly-token-expiry
- `src/auth/index.ts` — BB-01 better-auth databaseHooks.user.create.after calls reclaimUnmatchedForEmail
- `src/types/env.ts` — ADMIN_USER_IDS plumbed
- `src/index.ts` — ADMIN_USER_IDS reader + env passed to startMaintenanceWorker
- `drizzle-pg/0016_supporter_referrals.sql` — NEW W4-04 (table + 3 indexes + UNIQUE + CHECK + 2 FKs)
- `drizzle-pg/0017_antiabuse.sql` — NEW W5-04 (ALTER x2 ADD COLUMN nullable + 3 indexes)
- `drizzle-pg/meta/_journal.json` — +idx:2 (0016) + idx:3 (0017)
- `scripts/test-ctx-12-w4.ts` — NEW 24-assertion integration test (ADD-8 compliant)
- `scripts/test-ctx-12-w5.ts` — NEW 10-assertion test for W5-02/03
- `scripts/test-ctx-12-w5-04.ts` — NEW 14-assertion test for W5-04
- `web/src/pages/Terms.tsx` — W5-01 Section 7 insertion + renumber 7-14 → 8-15
- `web/src/components/SupporterStatusCard.tsx` — BB-07 structured 409 error matching
- `ops/deploy.sh` — W5-05 sync_dir helper + pre-deploy disk check + post-build sha256 verification + nested-dir regression check + /api/formats smoke + set -euo pipefail

**Completed (14 commits on main, session 239):**
- **Wave 4** — 5 atomic commits (DEPLOYED):
  - `0c37181` W4-01 POST /tasks + requireActiveSupporter gate
  - `7f97ffa` W4-02+03 admin endpoints + advisory lock cap
  - `26fadc8` W4-04 referrals migration 0016 + endpoint + first-payment trigger
  - `ae9b77a` W4-05 quarterly revshare cron with MRR gate
  - `ee822e5` W4-06 notifications + 24/24 integration test
- **Wave 5-5A Deferred Bundle** — 7 atomic commits (backend DEPLOYED, BB-07 frontend NOT):
  - `e9b6db5` BB-01 better-auth reclaim
  - `e96d2f1` BB-06 SupporterStatus widen
  - `784f679` BB-02 creditTokensWithQuarantineCheck honest type
  - `cc28922` BB-03 runSupportersRanking helper extract
  - `15a98b5` BB-04 /freeze atomicity
  - `e0b8c5e` BB-05 amount_tokens audit drift
  - `60ed97f` BB-07 W3 frontend structured error
- **Wave 5-5B/5C** — 5 atomic commits (NOT DEPLOYED):
  - `141f714` W5-01 ToS Section 7
  - `016fd20` W5-05 deploy script fix
  - `acc5a01` W5-02 soft demotion cron
  - `ca1ef4e` W5-03 token expiry cron
  - `907883a` W5-04 anti-abuse IP/device + hold

**Tests:** 24/24 W4 PASS + 10/10 W5-02/03 PASS + 14/14 W5-04 PASS = **48 new assertions** all green on contexter_dev.

**Deploys this session:** 2 manual (J8) + 0 frontend
- Deploy A: W4 backend (pg_dump + migration 0016 + 11 files + ADMIN_USER_IDS env + docker rebuild + smoke all 401/200) — LIVE
- Deploy B: W5-5A backend (5 files via tar + docker rebuild + smoke all green, no env_file change so postgres stayed up) — LIVE
- **NOT deployed:** W5-5B/C (5 commits), BB-07 frontend, W5-01 ToS frontend. Migration 0017 applied to contexter_dev only.

**Opened (deferred to next session):**
- W5 DEPLOY stage: pg_dump → migration 0017 to prod → SCP via new deploy.sh (live-test of W5-05 fix) → docker rebuild → smoke test for POST /referral duplicate-IP rejection + 6 BullMQ cron hashes (was 4)
- Frontend CF Pages deploy via ops/deploy-web.sh — ships BB-07 + W5-01 ToS Section 7
- RESEND_API_KEY rotation (defensive — value leaked into Orchestrator context via grep this session, not logged/committed)
- Hetzner CAX21 disk expansion or aggressive docker prune cron (48→51% used after 2 deploys)
- LS store #333207 deletion follow-up (email to hello@lemonsqueezy.com sent, no response)
- AC-7 soft demotion: implemented but not production-validated until W5 deploy lands
- src/routes/supporters.ts 821 lines → future refactor (H2 soft threshold 800, pre-commit hook warning noted)

**Notes:**
- **Orchestrator self-audit before W4 Player launch** caught 5 blocking gaps, added 8 addenda — prevented phantom supporters via creditTokens upsert and race conditions on cap check
- **G3 pattern this session:** light Orchestrator-driven Coach (main context, per C3) instead of full G3 Coach subagents for W4 + W5-5A + W5-5B/C — nopoint flagged mid-session ("а ты коучей не собираешься запускать после плееров?") but explicitly authorized skipping when closing ("пока не надо")
- **Epic progress:** session 237 brought W1+W2+W3 (25 commits), session 238 closed + wrote W4 spec (1 commit), session 239 added W4+W5 implementation (14 commits) → **40 total CTX-12 commits** on main, ~90% complete
- **Revenue baseline:** still $0 real (single $1.16 test from nopoint session 236)
- **Real users:** 0 supporter rows in prod DB — all new machinery untested under real load
- **Context management this session:** 3 memory pressure warnings (94K → 229K → 278K → 348K). Used parallel background Players for W5 features to avoid main context bloat. Ended at ~348K / 1M.
- **Recovery:** session started with crash recovery notice (PID 329 crashed 15:56 BST) but axis-active was intact, proceeded clean
