/**
 * CTX-12 Wave 2 integration test.
 *
 * Standalone Bun script against contexter_dev with 15 assertions
 * covering: tier multiplier, quarantine intake, ranking, frozen
 * exclusion, quarantine promotion sweep, spending cap, order_created
 * path unchanged, leaderboard + /me query shapes.
 *
 * Seeds with user_id prefix 'w2test_' and cleans up at the end.
 *
 * Usage:
 *   PG_DATABASE=contexter_dev bun run scripts/test-ctx-12-w2.ts
 */

import postgres from "postgres"
import {
  TIER_MULTIPLIERS,
  creditTokensWithMultiplier,
  creditTokensWithQuarantineCheck,
  creditTokens,
  tokensFromCents,
  type SupporterTier,
} from "../src/services/supporters"
import { runSupportersRanking } from "../src/services/supporters-ranking"

const sql = postgres({
  host: "localhost",
  database: process.env.PG_DATABASE ?? "contexter_dev",
  username: "cx_user",
  password: "",
})

const PREFIX = "w2test_"
const results: { name: string; pass: boolean; detail?: string }[] = []

function check(name: string, pass: boolean, detail?: string): void {
  results.push({ name, pass, detail })
}

async function cleanup(): Promise<void> {
  await sql`DELETE FROM supporter_transactions WHERE user_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "%"}`
}

async function seedUser(id: string, email: string): Promise<void> {
  await sql`
    INSERT INTO users (id, email, name)
    VALUES (${id}, ${email}, ${id})
    ON CONFLICT (id) DO NOTHING
  `
}

async function seedSupporter(
  id: string,
  tokens: number,
  status: string = "active",
  tier: SupporterTier = "pending",
): Promise<void> {
  await sql`
    INSERT INTO supporters (user_id, tokens, status, tier)
    VALUES (${id}, ${tokens}, ${status}, ${tier})
    ON CONFLICT (user_id) DO UPDATE
      SET tokens = EXCLUDED.tokens,
          status = EXCLUDED.status,
          tier = EXCLUDED.tier,
          updated_at = NOW()
  `
}

async function getSupporter(
  id: string,
): Promise<{ tokens: number; rank: number | null; tier: string; status: string } | null> {
  const rows = await sql<
    { tokens: string; rank: number | null; tier: string; status: string }[]
  >`
    SELECT tokens::text, rank, tier, status FROM supporters WHERE user_id = ${id}
  `
  const first = rows[0]
  if (!first) return null
  return {
    tokens: Number(first.tokens),
    rank: first.rank,
    tier: first.tier,
    status: first.status,
  }
}

