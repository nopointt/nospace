/**
 * CTX-12 Supporters ranking engine (W2-01).
 *
 * Weekly cron computes rank (1-based leaderboard position) and tier
 * (via rankToTier from D-51) for every active/warning supporter, ordered
 * by (tokens DESC, joined_at ASC) — D-AUTO-03 tiebreak.
 *
 * Frozen and quarantined rows are intentionally excluded:
 *  - frozen: rank is preserved at whatever it was when freeze began
 *  - quarantined: W2-07 promotion sweep handles their entry into the
 *    ranked set separately; they never appear in the 1..N enumeration
 *
 * Locked decisions:
 *  D-51      — tier thresholds (diamond<=10, gold<=30, silver<=60, bronze<=100)
 *  D-AUTO-03 — tiebreak by (tokens DESC, joined_at ASC)
 */

import type { Sql } from "postgres"
import { rankToTier, type SupporterTier } from "./supporters"

interface RankingRow {
  user_id: string
  tokens: string
  current_rank: number | null
  current_tier: SupporterTier
}

interface QuarantineRow {
  user_id: string
  tokens: string
}

/**
 * Recompute rank and tier for every active/warning supporter. Writes only
 * rows whose rank or tier actually changed (minimizes WAL + updated_at
 * churn). Emits a single JSON log line with totals + duration.
 *
 * After the main rank loop, runs a quarantine promotion sweep: any
 * quarantined supporter whose tokens exceed the current rank-100 threshold
 * is promoted to active (displacing the previous #100 into quarantined).
 * The swap runs inside sql.begin so a partial state is never observable.
 */
export async function runSupportersRanking(sql: Sql): Promise<void> {
  const started = Date.now()

  const rows = await sql<RankingRow[]>`
    SELECT user_id, tokens::text, rank AS current_rank, tier AS current_tier
    FROM supporters
    WHERE status IN ('active', 'warning')
    ORDER BY tokens DESC, joined_at ASC
  `

  let updated = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const newRank = i + 1
    const newTier = rankToTier(newRank)
    if (row.current_rank !== newRank || row.current_tier !== newTier) {
      await sql`
        UPDATE supporters
        SET rank = ${newRank}, tier = ${newTier}, updated_at = NOW()
        WHERE user_id = ${row.user_id}
      `
      updated++
    }
  }

  // --- Quarantine promotion sweep (W2-07) ---
  let promoted = 0
  const quarantined = await sql<QuarantineRow[]>`
    SELECT user_id, tokens::text
    FROM supporters
    WHERE status = 'quarantined'
    ORDER BY tokens DESC, joined_at ASC
  `

  if (quarantined.length > 0) {
    for (const q of quarantined) {
      // Re-read #100 on each iteration because a prior promotion in this
      // loop may have reshuffled the bottom of the ranked set.
      const hundredth = await sql<{ tokens: string }[]>`
        SELECT tokens::text
        FROM supporters
        WHERE status IN ('active', 'warning')
        ORDER BY tokens DESC, joined_at ASC
        OFFSET 99 LIMIT 1
      `
      const threshold = hundredth[0] ? BigInt(hundredth[0].tokens) : 0n
      const qTokens = BigInt(q.tokens)

      // When ranked set has fewer than 100 rows, any quarantined row is
      // eligible immediately (threshold defaults to 0).
      if (hundredth.length < 100 || qTokens > threshold) {
        await sql.begin(async (txRaw) => {
          const tx = txRaw as unknown as Sql
          if (hundredth.length === 100) {
            // Demote current #100 into quarantined.
            await tx`
              UPDATE supporters
              SET status = 'quarantined', updated_at = NOW()
              WHERE user_id = (
                SELECT user_id FROM supporters
                WHERE status IN ('active', 'warning')
                ORDER BY tokens DESC, joined_at ASC
                OFFSET 99 LIMIT 1
              )
            `
          }
          await tx`
            UPDATE supporters
            SET status = 'active', updated_at = NOW()
            WHERE user_id = ${q.user_id}
          `
        })
        promoted++
        console.log(JSON.stringify({
          event: "supporter_quarantine_promoted",
          user_id: q.user_id,
        }))
      }
    }
  }

  const duration = Date.now() - started
  console.log(JSON.stringify({
    event: "supporters_ranking_complete",
    total_supporters: rows.length,
    updated,
    quarantine_promoted: promoted,
    duration_ms: duration,
  }))
}
