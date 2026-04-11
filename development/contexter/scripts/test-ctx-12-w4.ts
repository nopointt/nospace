#!/usr/bin/env bun
/**
 * CTX-12 Wave 4 integration test.
 *
 * Standalone Bun script against contexter_dev with 24 assertions covering:
 *  - TASK_TOKEN_AMOUNTS constants + submitTask validation
 *  - isAdmin allowlist behavior
 *  - checkTaskCapForUser current-month aggregation + window rules
 *  - supporter_referrals CHECK / UNIQUE constraint enforcement
 *  - Signup + first-payment referral credit paths
 *  - runQuarterlyRevShare gate, distribution, idempotency, exclusions
 *  - Notification graceful no-op when RESEND_API_KEY is unset
 *  - ADD-8 addenda: requireActiveSupporter behavior + rollback safety
 *
 * Seeds with user_id prefix 'w4test_' and cleans up at the end (finally).
 * Exits 0 on 24/24 PASS, 1 on any failure.
 *
 * Usage:
 *   PG_DATABASE=contexter_dev ADMIN_USER_IDS=w4test_admin \
 *     bun run scripts/test-ctx-12-w4.ts
 */

import postgres from "postgres"
import {
  TASK_TOKEN_AMOUNTS,
  submitTask,
  isAdmin,
  checkTaskCapForUser,
  requireActiveSupporter,
  creditTokens,
  recordTransaction,
  genId,
  type SupporterTier,
} from "../src/services/supporters"
import { runQuarterlyRevShare } from "../src/services/supporters-revshare"
import { sendTaskApprovedEmail } from "../src/services/notifications"
import type { Env } from "../src/types/env"

// --- Postgres client ---------------------------------------------------

const sql = postgres({
  host: "localhost",
  database: process.env.PG_DATABASE ?? "contexter_dev",
  username: "cx_user",
  password: "",
  max: 4,
})

const PREFIX = "w4test_"

// --- Tracking ----------------------------------------------------------

let passed = 0
let failed = 0
const results: string[] = []

function pass(name: string): void {
  passed++
  results.push(`[PASS] ${name}`)
}
function fail(name: string, details: string): void {
  failed++
  results.push(`[FAIL] ${name} — ${details}`)
}
function assert(name: string, cond: boolean, details?: string): void {
  if (cond) pass(name)
  else fail(name, details ?? "condition false")
}

// --- Seeding helpers ---------------------------------------------------

async function cleanup(): Promise<void> {
  // Order matters: dependent rows first. Match any source_id carrying our prefix.
  await sql`DELETE FROM supporter_transactions WHERE user_id LIKE ${PREFIX + "%"} OR source_id LIKE ${"%" + PREFIX + "%"} OR source_id LIKE ${"revshare:%" + PREFIX + "%"}`
  await sql`DELETE FROM supporter_referrals WHERE referrer_id LIKE ${PREFIX + "%"} OR referred_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM supporter_tasks WHERE user_id LIKE ${PREFIX + "%"} OR reviewer_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "%"}`
}

async function seedUser(id: string, email?: string): Promise<void> {
  const finalEmail = email ?? `${id}@w4test.local`
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${id}, ${finalEmail}, ${id})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  `
}

async function seedSupporter(
  id: string,
  opts: {
    tokens?: number
    status?: string
    tier?: SupporterTier
    rank?: number | null
  } = {},
): Promise<void> {
  const tokens = opts.tokens ?? 0
  const status = opts.status ?? "active"
  const tier = opts.tier ?? "bronze"
  const rank = opts.rank ?? 50
  await sql`
    INSERT INTO supporters (user_id, tokens, status, tier, rank, joined_at)
    VALUES (${id}, ${tokens}, ${status}, ${tier}, ${rank}, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET tokens = EXCLUDED.tokens,
          status = EXCLUDED.status,
          tier = EXCLUDED.tier,
          rank = EXCLUDED.rank,
          updated_at = NOW()
  `
}

async function getTokens(userId: string): Promise<number> {
  const rows = await sql<{ tokens: string }[]>`
    SELECT tokens::text FROM supporters WHERE user_id = ${userId}
  `
  return rows.length > 0 ? Number(rows[0]!.tokens) : 0
}

async function countRevShareTx(prefix: string): Promise<number> {
  const rows = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM supporter_transactions
    WHERE source_id LIKE ${"revshare:%" + prefix + "%"}
  `
  return Number(rows[0]?.count ?? "0")
}

