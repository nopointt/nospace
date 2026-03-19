import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { projects, documents } from "./core";

const timestamp = () => text().notNull().default(sql`(datetime('now'))`);

// ── Project Schemas ──────────────────────────────────────────
export const projectSchemas = sqliteTable(
  "project_schemas",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("draft"),
    discoveryPrompt: text("discovery_prompt"),
    modelUsed: text("model_used"),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (t) => [
    index("idx_schemas_project").on(t.projectId),
    index("idx_schemas_tenant").on(t.tenantId),
  ],
);

// ── Schema Fields ────────────────────────────────────────────
export const schemaFields = sqliteTable(
  "schema_fields",
  {
    id: text("id").primaryKey().notNull(),
    schemaId: text("schema_id")
      .notNull()
      .references(() => projectSchemas.id, { onDelete: "cascade" }),
    parentFieldId: text("parent_field_id").references((): any => schemaFields.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    displayName: text("display_name"),
    type: text("type").notNull(),
    description: text("description"),
    required: integer("required").notNull().default(0),
    enumValues: text("enum_values"), // JSON array
    extractionHints: text("extraction_hints"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp(),
  },
  (t) => [
    index("idx_fields_schema").on(t.schemaId),
    index("idx_fields_parent").on(t.parentFieldId),
  ],
);

// ── Extracted Entities ───────────────────────────────────────
export const extractedEntities = sqliteTable(
  "extracted_entities",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    schemaId: text("schema_id")
      .notNull()
      .references(() => projectSchemas.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    entityType: text("entity_type").notNull(),
    data: text("data").notNull(), // JSON
    confidence: real("confidence"),
    evidence: text("evidence"),
    verified: integer("verified").notNull().default(0),
    rejected: integer("rejected").notNull().default(0),
    annotation: text("annotation"),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  (t) => [
    index("idx_entities_project").on(t.projectId),
    index("idx_entities_schema").on(t.schemaId),
    index("idx_entities_document").on(t.documentId),
    index("idx_entities_tenant").on(t.tenantId),
    index("idx_entities_type").on(t.projectId, t.entityType),
  ],
);

// ── Extracted Relations ──────────────────────────────────────
export const extractedRelations = sqliteTable(
  "extracted_relations",
  {
    id: text("id").primaryKey().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    schemaId: text("schema_id")
      .notNull()
      .references(() => projectSchemas.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull(),
    relationType: text("relation_type").notNull(),
    sourceEntityId: text("source_entity_id")
      .notNull()
      .references(() => extractedEntities.id, { onDelete: "cascade" }),
    targetEntityId: text("target_entity_id")
      .notNull()
      .references(() => extractedEntities.id, { onDelete: "cascade" }),
    confidence: real("confidence"),
    evidence: text("evidence"),
    metadata: text("metadata"), // JSON
    createdAt: timestamp(),
  },
  (t) => [
    index("idx_relations_project").on(t.projectId),
    index("idx_relations_source").on(t.sourceEntityId),
    index("idx_relations_target").on(t.targetEntityId),
    index("idx_relations_type").on(t.projectId, t.relationType),
  ],
);
