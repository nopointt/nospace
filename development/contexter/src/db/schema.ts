import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  apiToken: text("api_token").notNull().unique(),
  name: text("name"),
  email: text("email"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
})

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  r2Key: text("r2_key").notNull(),
  status: text("status", { enum: ["pending", "processing", "ready", "error"] }).notNull().default("pending"),
  markdown: text("markdown"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
})

export const chunks = sqliteTable("chunks", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  tokenCount: integer("token_count"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
})

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["parse", "chunk", "embed", "index"] }).notNull(),
  status: text("status", { enum: ["pending", "running", "done", "error"] }).notNull().default("pending"),
  progress: integer("progress").default(0),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
})

export const shares = sqliteTable("shares", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  sharedWithId: text("shared_with_id").references(() => users.id),
  shareToken: text("share_token").notNull().unique(),
  scope: text("scope").notNull().default("all"), // "all" or JSON array of document IDs
  permission: text("permission", { enum: ["read", "read_write"] }).notNull().default("read"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
})
