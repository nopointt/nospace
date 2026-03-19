-- KB_DB: Schema and extraction tables
-- Migration: 0002_schema_extraction.sql

CREATE TABLE IF NOT EXISTS project_schemas (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft',
    discovery_prompt TEXT,
    model_used TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_schemas_project ON project_schemas(project_id);
CREATE INDEX idx_schemas_tenant ON project_schemas(tenant_id);

CREATE TABLE IF NOT EXISTS schema_fields (
    id TEXT PRIMARY KEY NOT NULL,
    schema_id TEXT NOT NULL REFERENCES project_schemas(id) ON DELETE CASCADE,
    parent_field_id TEXT REFERENCES schema_fields(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT,
    type TEXT NOT NULL,
    description TEXT,
    required INTEGER NOT NULL DEFAULT 0,
    enum_values TEXT,
    extraction_hints TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_fields_schema ON schema_fields(schema_id);
CREATE INDEX idx_fields_parent ON schema_fields(parent_field_id);

CREATE TABLE IF NOT EXISTS extracted_entities (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schema_id TEXT NOT NULL REFERENCES project_schemas(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    data TEXT NOT NULL,
    confidence REAL,
    evidence TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    rejected INTEGER NOT NULL DEFAULT 0,
    annotation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_entities_project ON extracted_entities(project_id);
CREATE INDEX idx_entities_schema ON extracted_entities(schema_id);
CREATE INDEX idx_entities_document ON extracted_entities(document_id);
CREATE INDEX idx_entities_tenant ON extracted_entities(tenant_id);
CREATE INDEX idx_entities_type ON extracted_entities(project_id, entity_type);

CREATE TABLE IF NOT EXISTS extracted_relations (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schema_id TEXT NOT NULL REFERENCES project_schemas(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    source_entity_id TEXT NOT NULL REFERENCES extracted_entities(id) ON DELETE CASCADE,
    target_entity_id TEXT NOT NULL REFERENCES extracted_entities(id) ON DELETE CASCADE,
    confidence REAL,
    evidence TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_relations_project ON extracted_relations(project_id);
CREATE INDEX idx_relations_source ON extracted_relations(source_entity_id);
CREATE INDEX idx_relations_target ON extracted_relations(target_entity_id);
CREATE INDEX idx_relations_type ON extracted_relations(project_id, relation_type);
