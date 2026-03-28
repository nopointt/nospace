CREATE TABLE "eval_metrics" (
  "id"                       TEXT         NOT NULL PRIMARY KEY,
  "query_id"                 TEXT         NOT NULL,
  "user_id"                  TEXT         NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "queried_at"               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Proxy metrics (F-013)
  "retrieval_score_mean"     REAL,
  "retrieval_score_max"      REAL,
  "retrieval_score_spread"   REAL,
  "chunks_retrieved_count"   SMALLINT,
  "answer_length_tokens"     SMALLINT,
  "lexical_overlap_score"    REAL,
  "retrieval_latency_ms"     INTEGER,
  "generation_latency_ms"    INTEGER,
  "empty_answer_rate"        BOOLEAN      NOT NULL DEFAULT FALSE,
  "embedding_l2_norm_mean"   REAL,
  "query_variants_count"     SMALLINT,

  -- LLM eval slot (F-031) — NULL until F-031 deployed
  "llm_eval"                 JSONB,

  "created_at"               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX "eval_metrics_user_id_idx"    ON "eval_metrics" ("user_id");
--> statement-breakpoint
CREATE INDEX "eval_metrics_queried_at_idx" ON "eval_metrics" ("queried_at");
--> statement-breakpoint
CREATE INDEX "eval_metrics_query_id_idx"   ON "eval_metrics" ("query_id");
--> statement-breakpoint

-- Daily aggregate table for post-90d retention
CREATE TABLE "eval_metrics_daily_agg" (
  "id"                            TEXT        NOT NULL PRIMARY KEY,
  "agg_date"                      DATE        NOT NULL,
  "user_id"                       TEXT        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "query_count"                   INTEGER     NOT NULL DEFAULT 0,
  "empty_answer_rate_pct"         REAL,
  "retrieval_score_mean_avg"      REAL,
  "retrieval_score_mean_p50"      REAL,
  "retrieval_score_mean_p95"      REAL,
  "chunks_retrieved_avg"          REAL,
  "answer_length_tokens_avg"      REAL,
  "lexical_overlap_avg"           REAL,
  "retrieval_latency_p50_ms"      REAL,
  "retrieval_latency_p95_ms"      REAL,
  "generation_latency_p50_ms"     REAL,
  "generation_latency_p95_ms"     REAL,
  "embedding_l2_norm_mean_avg"    REAL,
  "faithfulness_score_avg"        REAL,   -- populated by F-031 cron later
  "relevancy_score_avg"           REAL,   -- populated by F-031 cron later
  "created_at"                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "eval_metrics_daily_agg_date_user_idx"
  ON "eval_metrics_daily_agg" ("agg_date", "user_id");
