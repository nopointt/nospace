CREATE TABLE "eval_drift_checks" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "checked_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sample_size"     INTEGER     NOT NULL,
  "mmd_score"       REAL        NOT NULL,
  "mmd_threshold"   REAL        NOT NULL DEFAULT 0.05,
  "drift_detected"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "projection_dims" SMALLINT    NOT NULL DEFAULT 32,
  "notes"           TEXT
);
--> statement-breakpoint
CREATE INDEX "eval_drift_checks_checked_at_idx" ON "eval_drift_checks" ("checked_at");
--> statement-breakpoint

CREATE TABLE "eval_drift_baseline" (
  "id"              TEXT        NOT NULL PRIMARY KEY,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sample_size"     INTEGER     NOT NULL,
  "projection_dims" SMALLINT    NOT NULL DEFAULT 32,
  "projections"     JSONB       NOT NULL,
  "expires_at"      TIMESTAMPTZ NOT NULL
);
