-- Full-text search: tsvector column + GIN index (replaces SQLite FTS5)
ALTER TABLE "chunks" ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED;
--> statement-breakpoint
CREATE INDEX "chunks_tsv_idx" ON "chunks" USING gin ("tsv");
--> statement-breakpoint
-- Vector similarity search: HNSW index on embedding column (replaces Vectorize)
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);
