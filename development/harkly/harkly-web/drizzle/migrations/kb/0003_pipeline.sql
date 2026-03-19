-- KB_DB: Processing pipeline tables
-- Migration: 0003_pipeline.sql

CREATE TABLE IF NOT EXISTS ingest_runs (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    run_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    current_phase TEXT,
    progress_message TEXT,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_runs_project ON ingest_runs(project_id);
CREATE INDEX idx_runs_tenant ON ingest_runs(tenant_id);
CREATE INDEX idx_runs_status ON ingest_runs(status);

CREATE TABLE IF NOT EXISTS ingest_jobs (
    id TEXT PRIMARY KEY NOT NULL,
    run_id TEXT REFERENCES ingest_runs(id) ON DELETE SET NULL,
    tenant_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 0,
    payload TEXT NOT NULL,
    result TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_jobs_run ON ingest_jobs(run_id);
CREATE INDEX idx_jobs_status ON ingest_jobs(status, priority DESC);
CREATE INDEX idx_jobs_tenant ON ingest_jobs(tenant_id);
CREATE INDEX idx_jobs_type ON ingest_jobs(job_type, status);

CREATE TABLE IF NOT EXISTS work_items (
    id TEXT PRIMARY KEY NOT NULL,
    job_id TEXT NOT NULL REFERENCES ingest_jobs(id) ON DELETE CASCADE,
    run_id TEXT REFERENCES ingest_runs(id) ON DELETE SET NULL,
    tenant_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    source_data TEXT,
    processed_data TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT
);
CREATE INDEX idx_items_job ON work_items(job_id);
CREATE INDEX idx_items_status ON work_items(status);
CREATE INDEX idx_items_tenant ON work_items(tenant_id);
