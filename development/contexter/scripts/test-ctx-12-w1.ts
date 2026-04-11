#!/usr/bin/env bun
/**
 * CTX-12 W1 integration test — exercises the supporters service against
 * a local PostgreSQL (default: contexter_dev on localhost).
 *
 * Override DB via env vars:
 *   PG_DATABASE (default "contexter_dev")
 *   PG_USER     (default "cx_user")
 *   PG_HOST     (default "localhost")
 *   PG_PORT     (default 5432)
 *   PG_PASSWORD (default "")
 *
 * Run:
 *   bun run scripts/test-ctx-12-w1.ts
 */

import postgres from "postgres"
import {
  recordTransaction,
  creditTokens,
  tokensFromCents,
  matchEmailToUser,
  matchSupporter,
  reclaimUnmatchedForEmail,
  variantToKind,
  rankToTier,
  genId,
} from "../src/services/supporters"

const sql = postgres({
  host: process.env.PG_HOST ?? "localhost",
  port: Number(process.env.PG_PORT ?? 5432),
  database: process.env.PG_DATABASE ?? "contexter_dev",
  user: process.env.PG_USER ?? "cx_user",
  password: process.env.PG_PASSWORD ?? "",
})

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    throw new Error(`Assertion failed: ${msg}`)
  }
}

async function cleanup(): Promise<void> {
  await sql`DELETE FROM supporter_transactions WHERE email LIKE 'test_%@example.com'`
  await sql`DELETE FROM supporters WHERE user_id LIKE 'test_u_%'`
  await sql`DELETE FROM users WHERE id LIKE 'test_u_%'`
}

