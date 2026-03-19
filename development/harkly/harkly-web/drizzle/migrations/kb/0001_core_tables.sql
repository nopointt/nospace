-- KB_DB: Core document storage
-- Migration: 0001_core_tables.sql

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    frame_type TEXT,
    frame_data TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_projects_tenant ON projects(tenant_id);

CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    url TEXT,
    r2_key TEXT,
    mime_type TEXT,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sources_project ON sources(project_id);
CREATE INDEX idx_sources_tenant ON sources(tenant_id);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    word_count INTEGER,
    language TEXT DEFAULT 'en',
    screening_status TEXT NOT NULL DEFAULT 'pending',
    screening_reason TEXT,
    relevance_score REAL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_source ON documents(source_id);
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_screening ON documents(project_id, screening_status);

CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY NOT NULL,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_project ON document_chunks(project_id);
CREATE INDEX idx_chunks_tenant ON document_chunks(tenant_id);

-- FTS5 virtual table for full-text search on chunks
CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
    id UNINDEXED,
    document_id UNINDEXED,
    project_id UNINDEXED,
    tenant_id UNINDEXED,
    content,
    content = 'document_chunks'
);

-- Trigger: auto-sync FTS5 on INSERT
CREATE TRIGGER IF NOT EXISTS chunks_fts_insert AFTER INSERT ON document_chunks
BEGIN
    INSERT INTO document_chunks_fts(id, document_id, project_id, tenant_id, content)
    VALUES (new.id, new.document_id, new.project_id, new.tenant_id, new.content);
END;

-- Trigger: auto-sync FTS5 on DELETE
CREATE TRIGGER IF NOT EXISTS chunks_fts_delete AFTER DELETE ON document_chunks
BEGIN
    INSERT INTO document_chunks_fts(document_chunks_fts, id, document_id, project_id, tenant_id, content)
    VALUES ('delete', old.id, old.document_id, old.project_id, old.tenant_id, old.content);
END;

-- Trigger: auto-sync FTS5 on UPDATE
CREATE TRIGGER IF NOT EXISTS chunks_fts_update AFTER UPDATE ON document_chunks
BEGIN
    INSERT INTO document_chunks_fts(document_chunks_fts, id, document_id, project_id, tenant_id, content)
    VALUES ('delete', old.id, old.document_id, old.project_id, old.tenant_id, old.content);
    INSERT INTO document_chunks_fts(id, document_id, project_id, tenant_id, content)
    VALUES (new.id, new.document_id, new.project_id, new.tenant_id, new.content);
END;
