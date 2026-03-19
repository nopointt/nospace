-- KB_DB: Observability
-- Migration: 0005_observability.sql

CREATE TABLE IF NOT EXISTS query_stats (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    search_type TEXT,
    fts_time_ms INTEGER,
    vector_time_ms INTEGER,
    rrf_time_ms INTEGER,
    cache_hit INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_stats_project ON query_stats(project_id);
CREATE INDEX idx_stats_created ON query_stats(created_at);

CREATE TABLE IF NOT EXISTS collection_timestamps (
    source_id TEXT PRIMARY KEY NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    last_successful_collection TEXT NOT NULL,
    etag TEXT,
    last_modified TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