async function main(): Promise<void> {
  await cleanup()

  // --- 1. TIER_MULTIPLIERS constant shape ---
  const shapeOk =
    TIER_MULTIPLIERS.diamond.num === 2n &&
    TIER_MULTIPLIERS.gold.num === 3n &&
    TIER_MULTIPLIERS.gold.den === 2n &&
    TIER_MULTIPLIERS.silver.num === 5n &&
    TIER_MULTIPLIERS.silver.den === 4n &&
    TIER_MULTIPLIERS.bronze.num === 1n &&
    TIER_MULTIPLIERS.pending.num === 1n
  check("1. TIER_MULTIPLIERS constant shape", shapeOk)

  // --- 2. diamond multiplier (2x) ---
  const dId = `${PREFIX}diamond`
  await seedUser(dId, `${dId}@t`)
  await seedSupporter(dId, 0, "active", "diamond")
  const dRes = await creditTokensWithMultiplier(sql, dId, 10)
  const dRow = await getSupporter(dId)
  check(
    "2. diamond x2",
    dRes.creditedTokens === 20 && dRow?.tokens === 20,
    `credited=${dRes.creditedTokens} stored=${dRow?.tokens}`,
  )

  // --- 3. silver 5/4 truncated ---
  const sId = `${PREFIX}silver`
  await seedUser(sId, `${sId}@t`)
  await seedSupporter(sId, 0, "active", "silver")
  const sRes = await creditTokensWithMultiplier(sql, sId, 10)
  check(
    "3. silver 5/4 truncated",
    sRes.creditedTokens === 12, // floor(10 * 5 / 4) = 12
    `credited=${sRes.creditedTokens} (expected 12)`,
  )

  // --- 4. pending (no multiplier) ---
  const pId = `${PREFIX}pending`
  await seedUser(pId, `${pId}@t`)
  // No supporter row → treated as pending
  const pRes = await creditTokensWithMultiplier(sql, pId, 10)
  check(
    "4. pending 1x",
    pRes.creditedTokens === 10,
    `credited=${pRes.creditedTokens}`,
  )

  // --- 5. Quarantine intake <100 supporters → active ---
  // With any existing rows from steps 2-4, ranked count is 3 (<100).
  const q1Id = `${PREFIX}q1`
  await seedUser(q1Id, `${q1Id}@t`)
  const q1Res = await creditTokensWithQuarantineCheck(sql, q1Id, 50)
  const q1Row = await getSupporter(q1Id)
  check(
    "5. intake <100 → active",
    q1Res.status === "active" && q1Row?.status === "active",
    `res=${q1Res.status} row=${q1Row?.status}`,
  )

  // --- 6. Quarantine intake when 100 active/warning exist ---
  // Seed 100 extra rows to force the count >=100 branch.
  for (let i = 0; i < 100; i++) {
    const id = `${PREFIX}pad_${String(i).padStart(3, "0")}`
    await seedUser(id, `${id}@t`)
    // Descending tokens so the 100th has tokens=100 (threshold for promotion test).
    await seedSupporter(id, 1000 - i, "active", "pending")
  }
  const q2Id = `${PREFIX}q2`
  await seedUser(q2Id, `${q2Id}@t`)
  const q2Res = await creditTokensWithQuarantineCheck(sql, q2Id, 50)
  const q2Row = await getSupporter(q2Id)
  check(
    "6. intake >=100 → quarantined",
    q2Res.status === "quarantined" && q2Row?.status === "quarantined",
    `res=${q2Res.status} row=${q2Row?.status}`,
  )

  // --- 7. runSupportersRanking assigns tiers correctly for top 15 ---
  // First cleanup the extra pad rows, then re-seed exactly 15 so tiering is deterministic.
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "pad_%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "pad_%"}`
  await sql`DELETE FROM supporters WHERE user_id IN (${dId}, ${sId}, ${pId}, ${q1Id}, ${q2Id})`
  await sql`DELETE FROM users WHERE id IN (${dId}, ${sId}, ${pId}, ${q1Id}, ${q2Id})`

  for (let i = 0; i < 15; i++) {
    const id = `${PREFIX}rank_${String(i).padStart(2, "0")}`
    await seedUser(id, `${id}@t`)
    await seedSupporter(id, 1000 - i, "active", "pending")
  }
  await runSupportersRanking(sql)
  const rankRows = await sql<{ rank: number; tier: string }[]>`
    SELECT rank, tier FROM supporters WHERE user_id LIKE ${PREFIX + "rank_%"} ORDER BY rank ASC
  `
  const rank7Ok =
    rankRows.length === 15 &&
    rankRows.slice(0, 10).every((r) => r.tier === "diamond") &&
    rankRows.slice(10, 15).every((r) => r.tier === "gold")
  check(
    "7. ranking: 1..10 diamond, 11..15 gold",
    rank7Ok,
    `count=${rankRows.length}`,
  )

  // --- 8. runSupportersRanking skips frozen rows ---
  const frozenId = `${PREFIX}frozen`
  await seedUser(frozenId, `${frozenId}@t`)
  await seedSupporter(frozenId, 9999, "frozen", "pending") // high tokens, would be #1
  await runSupportersRanking(sql)
  const frozenRow = await getSupporter(frozenId)
  check(
    "8. frozen row skipped by ranking",
    frozenRow?.rank === null && frozenRow?.tier === "pending",
    `rank=${frozenRow?.rank} tier=${frozenRow?.tier}`,
  )

  // --- 9. Quarantine promotion sweep ---
  // Cleanup rank rows, then seed exactly 100 active + 1 quarantined with higher tokens
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "rank_%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "rank_%"}`
  await sql`DELETE FROM supporters WHERE user_id = ${frozenId}`
  await sql`DELETE FROM users WHERE id = ${frozenId}`

  for (let i = 0; i < 100; i++) {
    const id = `${PREFIX}promo_${String(i).padStart(3, "0")}`
    await seedUser(id, `${id}@t`)
    await seedSupporter(id, 1000 - i, "active", "pending")
  }
  const promoId = `${PREFIX}promo_new`
  await seedUser(promoId, `${promoId}@t`)
  // Quarantined row with 5000 tokens — way more than #100 (which has ~901)
  await seedSupporter(promoId, 5000, "quarantined", "pending")

  await runSupportersRanking(sql)

  const promoRow = await getSupporter(promoId)
  // After promotion: promoId should be active, and the previous #100 (promo_099 with 901) should be quarantined
  const prev100 = await getSupporter(`${PREFIX}promo_099`)
  check(
    "9. promotion sweep swaps #100 with high-tokens quarantined",
    promoRow?.status === "active" && prev100?.status === "quarantined",
    `promo.status=${promoRow?.status} prev100.status=${prev100?.status}`,
  )

  // Cleanup promotion test data
  await sql`DELETE FROM supporters WHERE user_id LIKE ${PREFIX + "promo_%"}`
  await sql`DELETE FROM users WHERE id LIKE ${PREFIX + "promo_%"}`

  // --- 10..12. Spending cap (simulated directly against supporter_transactions) ---
  const capId = `${PREFIX}cap`
  await seedUser(capId, `${capId}@t`)
  // Not a supporter yet — creditTokensWithMultiplier treats as pending 1x
  // Simulate the webhook path manually: record tx, then apply cap logic.

  async function simulateSubPayment(
    invoiceId: string,
    subtotalCents: number,
  ): Promise<{ credited: number; capped: boolean }> {
    const tokens = tokensFromCents(subtotalCents)
    const txId = `${PREFIX}tx_${invoiceId}`
    await sql`
      INSERT INTO supporter_transactions
        (id, user_id, email, type, amount_tokens, amount_usd_cents,
         source_type, source_id, metadata, matched_at)
      VALUES
        (${txId}, ${capId}, null, 'subscription_payment', ${tokens}, ${subtotalCents},
         'lemonsqueezy_subscription', ${"payment:" + invoiceId}, '{}'::jsonb, NOW())
    `
    const alreadyRows = await sql<{ sum: string | null }[]>`
      SELECT COALESCE(SUM(amount_tokens), 0)::text AS sum
      FROM supporter_transactions
      WHERE user_id = ${capId}
        AND source_type = 'lemonsqueezy_subscription'
        AND source_id LIKE 'payment:%'
        AND created_at >= date_trunc('month', NOW())
        AND id != ${txId}
    `
    const alreadyBig = BigInt(alreadyRows[0]?.sum ?? "0")
    const CAP = 500n
    const remaining = CAP > alreadyBig ? CAP - alreadyBig : 0n
    const requested = BigInt(tokens)
    const toCreditBig = remaining < requested ? remaining : requested
    const toCredit = Number(toCreditBig)
    if (toCredit > 0) {
      await creditTokensWithMultiplier(sql, capId, toCredit)
    }
    return { credited: toCredit, capped: toCredit === 0 }
  }

  const pay1 = await simulateSubPayment("INV1", 30000) // 300 tokens
  check("10. first $300 sub payment → credit 300", pay1.credited === 300)

  const pay2 = await simulateSubPayment("INV2", 30000) // 300 tokens → only 200 remaining
  check("11. second $300 sub payment same month → credit 200", pay2.credited === 200)

  const pay3 = await simulateSubPayment("INV3", 30000) // 300 tokens → 0 remaining
  check("12. third $300 sub payment same month → capped at 0", pay3.credited === 0 && pay3.capped)

  // --- 13. order_created path unchanged (no cap, no multiplier on credit) ---
  // The order_created handler uses creditTokensWithQuarantineCheck which delegates to creditTokens.
  // Verify that a 500-token order credit goes through unchanged.
  const orderId = `${PREFIX}order`
  await seedUser(orderId, `${orderId}@t`)
  await creditTokens(sql, orderId, 500)
  const orderRow = await getSupporter(orderId)
  check(
    "13. order_created base path credits exact amount",
    orderRow?.tokens === 500,
    `tokens=${orderRow?.tokens}`,
  )

  // --- 14. Public leaderboard query shape ---
  const boardRows = await sql<
    { tokens: string; rank: number | null; tier: string; status: string; name: string | null }[]
  >`
    SELECT s.tokens::text, s.rank, s.tier, s.status, u.name
    FROM supporters s
    JOIN users u ON u.id = s.user_id
    WHERE s.status IN ('active', 'warning')
    ORDER BY s.tokens DESC, s.joined_at ASC
    LIMIT 100
  `
  check(
    "14. public leaderboard query returns rows with required columns",
    Array.isArray(boardRows) &&
      boardRows.every(
        (r) =>
          typeof r.tokens === "string" &&
          (r.rank === null || typeof r.rank === "number") &&
          typeof r.tier === "string" &&
          typeof r.status === "string",
      ),
  )

  // --- 15. /me query shape ---
  const meRows = await sql<
    {
      tokens: string
      rank: number | null
      tier: string
      status: string
      warning_sent_at: Date | null
      freeze_start: Date | null
      freeze_end: Date | null
      joined_at: Date
    }[]
  >`
    SELECT tokens::text, rank, tier, status, warning_sent_at, freeze_start, freeze_end, joined_at
    FROM supporters
    WHERE user_id = ${capId}
    LIMIT 1
  `
  check("15. /me query returns supporter row", meRows.length === 1)

  // --- Cleanup ---
  await cleanup()
  await sql.end()

  // --- Report ---
  const passed = results.filter((r) => r.pass).length
  const failed = results.length - passed
  console.log("\n=== W2 integration test ===")
  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL"
    const detail = r.detail ? ` (${r.detail})` : ""
    console.log(`${mark} ${r.name}${detail}`)
  }
  console.log(`\nTotal: ${passed}/${results.length} passed`)
  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(async (err) => {
  console.error("W2 test script error:", err)
  try {
    await cleanup()
  } catch {}
  try {
    await sql.end()
  } catch {}
  process.exit(1)
})
