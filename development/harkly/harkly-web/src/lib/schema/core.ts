import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamp = () => text().notNull().default(sql`(datetime('now'))`);
const optionalTimestamp = () => text().default(sql`(datetime('now'))`);

// ── Projects ─────────────────────────────────────────────────
export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey().notNull(),
    tenantId: text("tenant_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    frameType: text("frame_type"),
    frameData: text("frame_data"), // JSON
    status: text("status").notNull().default("active"),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (t) => [
    index("idx_projects_tenant").on(t.tenantId),
  ],
);

// ── Sources ──────────────────────────────────────────────────
export const sources = sqliteTable(
  "sources",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    type: text("type").notNull(),
    title: text("title"),
    url: text("url"),
    r2Key: text("r2_key"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    status: text("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    metadata: text("metadata"), // JSON
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (t) => [
    index("idx_sources_project").on(t.projectId),
    index("idx_sources_tenant").on(t.tenantId),
  ],
);

// ── Documents ────────────────────────────────────────────────
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    title: text("title"),
    content: text("content").notNull(),
    wordCount: integer("word_count"),
    language: text("language").default("en"),
    screeningStatus: text("screening_status").notNull().default("pending"),
    screeningReason: text("screening_reason"),
    relevanceScore: real("relevance_score"),
    metadata: text("metadata"), // JSON
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (t) => [
    index("idx_documents_project").on(t.projectId),
    index("idx_documents_source").on(t.sourceId),
    index("idx_documents_tenant").on(t.tenantId),
    index("idx_documents_screening").on(t.projectId, t.screeningStatus),
  ],
);

// ── Document Chunks ──────────────────────────────────────────
export const documentChunks = sqliteTable(
  "document_chunks",
  {
    id: text("id").primaryKey().notNull(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count"),
    createdAt: timestamp(),
  },
  (t) => [
    index("idx_chunks_document").on(t.documentId),
    index("idx_chunks_project").on(t.projectId),
    index("idx_chunks_tenant").on(t.tenantId),
  ],
);
