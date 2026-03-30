/**
 * Better Auth configuration for Contexter.
 *
 * Stack: Hono + Bun + PostgreSQL 16 + Drizzle ORM
 * Features: email/password + Google OAuth + email verification + password reset
 * Session: PostgreSQL-backed, HttpOnly cookie, cross-subdomain (.contexter.cc)
 *
 * Existing apiToken system preserved for API/MCP clients (parallel auth).
 */

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import type { Env } from "../types/env"
import * as authSchema from "./schema"

/**
 * Create auth instance. Called once at server startup.
 * Requires DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY in env.
 */
export function createAuth(env: Env) {
  // Small dedicated pool for auth (max 3) — main app pool (max 10) is separate
  const client = postgres(env.DATABASE_URL, { max: 3, idle_timeout: 30 })
  const db = drizzle(client, { schema: authSchema })

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),

    baseURL: env.BASE_URL, // https://api.contexter.cc
    basePath: "/auth", // better-auth routes mount here (separate from legacy /api/auth)

    secret: env.BETTER_AUTH_SECRET,

    // Map to existing "users" table (not default "user")
    // Field mapping handled in Drizzle schema (auth/schema.ts) — column names map to snake_case DB columns
    user: {
      modelName: "users",
    },

    // --- Email + Password ---
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: true, // auto sign in after registration
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(env, {
          to: user.email,
          subject: "Reset your Contexter password",
          html: resetPasswordTemplate(url),
        })
      },
    },

    // --- Email Verification ---
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(env, {
          to: user.email,
          subject: "Verify your Contexter email",
          html: verificationEmailTemplate(url),
        })
      },
    },

    // --- Google OAuth ---
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    // --- Account Linking ---
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"], // auto-link when Google confirms email_verified
      },
    },

    // --- Session ---
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 min cache before re-validate
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh session every 24h
    },

    // --- Advanced ---
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: ".contexter.cc", // shared between contexter.cc and api.contexter.cc
      },
      defaultCookieAttributes: {
        secure: true,
        httpOnly: true,
        sameSite: "none", // cross-origin (CF Pages → Hetzner API)
        path: "/",
      },
    },

    // --- Rate Limiting ---
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 900, max: 10 }, // 10 per 15 min
        "/sign-up/email": { window: 3600, max: 5 }, // 5 per hour
        "/forget-password": { window: 3600, max: 5 },
      },
    },
  })
}

// --- Email Helpers ---

interface EmailMessage {
  to: string
  subject: string
  html: string
}

async function sendEmail(env: Env, msg: EmailMessage): Promise<void> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contexter <noreply@contexter.cc>",
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error(`Resend email failed (${res.status}):`, error)
      // Don't throw — email failure should not block registration/reset
    }
  } catch (e) {
    // Network error or timeout — log but don't block auth flow
    console.error("Resend email error (non-fatal):", e instanceof Error ? e.message : String(e))
  }
}

function verificationEmailTemplate(url: string): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #111; margin-bottom: 16px;">Verify your email</h2>
      <p style="color: #555; line-height: 1.6;">
        Click the button below to verify your email address and activate your Contexter account.
      </p>
      <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 24px 0;">
        Verify Email
      </a>
      <p style="color: #999; font-size: 13px;">
        If you didn't create a Contexter account, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #bbb; font-size: 12px;">Contexter — One memory. Every AI.</p>
    </div>
  `
}

function resetPasswordTemplate(url: string): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #111; margin-bottom: 16px;">Reset your password</h2>
      <p style="color: #555; line-height: 1.6;">
        Click the button below to set a new password. This link expires in 60 minutes.
      </p>
      <a href="${url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 24px 0;">
        Reset Password
      </a>
      <p style="color: #999; font-size: 13px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #bbb; font-size: 12px;">Contexter — One memory. Every AI.</p>
    </div>
  `
}

export type Auth = ReturnType<typeof createAuth>
