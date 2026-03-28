-- F-020: Contextual prefix for chunk contextualization
ALTER TABLE "chunks" ADD COLUMN "context_prefix" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "context_version" integer NOT NULL DEFAULT 0;
