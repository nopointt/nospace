import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { sources } from "./core";

const timestamp = () => text().notNull().default(sql`(datetime('now'))`);

// ── Query Stats ──────────────────────────────────────────────
export const queryStats = sqliteTable(
  "query_stats",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    query: text("query").notNull(),
    resultsCount: integer("results_count").default(0),
    responseTimeMs: integer("response_time_ms"),
    searchType: text("search_type"),
    ftsTimeMs: integer("fts_time_ms"),
    vectorTimeMs: integer("vector_time_ms"),
    rrfTimeMs: integer("rrf_time_ms"),
    cacheHit: integer("cache_hit").default(0),
    createdAt: timestamp(),
  },
  (t) => [
    index("idx_stats_project").on(t.projectId),
    index("idx_stats_created").on(t.createdAt),
  ],
);

// ── Collection Timestamps ────────────────────────────────────
export const collectionTimestamps = sqliteTable("collection_timestamps", {
  sourceId: text("source_id")
    .primaryKey()
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  lastSuccessfulCollection: text("last_successful_collection").notNull(),
  etag: text("etag"),
  lastModified: text("last_modified"),
  updatedAt: timestamp(),
});
