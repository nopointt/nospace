-- Billing: subscriptions + payments for NOWPayments integration
CREATE TABLE "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "tier" TEXT NOT NULL DEFAULT 'free',
  "status" TEXT NOT NULL DEFAULT 'active',
  "storage_limit_bytes" BIGINT NOT NULL DEFAULT 1073741824,
  "current_period_start" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "current_period_end" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_id_idx" ON "subscriptions" ("user_id");
--> statement-breakpoint
CREATE TABLE "payments" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "subscription_id" TEXT NOT NULL REFERENCES "subscriptions"("id"),
  "nowpayments_invoice_id" TEXT,
  "nowpayments_payment_id" TEXT,
  "tier" TEXT NOT NULL,
  "amount_usd" NUMERIC(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "pay_currency" TEXT,
  "actually_paid" NUMERIC(20,8),
  "invoice_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" ("user_id");
--> statement-breakpoint
CREATE INDEX "payments_nowpayments_invoice_id_idx" ON "payments" ("nowpayments_invoice_id");
--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" ("status");
