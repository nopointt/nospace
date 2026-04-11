-- CTX-12 W5-04: Anti-abuse tracking
-- Part A: IP + device hash on referrals
ALTER TABLE "supporter_referrals"
  ADD COLUMN "signup_ip" TEXT,
  ADD COLUMN "signup_device_hash" TEXT;
--> statement-breakpoint
CREATE INDEX "supporter_referrals_signup_ip_idx" ON "supporter_referrals" ("signup_ip");
--> statement-breakpoint
CREATE INDEX "supporter_referrals_signup_device_hash_idx" ON "supporter_referrals" ("signup_device_hash");
--> statement-breakpoint
-- Part B: 14-day hold on payment tokens
ALTER TABLE "supporter_transactions"
  ADD COLUMN "held_until" TIMESTAMP WITH TIME ZONE;
--> statement-breakpoint
CREATE INDEX "supporter_transactions_held_until_idx" ON "supporter_transactions" ("held_until") WHERE "held_until" IS NOT NULL;
