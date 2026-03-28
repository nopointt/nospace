-- F-017: Parent-child chunk hierarchy
ALTER TABLE "chunks" ADD COLUMN "parent_id" text REFERENCES "chunks"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "chunk_type" text NOT NULL DEFAULT 'flat';
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "section_heading" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "page_number" integer;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "sheet_name" text;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "start_offset" integer;
--> statement-breakpoint
ALTER TABLE "chunks" ADD COLUMN "end_offset" integer;
--> statement-breakpoint
CREATE INDEX "chunks_parent_id_idx" ON "chunks" ("parent_id");
--> statement-breakpoint
CREATE INDEX "chunks_chunk_type_idx" ON "chunks" ("chunk_type");
