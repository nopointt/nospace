import type { Sql } from "postgres"
import crypto from "crypto"

// --- Tier definitions ---
export const TIERS = {
  free: { name: "Free", priceUsd: 0, storageLimitBytes: 1 * 1024 * 1024 * 1024, intervalDays: 0 },
  starter: { name: "Starter", priceUsd: 9, storageLimitBytes: 10 * 1024 * 1024 * 1024, intervalDays: 30 },
  pro: { name: "Pro", priceUsd: 29, storageLimitBytes: 50 * 1024 * 1024 * 1024, intervalDays: 30 },
  business: { name: "Business", priceUsd: 79, storageLimitBytes: 200 * 1024 * 1024 * 1024, intervalDays: 30 },
} as const

export type TierKey = keyof typeof TIERS

// --- NOWPayments API ---
const NOWPAYMENTS_API = "https://api.nowpayments.io/v1"

export async function createInvoice(
  apiKey: string,
  opts: { tier: TierKey; userId: string; subscriptionId: string }
): Promise<{ invoiceId: string; invoiceUrl: string }> {
  const tierDef = TIERS[opts.tier]
  if (tierDef.priceUsd === 0) throw new Error("Cannot create invoice for free tier")

  const orderId = `${opts.userId}:${opts.subscriptionId}:${opts.tier}:${Date.now()}`

  const res = await fetch(`${NOWPAYMENTS_API}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      price_amount: tierDef.priceUsd,
      price_currency: "usd",
      order_id: orderId,
      order_description: `Contexter ${tierDef.name} — 1 month`,
      ipn_callback_url: `${process.env.BASE_URL ?? "https://api.contexter.cc"}/api/webhooks/nowpayments`,
      success_url: "https://contexter.cc/app?payment=success",
      cancel_url: "https://contexter.cc/app?payment=cancelled",
      is_fee_paid_by_user: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`NOWPayments invoice creation failed: ${res.status} ${text}`)
  }

  const data = await res.json() as { id: string; invoice_url: string }
  return { invoiceId: String(data.id), invoiceUrl: data.invoice_url }
}

// --- IPN signature verification ---
export function verifyIpnSignature(body: Record<string, unknown>, signature: string, ipnSecret: string): boolean {
  const sorted = JSON.stringify(body, Object.keys(body).sort())
  const hmac = crypto.createHmac("sha512", ipnSecret).update(sorted).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(signature, "hex"))
  } catch { return false }
}

// --- DB operations ---
function genId(): string {
  return crypto.randomBytes(8).toString("hex")
}

export async function getOrCreateSubscription(sql: Sql, userId: string) {
  const [existing] = await sql`
    SELECT id, tier, status, storage_limit_bytes, current_period_start, current_period_end
    FROM subscriptions WHERE user_id = ${userId}
  `
  if (existing) return existing

  // INSERT with ON CONFLICT to handle concurrent race (two requests both see "no subscription")
  const id = genId()
  await sql`
    INSERT INTO subscriptions (id, user_id, tier, status, storage_limit_bytes)
    VALUES (${id}, ${userId}, 'free', 'active', ${TIERS.free.storageLimitBytes})
    ON CONFLICT (user_id) DO NOTHING
  `

  // Re-SELECT to get the row (either ours or the concurrent winner's)
  const [sub] = await sql`
    SELECT id, tier, status, storage_limit_bytes, current_period_start, current_period_end
    FROM subscriptions WHERE user_id = ${userId}
  `
  return sub
}

export async function getUserStorageUsed(sql: Sql, userId: string): Promise<number> {
  const [row] = await sql`SELECT COALESCE(SUM(size), 0) as total FROM documents WHERE user_id = ${userId}`
  return Number(row?.total ?? 0)
}

export async function createPaymentRecord(
  sql: Sql,
  opts: { userId: string; subscriptionId: string; tier: TierKey; amountUsd: number; invoiceId: string; invoiceUrl: string }
) {
  const id = genId()
  const [payment] = await sql`
    INSERT INTO payments (id, user_id, subscription_id, nowpayments_invoice_id, tier, amount_usd, status, invoice_url)
    VALUES (${id}, ${opts.userId}, ${opts.subscriptionId}, ${opts.invoiceId}, ${opts.tier}, ${opts.amountUsd}, 'pending', ${opts.invoiceUrl})
    RETURNING *
  `
  return payment
}

export async function activateSubscription(
  sql: Sql,
  opts: { invoiceId: string; paymentId: string; payCurrency: string; actuallyPaid: string }
) {
  // Atomic: find pending payment + mark completed + activate subscription in one transaction
  // Prevents: crash between payment update and subscription update, webhook replay double-activation
  return sql.begin(async (tx) => {
    // RETURNING ensures idempotency: if payment already completed, no row returned → null
    const [payment] = await tx`
      UPDATE payments SET
        status = 'completed',
        nowpayments_payment_id = ${opts.paymentId},
        pay_currency = ${opts.payCurrency},
        actually_paid = ${opts.actuallyPaid},
        updated_at = NOW()
      WHERE nowpayments_invoice_id = ${opts.invoiceId} AND status = 'pending'
      RETURNING id, user_id, subscription_id, tier
    `
    if (!payment) return null

    const tier = payment.tier as TierKey
    const tierDef = TIERS[tier]
    const now = new Date()
    const periodEnd = new Date(now.getTime() + tierDef.intervalDays * 24 * 60 * 60 * 1000)

    await tx`
      UPDATE subscriptions SET
        tier = ${tier},
        status = 'active',
        storage_limit_bytes = ${tierDef.storageLimitBytes},
        current_period_start = ${now.toISOString()},
        current_period_end = ${periodEnd.toISOString()},
        updated_at = NOW()
      WHERE id = ${payment.subscription_id}
    `

    return { userId: payment.user_id, tier, periodEnd }
  })
}

export async function getExpiringSoon(sql: Sql, daysAhead: number = 3) {
  return sql`
    SELECT s.id, s.user_id, s.tier, s.current_period_end, u.email
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.tier != 'free'
      AND s.status = 'active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end <= NOW() + INTERVAL '1 day' * ${daysAhead}
      AND s.current_period_end > NOW()
  `
}

export async function downgradeExpired(sql: Sql) {
  return sql`
    UPDATE subscriptions SET
      tier = 'free',
      storage_limit_bytes = ${TIERS.free.storageLimitBytes},
      status = 'expired',
      updated_at = NOW()
    WHERE tier != 'free'
      AND current_period_end IS NOT NULL
      AND current_period_end < NOW()
    RETURNING id, user_id
  `
}
