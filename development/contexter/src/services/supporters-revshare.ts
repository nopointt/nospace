import type { Sql } from "postgres"
import type { Env } from "../types/env"
import {
  creditTokens,
  recordTransaction,
  type SupporterTier,
} from "./supporters"

// CTX-12 W4-05: quarterly rev share distribution.
//
// D-51: pool = 1% of previous-quarter subscription revenue.
// D-52: weighted by tier — diamond 2.0x, gold 1.5x, silver 1.25x, bronze 1.0x.
// D-55: gated by $10,000 MRR (last 30 days subscription payments). Below the
//       gate, distribution is skipped entirely and logged.
//
// Idempotency: recordTransaction dedupes on (source_type, source_id). We use
// source_id = `revshare:${quarter}:${userId}` so re-runs for the same quarter
// are safe — the second attempt returns null and the credit is skipped.

const REV_SHARE_PERCENT = 1n // D-51: 1% of quarterly revenue
const MRR_GATE_CENTS = 1_000_000n // D-55: $10,000 MRR gate

// Tier units for weighted distribution (D-52). Common denominator 4 so all
// values are integers, preserving the ratios 2 / 1.5 / 1.25 / 1.
//   diamond = 2.0 * 4 = 8
//   gold    = 1.5 * 4 = 6
//   silver  = 1.25 * 4 = 5
//   bronze  = 1.0 * 4 = 4
// pending is excluded from the eligible query but must be present in the map
// for exhaustive Record typing.
const TIER_UNITS: Record<SupporterTier, bigint> = {
  diamond: 8n,
  gold: 6n,
  silver: 5n,
  bronze: 4n,
  pending: 0n,
}

function previousQuarterStart(): Date {
  const now = new Date()
  const q = Math.floor(now.getUTCMonth() / 3) // 0-3, current quarter index
  const prevQ = q === 0 ? 3 : q - 1
  const year = q === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear()
  return new Date(Date.UTC(year, prevQ * 3, 1, 0, 0, 0, 0))
}

function previousQuarterEnd(): Date {
  // Previous quarter end == current quarter start (exclusive upper bound).
  const now = new Date()
  const q = Math.floor(now.getUTCMonth() / 3)
  return new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1, 0, 0, 0, 0))
}

function quarterLabel(d: Date): string {
  return `${d.getUTCFullYear()}Q${Math.floor(d.getUTCMonth() / 3) + 1}`
}

export async function runQuarterlyRevShare(sql: Sql, env: Env): Promise<void> {
  // env is reserved for W4-06 sendRevShareEmail wiring; referenced to satisfy
  // the no-unused-args lint without muddying the signature.
  void env

  const started = Date.now()

  // Step 1: MRR gate — sum of last 30 days subscription payments.
  const mrrRows = await sql<{ sum: string | null }[]>`
    SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
    FROM supporter_transactions
    WHERE source_type = 'lemonsqueezy_subscription'
      AND source_id LIKE 'payment:%'
      AND created_at >= NOW() - INTERVAL '30 days'
  `
  const mrrCents = BigInt(mrrRows[0]?.sum ?? "0")
  if (mrrCents < MRR_GATE_CENTS) {
    console.log(
      JSON.stringify({
        event: "revshare_skipped_below_gate",
        mrr_cents: mrrCents.toString(),
        gate_cents: MRR_GATE_CENTS.toString(),
        duration_ms: Date.now() - started,
      }),
    )
    return
  }

  // Step 2: previous-quarter revenue → pool.
  const qStart = previousQuarterStart()
  const qEnd = previousQuarterEnd()
  const label = quarterLabel(qStart)

  const qRows = await sql<{ sum: string | null }[]>`
    SELECT COALESCE(SUM(amount_usd_cents), 0)::text AS sum
    FROM supporter_transactions
    WHERE source_type = 'lemonsqueezy_subscription'
      AND source_id LIKE 'payment:%'
      AND created_at >= ${qStart}
      AND created_at < ${qEnd}
  `
  const quarterRevenueCents = BigInt(qRows[0]?.sum ?? "0")
  const poolCents = (quarterRevenueCents * REV_SHARE_PERCENT) / 100n

  if (poolCents === 0n) {
    console.log(
      JSON.stringify({
        event: "revshare_zero_pool",
        quarter: label,
        quarter_revenue_cents: quarterRevenueCents.toString(),
      }),
    )
    return
  }

  // Step 3: eligible supporters — status IN (active, warning), tier tiered.
  // Frozen / quarantined / exiting / pending-tier rows are excluded by design.
  const supporters = await sql<
    { user_id: string; tier: SupporterTier; email: string | null }[]
  >`
    SELECT s.user_id, s.tier, u.email
    FROM supporters s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.status IN ('active', 'warning')
      AND s.tier IN ('diamond', 'gold', 'silver', 'bronze')
  `

  // Step 4: weighted units total.
  let totalUnits = 0n
  for (const s of supporters) totalUnits += TIER_UNITS[s.tier]
  if (totalUnits === 0n) {
    console.log(
      JSON.stringify({
        event: "revshare_no_eligible_supporters",
        quarter: label,
      }),
    )
    return
  }

  // Step 5: distribute pool. Each supporter gets
  //   shareCents = (poolCents * tierUnits) / totalUnits
  //   shareTokens = floor(shareCents / 100)   // $1 = 1 token
  let distributed = 0
  let skipped = 0
  for (const s of supporters) {
    const shareCents = (poolCents * TIER_UNITS[s.tier]) / totalUnits
    const shareTokens = Number(shareCents / 100n)
    if (shareTokens === 0) {
      skipped++
      continue
    }

    // Idempotency via source_id. If cron re-runs for the same quarter the
    // second call returns null (duplicate) and the credit path is skipped.
    const txId = await recordTransaction(sql, {
      userId: s.user_id,
      email: null,
      type: "revshare",
      amountTokens: shareTokens,
      amountUsdCents: Number(shareCents),
      // No dedicated source_type for revshare in the W1 enum set — reuse
      // "manual" and disambiguate via the source_id prefix.
      sourceType: "manual",
      sourceId: `revshare:${label}:${s.user_id}`,
      metadata: {
        quarter: label,
        tier: s.tier,
        pool_cents: poolCents.toString(),
      },
    })
    if (!txId) {
      skipped++
      continue
    }

    await creditTokens(sql, s.user_id, shareTokens)
    distributed++

    // TODO W4-06: wire fire-and-forget email notification once
    // src/services/notifications.ts exists:
    //   if (s.email) {
    //     sendRevShareEmail(env, s.email, label, shareTokens, poolCents)
    //       .catch((e) => console.error(JSON.stringify({
    //         event: "revshare_email_failed",
    //         user_id: s.user_id,
    //         error: e instanceof Error ? e.message : String(e),
    //       })))
    //   }
  }

  console.log(
    JSON.stringify({
      event: "revshare_distributed",
      quarter: label,
      mrr_cents: mrrCents.toString(),
      quarter_revenue_cents: quarterRevenueCents.toString(),
      pool_cents: poolCents.toString(),
      eligible: supporters.length,
      distributed,
      skipped,
      duration_ms: Date.now() - started,
    }),
  )
}
