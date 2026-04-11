import { Hono } from "hono"
import { createHmac } from "crypto"
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

// LemonSqueezy webhook
webhooks.post("/lemonsqueezy", async (c) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured")
    return c.json({ error: "webhook not configured" }, 500)
  }

  const signature = c.req.header("x-signature")
  if (!signature) {
    return c.json({ error: "missing signature" }, 400)
  }

  // CRITICAL: use raw text for HMAC, not parsed JSON (Hono gotcha)
  const rawBody = await c.req.text()

  const hmac = createHmac("sha256", secret).update(rawBody).digest("hex")
  if (hmac !== signature) {
    console.error("LemonSqueezy signature verification failed", { rid: c.get("requestId") })
    return c.json({ error: "invalid signature" }, 403)
  }

  const payload = JSON.parse(rawBody)
  const eventName = payload.meta?.event_name as string
  const customData = payload.meta?.custom_data ?? {}
  const attrs = payload.data?.attributes ?? {}

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: "lemonsqueezy_webhook",
    rid: c.get("requestId"),
    eventName,
    customerEmail: attrs.user_email ?? attrs.customer_email ?? null,
    productName: attrs.product_name ?? attrs.first_order_item?.product_name ?? null,
    variantId: attrs.variant_id ?? attrs.first_order_item?.variant_id ?? null,
    total: attrs.total ?? attrs.subtotal ?? null,
    status: attrs.status ?? null,
    customData,
  }))

  // Handle key events
  switch (eventName) {
    case "order_created": {
      const email = attrs.user_email ?? ""
      const total = attrs.total ?? 0
      const variantId = attrs.first_order_item?.variant_id ?? null
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event: "ls_order_created",
        email,
        total,
        variantId,
        orderId: payload.data?.id,
      }))
      // TODO: match email to user, credit tokens, activate supporter status
      break
    }

    case "subscription_created": {
      const email = attrs.user_email ?? ""
      const productName = attrs.product_name ?? ""
      const status = attrs.status ?? ""
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event: "ls_subscription_created",
        email,
        productName,
        status,
        subscriptionId: payload.data?.id,
      }))
      // TODO: match email to user, activate subscription tier
      break
    }

    case "subscription_payment_success": {
      const email = attrs.user_email ?? ""
      const total = attrs.subtotal ?? 0
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event: "ls_subscription_payment",
        email,
        total,
        subscriptionId: payload.data?.id,
      }))
      // TODO: credit tokens for monthly payment
      break
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      const email = attrs.user_email ?? ""
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event: "ls_subscription_ended",
        eventName,
        email,
        subscriptionId: payload.data?.id,
      }))
      // TODO: start 30-day warning for supporter status
      break
    }

    default:
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event: "ls_webhook_unhandled",
        eventName,
      }))
  }

  return c.json({ ok: true })
})
