import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import {
  TIERS,
  type TierKey,
  getOrCreateSubscription,
  getUserStorageUsed,
  createInvoice,
  createPaymentRecord,
} from "../services/billing"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

export const billing = new Hono<AppEnv>()

// GET /api/billing — current subscription + usage
billing.get("/", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const sub = await getOrCreateSubscription(sql, auth.userId)
  if (!sub) return c.json({ error: "failed to load subscription" }, 500)
  const storageUsed = await getUserStorageUsed(sql, auth.userId)
  const tier = (sub.tier as TierKey) ?? "free"
  const tierDef = TIERS[tier] ?? TIERS.free
  const limit = Number(sub.storage_limit_bytes ?? tierDef.storageLimitBytes)

  return c.json({
    tier,
    tierName: tierDef.name,
    status: sub.status,
    storageUsed,
    storageLimit: limit,
    storagePct: limit > 0 ? Math.round((storageUsed / limit) * 100) : 0,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    tiers: Object.entries(TIERS).map(([key, t]) => ({
      key,
      name: t.name,
      priceUsd: t.priceUsd,
      storageLimitGb: Math.round(t.storageLimitBytes / (1024 * 1024 * 1024)),
    })),
  })
})

// POST /api/billing/subscribe — create invoice for tier upgrade
billing.post("/subscribe", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const apiKey = process.env.NOWPAYMENTS_API_KEY
  if (!apiKey) return c.json({ error: "billing not configured" }, 500)

  let body: { tier?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid JSON" }, 400)
  }

  const tier = body.tier as TierKey
  if (!tier || !TIERS[tier] || tier === "free") {
    return c.json({ error: "invalid tier", validTiers: ["starter", "pro", "business"] }, 400)
  }

  const sub = await getOrCreateSubscription(sql, auth.userId)
  if (!sub) return c.json({ error: "failed to load subscription" }, 500)
  const tierDef = TIERS[tier]

  // Create NOWPayments invoice
  let invoiceId: string
  let invoiceUrl: string
  try {
    const invoice = await createInvoice(apiKey, {
      tier,
      userId: auth.userId,
      subscriptionId: sub.id as string,
    })
    invoiceId = invoice.invoiceId
    invoiceUrl = invoice.invoiceUrl
  } catch (e) {
    console.error("createInvoice failed:", e instanceof Error ? e.message : String(e))
    return c.json({ error: "Failed to create payment invoice. Please try again later." }, 502)
  }

  // Record payment — failure here is recoverable (invoice exists, record can be replayed)
  try {
    await createPaymentRecord(sql, {
      userId: auth.userId,
      subscriptionId: sub.id as string,
      tier,
      amountUsd: tierDef.priceUsd,
      invoiceId,
      invoiceUrl,
    })
  } catch (e) {
    console.error("createPaymentRecord failed — invoice created but record missing. invoiceId:", invoiceId, e instanceof Error ? e.message : String(e))
    // Invoice exists — return it so user can still pay; record can be recovered from webhook
  }

  return c.json({
    invoiceId,
    invoiceUrl,
    tier,
    tierName: tierDef.name,
    priceUsd: tierDef.priceUsd,
    message: `Pay at the invoice URL to activate your ${tierDef.name} plan.`,
  })
})

// GET /api/billing/payments — payment history
billing.get("/payments", async (c) => {
  const sql = c.get("sql")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const payments = await sql`
    SELECT id, tier, amount_usd, status, pay_currency, actually_paid, invoice_url, created_at
    FROM payments WHERE user_id = ${auth.userId}
    ORDER BY created_at DESC LIMIT 20
  `

  return c.json({ payments })
})
