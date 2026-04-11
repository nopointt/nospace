/**
 * CTX-12 W5-02: Soft demotion lifecycle (30/60/90d inactivity ladder).
 *
 * Daily cron sweeps active/warning supporters and applies the 3-stage
 * soft-demotion ladder derived from D-53:
 *
 *   Stage 1  (≥30d inactive)  — send warning email, stamp warning_sent_at.
 *   Stage 2  (≥60d inactive)  — demote to 'bronze' tier (rank preserved).
 *   Stage 3  (≥90d inactive)  — status='exiting', send exit email.
 *
 * "Inactive" means no supporter_transactions row since last_activity, where
 * last_activity = MAX(supporter_transactions.created_at) for user_id, falling
 * back to supporters.joined_at when no transactions exist.
 *
 * Re-activation: any new supporter_transactions row with created_at AFTER
 * warning_sent_at clears the warning (handled by clearReactivatedWarnings
 * at the start of the sweep).
 *
 * Locked decisions:
 *  D-53      — soft demotion over hard purge (no deletes, G1)
 *  D-W5-02   — thresholds, cron schedule, re-activation rules
 */

import type { Sql } from "postgres"
import type { Env } from "../types/env"
import { sendDemotionWarningEmail, sendDemotionExitEmail } from "./notifications"

/**
 * Re-activation: clears warning_sent_at for any supporter with a new
 * transaction after the warning was sent. Runs first so downstream ladder
 * stages do not mis-apply to users who have resumed activity.
 *
 * Returns number of rows cleared.
 */
async function clearReactivatedWarnings(sql: Sql): Promise<number> {
  const result = await sql<{ user_id: string }[]>`
    UPDATE supporters s
    SET warning_sent_at = NULL
    WHERE warning_sent_at IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM supporter_transactions t
        WHERE t.user_id = s.user_id
          AND t.created_at > s.warning_sent_at
      )
    RETURNING user_id
  `
  return result.length
}

interface LastActivityRow {
  user_id: string
  email: string | null
  tier: string
  status: string
  tokens: string
  warning_sent_at: Date | null
  joined_at: Date
  last_activity: Date
}

/**
 * Fetch all active/warning supporters with their computed last_activity
 * timestamp. last_activity = MAX(supporter_transactions.created_at) or
 * supporters.joined_at when no transactions exist.
 *
 * The LEFT JOIN on users is needed for the optional email field used by
 * the warning/exit notification path.
 */
async function fetchSupportersWithLastActivity(sql: Sql): Promise<LastActivityRow[]> {
  return await sql<LastActivityRow[]>`
    SELECT
      s.user_id,
      u.email,
      s.tier,
      s.status,
      s.tokens::text AS tokens,
      s.warning_sent_at,
      s.joined_at,
      COALESCE(
        (SELECT MAX(created_at) FROM supporter_transactions WHERE user_id = s.user_id),
        s.joined_at
      ) AS last_activity
    FROM supporters s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.status IN ('active', 'warning')
  `
}

/**
 * Run one pass of the soft-demotion ladder.
 *
 * Emits per-supporter events (supporter_soft_demotion_warning /
 * supporter_soft_demotion_to_bronze / supporter_soft_demotion_exit) plus a
 * summary soft_demotion_complete line at the end. All email sends are
 * fire-and-forget so a hung Resend endpoint cannot back-pressure the loop.
 */
export async function runSoftDemotion(sql: Sql, env: Env): Promise<void> {
  const started = Date.now()
  const reactivated = await clearReactivatedWarnings(sql)
  const rows = await fetchSupportersWithLastActivity(sql)
  const now = Date.now()
  const DAY_MS = 86_400_000

  let stage1 = 0
  let stage2 = 0
  let stage3 = 0

  for (const r of rows) {
    const lastActive = new Date(r.last_activity).getTime()
    const inactiveDays = Math.floor((now - lastActive) / DAY_MS)

    // Stage 3 — exit (warned ≥60d ago, ~90d total inactive)
    if (r.warning_sent_at && r.status !== "exiting") {
      const warnedMs = new Date(r.warning_sent_at).getTime()
      const warnedDaysAgo = Math.floor((now - warnedMs) / DAY_MS)
      if (warnedDaysAgo >= 60) {
        await sql`UPDATE supporters SET status = 'exiting', updated_at = NOW() WHERE user_id = ${r.user_id}`
        stage3++
        console.log(JSON.stringify({ event: "supporter_soft_demotion_exit", user_id: r.user_id }))
        if (r.email) {
          sendDemotionExitEmail(env, r.email).catch((e) =>
            console.error(JSON.stringify({
              event: "exit_email_failed",
              user_id: r.user_id,
              error: e instanceof Error ? e.message : String(e),
            })),
          )
        }
        continue
      }
      // Stage 2 — demote to bronze (warned ≥30d ago, ~60d total inactive)
      if (warnedDaysAgo >= 30 && r.tier !== "bronze") {
        await sql`UPDATE supporters SET tier = 'bronze', updated_at = NOW() WHERE user_id = ${r.user_id}`
        stage2++
        console.log(JSON.stringify({
          event: "supporter_soft_demotion_to_bronze",
          user_id: r.user_id,
          prev_tier: r.tier,
        }))
        continue
      }
    }

    // Stage 1 — warning (≥30d inactive, no prior warning)
    if (!r.warning_sent_at && inactiveDays >= 30) {
      await sql`UPDATE supporters SET warning_sent_at = NOW(), updated_at = NOW() WHERE user_id = ${r.user_id}`
      stage1++
      console.log(JSON.stringify({
        event: "supporter_soft_demotion_warning",
        user_id: r.user_id,
        inactive_days: inactiveDays,
      }))
      if (r.email) {
        sendDemotionWarningEmail(env, r.email, inactiveDays).catch((e) =>
          console.error(JSON.stringify({
            event: "warning_email_failed",
            user_id: r.user_id,
            error: e instanceof Error ? e.message : String(e),
          })),
        )
      }
    }
  }

  console.log(JSON.stringify({
    event: "soft_demotion_complete",
    reactivated,
    stage1,
    stage2,
    stage3,
    total_checked: rows.length,
    duration_ms: Date.now() - started,
  }))
}
