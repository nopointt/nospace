-- Drop old simple tsvector column and index
ALTER TABLE "chunks" DROP COLUMN IF EXISTS "tsv";
--> statement-breakpoint
-- Add multilingual tsvector: english + russian morphological stemming
ALTER TABLE "chunks" ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', "content") || to_tsvector('russian', "content")
  ) STORED;
--> statement-breakpoint
-- Recreate GIN index on new tsv column
CREATE INDEX "chunks_tsv_idx" ON "chunks" USING gin ("tsv");
