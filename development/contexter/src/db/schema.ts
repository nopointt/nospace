import { pgTable, text, integer, timestamp, index, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// pgvector custom type — 1024 dimensions (Jina v4)
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1024)"
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  r2Key: text("r2_key").notNull(),
  status: text("status", { enum: ["pending", "processing", "ready", "error"] }).notNull().default("pending"),
  markdown: text("markdown"),
  errorMessage: text("error_message"),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("chunks_user_id_idx").on(table.userId),
  index("chunks_document_id_idx").on(table.documentId),
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
