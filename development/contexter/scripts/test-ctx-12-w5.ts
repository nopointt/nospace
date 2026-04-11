#!/usr/bin/env bun
/**
 * CTX-12 Wave 5 integration test.
 *
 * Standalone Bun script against contexter_dev covering:
 *  - W5-02: runSoftDemotion ladder (30/60/90d), re-activation, tier guards
 *  - W5-03: runTokenExpiry (365d inactivity zeroes tokens, preserves row)
 *
 * Seeds with user_id prefix 'w5test_' and cleans up at the end (finally).
 * Exits 0 on all PASS, 1 on any failure.
 *
 * Usage:
 *   PG_DATABASE=contexter_dev bun run scripts/test-ctx-12-w5.ts
 */

import postgres from "postgres"
import { runSoftDemotion, runTokenExpiry } from "../src/services/supporters-lifecycle"
import { genId, type SupporterTier } from "../src/services/supporters"
import type { Env } from "../src/types/env"

// --- Postgres client ---------------------------------------------------

const sql = postgres({
  host: "localhost",
  database: process.env.PG_DATABASE ?? "contexter_dev",
  username: "cx_user",
  password: "",
  max: 4,
})

const PREFIX = "w5test_"
const ENV = { RESEND_API_KEY: "" } as unknown as Env

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
  await sql`DELETE FROM supporter_transactions WHERE user_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "%"}`
}

