-- CTX-12: Supporters program — tokens, ranking, audit trail

CREATE TABLE "supporters" (
  "user_id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "tokens" BIGINT NOT NULL DEFAULT 0,
  "rank" INTEGER,
  "tier" TEXT NOT NULL DEFAULT 'pending',
  "status" TEXT NOT NULL DEFAULT 'active',
  "warning_sent_at" TIMESTAMP WITH TIME ZONE,
  "freeze_start" TIMESTAMP WITH TIME ZONE,
  "freeze_end" TIMESTAMP WITH TIME ZONE,
  "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "supporters_tokens_joined_idx" ON "supporters" ("tokens" DESC, "joined_at" ASC);
--> statement-breakpoint
CREATE INDEX "supporters_tier_idx" ON "supporters" ("tier");
--> statement-breakpoint
CREATE INDEX "supporters_status_idx" ON "supporters" ("status");
--> statement-breakpoint

CREATE TABLE "supporter_transactions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "email" TEXT,
  "type" TEXT NOT NULL,
  "amount_tokens" BIGINT NOT NULL DEFAULT 0,
  "amount_usd_cents" BIGINT,
  "source_type" TEXT NOT NULL,
  "source_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "matched_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "supporter_tx_user_id_idx" ON "supporter_transactions" ("user_id");
--> statement-breakpoint
CREATE INDEX "supporter_tx_email_idx" ON "supporter_transactions" ("email") WHERE "user_id" IS NULL;
--> statement-breakpoint
CREATE INDEX "supporter_tx_source_idx" ON "supporter_transactions" ("source_type", "source_id");
--> statement-breakpoint
CREATE INDEX "supporter_tx_created_idx" ON "supporter_transactions" ("created_at" DESC);
--> statement-breakpoint

CREATE TABLE "supporter_tasks" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "task_type" TEXT NOT NULL,
  "amount_tokens" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "description" TEXT,
  "reviewer_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "supporter_tasks_user_id_idx" ON "supporter_tasks" ("user_id");
--> statement-breakpoint
CREATE INDEX "supporter_tasks_status_idx" ON "supporter_tasks" ("status");
