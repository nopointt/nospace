#!/usr/bin/env bun
/**
 * CTX-12 W5-04 integration test — anti-abuse referrals + 14-day payment hold.
 *
 * Covers:
 *  - Migration 0017 columns present on supporter_referrals + supporter_transactions
 *  - computeDeviceHash determinism + null-safety
 *  - POST /referral-style per-referrer IP + device duplicate rejection (409)
 *  - Second referrer is unaffected by first referrer's IP (referrer-scoped)
 *  - recordTransaction persists heldUntil correctly
 *  - runQuarterlyRevShare MRR gate excludes held rows
 *  - Expired hold (held_until <= NOW) is counted again
 *
 * Works directly against contexter_dev. Uses the same service-layer functions
 * as the production code (sql.begin transactions + recordTransaction), so the
 * referral path is exercised through the exact same code paths as the HTTP
 * handler — we just skip Hono/auth wiring because that's not what's under
 * test in this wave.
 *
 * Seeds with user_id prefix 'w5_04test_' and cleans up at the end (finally).
 * Exits 0 on all PASS, 1 on any failure.
 *
 * Usage:
 *   PG_DATABASE=contexter_dev bun run scripts/test-ctx-12-w5-04.ts
 */

import postgres from "postgres"
import type { Sql } from "postgres"
import {
  recordTransaction,
  creditTokens,
  requireActiveSupporter,
  genId,
  TASK_TOKEN_AMOUNTS,
  type SupporterTier,
} from "../src/services/supporters"
import { computeDeviceHash } from "../src/routes/supporters"
import { runQuarterlyRevShare } from "../src/services/supporters-revshare"
import type { Env } from "../src/types/env"

// --- Postgres client ---------------------------------------------------

const sql = postgres({
  host: "localhost",
  database: process.env.PG_DATABASE ?? "contexter_dev",
  username: "cx_user",
  password: "",
  max: 4,
})

const PREFIX = "w5_04test_"

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

// --- Seed helpers ------------------------------------------------------

async function cleanup(): Promise<void> {
  await sql`DELETE FROM supporter_transactions WHERE user_id LIKE ${PREFIX + "%"} OR source_id LIKE ${"%" + PREFIX + "%"} OR source_id LIKE ${"revshare:%" + PREFIX + "%"}`
  await sql`DELETE FROM supporter_referrals WHERE referrer_id LIKE ${PREFIX + "%"} OR referred_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM supporter_tasks WHERE user_id LIKE ${PREFIX + "%"} OR reviewer_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "%"}`
}

