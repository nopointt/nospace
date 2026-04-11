/**
 * W2-02 verification-only script.
 *
 * Seeds 15 synthetic supporters with descending token counts into
 * contexter_dev, runs runSupportersRanking, then asserts that tier
 * assignment matches D-51 thresholds:
 *   rank 1..10  -> diamond
 *   rank 11..15 -> gold
 *
 * Cleans up all seeded rows at the end (DELETE WHERE user_id LIKE 'w202-test-%').
 */

import postgres from "postgres"
import { runSupportersRanking } from "../src/services/supporters-ranking"

const sql = postgres({
  host: "localhost",
  database: process.env.PG_DATABASE ?? "contexter_dev",
  username: "cx_user",
  password: "",
})

async function main(): Promise<void> {
  // Cleanup any leftover rows from prior runs first
  await sql`DELETE FROM supporters WHERE user_id LIKE 'w202-test-%'`
  await sql`DELETE FROM users WHERE id LIKE 'w202-test-%'`

  // Seed 15 users + supporters, descending tokens so rank order is deterministic
  for (let i = 0; i < 15; i++) {
    const id = `w202-test-${String(i).padStart(2, "0")}`
    const tokens = 1000 - i // 1000, 999, ..., 986
    await sql`
      INSERT INTO users (id, email, name)
      VALUES (${id}, ${`${id}@test.local`}, ${`Test ${i}`})
      ON CONFLICT (id) DO NOTHING
    `
    await sql`
      INSERT INTO supporters (user_id, tokens, status)
      VALUES (${id}, ${tokens}, 'active')
      ON CONFLICT (user_id) DO UPDATE SET tokens = EXCLUDED.tokens, status = 'active'
    `
  }

  await runSupportersRanking(sql)

  const rows = await sql<{ user_id: string; rank: number; tier: string }[]>`
    SELECT user_id, rank, tier
    FROM supporters
    WHERE user_id LIKE 'w202-test-%'
    ORDER BY rank ASC
  `

  let pass = true
  for (const r of rows) {
    const expected = r.rank <= 10 ? "diamond" : "gold"
    if (r.tier !== expected) {
      console.error(`FAIL rank=${r.rank} tier=${r.tier} expected=${expected}`)
      pass = false
    }
  }

  if (pass && rows.length === 15) {
    console.log("W2-02 tier assignment: PASS")
  } else {
    console.error(`W2-02 tier assignment: FAIL (rows=${rows.length})`)
    process.exitCode = 1
  }

  // Cleanup
  await sql`DELETE FROM supporters WHERE user_id LIKE 'w202-test-%'`
  await sql`DELETE FROM users WHERE id LIKE 'w202-test-%'`
  await sql.end()
}

main().catch((err) => {
  console.error("W2-02 script error:", err)
  process.exit(1)
})
