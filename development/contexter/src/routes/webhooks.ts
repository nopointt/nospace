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
  creditTokensWithMultiplier,
  creditTokensWithQuarantineCheck,
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
        // W2-07: intake routes new supporters through the quarantine
        // check — when there are already 100 active/warning members,
        // the new row lands in status='quarantined' and waits for the
        // weekly ranking sweep to (maybe) promote it.
        const result = await creditTokensWithQuarantineCheck(sql, userId, tokens)
        console.log(JSON.stringify({
          ts,
          event: "ls_supporter_credited",
          userId,
          tokens,
          orderId,
          supporterStatus: result.status,
          created: result.created,
        }))
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
      // Idempotent via source_id: a duplicate webhook returns null and
      // we break BEFORE the subscription upsert, so current_period_start
      // and current_period_end are never reset by a replay.
      const txId = await recordTransaction(sql, {
        userId,
        email,
        type: "subscription_payment",
        amountTokens: 0,
        amountUsdCents: 0,
        sourceType: "lemonsqueezy_subscription",
        sourceId: `${subscriptionId}:created`,
        metadata: { eventName, variantId, productName, customData },
      })

      if (!txId) {
        console.log(JSON.stringify({ ts, event: "ls_subscription_created_duplicate", subscriptionId }))
        break
      }

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

      if (!userId) {
        // No supporter to match — still record the unmatched transaction
        // for later reclaim on registration. No cap check needed (no
        // credit happens), no lock needed (no race window).
        const txId = await recordTransaction(sql, {
          userId: null,
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
        console.log(JSON.stringify({ ts, event: "ls_subscription_payment_unmatched", email, invoiceId }))
        break
      }

      // Extend period by 30 days. GREATEST handles expired subs.
      // Runs outside the cap transaction — subscriptions row update is
      // independent of the token accounting and does not need to be
      // serialized with it.
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
      //
      // W2-03: subscription_payment_success gets the D-52 tier multiplier.
      // Order-created PWYW stays at the base 1:1 rate (no silent change).
      //
      // W2-08 (revised): spending cap of 500 BASE tokens/month from
      // subscription payments, wrapped in sql.begin + pg_advisory_xact_lock
      // so two concurrent webhooks for the SAME user with DIFFERENT invoice
      // IDs cannot both observe the same prior SUM and both credit up to
      // 500 tokens (cap would be exceeded). The lock is keyed on the user
      // id so different users never contend. Inside the transaction:
      //   1. acquire advisory lock keyed on `supporter_cap:${userId}`
      //   2. recordTransaction (duplicate gate still works — idempotent
      //      pre-SELECT on source_type+source_id inside the tx)
      //   3. SUM prior subscription_payment rows this calendar month,
      //      excluding the row we just inserted (filter by id != txId)
      //   4. compute cap math
      //   5. call creditTokensWithMultiplier with the tx handle so the
      //      supporters upsert commits atomically with the transaction row
      // If any step fails, the whole transaction rolls back and the next
      // webhook retry sees a clean slate.
      type CapOutcome =
        | { kind: "duplicate" }
        | { kind: "capped"; already: string; requested: number }
        | {
            kind: "credited"
            already: string
            requested: number
            baseTokens: number
            multiplier: string
            creditedTokens: number
          }

      const outcome: CapOutcome = await sql.begin(async (txRaw) => {
        const tx = txRaw as unknown as Sql

        // 1. Serialize all cap checks for this user. Advisory locks taken
        //    with pg_advisory_xact_lock are released automatically on
        //    commit or rollback — no manual unlock needed.
        await tx`SELECT pg_advisory_xact_lock(hashtext(${`supporter_cap:${userId}`}))`

        // 2. Record transaction (idempotent). If duplicate, short-circuit.
        const txId = await recordTransaction(tx, {
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
          return { kind: "duplicate" } as CapOutcome
        }

        if (tokens <= 0) {
          // Zero-token payment still gets a transaction row, no credit.
          return {
            kind: "credited",
            already: "0",
            requested: 0,
            baseTokens: 0,
            multiplier: "1/1",
            creditedTokens: 0,
          } as CapOutcome
        }

        // 3. SUM prior payment transactions this calendar month,
        //    excluding the row we just inserted.
        const alreadyRows = await tx<{ sum: string | null }[]>`
          SELECT COALESCE(SUM(amount_tokens), 0)::text AS sum
          FROM supporter_transactions
          WHERE user_id = ${userId}
            AND source_type = 'lemonsqueezy_subscription'
            AND source_id LIKE 'payment:%'
            AND created_at >= date_trunc('month', NOW())
            AND id != ${txId}
        `
        const alreadyBig = BigInt(alreadyRows[0]?.sum ?? "0")
        const CAP = 500n
        const remaining = CAP > alreadyBig ? CAP - alreadyBig : 0n
        const requested = BigInt(tokens)
        const toCreditBig = remaining < requested ? remaining : requested
        const toCredit = Number(toCreditBig)

        if (toCredit === 0) {
          return {
            kind: "capped",
            already: alreadyBig.toString(),
            requested: tokens,
          } as CapOutcome
        }

        // 4. Credit inside the transaction so the supporters upsert and
        //    the supporter_transactions row commit atomically.
        const result = await creditTokensWithMultiplier(tx, userId, toCredit)
        return {
          kind: "credited",
          already: alreadyBig.toString(),
          requested: tokens,
          baseTokens: result.baseTokens,
          multiplier: result.multiplier,
          creditedTokens: result.creditedTokens,
        } as CapOutcome
      }) as unknown as CapOutcome

      if (outcome.kind === "duplicate") {
        console.log(JSON.stringify({ ts, event: "ls_subscription_payment_duplicate", invoiceId }))
        break
      }

      if (outcome.kind === "capped") {
        console.log(JSON.stringify({
          ts,
          event: "ls_subscription_payment_capped",
          userId,
          requested: outcome.requested,
          alreadyCredited: Number(BigInt(outcome.already)),
          subscriptionId,
        }))
      } else {
        console.log(JSON.stringify({
          ts,
          event: "ls_subscription_payment_credited",
          userId,
          requested: outcome.requested,
          cappedBase: outcome.baseTokens,
          multiplier: outcome.multiplier,
          creditedTokens: outcome.creditedTokens,
          subscriptionId,
        }))
      }
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
