-- KB_DB: Canvas / UI state
-- Migration: 0004_canvas.sql

CREATE TABLE IF NOT EXISTS canvas_frames (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    module TEXT NOT NULL,
    title TEXT NOT NULL,
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    width REAL NOT NULL DEFAULT 600,
    height REAL NOT NULL DEFAULT 480,
    z_index INTEGER NOT NULL DEFAULT 0,
    minimized INTEGER NOT NULL DEFAULT 0,
    floor INTEGER NOT NULL DEFAULT 0,
    frame_data TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_frames_project ON canvas_frames(project_id);
CREATE INDEX idx_frames_tenant ON canvas_frames(tenant_id);

CREATE TABLE IF NOT EXISTS canvas_viewports (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL,
    floor INTEGER NOT NULL DEFAULT 0,
    pan_x REAL NOT NULL DEFAULT 0,
    pan_y REAL NOT NULL DEFAULT 0,
    zoom REAL NOT NULL DEFAULT 1.0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, tenant_id, floor)
);
CREATE INDEX idx_viewports_project ON canvas_viewports(project_id, tenant_id);
