-- F-006: MRL dimension reduction 1024d → 512d
-- Retains 99.7% nDCG@10. 50% storage savings, ~1.5-2x HNSW search speed.

-- Drop HNSW index before altering column type (PG requires this)
DROP INDEX IF EXISTS "chunks_embedding_idx";
--> statement-breakpoint

-- Set all existing embeddings to NULL (will be re-embedded at 512d by reembed_chunks.ts)
UPDATE "chunks" SET "embedding" = NULL;
--> statement-breakpoint

-- Alter column type from vector(1024) to vector(512)
ALTER TABLE "chunks" ALTER COLUMN "embedding" TYPE vector(512);
--> statement-breakpoint

-- Rebuild HNSW index for 512d cosine similarity
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);
