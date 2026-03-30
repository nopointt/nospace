-- CTX-04: better-auth integration
-- Adds missing columns to users + creates session/account/verification tables

-- 1. Make api_token nullable (better-auth users don't have apiToken, legacy users keep theirs)
ALTER TABLE "users" ALTER COLUMN "api_token" DROP NOT NULL;

-- 2. Add missing columns to existing users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;

-- Make email unique (better-auth requires it for email/password login)
-- First set null emails to placeholder to avoid unique violation
UPDATE "users" SET email = 'legacy-' || id || '@noemail.contexter.cc' WHERE email IS NULL;
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");

-- 2. Session table (better-auth session storage)
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token");

-- 3. Account table (OAuth providers — Google, etc.)
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "access_token_expires_at" timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "scope" text,
  "id_token" text,
  "password" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Verification table (email verification + password reset tokens)
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
