import { Hono } from "hono"
import { createHmac } from "crypto"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import {
  verifyIpnSignature,
  activateSubscription,
  getOrCreateSubscription,
  TIERS,
} from "../services/billing"
import {
  variantToKind,
  matchSupporter,
  tokensFromCents,
  recordTransaction,
  creditTokens,
} from "../services/supporters"

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
  const sql = c.get("sql")
  const ts = new Date().toISOString()

  console.log(JSON.stringify({
    ts,
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
      const email = (attrs.user_email ?? "") || null
      const total = Number(attrs.total ?? 0)  // cents, per LS API
      const variantId = attrs.first_order_item?.variant_id ?? null
      const orderId = String(payload.data?.id ?? "")
      const customDataUserId = (customData.user_id as string | undefined) ?? null
      const kind = variantToKind(variantId)

      // Skip subscription variants — they arrive via subscription_created.
      if (kind !== "supporter") {
        console.log(JSON.stringify({ ts, event: "ls_order_not_supporter", kind, orderId }))
        break
      }

      const userId = await matchSupporter(sql, { email, customDataUserId })
      const tokens = tokensFromCents(total)

      const txId = await recordTransaction(sql, {
        userId,
        email,
        type: "purchase",
        amountTokens: tokens,
        amountUsdCents: total,
        sourceType: "lemonsqueezy_order",
        sourceId: orderId,
        metadata: { variantId, customData },
      })

      if (!txId) {
        // Duplicate webhook — idempotent no-op
        console.log(JSON.stringify({ ts, event: "ls_order_duplicate", orderId }))
        break
      }

      if (userId) {
        await creditTokens(sql, userId, tokens)
        console.log(JSON.stringify({ ts, event: "ls_supporter_credited", userId, tokens, orderId }))
      } else {
        console.log(JSON.stringify({ ts, event: "ls_supporter_unmatched", email, tokens, orderId }))
      }
      break
    }

    case "subscription_created": {
      const email = (attrs.user_email ?? "") || null
      const productName = attrs.product_name ?? ""
      const variantId = attrs.variant_id ?? attrs.first_order_item?.variant_id ?? null
      const subscriptionId = String(payload.data?.id ?? "")
      const customDataUserId = (customData.user_id as string | undefined) ?? null
      const kind = variantToKind(variantId)

      const userId = await matchSupporter(sql, { email, customDataUserId })

      // Audit row (0 tokens — token credit happens on payment_success).
      await recordTransaction(sql, {
        userId,
        email,
        type: "subscription_payment",
        amountTokens: 0,
        amountUsdCents: 0,
        sourceType: "lemonsqueezy_subscription",
        sourceId: `${subscriptionId}:created`,
        metadata: { eventName, variantId, productName, customData },
      })

      if (!userId) {
        console.log(JSON.stringify({ ts, event: "ls_subscription_unmatched", email, subscriptionId }))
        break
      }

      if (kind !== "starter" && kind !== "pro") {
        console.log(JSON.stringify({ ts, event: "ls_subscription_unknown_variant", variantId, subscriptionId }))
        break
      }

      // Upsert subscription row, then update tier/period.
      await getOrCreateSubscription(sql, userId)
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const storageLimit = TIERS[kind].storageLimitBytes
      await sql`
        UPDATE subscriptions
        SET tier = ${kind}, status = 'active',
            storage_limit_bytes = ${storageLimit},
            current_period_start = NOW(),
            current_period_end = ${periodEnd},
            updated_at = NOW()
        WHERE user_id = ${userId}
      `
      console.log(JSON.stringify({ ts, event: "ls_subscription_activated", userId, tier: kind, subscriptionId }))
      break
    }

    case "subscription_payment_success": {
      const email = (attrs.user_email ?? "") || null
      const subtotal = Number(attrs.subtotal ?? 0)  // cents
      const subscriptionId = String(
        payload.data?.relationships?.subscription?.data?.id ?? payload.data?.id ?? "",
      )
      const invoiceId = String(payload.data?.id ?? "")
      const customDataUserId = (customData.user_id as string | undefined) ?? null

      const userId = await matchSupporter(sql, { email, customDataUserId })
      const tokens = tokensFromCents(subtotal)

      const txId = await recordTransaction(sql, {
        userId,
        email,
        type: "subscription_payment",
        amountTokens: tokens,
        amountUsdCents: subtotal,
        sourceType: "lemonsqueezy_subscription",
        sourceId: `payment:${invoiceId}`,
        metadata: { subscriptionId, customData },
      })

      if (!txId) {
        console.log(JSON.stringify({ ts, event: "ls_subscription_payment_duplicate", invoiceId }))
        break
      }

      if (!userId) {
        console.log(JSON.stringify({ ts, event: "ls_subscription_payment_unmatched", email, invoiceId }))
        break
      }

      // Extend period by 30 days. GREATEST handles expired subs.
      await sql`
        UPDATE subscriptions
        SET current_period_end = GREATEST(current_period_end, NOW()) + INTERVAL '30 days',
            status = 'active',
            updated_at = NOW()
        WHERE user_id = ${userId}
      `

      // D-58: token-paid subs do NOT generate tokens. All LS payments
      // are USD-paid in W1, so crediting is correct here. When internal
      // token-paid subs land, gate this on the payment source.
      if (tokens > 0) {
        await creditTokens(sql, userId, tokens)
      }

      console.log(JSON.stringify({ ts, event: "ls_subscription_payment_credited", userId, tokens, subscriptionId }))
      break
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      const email = (attrs.user_email ?? "") || null
      const subscriptionId = String(payload.data?.id ?? "")
      const customDataUserId = (customData.user_id as string | undefined) ?? null
      const userId = await matchSupporter(sql, { email, customDataUserId })

      await recordTransaction(sql, {
        userId,
        email,
        type: "subscription_payment",
        amountTokens: 0,
        amountUsdCents: 0,
        sourceType: "lemonsqueezy_subscription",
        sourceId: `${subscriptionId}:${eventName}`,
        metadata: { eventName, attrs, customData },
      })

      if (userId) {
        // Do NOT downgrade tier immediately — user paid for the current
        // period. Mark status cancelled; cron (W5) handles expiration.
        await sql`
          UPDATE subscriptions
          SET status = 'cancelled', updated_at = NOW()
          WHERE user_id = ${userId}
        `
        // Start supporter warning window (D-53 soft demotion — W5 cron
        // handles the actual downgrade; here we just stamp the warning).
        await sql`
          UPDATE supporters
          SET warning_sent_at = COALESCE(warning_sent_at, NOW()),
              status = CASE WHEN status = 'active' THEN 'warning' ELSE status END,
              updated_at = NOW()
          WHERE user_id = ${userId}
        `
        console.log(JSON.stringify({ ts, event: "ls_subscription_ended", userId, eventName, subscriptionId }))
      } else {
        console.log(JSON.stringify({ ts, event: "ls_subscription_ended_unmatched", email, subscriptionId }))
      }
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
