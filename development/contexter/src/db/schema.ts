import {
  pgTable, text, integer, smallint, real, boolean, jsonb, date,
  timestamp, index, uniqueIndex, customType,
} from "drizzle-orm/pg-core"
import type { AnyPgColumn } from "drizzle-orm/pg-core"

// pgvector custom type — 512 dimensions (Jina v4, MRL truncated from 1024)
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(512)"
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(",").map(Number)
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`
  },
})

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  apiToken: text("api_token").notNull().unique(),
  name: text("name"),
  email: text("email"),
  personaSelfReported: text("persona_self_reported"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("rooms_user_id_idx").on(table.userId),
])

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  r2Key: text("r2_key").notNull(),
  status: text("status", { enum: ["pending", "processing", "ready", "error"] }).notNull().default("pending"),
  markdown: text("markdown"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const chunks = pgTable("chunks", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  tokenCount: integer("token_count"),
  embedding: vector("embedding"),
  contextPrefix: text("context_prefix"),
  contextVersion: integer("context_version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // F-017: parent-child hierarchy
  parentId: text("parent_id").references((): any => chunks.id, { onDelete: "cascade" }),
  chunkType: text("chunk_type").notNull().default("flat"),
  sectionHeading: text("section_heading"),
  pageNumber: integer("page_number"),
  sheetName: text("sheet_name"),
  startOffset: integer("start_offset"),
  endOffset: integer("end_offset"),
  // F-028: semantic dedup audit trail — points to canonical chunk
  duplicateOf: text("duplicate_of").references((): AnyPgColumn => chunks.id, { onDelete: "set null" }),
  // F-030: feedback tracking columns
  feedbackPos: real("feedback_pos").notNull().default(0),
  feedbackNeg: real("feedback_neg").notNull().default(0),
  feedbackScore: real("feedback_score").notNull().default(1.0),
}, (table) => [
  index("chunks_user_id_idx").on(table.userId),
  index("chunks_document_id_idx").on(table.documentId),
  index("chunks_parent_id_idx").on(table.parentId),
  index("chunks_chunk_type_idx").on(table.chunkType),
  index("chunks_feedback_score_idx").on(table.feedbackScore),
])

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["parse", "chunk", "embed", "index"] }).notNull(),
  status: text("status", { enum: ["pending", "running", "done", "error"] }).notNull().default("pending"),
  progress: integer("progress").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const shares = pgTable("shares", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  sharedWithId: text("shared_with_id").references(() => users.id),
  shareToken: text("share_token").notNull().unique(),
  scope: text("scope").notNull().default("all"),
  permission: text("permission", { enum: ["read", "read_write"] }).notNull().default("read"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// F-013: proxy evaluation metrics — one row per query
export const evalMetrics = pgTable("eval_metrics", {
  id: text("id").primaryKey(),
  queryId: text("query_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queriedAt: timestamp("queried_at", { withTimezone: true }).notNull().defaultNow(),
  retrievalScoreMean: real("retrieval_score_mean"),
  retrievalScoreMax: real("retrieval_score_max"),
  retrievalScoreSpread: real("retrieval_score_spread"),
  chunksRetrievedCount: smallint("chunks_retrieved_count"),
  answerLengthTokens: smallint("answer_length_tokens"),
  lexicalOverlapScore: real("lexical_overlap_score"),
  retrievalLatencyMs: integer("retrieval_latency_ms"),
  generationLatencyMs: integer("generation_latency_ms"),
  emptyAnswerRate: boolean("empty_answer_rate").notNull().default(false),
  embeddingL2NormMean: real("embedding_l2_norm_mean"),
  queryVariantsCount: smallint("query_variants_count"),
  // F-031 slot — NULL until F-031 deployed
  llmEval: jsonb("llm_eval"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("eval_metrics_user_id_idx").on(table.userId),
  index("eval_metrics_queried_at_idx").on(table.queriedAt),
  index("eval_metrics_query_id_idx").on(table.queryId),
])

// F-013: daily aggregates for post-90d retention
export const evalMetricsDailyAgg = pgTable("eval_metrics_daily_agg", {
  id: text("id").primaryKey(),
  aggDate: date("agg_date").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryCount: integer("query_count").notNull().default(0),
  emptyAnswerRatePct: real("empty_answer_rate_pct"),
  retrievalScoreMeanAvg: real("retrieval_score_mean_avg"),
  retrievalScoreMeanP50: real("retrieval_score_mean_p50"),
  retrievalScoreMeanP95: real("retrieval_score_mean_p95"),
  chunksRetrievedAvg: real("chunks_retrieved_avg"),
  answerLengthTokensAvg: real("answer_length_tokens_avg"),
  lexicalOverlapAvg: real("lexical_overlap_avg"),
  retrievalLatencyP50Ms: real("retrieval_latency_p50_ms"),
  retrievalLatencyP95Ms: real("retrieval_latency_p95_ms"),
  generationLatencyP50Ms: real("generation_latency_p50_ms"),
  generationLatencyP95Ms: real("generation_latency_p95_ms"),
  embeddingL2NormMeanAvg: real("embedding_l2_norm_mean_avg"),
  faithfulnessScoreAvg: real("faithfulness_score_avg"),   // F-031
  relevancyScoreAvg: real("relevancy_score_avg"),         // F-031
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("eval_metrics_daily_agg_date_user_idx").on(table.aggDate, table.userId),
])

// F-033: embedding drift detection tables
export const evalDriftChecks = pgTable("eval_drift_checks", {
  id: text("id").primaryKey(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  sampleSize: integer("sample_size").notNull(),
  mmdScore: real("mmd_score").notNull(),
  mmdThreshold: real("mmd_threshold").notNull().default(0.05),
  driftDetected: boolean("drift_detected").notNull().default(false),
  projectionDims: smallint("projection_dims").notNull().default(32),
  notes: text("notes"),
}, (table) => [
  index("eval_drift_checks_checked_at_idx").on(table.checkedAt),
])

export const evalDriftBaseline = pgTable("eval_drift_baseline", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sampleSize: integer("sample_size").notNull(),
  projectionDims: smallint("projection_dims").notNull().default(32),
  projections: jsonb("projections").notNull(),
  projectionMatrix: jsonb("projection_matrix"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
})

// F-030: explicit user feedback on query-answer pairs
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  queryId: text("query_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  answerText: text("answer_text").notNull(),
  rating: smallint("rating").notNull(),  // 1 = thumbs up, -1 = thumbs down
  chunkIds: text("chunk_ids").array().notNull().default([]),
  source: text("source").notNull().default("explicit"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("feedback_user_id_idx").on(table.userId),
  index("feedback_query_id_idx").on(table.queryId),
])
