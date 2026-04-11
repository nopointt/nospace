-- CTX-12 W4-04: Supporter referral tracking
-- Additive only. No ALTER on existing tables.

CREATE TABLE "supporter_referrals" (
  "id" TEXT PRIMARY KEY,
  "referrer_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referred_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" TEXT NOT NULL,
  "signup_credited_at" TIMESTAMP WITH TIME ZONE,
  "payment_credited_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "supporter_referrals_referred_unique" UNIQUE ("referred_id"),
  CONSTRAINT "supporter_referrals_no_self" CHECK ("referrer_id" != "referred_id")
);
--> statement-breakpoint
CREATE INDEX "supporter_referrals_referrer_idx" ON "supporter_referrals" ("referrer_id");
--> statement-breakpoint
CREATE INDEX "supporter_referrals_code_idx" ON "supporter_referrals" ("code");
--> statement-breakpoint
CREATE INDEX "supporter_referrals_pending_payment_idx" ON "supporter_referrals" ("referrer_id") WHERE "payment_credited_at" IS NULL;
