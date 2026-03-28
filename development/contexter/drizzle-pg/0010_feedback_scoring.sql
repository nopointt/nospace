-- F-030: Feedback loops — MVFL
-- Creates the feedback table and extends chunks with feedback tracking columns.

CREATE TABLE "feedback" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "query_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "query_text" TEXT NOT NULL,
  "answer_text" TEXT NOT NULL,
  "rating" SMALLINT NOT NULL CHECK ("rating" IN (-1, 1)),
  "chunk_ids" TEXT[] NOT NULL DEFAULT '{}',
  "source" TEXT NOT NULL DEFAULT 'explicit',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" ("user_id");
--> statement-breakpoint
CREATE INDEX "feedback_query_id_idx" ON "feedback" ("query_id");
--> statement-breakpoint
CREATE INDEX "feedback_chunk_ids_idx" ON "feedback" USING GIN ("chunk_ids");
--> statement-breakpoint
ALTER TABLE "chunks"
  ADD COLUMN "feedback_pos" REAL NOT NULL DEFAULT 0,
  ADD COLUMN "feedback_neg" REAL NOT NULL DEFAULT 0,
  ADD COLUMN "feedback_score" REAL NOT NULL DEFAULT 1.0;
--> statement-breakpoint
CREATE INDEX "chunks_feedback_score_idx" ON "chunks" ("feedback_score");