async function seedUser(id: string, email?: string): Promise<void> {
  const finalEmail = email ?? `${id}@w5test.local`
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${id}, ${finalEmail}, ${id})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
  `
}

interface SupporterSeedOpts {
  tokens?: number
  status?: string
  tier?: SupporterTier
  rank?: number | null
  joinedDaysAgo?: number
  warningDaysAgo?: number | null
}

async function seedSupporter(id: string, opts: SupporterSeedOpts = {}): Promise<void> {
  const tokens = opts.tokens ?? 0
  const status = opts.status ?? "active"
  const tier = opts.tier ?? "bronze"
  const rank = opts.rank ?? 50
  const joinedDaysAgo = opts.joinedDaysAgo ?? 0
  const joinedAt = new Date(Date.now() - joinedDaysAgo * 86_400_000)
  const warningSentAt =
    opts.warningDaysAgo !== undefined && opts.warningDaysAgo !== null
      ? new Date(Date.now() - opts.warningDaysAgo * 86_400_000)
      : null

  await sql`
    INSERT INTO supporters (user_id, tokens, status, tier, rank, joined_at, warning_sent_at)
    VALUES (${id}, ${tokens}, ${status}, ${tier}, ${rank}, ${joinedAt}, ${warningSentAt})
    ON CONFLICT (user_id) DO UPDATE
      SET tokens = EXCLUDED.tokens,
          status = EXCLUDED.status,
          tier = EXCLUDED.tier,
          rank = EXCLUDED.rank,
          joined_at = EXCLUDED.joined_at,
          warning_sent_at = EXCLUDED.warning_sent_at,
          updated_at = NOW()
  `
}

/**
 * Insert a supporter_transaction row at a specific age (days ago). Used to
 * control last_activity deterministically without waiting real time.
 */
async function seedTransactionDaysAgo(userId: string, daysAgo: number): Promise<void> {
  const createdAt = new Date(Date.now() - daysAgo * 86_400_000)
  await sql`
    INSERT INTO supporter_transactions
      (id, user_id, email, type, amount_tokens, amount_usd_cents, source_type, source_id, metadata, created_at)
    VALUES
      (${genId()}, ${userId}, null, 'purchase', 100, 10000, 'manual', ${"w5seed:" + genId()}, '{}'::jsonb, ${createdAt})
  `
}

interface SupporterSnapshot {
  tokens: number
  tier: string
  status: string
  warning_sent_at: Date | null
}

async function getSupporter(userId: string): Promise<SupporterSnapshot | null> {
  const rows = await sql<{ tokens: string; tier: string; status: string; warning_sent_at: Date | null }[]>`
    SELECT tokens::text, tier, status, warning_sent_at FROM supporters WHERE user_id = ${userId}
  `
  const row = rows[0]
  if (!row) return null
  return {
    tokens: Number(row.tokens),
    tier: row.tier,
    status: row.status,
    warning_sent_at: row.warning_sent_at,
  }
}

// --- Main runner -------------------------------------------------------

async function run(): Promise<void> {
  await cleanup()

  try {
    // -----------------------------------------------------------------
    // 1. Fresh supporter (joined 5 days ago, no transactions, no warning)
    //    → soft demotion is a no-op.
    // -----------------------------------------------------------------
    const u1 = PREFIX + "fresh"
    await seedUser(u1)
    await seedSupporter(u1, { tokens: 50, tier: "gold", status: "active", joinedDaysAgo: 5 })
    await runSoftDemotion(sql, ENV)
    const s1 = await getSupporter(u1)
    assert(
      "1. Fresh supporter no-op",
      s1 !== null && s1.warning_sent_at === null && s1.tier === "gold" && s1.status === "active",
      JSON.stringify(s1),
    )

    // -----------------------------------------------------------------
    // 2. 31-day inactive → warning_sent_at is set, status/tier unchanged.
    // -----------------------------------------------------------------
    const u2 = PREFIX + "warn"
    await seedUser(u2)
    await seedSupporter(u2, { tokens: 50, tier: "gold", status: "active", joinedDaysAgo: 60 })
    await seedTransactionDaysAgo(u2, 31)
    await runSoftDemotion(sql, ENV)
    const s2 = await getSupporter(u2)
    assert(
      "2. 31d inactive → warning",
      s2 !== null && s2.warning_sent_at !== null && s2.tier === "gold" && s2.status === "active",
      JSON.stringify(s2),
    )

    // -----------------------------------------------------------------
    // 3. 61-day inactive, warning 31 days ago, tier=gold
    //    → demoted to bronze (stage 2).
    // -----------------------------------------------------------------
    const u3 = PREFIX + "demote"
    await seedUser(u3)
    await seedSupporter(u3, {
      tokens: 50,
      tier: "gold",
      status: "active",
      joinedDaysAgo: 120,
      warningDaysAgo: 31,
    })
    await seedTransactionDaysAgo(u3, 61)
    await runSoftDemotion(sql, ENV)
    const s3 = await getSupporter(u3)
    assert(
      "3. 61d inactive + warned 31d → bronze",
      s3 !== null && s3.tier === "bronze" && s3.status === "active",
      JSON.stringify(s3),
    )

    // -----------------------------------------------------------------
    // 4. 91-day inactive, warning 61 days ago → status='exiting' (stage 3).
    // -----------------------------------------------------------------
    const u4 = PREFIX + "exit"
    await seedUser(u4)
    await seedSupporter(u4, {
      tokens: 50,
      tier: "bronze",
      status: "active",
      joinedDaysAgo: 180,
      warningDaysAgo: 61,
    })
    await seedTransactionDaysAgo(u4, 91)
    await runSoftDemotion(sql, ENV)
    const s4 = await getSupporter(u4)
    assert(
      "4. 91d inactive + warned 61d → exiting",
      s4 !== null && s4.status === "exiting",
      JSON.stringify(s4),
    )

    // -----------------------------------------------------------------
    // 5. Re-activation: warning set, new transaction after warning_sent_at
    //    → warning cleared, status/tier preserved.
    // -----------------------------------------------------------------
    const u5 = PREFIX + "reactivate"
    await seedUser(u5)
    await seedSupporter(u5, {
      tokens: 50,
      tier: "gold",
      status: "active",
      joinedDaysAgo: 120,
      warningDaysAgo: 10, // warned 10 days ago
    })
    // New transaction 2 days ago (after the warning that was sent 10 days ago).
    await seedTransactionDaysAgo(u5, 2)
    await runSoftDemotion(sql, ENV)
    const s5 = await getSupporter(u5)
    assert(
      "5. Re-activation clears warning",
      s5 !== null && s5.warning_sent_at === null && s5.tier === "gold" && s5.status === "active",
      JSON.stringify(s5),
    )

    // -----------------------------------------------------------------
    // 6. status='exiting' supporters → skipped by the main WHERE clause
    //    (query filters status IN ('active','warning')). No re-demote.
    // -----------------------------------------------------------------
    const u6 = PREFIX + "already_exiting"
    await seedUser(u6)
    await seedSupporter(u6, {
      tokens: 50,
      tier: "silver",
      status: "exiting",
      joinedDaysAgo: 200,
      warningDaysAgo: 100,
    })
    await seedTransactionDaysAgo(u6, 100)
    await runSoftDemotion(sql, ENV)
    const s6 = await getSupporter(u6)
    // Must remain exiting, tier silver, warning unchanged (not cleared).
    assert(
      "6. status=exiting is skipped",
      s6 !== null && s6.status === "exiting" && s6.tier === "silver",
      JSON.stringify(s6),
    )

    // -----------------------------------------------------------------
    // 10. Bronze tier + 61d inactive + warned 31d → stays bronze
    //     (guard: tier !== 'bronze' prevents the UPDATE branch).
    //     The exit branch requires ≥60 warned days, so 31 warned days
    //     does not trigger stage 3 either. Expected: unchanged.
    // -----------------------------------------------------------------
    const u10 = PREFIX + "bronze_stay"
    await seedUser(u10)
    await seedSupporter(u10, {
      tokens: 50,
      tier: "bronze",
      status: "active",
      joinedDaysAgo: 120,
      warningDaysAgo: 31,
    })
    await seedTransactionDaysAgo(u10, 61)
    await runSoftDemotion(sql, ENV)
    const s10 = await getSupporter(u10)
    assert(
      "10. Bronze + warned 31d → no change",
      s10 !== null && s10.tier === "bronze" && s10.status === "active" && s10.warning_sent_at !== null,
      JSON.stringify(s10),
    )

    // -----------------------------------------------------------------
    // W5-03 Token Expiry
    // -----------------------------------------------------------------

    // 7. Supporter with 100 tokens, last activity 366 days ago → tokens=0.
    //    Row is preserved (only tokens zeroed).
    // -----------------------------------------------------------------
    const u7 = PREFIX + "expiry_old"
    await seedUser(u7)
    await seedSupporter(u7, { tokens: 100, tier: "bronze", status: "active", joinedDaysAgo: 400 })
    await seedTransactionDaysAgo(u7, 366)
    await runTokenExpiry(sql)
    const s7 = await getSupporter(u7)
    assert(
      "7. 366d inactive → tokens zeroed",
      s7 !== null && s7.tokens === 0 && s7.status === "active",
      JSON.stringify(s7),
    )

    // -----------------------------------------------------------------
    // 8. Supporter with 100 tokens, last activity 30 days ago → unchanged.
    // -----------------------------------------------------------------
    const u8 = PREFIX + "expiry_fresh"
    await seedUser(u8)
    await seedSupporter(u8, { tokens: 100, tier: "gold", status: "active", joinedDaysAgo: 60 })
    await seedTransactionDaysAgo(u8, 30)
    await runTokenExpiry(sql)
    const s8 = await getSupporter(u8)
    assert(
      "8. 30d inactive → tokens unchanged",
      s8 !== null && s8.tokens === 100,
      JSON.stringify(s8),
    )

    // -----------------------------------------------------------------
    // 9. Supporter with 0 tokens, long inactive → unchanged no-op
    //    (the `tokens > 0` guard keeps this row out of the UPDATE set).
    // -----------------------------------------------------------------
    const u9 = PREFIX + "expiry_zero"
    await seedUser(u9)
    await seedSupporter(u9, { tokens: 0, tier: "bronze", status: "active", joinedDaysAgo: 500 })
    await seedTransactionDaysAgo(u9, 500)
    await runTokenExpiry(sql)
    const s9 = await getSupporter(u9)
    assert(
      "9. 0 tokens → no-op",
      s9 !== null && s9.tokens === 0,
      JSON.stringify(s9),
    )
  } finally {
    await cleanup().catch((e) => console.error("cleanup error:", e))
    await sql.end({ timeout: 5 }).catch(() => {})
  }

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