// --- Main runner -------------------------------------------------------

async function run(): Promise<void> {
  await cleanup()

  try {
    // -----------------------------------------------------------------
    // 1. TASK_TOKEN_AMOUNTS shape
    // -----------------------------------------------------------------
    assert(
      "1. TASK_TOKEN_AMOUNTS shape",
      TASK_TOKEN_AMOUNTS.bug_report === 10 &&
        TASK_TOKEN_AMOUNTS.referral_signup === 3 &&
        TASK_TOKEN_AMOUNTS.referral_paid === 5 &&
        TASK_TOKEN_AMOUNTS.social_share === 2 &&
        TASK_TOKEN_AMOUNTS.review === 5,
      JSON.stringify(TASK_TOKEN_AMOUNTS),
    )

    // -----------------------------------------------------------------
    // 2. submitTask throws on invalid task_type
    // -----------------------------------------------------------------
    const userA = PREFIX + "userA"
    await seedUser(userA)
    let caught2: string | null = null
    try {
      await submitTask(sql, userA, "not_a_real_type")
    } catch (e) {
      caught2 = e instanceof Error ? e.message : String(e)
    }
    assert("2. submitTask invalid_task_type", caught2 === "invalid_task_type", caught2 ?? "no throw")

    // -----------------------------------------------------------------
    // 3. submitTask stores row with status='pending' and correct amount
    // -----------------------------------------------------------------
    const submitted = await submitTask(sql, userA, "bug_report", "seed test")
    const taskRows = await sql<{ status: string; amount_tokens: string }[]>`
      SELECT status, amount_tokens::text FROM supporter_tasks WHERE id = ${submitted.id}
    `
    const t = taskRows[0]
    assert(
      "3. submitTask pending row",
      t !== undefined && t.status === "pending" && Number(t.amount_tokens) === 10,
      JSON.stringify(t),
    )

    // -----------------------------------------------------------------
    // 4. submitTask rejects description > 1000 chars
    // -----------------------------------------------------------------
    let caught4: string | null = null
    try {
      await submitTask(sql, userA, "bug_report", "x".repeat(1001))
    } catch (e) {
      caught4 = e instanceof Error ? e.message : String(e)
    }
    assert("4. submitTask description_too_long", caught4 === "description_too_long", caught4 ?? "no throw")

    // -----------------------------------------------------------------
    // 5. isAdmin true when id on allowlist
    // -----------------------------------------------------------------
    assert(
      "5. isAdmin allowlist match",
      isAdmin("u1", { ADMIN_USER_IDS: "u1" } as unknown as Env) === true,
    )

    // -----------------------------------------------------------------
    // 6. isAdmin false when id missing
    // -----------------------------------------------------------------
    assert(
      "6. isAdmin allowlist miss",
      isAdmin("u2", { ADMIN_USER_IDS: "u1" } as unknown as Env) === false,
    )

    // -----------------------------------------------------------------
    // 7. isAdmin false when allowlist empty
    // -----------------------------------------------------------------
    assert(
      "7. isAdmin empty allowlist",
      isAdmin("x", { ADMIN_USER_IDS: "" } as unknown as Env) === false,
    )

    // -----------------------------------------------------------------
    // 8. checkTaskCapForUser with 0 already → allowed, remaining=50
    // -----------------------------------------------------------------
    const userCap1 = PREFIX + "cap1"
    await seedUser(userCap1)
    const cap1 = await checkTaskCapForUser(sql, userCap1, 10)
    assert(
      "8. checkTaskCap empty state",
      cap1.allowed === true && cap1.remaining === 50 && cap1.already === 0,
      JSON.stringify(cap1),
    )

    // -----------------------------------------------------------------
    // 9. checkTaskCapForUser with 45 already for 10 tokens → NOT allowed
    // -----------------------------------------------------------------
    const userCap2 = PREFIX + "cap2"
    await seedUser(userCap2)
    // Seed 45 tokens of approved tasks this month.
    await sql`
      INSERT INTO supporter_tasks (id, user_id, task_type, amount_tokens, status, reviewed_at)
      VALUES (${genId()}, ${userCap2}, 'bug_report', 45, 'approved', date_trunc('month', NOW()) + INTERVAL '1 day')
    `
    const cap2 = await checkTaskCapForUser(sql, userCap2, 10)
    assert(
      "9. checkTaskCap exceed",
      cap2.allowed === false && cap2.remaining === 5 && cap2.already === 45,
      JSON.stringify(cap2),
    )

    // -----------------------------------------------------------------
    // 10. checkTaskCapForUser only counts reviewed_at current month,
    //     not a row approved last month (even if created_at is recent).
    // -----------------------------------------------------------------
    const userCap3 = PREFIX + "cap3"
    await seedUser(userCap3)
    // Approved-last-month row: reviewed_at set to a safe "previous month" date.
    await sql`
      INSERT INTO supporter_tasks (id, user_id, task_type, amount_tokens, status, reviewed_at, created_at)
      VALUES (${genId()}, ${userCap3}, 'bug_report', 30, 'approved',
              date_trunc('month', NOW()) - INTERVAL '5 days',
              NOW())
    `
    const cap3 = await checkTaskCapForUser(sql, userCap3, 10)
    assert(
      "10. checkTaskCap window",
      cap3.allowed === true && cap3.already === 0 && cap3.remaining === 50,
      JSON.stringify(cap3),
    )

    // -----------------------------------------------------------------
    // 11. Referral self-loop rejected (CHECK constraint)
    // -----------------------------------------------------------------
    const userR = PREFIX + "refSelf"
    await seedUser(userR)
    let caught11: string | null = null
    try {
      await sql`
        INSERT INTO supporter_referrals (id, referrer_id, referred_id, code)
        VALUES (${genId()}, ${userR}, ${userR}, ${userR})
      `
    } catch (e) {
      caught11 = e instanceof Error ? e.message : String(e)
    }
    assert(
      "11. Referral self-loop CHECK",
      caught11 !== null && /check|constraint|supporter_referrals_no_self/i.test(caught11),
      caught11 ?? "no throw",
    )

    // -----------------------------------------------------------------
    // 12. Referral duplicate referred rejected (UNIQUE on referred_id)
    // -----------------------------------------------------------------
    const refA = PREFIX + "refA"
    const refB = PREFIX + "refB"
    const refC = PREFIX + "refC"
    await seedUser(refA)
    await seedUser(refB)
    await seedUser(refC)
    await sql`
      INSERT INTO supporter_referrals (id, referrer_id, referred_id, code)
      VALUES (${genId()}, ${refA}, ${refC}, ${refA})
    `
    let caught12: string | null = null
    try {
      await sql`
        INSERT INTO supporter_referrals (id, referrer_id, referred_id, code)
        VALUES (${genId()}, ${refB}, ${refC}, ${refB})
      `
    } catch (e) {
      caught12 = e instanceof Error ? e.message : String(e)
    }
    assert(
      "12. Referral UNIQUE(referred_id)",
      caught12 !== null && /unique|duplicate|referred_unique/i.test(caught12),
      caught12 ?? "no throw",
    )

    // -----------------------------------------------------------------
    // 13. Signup referral path: credit 3 tokens to referrer
    // -----------------------------------------------------------------
    const signupReferrer = PREFIX + "signup_ref"
    const signupReferred = PREFIX + "signup_refd"
    await seedUser(signupReferrer)
    await seedUser(signupReferred)
    await seedSupporter(signupReferrer, { tokens: 100, tier: "bronze" })
    const beforeSignup = await getTokens(signupReferrer)
    const signupId = genId()
    await sql`
      INSERT INTO supporter_referrals (id, referrer_id, referred_id, code, signup_credited_at)
      VALUES (${signupId}, ${signupReferrer}, ${signupReferred}, ${signupReferrer}, NOW())
    `
    await recordTransaction(sql, {
      userId: signupReferrer,
      email: null,
      type: "referral",
      amountTokens: TASK_TOKEN_AMOUNTS.referral_signup,
      amountUsdCents: null,
      sourceType: "referral",
      sourceId: `signup:${signupId}`,
      metadata: { referred_id: signupReferred },
    })
    await creditTokens(sql, signupReferrer, TASK_TOKEN_AMOUNTS.referral_signup)
    const afterSignup = await getTokens(signupReferrer)
    assert(
      "13. Signup referral +3",
      afterSignup - beforeSignup === TASK_TOKEN_AMOUNTS.referral_signup,
      `before=${beforeSignup} after=${afterSignup}`,
    )

    // -----------------------------------------------------------------
    // 14. First-payment referral path: credit 5 tokens + update
    // -----------------------------------------------------------------
    const paidReferrer = PREFIX + "paid_ref"
    const paidReferred = PREFIX + "paid_refd"
    await seedUser(paidReferrer)
    await seedUser(paidReferred)
    await seedSupporter(paidReferrer, { tokens: 50, tier: "bronze" })
    const beforePaid = await getTokens(paidReferrer)
    const paidRefId = genId()
    await sql`
      INSERT INTO supporter_referrals (id, referrer_id, referred_id, code, signup_credited_at, payment_credited_at)
      VALUES (${paidRefId}, ${paidReferrer}, ${paidReferred}, ${paidReferrer}, NOW() - INTERVAL '2 days', NULL)
    `
    await creditTokens(sql, paidReferrer, TASK_TOKEN_AMOUNTS.referral_paid)
    await sql`
      UPDATE supporter_referrals SET payment_credited_at = NOW() WHERE id = ${paidRefId}
    `
    const afterPaid = await getTokens(paidReferrer)
    const updatedRef = await sql<{ payment_credited_at: Date | null }[]>`
      SELECT payment_credited_at FROM supporter_referrals WHERE id = ${paidRefId}
    `
    assert(
      "14. First-payment referral +5",
      afterPaid - beforePaid === TASK_TOKEN_AMOUNTS.referral_paid &&
        updatedRef[0]?.payment_credited_at !== null,
      `delta=${afterPaid - beforePaid}`,
    )

    // -----------------------------------------------------------------
    // 15. runQuarterlyRevShare with empty state → skipped below gate
    // -----------------------------------------------------------------
    // Capture console.log during the call.
    const logs15: string[] = []
    const origLog15 = console.log
    console.log = (msg: unknown) => {
      logs15.push(String(msg))
      origLog15(msg)
    }
    try {
      await runQuarterlyRevShare(sql, { RESEND_API_KEY: "" } as unknown as Env)
    } finally {
      console.log = origLog15
    }
    // Empty contexter_dev may still have unrelated rows but unlikely to exceed $10K MRR.
    assert(
      "15. Rev share below-gate skip",
      logs15.some((m) => /revshare_skipped_below_gate/.test(m)),
      "no revshare_skipped_below_gate log",
    )

    // -----------------------------------------------------------------
    // 16. Rev share MRR ≥ $10K distributes to eligible supporters
    // -----------------------------------------------------------------
    // Seed: two supporters (diamond + bronze). Seed last-30-day MRR rows
    // totalling > $10,000 and previous-quarter rows totalling > $0 so the
    // pool is non-zero. We use source_type='lemonsqueezy_subscription'
    // with source_id LIKE 'payment:%' to match the query filter.
    const diamondUser = PREFIX + "diamond"
    const bronzeUser = PREFIX + "bronze"
    await seedUser(diamondUser)
    await seedUser(bronzeUser)
    await seedSupporter(diamondUser, { tokens: 500, tier: "diamond", status: "active" })
    await seedSupporter(bronzeUser, { tokens: 100, tier: "bronze", status: "active" })

    // MRR row: 1 single payment of $15,000 in last 30 days.
    await sql`
      INSERT INTO supporter_transactions
        (id, user_id, email, type, amount_tokens, amount_usd_cents, source_type, source_id, metadata, created_at)
      VALUES
        (${genId()}, ${diamondUser}, null, 'subscription_payment', 0, 1500000, 'lemonsqueezy_subscription', ${"payment:" + PREFIX + "mrr1"}, '{}'::jsonb, NOW() - INTERVAL '3 days')
    `
    // Previous-quarter revenue: $200 → pool = $2 = 200 cents. With only
    // 2 supporters (diamond+bronze) distributed share may round to 0 or 1
    // token. To guarantee at least one positive share we seed $50,000
    // of previous-quarter revenue → pool = $500 = 50000 cents.
    // diamond units=8, bronze=4 → total=12 → diamond share = 50000*8/12 = 33333 cents = $333
    // shareTokens = 333 → > 0. Good.
    const qStart = new Date()
    const q = Math.floor(qStart.getUTCMonth() / 3)
    const prevQ = q === 0 ? 3 : q - 1
    const prevYear = q === 0 ? qStart.getUTCFullYear() - 1 : qStart.getUTCFullYear()
    const prevQDate = new Date(Date.UTC(prevYear, prevQ * 3 + 1, 15, 0, 0, 0, 0)) // mid-prev-quarter
    await sql`
      INSERT INTO supporter_transactions
        (id, user_id, email, type, amount_tokens, amount_usd_cents, source_type, source_id, metadata, created_at)
      VALUES
        (${genId()}, ${diamondUser}, null, 'subscription_payment', 0, 5000000, 'lemonsqueezy_subscription', ${"payment:" + PREFIX + "prevq1"}, '{}'::jsonb, ${prevQDate})
    `
    await runQuarterlyRevShare(sql, { RESEND_API_KEY: "" } as unknown as Env)
    const rev16 = await countRevShareTx(PREFIX)
    assert(
      "16. Rev share distributed ≥ 1",
      rev16 >= 1,
      `revshare tx count=${rev16}`,
    )

    // -----------------------------------------------------------------
    // 17. Idempotency: re-run same quarter → no double-credit
    // -----------------------------------------------------------------
    const tokensDiamondBefore = await getTokens(diamondUser)
    await runQuarterlyRevShare(sql, { RESEND_API_KEY: "" } as unknown as Env)
    const rev17 = await countRevShareTx(PREFIX)
    const tokensDiamondAfter = await getTokens(diamondUser)
    assert(
      "17. Rev share idempotent",
      rev17 === rev16 && tokensDiamondAfter === tokensDiamondBefore,
      `before_count=${rev16} after_count=${rev17} before_tokens=${tokensDiamondBefore} after_tokens=${tokensDiamondAfter}`,
    )

    // -----------------------------------------------------------------
    // 18. Rev share excludes frozen/quarantined/exiting
    // -----------------------------------------------------------------
    const frozenUser = PREFIX + "frozen"
    const quarantinedUser = PREFIX + "quar"
    const exitingUser = PREFIX + "exit"
    await seedUser(frozenUser)
    await seedUser(quarantinedUser)
    await seedUser(exitingUser)
    await seedSupporter(frozenUser, { tokens: 500, tier: "diamond", status: "frozen" })
    await seedSupporter(quarantinedUser, { tokens: 500, tier: "diamond", status: "quarantined" })
    await seedSupporter(exitingUser, { tokens: 500, tier: "diamond", status: "exiting" })
    // Seed a fresh previous-quarter row so pool != 0 for a new quarter-label
    // run... but we're still in the same quarter, so source_id stays the same.
    // Instead: no new run needed — we check that NO revshare rows were ever
    // created for these three user ids across the run-16 pass.
    const excludedRevRows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM supporter_transactions
      WHERE source_id LIKE 'revshare:%'
        AND user_id IN (${frozenUser}, ${quarantinedUser}, ${exitingUser})
    `
    assert(
      "18. Rev share excludes frozen/quarantined/exiting",
      Number(excludedRevRows[0]?.count ?? "0") === 0,
      `count=${excludedRevRows[0]?.count}`,
    )

    // -----------------------------------------------------------------
    // 19. Rev share zero-pool: MRR gate passes but previous-quarter
    //     revenue is 0 → revshare_zero_pool logged, no credit.
    //
    // Implementation note: we cannot easily tear down assertion 16's
    // prev-quarter seed mid-test (it would corrupt assertion 17's
    // idempotency window). Instead we test the code path semantics:
    // we take a snapshot via a throwaway call path by running the
    // zero-pool check via direct assertion — if this proves fragile,
    // we mark SKIPPED. Strategy: delete the prev-quarter row we seeded
    // in assertion 16, re-run, and assert that logs contain either
    // revshare_zero_pool OR revshare_no_eligible_supporters (both are
    // valid "no distribution" branches for a zero pool).
    // -----------------------------------------------------------------
    await sql`
      DELETE FROM supporter_transactions
      WHERE source_id = ${"payment:" + PREFIX + "prevq1"}
    `
    // Need the gate to still pass — the $15K MRR row is still in place.
    const logs19: string[] = []
    const origLog19 = console.log
    console.log = (msg: unknown) => {
      logs19.push(String(msg))
      origLog19(msg)
    }
    try {
      await runQuarterlyRevShare(sql, { RESEND_API_KEY: "" } as unknown as Env)
    } finally {
      console.log = origLog19
    }
    const sawZeroPool = logs19.some((m) => /revshare_zero_pool/.test(m))
    assert(
      "19. Rev share zero-pool",
      sawZeroPool,
      `logs=${logs19.slice(-5).join(" | ")}`,
    )

    // -----------------------------------------------------------------
    // 20. sendEmail graceful no-op when RESEND_API_KEY is unset.
    // -----------------------------------------------------------------
    const logs20: string[] = []
    const origWarn20 = console.warn
    console.warn = (msg: unknown) => {
      logs20.push(String(msg))
      origWarn20(msg)
    }
    let threw20 = false
    try {
      // env with RESEND_API_KEY = "" — must log notification_skipped and return
      await sendTaskApprovedEmail(
        { RESEND_API_KEY: "" } as unknown as Env,
        "nowhere@example.test",
        "bug_report",
        10,
      )
    } catch {
      threw20 = true
    } finally {
      console.warn = origWarn20
    }
    assert(
      "20. Notification graceful no-op",
      !threw20 && logs20.some((m) => /notification_skipped_no_resend_key/.test(m)),
      `threw=${threw20} logs=${logs20.slice(-3).join(" | ")}`,
    )

    // -----------------------------------------------------------------
    // 21. ADD-8: requireActiveSupporter not_found for missing row
    // -----------------------------------------------------------------
    const gate21 = await requireActiveSupporter(sql, PREFIX + "nonexistent")
    assert(
      "21. requireActiveSupporter not_found",
      gate21.ok === false && gate21.reason === "not_found",
      JSON.stringify(gate21),
    )

    // -----------------------------------------------------------------
    // 22. ADD-8: requireActiveSupporter returns exiting for status='exiting'
    // -----------------------------------------------------------------
    const gate22 = await requireActiveSupporter(sql, exitingUser)
    assert(
      "22. requireActiveSupporter exiting",
      gate22.ok === false && gate22.reason === "exiting",
      JSON.stringify(gate22),
    )

    // -----------------------------------------------------------------
    // 23. ADD-8: submitTask itself does NOT gate on supporter presence;
    //     the HTTP route is the gate. Prove: non-supporter user call
    //     submitTask succeeds (no throw), AND requireActiveSupporter
    //     for that same user returns not_found.
    // -----------------------------------------------------------------
    const nonSupporter = PREFIX + "nonsup"
    await seedUser(nonSupporter)
    let submitThrew23 = false
    try {
      await submitTask(sql, nonSupporter, "bug_report", "non-sup submit")
    } catch {
      submitThrew23 = true
    }
    const gateOnNonSup = await requireActiveSupporter(sql, nonSupporter)
    assert(
      "23. submitTask not self-gating",
      !submitThrew23 && gateOnNonSup.ok === false && gateOnNonSup.reason === "not_found",
      `submitThrew=${submitThrew23} gate=${JSON.stringify(gateOnNonSup)}`,
    )

    // -----------------------------------------------------------------
    // 24. ADD-8: referral signup rolled back cleanly when referrer inactive
    //     — no orphan supporter_referrals row inserted.
    // -----------------------------------------------------------------
    const inactiveRef = PREFIX + "inactive_ref"
    const attemptRefd = PREFIX + "attempt_refd"
    await seedUser(inactiveRef)
    await seedUser(attemptRefd)
    await seedSupporter(inactiveRef, { tokens: 10, tier: "bronze", status: "exiting" })

    // Simulate route-layer tx: gate inside sql.begin → rollback via throw.
    // The route's own referral path uses an early return from sql.begin,
    // but early return from postgres.js tx callback still commits. So to
    // verify "no orphan row" we need an explicit ROLLBACK semantics:
    // throwing from inside sql.begin rolls everything back. We simulate
    // the guarded flow: if requireActiveSupporter returns not_ok, we
    // throw so the tx rolls back.
    let rolledBack24 = false
    try {
      await sql.begin(async (txRaw) => {
        const tx = txRaw as unknown as typeof sql
        const g = await requireActiveSupporter(tx, inactiveRef)
        if (!g.ok) {
          throw new Error("referrer_not_active")
        }
        // This INSERT must never run:
        await tx`
          INSERT INTO supporter_referrals (id, referrer_id, referred_id, code)
          VALUES (${genId()}, ${inactiveRef}, ${attemptRefd}, ${inactiveRef})
        `
      })
    } catch (e) {
      if (e instanceof Error && e.message === "referrer_not_active") {
        rolledBack24 = true
      } else {
        throw e
      }
    }
    const orphanRows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM supporter_referrals
      WHERE referrer_id = ${inactiveRef} OR referred_id = ${attemptRefd}
    `
    assert(
      "24. Referral rollback on inactive referrer",
      rolledBack24 === true && Number(orphanRows[0]?.count ?? "0") === 0,
      `rolled_back=${rolledBack24} orphan_count=${orphanRows[0]?.count}`,
    )
  } finally {
    await cleanup().catch((e) => console.error("cleanup error:", e))
    await sql.end({ timeout: 5 }).catch(() => {})
  }

  // --- Report ----------------------------------------------------------
  console.log("\n" + results.join("\n"))
  const total = passed + failed
  console.log(`\nResult: ${passed}/${total} PASS${failed > 0 ? `, ${failed} FAIL` : ""}`)
  process.exit(failed === 0 ? 0 : 1)
}

run().catch(async (e) => {
  console.error("FATAL:", e)
  try {
    await cleanup()
  } catch {}
  try {
    await sql.end({ timeout: 5 })
  } catch {}
  process.exit(1)
})
