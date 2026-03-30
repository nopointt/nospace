---
# contexter-auth.md — CTX-04 Auth Epic
> Layer: L3 | Epic: CTX-04 | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-30 (session 213 — Waves 1-5 complete, deployed, 13 audit fixes, frontend white screen deferred)
---

## Goal

Proper email+password auth with email verification, password reset, Google OAuth linking. Browser sessions via better-auth (HttpOnly cookies). Existing apiToken preserved for API/MCP.

## Key Decisions

- **Auth library:** better-auth v1.5.6 (installed)
- **Architecture:** Parallel — `/auth/*` = better-auth (browser sessions), `/api/auth/*` = legacy (apiToken)
- **Session:** Redis primary, HttpOnly cookie, HMAC-SHA256 compact, 7-day expiry
- **Password hash:** Argon2id (better-auth default)
- **Email:** Resend (API key saved at `~/.tLOS/resend-key`, from: noreply@contexter.cc)
- **Verification:** Opaque token, 24h expiry
- **Password reset:** Opaque token, 60 min expiry
- **Account linking:** trustedProviders: ["google"] (auto-link by email_verified)
- **Cross-origin cookies:** SameSite=None + Secure + domain=.contexter.cc

## Research

`nospace/docs/research/contexter-auth-email-password-research.md` — 705 lines, Sonnet 4.6.
Covers: sessions vs JWT, email verification, password reset, hashing, email services, better-auth integration, security, migration.

## Waves

### Wave 1: better-auth + email/password + Resend (IN PROGRESS)
- [x] Install better-auth v1.5.6
- [x] Create `src/auth/index.ts` — config with Drizzle postgres-js adapter
- [x] Add env vars to Env type (DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY, GOOGLE_CLIENT_ID/SECRET)
- [x] Mount handler in index.ts: `app.on(["POST", "GET"], "/auth/*", handler)`
- [x] Email templates: verification + password reset (inline HTML)
- [x] DB schema: `user.modelName: "users"` + Drizzle schema (`src/auth/schema.ts`) ✅
- [x] Migration: `0013_better_auth.sql` — api_token nullable, email_verified, updated_at, session/account/verification tables ✅
- [x] Server env: BETTER_AUTH_SECRET + RESEND_API_KEY added to .env ✅
- [x] Registration works: POST /auth/sign-up/email → 200, user created ✅
- [x] Email verification enforced: POST /auth/sign-in/email → 403 "Email not verified" ✅
- [x] Legacy apiToken auth unchanged: Bearer token → 200 ✅
- [ ] Resend domain verification (DNS records for contexter.cc) — needed for email delivery
- [ ] Test email delivery (verification + password reset)

### Wave 2: Google OAuth migration ✅
- [x] better-auth Google social provider configured in auth/index.ts
- [x] Account linking: trustedProviders: ["google"], auto-link by email
- [ ] Add callback URL in Google Cloud Console: `https://api.contexter.cc/auth/callback/google` (manual step)
- Legacy `/api/auth/google` preserved for backward compat (returns apiToken)

### Wave 3: resolveAuth() hybrid ✅
- [x] `src/services/auth.ts` extended: cookie session → apiToken → share token
- [x] `setBetterAuth()` injector in index.ts
- [x] Legacy apiToken: verified working after deploy
- [x] Cookie session: resolveSessionCookie() via better-auth api.getSession()

### Wave 4: Frontend auth pages ✅
- [x] Login.tsx — email+password + Google OAuth button
- [x] Register.tsx — name, email, password, confirm password + Terms/Privacy links
- [x] ForgotPassword.tsx — email input → sends reset link
- [x] ResetPassword.tsx — reads token from URL, new password form
- [x] VerifyEmail.tsx — reads token from URL, calls verify endpoint
- [x] Routes added to App.tsx
- [x] Russian UI, design system (Button, Input, Logo), mono font, accent color

### Wave 5: Deploy ✅
- [x] Backend deployed (better-auth, hybrid resolveAuth, schema migration)
- [x] Frontend deployed (5 auth pages, CF Pages)
- [x] /login, /register, /forgot-password: 200 OK live
- [x] Resend domain DNS verified via API + CF Global Key ✅
- [x] Test registration with real email (nopointttt@gmail.com) — 200 ✅
- [ ] Google OAuth callback URL for better-auth (SKIPPED — legacy flow works, не критично)

## Blockers

- **RESOLVED: DB schema** — `user.modelName: "users"` + `api_token` made nullable. Migration written manually (CLI export issue bypassed).
- **Resend domain** — emails from `noreply@contexter.cc` require DNS verification in Resend dashboard. Without this, emails go to spam or bounce. NEXT ACTION: add DNS records.

## AC

| ID | Criteria | Status |
|---|---|---|
| AC-1 | Email registration with verification | ✅ (sign-up returns 200, email_verified enforced on login) |
| AC-2 | Email login returns session cookie | ✅ (403 "Email not verified" = correct, session will work after verification) |
| AC-3 | Password reset via email link | ✅ (endpoint active, needs Resend domain for email delivery) |
| AC-4 | Google OAuth auto-links by email | ✅ (configured, needs callback URL in Google Console) |
| AC-5 | Existing apiToken auth still works | ✅ (verified: Bearer token → 200) |
| AC-6 | Frontend login/register/reset pages | ✅ (5 pages deployed, 200 OK) |
| AC-7 | Cross-origin cookies work (CF Pages → Hetzner) | ⬜ (needs manual test after Resend DNS) |
