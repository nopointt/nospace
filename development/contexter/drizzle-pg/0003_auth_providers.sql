-- Auth providers: add social login fields to users
ALTER TABLE "users" ADD COLUMN "telegram_id" TEXT;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" TEXT;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX "users_telegram_id_idx" ON "users" ("telegram_id") WHERE "telegram_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_id_idx" ON "users" ("google_id") WHERE "google_id" IS NOT NULL;