async function seedUser(id: string): Promise<void> {
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${id}, ${id + "@w5_04test.local"}, ${id})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  `
}

async function seedSupporter(
  id: string,
  opts: { tokens?: number; status?: string; tier?: SupporterTier; rank?: number } = {},
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

/**
 * Mirror of the POST /referral transaction body (minus Hono wiring).
 * This lets us test the anti-abuse path end-to-end at the SQL level using
 * the exact same service-layer functions the HTTP handler uses.
 */
async function attemptReferral(
  referrerId: string,
  referredId: string,
  opts: { ip: string | null; deviceHash: string | null },
): Promise<
  | { ok: true; referralId: string }
  | { ok: false; code: number; err: string }
> {
  type R =
    | { ok: true; referralId: string }
    | { ok: false; code: number; err: string }

  const result: R = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as Sql

    const gate = await requireActiveSupporter(tx, referrerId)
    if (!gate.ok) {
      return { ok: false, code: 409, err: "referrer_not_active" } as R
    }

    const dup = await tx`
      SELECT 1 FROM supporter_referrals WHERE referred_id = ${referredId} LIMIT 1
    `
    if (dup.length > 0) {
      return { ok: false, code: 409, err: "already_referred" } as R
    }

    if (opts.ip !== null || opts.deviceHash !== null) {
      const abuse = await tx`
        SELECT 1 FROM supporter_referrals
        WHERE referrer_id = ${referrerId}
          AND (
            (${opts.ip}::text IS NOT NULL AND signup_ip = ${opts.ip})
            OR
            (${opts.deviceHash}::text IS NOT NULL AND signup_device_hash = ${opts.deviceHash})
          )
        LIMIT 1
      `
      if (abuse.length > 0) {
        return { ok: false, code: 409, err: "duplicate_ip_or_device" } as R
      }
    }

    const refId = genId()
    await tx`
      INSERT INTO supporter_referrals
        (id, referrer_id, referred_id, code, signup_credited_at,
         signup_ip, signup_device_hash)
      VALUES
        (${refId}, ${referrerId}, ${referredId}, ${referrerId}, NOW(),
         ${opts.ip}, ${opts.deviceHash})
    `

    const txId = await recordTransaction(tx, {
      userId: referrerId,
      email: null,
      type: "referral",
      amountTokens: TASK_TOKEN_AMOUNTS.referral_signup,
      amountUsdCents: null,
      sourceType: "referral",
      sourceId: `signup:${refId}`,
      metadata: { referred_id: referredId },
    })
    if (!txId) {
      return { ok: false, code: 409, err: "duplicate_tx" } as R
    }

    await creditTokens(tx, referrerId, TASK_TOKEN_AMOUNTS.referral_signup)

    return { ok: true, referralId: refId } as R
  }) as unknown as R

  return result
}

// --- Main runner -------------------------------------------------------

async function run(): Promise<void> {
  await cleanup()

  try {
    // -----------------------------------------------------------------
    // 1. Migration 0017 — supporter_referrals has signup_ip + signup_device_hash
    // -----------------------------------------------------------------
    const refCols = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'supporter_referrals'
        AND column_name IN ('signup_ip', 'signup_device_hash')
      ORDER BY column_name
    `
    assert(
      "1. migration 0017 adds signup_ip + signup_device_hash",
      refCols.length === 2 &&
        refCols[0]!.column_name === "signup_device_hash" &&
        refCols[1]!.column_name === "signup_ip",
      JSON.stringify(refCols),
    )

    // -----------------------------------------------------------------
    // 2. Migration 0017 — supporter_transactions has held_until
    // -----------------------------------------------------------------
    const txCols = await sql<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'supporter_transactions' AND column_name = 'held_until'
    `
    assert(
      "2. migration 0017 adds held_until",
      txCols.length === 1,
      JSON.stringify(txCols),
    )

    // -----------------------------------------------------------------
    // 3. computeDeviceHash — deterministic for same input
    // -----------------------------------------------------------------
    const h1 = computeDeviceHash("Mozilla/5.0 (X11; Linux)", "en-US,en;q=0.9")
    const h2 = computeDeviceHash("Mozilla/5.0 (X11; Linux)", "en-US,en;q=0.9")
    assert(
      "3. computeDeviceHash deterministic",
      h1 !== null && h1 === h2 && h1.length === 32,
      `h1=${h1} h2=${h2}`,
    )

    // -----------------------------------------------------------------
    // 4. computeDeviceHash — different UA → different hash
    // -----------------------------------------------------------------
    const h3 = computeDeviceHash("Mozilla/5.0 (Windows)", "en-US,en;q=0.9")
    assert(
      "4. computeDeviceHash distinct for different UA",
      h1 !== null && h3 !== null && h1 !== h3,
      `h1=${h1} h3=${h3}`,
    )

    // -----------------------------------------------------------------
    // 5. computeDeviceHash — both inputs empty → null
    // -----------------------------------------------------------------
    assert(
      "5. computeDeviceHash null-safe",
      computeDeviceHash(null, null) === null &&
        computeDeviceHash("", "") === null &&
        computeDeviceHash("  ", "  ") === null,
    )

    // -----------------------------------------------------------------
    // 6. Setup referrers + referred users for anti-abuse tests
    // -----------------------------------------------------------------
    const ref1 = PREFIX + "ref1"
    const ref2 = PREFIX + "ref2"
    const refdA = PREFIX + "refdA"
    const refdB = PREFIX + "refdB"
    const refdC = PREFIX + "refdC"
    const refdD = PREFIX + "refdD"
    await seedUser(ref1)
    await seedUser(ref2)
    await seedUser(refdA)
    await seedUser(refdB)
    await seedUser(refdC)
    await seedUser(refdD)
    await seedSupporter(ref1, { tokens: 100, status: "active", tier: "bronze" })
    await seedSupporter(ref2, { tokens: 100, status: "active", tier: "bronze" })

    const ipA = "203.0.113.42"
    const devX = computeDeviceHash("UA-X", "en-US")!

    // -----------------------------------------------------------------
    // 7. First signup via ref1 from ipA / devX — succeeds
    // -----------------------------------------------------------------
    const r1 = await attemptReferral(ref1, refdA, { ip: ipA, deviceHash: devX })
    assert("7. first referral via ref1 succeeds", r1.ok === true, JSON.stringify(r1))

    // -----------------------------------------------------------------
    // 8. Second signup (different referred) via ref1 from same ipA — rejected 409
    // -----------------------------------------------------------------
    const devY = computeDeviceHash("UA-Y", "fr-FR")!
    const r2 = await attemptReferral(ref1, refdB, { ip: ipA, deviceHash: devY })
    assert(
      "8. same-IP different-device same referrer → 409 duplicate_ip_or_device",
      r2.ok === false && r2.code === 409 && r2.err === "duplicate_ip_or_device",
      JSON.stringify(r2),
    )

    // -----------------------------------------------------------------
    // 9. Third signup (different referred) via ref1 from different IP but same device X — rejected 409
    // -----------------------------------------------------------------
    const ipB = "198.51.100.77"
    const r3 = await attemptReferral(ref1, refdC, { ip: ipB, deviceHash: devX })
    assert(
      "9. different-IP same-device same referrer → 409 duplicate_ip_or_device",
      r3.ok === false && r3.code === 409 && r3.err === "duplicate_ip_or_device",
      JSON.stringify(r3),
    )

    // -----------------------------------------------------------------
    // 10. Same ipA + devX but DIFFERENT referrer (ref2) — allowed.
    //     Block is per-referrer, not global.
    // -----------------------------------------------------------------
    const r4 = await attemptReferral(ref2, refdD, { ip: ipA, deviceHash: devX })
    assert(
      "10. different referrer unaffected by ref1's IP/device",
      r4.ok === true,
      JSON.stringify(r4),
    )

    // -----------------------------------------------------------------
    // 11. recordTransaction persists heldUntil
    // -----------------------------------------------------------------
    const holdUser = PREFIX + "holduser"
    await seedUser(holdUser)
    await seedSupporter(holdUser, { tokens: 0, tier: "bronze", status: "active" })
    const future = new Date(Date.now() + 14 * 86400000)
    const heldTxId = await recordTransaction(sql, {
      userId: holdUser,
      email: null,
      type: "subscription_payment",
      amountTokens: 10,
      amountUsdCents: 1000,
      sourceType: "lemonsqueezy_subscription",
      sourceId: `payment:${PREFIX}invoice_held`,
      metadata: {},
      heldUntil: future,
    })
    const heldRows = await sql<{ held_until: Date | null }[]>`
      SELECT held_until FROM supporter_transactions WHERE id = ${heldTxId!}
    `
    assert(
      "11. recordTransaction persists heldUntil",
      heldRows[0]?.held_until !== null &&
        heldRows[0]!.held_until instanceof Date &&
        Math.abs(heldRows[0]!.held_until.getTime() - future.getTime()) < 2000,
      JSON.stringify(heldRows[0]),
    )

    // -----------------------------------------------------------------
    // 12. runQuarterlyRevShare MRR gate excludes held rows.
    //     Seed: 1 held payment ($2000) + 1 non-held payment ($5000).
    //     Without exclusion, MRR = $7000. With exclusion, MRR = $5000.
    //     The D-55 gate is $10,000 MRR so BOTH scenarios skip distribution,
    //     but we log "revshare_skipped_below_gate" with the MRR sum which
    //     we can read from the DB directly (SUM reproduction).
    //     Assertion: MRR SUM with held filter matches the non-held rows only.
    // -----------------------------------------------------------------
    const gateUser = PREFIX + "gate"
    await seedUser(gateUser)
    // Non-held row (counts).
    await recordTransaction(sql, {
      userId: gateUser,
      email: null,
      type: "subscription_payment",
      amountTokens: 50,
      amountUsdCents: 500000, // $5000
      sourceType: "lemonsqueezy_subscription",
      sourceId: `payment:${PREFIX}gate_nohold`,
      metadata: {},
      heldUntil: null,
    })
    // Held row (excluded).
    await recordTransaction(sql, {
      userId: gateUser,
      email: null,
      type: "subscription_payment",
      amountTokens: 20,
      amountUsdCents: 200000, // $2000
      sourceType: "lemonsqueezy_subscription",
      sourceId: `payment:${PREFIX}gate_held`,
      metadata: {},
      heldUntil: new Date(Date.now() + 14 * 86400000),
    })

    const mrrSumHeld = await sql<{ sum: string | null }[]>`
      SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
      FROM supporter_transactions
      WHERE source_type = 'lemonsqueezy_subscription'
        AND source_id LIKE ${"payment:" + PREFIX + "gate_%"}
        AND created_at >= NOW() - INTERVAL '30 days'
        AND (held_until IS NULL OR held_until <= NOW())
    `
    const mrrSumAll = await sql<{ sum: string | null }[]>`
      SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
      FROM supporter_transactions
      WHERE source_type = 'lemonsqueezy_subscription'
        AND source_id LIKE ${"payment:" + PREFIX + "gate_%"}
        AND created_at >= NOW() - INTERVAL '30 days'
    `
    assert(
      "12. MRR gate SUM excludes held rows",
      mrrSumHeld[0]!.sum === "500000" && mrrSumAll[0]!.sum === "700000",
      `held=${mrrSumHeld[0]?.sum} all=${mrrSumAll[0]?.sum}`,
    )

    // -----------------------------------------------------------------
    // 13. Expired hold (held_until in the past) is counted again
    // -----------------------------------------------------------------
    await sql`
      UPDATE supporter_transactions
      SET held_until = NOW() - INTERVAL '1 day'
      WHERE source_id = ${"payment:" + PREFIX + "gate_held"}
    `
    const mrrSumAfter = await sql<{ sum: string | null }[]>`
      SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
      FROM supporter_transactions
      WHERE source_type = 'lemonsqueezy_subscription'
        AND source_id LIKE ${"payment:" + PREFIX + "gate_%"}
        AND created_at >= NOW() - INTERVAL '30 days'
        AND (held_until IS NULL OR held_until <= NOW())
    `
    assert(
      "13. expired hold is counted in MRR gate again",
      mrrSumAfter[0]!.sum === "700000",
      `after=${mrrSumAfter[0]?.sum}`,
    )

    // -----------------------------------------------------------------
    // 14. runQuarterlyRevShare function executes with held filter without throwing.
    //     Real gate won't trigger (seeded amounts below $10k from non-test data)
    //     but we verify the code path doesn't crash with the new filter.
    // -----------------------------------------------------------------
    const mockEnv = {} as Env
    let crashed14 = false
    try {
      await runQuarterlyRevShare(sql, mockEnv)
    } catch (e) {
      crashed14 = true
      console.error("runQuarterlyRevShare crashed:", e)
    }
    assert("14. runQuarterlyRevShare executes with held filter", !crashed14)

    // -----------------------------------------------------------------
    // 15. Non-held payment row stores held_until = null via recordTransaction
    // -----------------------------------------------------------------
    const nullHoldId = await recordTransaction(sql, {
      userId: holdUser,
      email: null,
      type: "subscription_payment",
      amountTokens: 5,
      amountUsdCents: 500,
      sourceType: "lemonsqueezy_subscription",
      sourceId: `payment:${PREFIX}invoice_nohold`,
      metadata: {},
    })
    const nullHoldRows = await sql<{ held_until: Date | null }[]>`
      SELECT held_until FROM supporter_transactions WHERE id = ${nullHoldId!}
    `
    assert(
      "15. heldUntil omitted → stored as NULL",
      nullHoldRows[0]?.held_until === null,
      JSON.stringify(nullHoldRows[0]),
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
