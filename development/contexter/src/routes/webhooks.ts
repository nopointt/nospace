import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { verifyIpnSignature, activateSubscription } from "../services/billing"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

export const webhooks = new Hono<AppEnv>()

// NOWPayments IPN webhook
webhooks.post("/nowpayments", async (c) => {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!ipnSecret) {
    console.error("NOWPAYMENTS_IPN_SECRET not configured")
    return c.json({ error: "webhook not configured" }, 500)
  }

  const signature = c.req.header("x-nowpayments-sig")
  if (!signature) {
    return c.json({ error: "missing signature" }, 400)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid JSON" }, 400)
  }

  // Verify HMAC-SHA512 signature
  if (!verifyIpnSignature(body, signature, ipnSecret)) {
    console.error("IPN signature verification failed", { rid: c.get("requestId") })
    return c.json({ error: "invalid signature" }, 403)
  }

  const paymentStatus = body.payment_status as string
  const invoiceId = String(body.invoice_id ?? "")
  const paymentId = String(body.payment_id ?? "")
  const payCurrency = String(body.pay_currency ?? "")
  const actuallyPaid = String(body.actually_paid ?? "0")
  const orderId = String(body.order_id ?? "")

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: "nowpayments_ipn",
    rid: c.get("requestId"),
    paymentStatus,
    invoiceId,
    paymentId,
    payCurrency,
    actuallyPaid,
    orderId,
  }))

  const sql = c.get("sql")

  // Handle terminal statuses
  if (paymentStatus === "finished" || paymentStatus === "confirmed") {
    const result = await activateSubscription(sql, {
      invoiceId,
      paymentId,
      payCurrency,
      actuallyPaid,
    })

    if (result) {
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event: "subscription_activated",
        userId: result.userId,
        tier: result.tier,
        periodEnd: result.periodEnd.toISOString(),
      }))
    }
  } else if (paymentStatus === "failed" || paymentStatus === "expired" || paymentStatus === "refunded") {
    // Mark payment as failed
    await sql`
      UPDATE payments SET status = ${paymentStatus}, updated_at = NOW()
      WHERE nowpayments_invoice_id = ${invoiceId} AND status = 'pending'
    `
  }
  // waiting, confirming, sending — intermediate statuses, no action needed

  return c.json({ ok: true })
})
