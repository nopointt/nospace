/**
 * CTX-12 W4-06: Supporter notification service.
 *
 * Thin Resend wrapper with 4 exports:
 *   - sendTaskApprovedEmail   (W4-02 approve path)
 *   - sendTaskRejectedEmail   (W4-02 reject path)
 *   - sendReferralPaidEmail   (W4-04 first-payment webhook trigger)
 *   - sendRevShareEmail       (W4-05 quarterly cron distribute loop)
 *
 * Design rules (locked by spec §W4-06):
 *  1. Graceful no-op when env.RESEND_API_KEY is unset — warns and returns.
 *     Never throws. Callers do NOT need to guard on env.RESEND_API_KEY.
 *  2. All fetch calls wrapped in try/catch that swallows. Email failures
 *     must never block core operations (approve / credit / distribute).
 *  3. PII protection: msg.to is NEVER logged. Subject is logged; recipient
 *     email is not. Errors log the message string only, not the body.
 *  4. XSS guard on user-supplied reject reason: strip `<` and `>`, clamp
 *     to 500 chars. Templates are minimal Bauhaus/system-ui HTML, no JS.
 *  5. AbortSignal.timeout(10_000) — each send has a 10s hard ceiling so a
 *     hung Resend endpoint cannot back-pressure the caller loop.
 */

import type { Env } from "../types/env"

interface EmailMessage {
  to: string
  subject: string
  html: string
}

/**
 * Internal Resend POST. Returns void. All failure paths are logged and
 * swallowed. Never throws — safe to call without try/catch at the call site.
 *
 * Logged events (structured JSON):
 *   - notification_skipped_no_resend_key  (graceful no-op branch)
 *   - notification_send_failed            (HTTP non-2xx from Resend)
 *   - notification_send_error             (fetch threw / timeout / network)
 *   - notification_sent                   (2xx response; subject only)
 *
 * PII rule: msg.to is NEVER included in any log line.
 */
async function sendEmail(env: Env, msg: EmailMessage): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn(JSON.stringify({ event: "notification_skipped_no_resend_key", subject: msg.subject }))
    return
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contexter <noreply@contexter.cc>",
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(JSON.stringify({
        event: "notification_send_failed",
        status: res.status,
        subject: msg.subject,
      }))
      return
    }
    console.log(JSON.stringify({
      event: "notification_sent",
      subject: msg.subject,
      // DO NOT log msg.to (PII)
    }))
  } catch (e) {
    console.error(JSON.stringify({
      event: "notification_send_error",
      error: e instanceof Error ? e.message : String(e),
      subject: msg.subject,
    }))
  }
}

function humanTaskType(taskType: string): string {
  return taskType.replace(/_/g, " ")
}

// --- Exported notification senders -------------------------------------

export async function sendTaskApprovedEmail(
  env: Env,
  email: string,
  taskType: string,
  amountTokens: number,
): Promise<void> {
  await sendEmail(env, {
    to: email,
    subject: "Your Contexter task was approved",
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Task approved</h2>
      <p>Your <strong>${humanTaskType(taskType)}</strong> task has been reviewed and approved.</p>
      <p><strong>${amountTokens} tokens</strong> have been credited to your supporter account.</p>
      <p><a href="https://contexter.cc/dashboard">View your supporter status</a></p>
    </div>`,
  })
}

export async function sendTaskRejectedEmail(
  env: Env,
  email: string,
  taskType: string,
  reason: string,
): Promise<void> {
  // XSS guard: strip angle brackets and clamp length. Templates are
  // trusted otherwise (no user-supplied HTML), so this plus clamp is
  // sufficient defense for a transactional email.
  const safeReason = reason.replace(/[<>]/g, "").slice(0, 500)
  await sendEmail(env, {
    to: email,
    subject: "Your Contexter task was not approved",
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Task not approved</h2>
      <p>Your <strong>${humanTaskType(taskType)}</strong> task was reviewed and could not be approved.</p>
      <p><em>Reason:</em> ${safeReason}</p>
      <p>You can submit new tasks anytime from your dashboard.</p>
    </div>`,
  })
}

export async function sendReferralPaidEmail(
  env: Env,
  email: string,
  amountTokens: number,
): Promise<void> {
  await sendEmail(env, {
    to: email,
    subject: "Your referral made their first payment",
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Referral rewarded</h2>
      <p>A user you referred has made their first payment.</p>
      <p><strong>${amountTokens} tokens</strong> have been added to your supporter account.</p>
    </div>`,
  })
}

export async function sendRevShareEmail(
  env: Env,
  email: string,
  quarter: string,
  tokens: number,
  poolCents: bigint,
): Promise<void> {
  const poolUsd = Number(poolCents / 100n)
  await sendEmail(env, {
    to: email,
    subject: `Rev share for ${quarter}`,
    html: `<div style="font-family: system-ui, sans-serif; max-width: 480px; padding: 24px;">
      <h2>Quarterly rev share distributed</h2>
      <p>Your share of ${quarter} revenue: <strong>${tokens} tokens</strong></p>
      <p>Total pool: $${poolUsd}</p>
    </div>`,
  })
}
