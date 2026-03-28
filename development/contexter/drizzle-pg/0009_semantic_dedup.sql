-- F-028: Add duplicate_of column to chunks for semantic dedup audit trail
ALTER TABLE "chunks" ADD COLUMN "duplicate_of" TEXT REFERENCES "chunks"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX "chunks_duplicate_of_idx" ON "chunks" ("duplicate_of") WHERE "duplicate_of" IS NOT NULL;
