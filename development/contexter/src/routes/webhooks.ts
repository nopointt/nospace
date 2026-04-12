import { Hono } from "hono"
import { createHmac, timingSafeEqual } from "crypto"
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
  creditTokensWithMultiplier,
  creditTokensWithQuarantineCheck,
  requireActiveSupporter,
  TASK_TOKEN_AMOUNTS,
} from "../services/supporters"
import { sendReferralPaidEmail } from "../services/notifications"

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
  if (
    hmac.length !== signature.length ||
    !timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
  ) {
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

      // W5-04: 14-day hold on payment credit. Rev-share SUMs exclude rows
      // whose held_until is in the future — chargeback window protection.
      const paymentHeldUntil = new Date(Date.now() + 14 * 86400000)

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
          heldUntil: paymentHeldUntil,
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
      // W4-06: credited variant optionally carries the referrer user id
      // that received a first-payment referral credit inside the tx. Used
      // by the outer handler to fire-and-forget the notification AFTER the
      // transaction commits (ADD-5 — email send must not run inside tx).
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
            referrerPaidEmailTarget: string | null
          }

      const outcome: CapOutcome = await sql.begin(async (txRaw) => {
        const tx = txRaw as unknown as Sql

        // W4-06: captured inside tx, used by outer handler after commit.
        let referrerPaidEmailTarget: string | null = null

        // 1. Serialize all cap checks for this user. Advisory locks taken
        //    with pg_advisory_xact_lock are released automatically on
        //    commit or rollback — no manual unlock needed.
        await tx`SELECT pg_advisory_xact_lock(hashtext(${`supporter_cap:${userId}`}))`

        // 2. Record transaction (idempotent). If duplicate, short-circuit.
        //    W5-04: 14-day hold — excluded from rev-share SUMs until NOW()
        //    has passed held_until. Credited tokens still land immediately
        //    on the supporter row; the hold only gates distribution math.
        const txId = await recordTransaction(tx, {
          userId,
          email,
          type: "subscription_payment",
          amountTokens: tokens,
          amountUsdCents: subtotal,
          sourceType: "lemonsqueezy_subscription",
          sourceId: `payment:${invoiceId}`,
          metadata: { subscriptionId, customData },
          heldUntil: paymentHeldUntil,
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
            referrerPaidEmailTarget: null,
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

        // BB-05: the transaction row was inserted above with
        // amount_tokens = tokens (requested). If the cap clamps, rewrite
        // amount_tokens to toCredit (what was actually credited) so the
        // audit row reflects the real accounting, not the intent.
        // Capped-to-zero case still writes 0 so the audit row matches
        // the absence of a supporters credit.
        if (toCreditBig !== requested) {
          await tx`
            UPDATE supporter_transactions
            SET amount_tokens = ${toCredit},
                metadata = COALESCE(metadata, '{}'::jsonb) ||
                  ${sql.json({ requested_tokens: tokens, capped: true } as never)}
            WHERE id = ${txId}
          `
        }

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

        // 5. W4-04: First-payment referral trigger. If this paying user was
        //    referred by a supporter and the referral has not yet been
        //    credited for first-payment, credit the referrer (gated on
        //    referrer still being an active supporter — ADD-1). If the
        //    referrer is no longer active, mark the referral as processed
        //    anyway to prevent re-trigger on subsequent payments. All inside
        //    the same transaction so a rollback unwinds the referral too.
        const refRows = await tx<Array<{ id: string; referrer_id: string }>>`
          SELECT id, referrer_id FROM supporter_referrals
          WHERE referred_id = ${userId} AND payment_credited_at IS NULL
          LIMIT 1
        `
        if (refRows.length > 0) {
          const ref = refRows[0]!
          const PAID_REWARD = TASK_TOKEN_AMOUNTS.referral_paid

          const refGate = await requireActiveSupporter(tx, ref.referrer_id)
          if (refGate.ok) {
            const refTxId = await recordTransaction(tx, {
              userId: ref.referrer_id,
              email: null,
              type: "referral",
              amountTokens: PAID_REWARD,
              amountUsdCents: null,
              sourceType: "referral",
              sourceId: `paid:${ref.id}`,
              metadata: { referred_id: userId, referral_id: ref.id },
            })
            if (refTxId) {
              await creditTokens(tx, ref.referrer_id, PAID_REWARD)
              await tx`
                UPDATE supporter_referrals
                SET payment_credited_at = NOW()
                WHERE id = ${ref.id}
              `
              // W4-06: lookup referrer email inside tx read (cheap) so the
              // outer handler can fire-and-forget the notification AFTER
              // the tx commits. We only capture the address — the actual
              // send happens outside the tx (ADD-5).
              const refEmailRows = await tx<{ email: string | null }[]>`
                SELECT email FROM users WHERE id = ${ref.referrer_id} LIMIT 1
              `
              referrerPaidEmailTarget = refEmailRows[0]?.email ?? null
              console.log(JSON.stringify({
                event: "referral_paid_credited",
                referral_id: ref.id,
                referrer_user_id: ref.referrer_id,
                referred_user_id: userId,
                tokens: PAID_REWARD,
              }))
            }
          } else {
            // Referrer no longer an active supporter — mark as processed so
            // we don't re-evaluate on every future payment from this user.
            await tx`
              UPDATE supporter_referrals
              SET payment_credited_at = NOW()
              WHERE id = ${ref.id}
            `
            console.log(JSON.stringify({
              event: "referral_paid_skipped_referrer_inactive",
              referral_id: ref.id,
              referrer_user_id: ref.referrer_id,
              referred_user_id: userId,
            }))
          }
        }

        return {
          kind: "credited",
          already: alreadyBig.toString(),
          requested: tokens,
          baseTokens: result.baseTokens,
          multiplier: result.multiplier,
          creditedTokens: result.creditedTokens,
          referrerPaidEmailTarget,
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

        // W4-06: fire-and-forget referral-paid notification. Email was
        // looked up INSIDE the tx (cheap SELECT) so this runs only when
        // the referral credit actually landed. Never awaited — a slow
        // Resend endpoint must not hold up the webhook response.
        if (outcome.referrerPaidEmailTarget) {
          const env = c.get("env")
          const PAID_REWARD = TASK_TOKEN_AMOUNTS.referral_paid
          sendReferralPaidEmail(env, outcome.referrerPaidEmailTarget, PAID_REWARD)
            .catch((e) => console.error(JSON.stringify({
              event: "referral_paid_email_error",
              error: e instanceof Error ? e.message : String(e),
            })))
        }
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

    case "order_refunded":
    case "subscription_payment_refunded": {
      // F-03: Reverse token credit on refund/chargeback.
      // Strategy: record a negative adjustment transaction and deduct tokens
      // from the supporter row. Per G1 — never delete the original transaction
      // or the supporter row.
      const email = (attrs.user_email ?? "") || null
      const refundedOrderId = String(payload.data?.id ?? "")
      const total = Number(attrs.total ?? attrs.subtotal ?? 0)
      const customDataUserId = (customData.user_id as string | undefined) ?? null
      const userId = await matchSupporter(sql, { email, customDataUserId })
      const tokensToDeduct = tokensFromCents(total)

      const txId = await recordTransaction(sql, {
        userId,
        email,
        type: "adjustment",
        amountTokens: -tokensToDeduct,
        amountUsdCents: -total,
        sourceType: eventName === "order_refunded" ? "lemonsqueezy_order" : "lemonsqueezy_subscription",
        sourceId: `refund:${refundedOrderId}`,
        metadata: { eventName, originalTotal: total, attrs, customData },
      })

      if (!txId) {
        console.log(JSON.stringify({ ts, event: "ls_refund_duplicate", refundedOrderId }))
        break
      }

      if (userId && tokensToDeduct > 0) {
        // Deduct tokens, floor at 0 (never go negative).
        await sql`
          UPDATE supporters
          SET tokens = GREATEST(tokens - ${tokensToDeduct}, 0),
              updated_at = NOW()
          WHERE user_id = ${userId}
        `
        console.log(JSON.stringify({
          ts,
          event: "ls_refund_processed",
          userId,
          tokensDeducted: tokensToDeduct,
          refundedOrderId,
          eventName,
        }))
      } else {
        console.log(JSON.stringify({
          ts,
          event: "ls_refund_unmatched",
          email,
          tokensToDeduct,
          refundedOrderId,
        }))
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