async function main(): Promise<void> {
  const testUserId = `test_u_${genId()}`
  const testEmail = `test_${genId()}@example.com`

  try {
    await cleanup()

    // 1. tokensFromCents
    assert(tokensFromCents(1000) === 10, "tokensFromCents(1000) should be 10")
    assert(tokensFromCents(100_000_000) === 1_000_000, "tokensFromCents 1M USD = 1M tokens")
    console.log("PASS tokensFromCents")

    // 2. variantToKind
    assert(variantToKind("1516645") === "supporter", "variant 1516645 = supporter")
    assert(variantToKind("1516676") === "starter", "variant 1516676 = starter")
    assert(variantToKind("1516706") === "pro", "variant 1516706 = pro")
    assert(variantToKind("999") === "unknown", "unknown variant")
    console.log("PASS variantToKind")

    // 3. rankToTier
    assert(rankToTier(1) === "diamond", "rank 1 = diamond")
    assert(rankToTier(10) === "diamond", "rank 10 = diamond")
    assert(rankToTier(11) === "gold", "rank 11 = gold")
    assert(rankToTier(30) === "gold", "rank 30 = gold")
    assert(rankToTier(31) === "silver", "rank 31 = silver")
    assert(rankToTier(60) === "silver", "rank 60 = silver")
    assert(rankToTier(61) === "bronze", "rank 61 = bronze")
    assert(rankToTier(100) === "bronze", "rank 100 = bronze")
    assert(rankToTier(101) === "pending", "rank 101 = pending")
    assert(rankToTier(null) === "pending", "rank null = pending")
    console.log("PASS rankToTier")

    // 4. Seed test user (stub users schema: id, email, name, created_at)
    await sql`
      INSERT INTO users (id, email, name)
      VALUES (${testUserId}, ${testEmail}, 'test user')
    `
    console.log("PASS user seeded")

    // 5. matchEmailToUser — case-insensitive
    const m1 = await matchEmailToUser(sql, testEmail.toUpperCase())
    assert(m1 === testUserId, `case-insensitive match: got ${m1}`)
    console.log("PASS matchEmailToUser")

    // 6. matchSupporter priority: custom_data.user_id → email → null
    const m2 = await matchSupporter(sql, { email: null, customDataUserId: testUserId })
    assert(m2 === testUserId, "custom_data.user_id match")
    const m3 = await matchSupporter(sql, { email: testEmail, customDataUserId: null })
    assert(m3 === testUserId, "email fallback match")
    const m4 = await matchSupporter(sql, {
      email: "nobody@example.com",
      customDataUserId: null,
    })
    assert(m4 === null, "unmatched returns null")
    console.log("PASS matchSupporter")

    // 7. recordTransaction + creditTokens (matched purchase)
    const txId1 = await recordTransaction(sql, {
      userId: testUserId,
      email: testEmail,
      type: "purchase",
      amountTokens: 10,
      amountUsdCents: 1000,
      sourceType: "lemonsqueezy_order",
      sourceId: "order_test_1",
    })
    assert(txId1 !== null, "first tx should insert")
    await creditTokens(sql, testUserId, 10)
    const [sup1] = await sql<{ tokens: string | number }[]>`
      SELECT tokens FROM supporters WHERE user_id = ${testUserId}
    `
    assert(sup1 !== undefined, "supporter row should exist")
    assert(
      Number(sup1!.tokens) === 10,
      `supporter tokens should be 10, got ${sup1!.tokens}`,
    )
    console.log("PASS recordTransaction + creditTokens")

    // 8. Idempotency — duplicate source_id returns null
    const txIdDup = await recordTransaction(sql, {
      userId: testUserId,
      email: testEmail,
      type: "purchase",
      amountTokens: 10,
      amountUsdCents: 1000,
      sourceType: "lemonsqueezy_order",
      sourceId: "order_test_1",
    })
    assert(txIdDup === null, "duplicate source_id should return null")
    console.log("PASS idempotency")

    // 9. Unmatched payment + reclaim on registration
    const testEmail2 = `test_unmatch_${genId()}@example.com`
    await recordTransaction(sql, {
      userId: null,
      email: testEmail2,
      type: "purchase",
      amountTokens: 25,
      amountUsdCents: 2500,
      sourceType: "lemonsqueezy_order",
      sourceId: "order_test_unmatch_1",
    })
    const testUserId2 = `test_u_${genId()}`
    await sql`
      INSERT INTO users (id, email, name)
      VALUES (${testUserId2}, ${testEmail2}, 'reclaim user')
    `
    const reclaimed = await reclaimUnmatchedForEmail(sql, testUserId2, testEmail2)
    // Fix(ctx12-w1-02): reclaim now returns total tokens credited, not row count
    assert(reclaimed === 25, `reclaimed tokens should be 25, got ${reclaimed}`)
    const [sup2] = await sql<{ tokens: string | number }[]>`
      SELECT tokens FROM supporters WHERE user_id = ${testUserId2}
    `
    assert(sup2 !== undefined, "reclaimed supporter row should exist")
    assert(
      Number(sup2!.tokens) === 25,
      `reclaimed supporter tokens should be 25, got ${sup2!.tokens}`,
    )
    const [tx] = await sql<
      { user_id: string | null; matched_at: Date | null }[]
    >`
      SELECT user_id, matched_at FROM supporter_transactions
      WHERE source_id = 'order_test_unmatch_1'
    `
    assert(tx !== undefined, "reclaimed tx should exist")
    assert(tx!.user_id === testUserId2, "tx.user_id should be updated")
    assert(tx!.matched_at !== null, "matched_at should be set")
    console.log("PASS unmatched + reclaim")

    // 10. Unlimited PWYW
    const bigTokens = tokensFromCents(100_000_000_000) // $1B
    assert(bigTokens === 1_000_000_000, "$1B = 1B tokens")
    console.log("PASS unlimited PWYW")

    await cleanup()

    console.log("\nAll W1 tests passed")
    await sql.end()
  } catch (err) {
    console.error("Test failed:", err)
    await cleanup().catch(() => undefined)
    await sql.end()
    process.exit(1)
  }
}

main()
