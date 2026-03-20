import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { projects } from "./core";

const createdAt = () => text("created_at").notNull().default(sql`(datetime('now'))`);

// ── Ingest Runs ──────────────────────────────────────────────
export const ingestRuns = sqliteTable(
  "ingest_runs",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    runType: text("run_type").notNull(),
    status: text("status").notNull().default("pending"),
    currentPhase: text("current_phase"),
    progressMessage: text("progress_message"),
    totalItems: integer("total_items").default(0),
    processedItems: integer("processed_items").default(0),
    failedItems: integer("failed_items").default(0),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (t) => [
    index("idx_runs_project").on(t.projectId),
    index("idx_runs_tenant").on(t.tenantId),
    index("idx_runs_status").on(t.status),
  ],
);

// ── Ingest Jobs ──────────────────────────────────────────────
export const ingestJobs = sqliteTable(
  "ingest_jobs",
  {
    id: text("id").primaryKey().notNull(),
    runId: text("run_id").references(() => ingestRuns.id, { onDelete: "set null" }),
    tenantId: text("tenant_id").notNull(),
    jobType: text("job_type").notNull(),
    status: text("status").notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    payload: text("payload").notNull(), // JSON
    result: text("result"), // JSON
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (t) => [
    index("idx_jobs_run").on(t.runId),
    index("idx_jobs_status").on(t.status, t.priority),
    index("idx_jobs_tenant").on(t.tenantId),
    index("idx_jobs_type").on(t.jobType, t.status),
  ],
);

// ── Work Items ───────────────────────────────────────────────
export const workItems = sqliteTable(
  "work_items",
  {
    id: text("id").primaryKey().notNull(),
    jobId: text("job_id")
      .notNull()
      .references(() => ingestJobs.id, { onDelete: "cascade" }),
    runId: text("run_id").references(() => ingestRuns.id, { onDelete: "set null" }),
    tenantId: text("tenant_id").notNull(),
    itemType: text("item_type").notNull(),
    itemId: text("item_id").notNull(),
    status: text("status").notNull().default("pending"),
    sourceData: text("source_data"), // JSON
    processedData: text("processed_data"), // JSON
    retryCount: integer("retry_count").notNull().default(0),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
    processedAt: text("processed_at"),
  },
  (t) => [
    index("idx_items_job").on(t.jobId),
    index("idx_items_status").on(t.status),
    index("idx_items_tenant").on(t.tenantId),
  ],
);
