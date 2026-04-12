/**
 * CTX-12 Supporters referral route (extracted from supporters.ts — F-02).
 *
 *  POST /referral  — submit referral code, credit signup bonus to referrer
 */

import { Hono } from "hono"
import type { Env } from "../types/env"
import type { Sql } from "postgres"
import type Redis from "ioredis"
import { resolveAuth } from "../services/auth"
import { checkRateLimit, getClientIp } from "../services/rate-limit"
import {
  TASK_TOKEN_AMOUNTS,
  requireActiveSupporter,
  recordTransaction,
  creditTokens,
  genId,
} from "../services/supporters"
import { computeDeviceHash } from "./supporters"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis; requestId: string } }

export const supportersReferral = new Hono<AppEnv>()

supportersReferral.post("/", async (c) => {
  const sql = c.get("sql")
  const redis = c.get("redis")
  const env = c.get("env")

  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth || !auth.isOwner) return c.json({ error: "unauthorized" }, 401)

  const ip = getClientIp(c)
  const userAgent = c.req.header("user-agent") ?? null
  const acceptLanguage = c.req.header("accept-language") ?? null
  const signupIp = ip && ip !== "unknown" && ip.length > 0 ? ip : null
  const deviceHash = computeDeviceHash(userAgent, acceptLanguage)
  const userRl = await checkRateLimit(
    redis,
    `referral_submit:${auth.userId}`,
    5,
    3600,
    ip,
    env.RATE_LIMIT_WHITELIST_IPS,
  )
  if (!userRl.allowed) return c.json({ error: "rate_limited" }, 429)
  const ipRl = await checkRateLimit(
    redis,
    `referral_submit_ip:${ip}`,
    20,
    3600,
    ip,
    env.RATE_LIMIT_WHITELIST_IPS,
  )
  if (!ipRl.allowed) return c.json({ error: "rate_limited" }, 429)

  let body: { code?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "invalid_json" }, 400)
  }
  if (typeof body.code !== "string" || body.code.length === 0 || body.code.length > 128) {
    return c.json({ error: "invalid_code" }, 400)
  }
  const code = body.code
  if (code === auth.userId) return c.json({ error: "cannot_refer_self" }, 400)

  const userRows = await sql<{ id: string }[]>`
    SELECT id FROM users WHERE id = ${code} LIMIT 1
  `
  if (userRows.length === 0) return c.json({ error: "invalid_code" }, 404)

  type ReferralResult =
    | { ok: true; referralId: string; signupReward: number }
    | { ok: false; code: 404 | 409; err: string }

  const SIGNUP_REWARD = TASK_TOKEN_AMOUNTS.referral_signup

  const result: ReferralResult = await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as Sql

    const gate = await requireActiveSupporter(tx, code)
    if (!gate.ok) {
      return { ok: false, code: 409, err: "referrer_not_active" } as ReferralResult
    }

    const dup = await tx`
      SELECT 1 FROM supporter_referrals WHERE referred_id = ${auth.userId} LIMIT 1
    `
    if (dup.length > 0) {
      return { ok: false, code: 409, err: "already_referred" } as ReferralResult
    }

    if (signupIp !== null || deviceHash !== null) {
      const abuse = await tx`
        SELECT 1 FROM supporter_referrals
        WHERE referrer_id = ${code}
          AND (
            (${signupIp}::text IS NOT NULL AND signup_ip = ${signupIp})
            OR
            (${deviceHash}::text IS NOT NULL AND signup_device_hash = ${deviceHash})
          )
        LIMIT 1
      `
      if (abuse.length > 0) {
        return {
          ok: false,
          code: 409,
          err: "duplicate_ip_or_device",
        } as ReferralResult
      }
    }

    const refId = genId()
    await tx`
      INSERT INTO supporter_referrals
        (id, referrer_id, referred_id, code, signup_credited_at,
         signup_ip, signup_device_hash)
      VALUES
        (${refId}, ${code}, ${auth.userId}, ${code}, NOW(),
         ${signupIp}, ${deviceHash})
    `

    const txId = await recordTransaction(tx, {
      userId: code,
      email: null,
      type: "referral",
      amountTokens: SIGNUP_REWARD,
      amountUsdCents: null,
      sourceType: "referral",
      sourceId: `signup:${refId}`,
      metadata: { referred_id: auth.userId },
    })
    if (!txId) {
      return { ok: false, code: 409, err: "duplicate_tx" } as ReferralResult
    }

    await creditTokens(tx, code, SIGNUP_REWARD)

    return { ok: true, referralId: refId, signupReward: SIGNUP_REWARD } as ReferralResult
  }) as unknown as ReferralResult

  if (!result.ok) {
    if (result.err === "duplicate_ip_or_device") {
      return c.json(
        { error: result.err, code: "duplicate_ip_or_device" },
        result.code,
      )
    }
    return c.json({ error: result.err }, result.code)
  }

  console.log(JSON.stringify({
    event: "referral_signup_credited",
    referrer_user_id: code,
    referred_user_id: auth.userId,
    referral_id: result.referralId,
    tokens: result.signupReward,
  }))

  return c.json({
    ok: true,
    referralId: result.referralId,
    signupReward: result.signupReward,
  }, 201)
})
