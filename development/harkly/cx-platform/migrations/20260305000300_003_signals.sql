CREATE TABLE signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    research_id UUID NOT NULL REFERENCES researches(id),
    source_type TEXT NOT NULL,
    source_url TEXT,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    author TEXT,
    language TEXT,
    sentiment REAL,
    topics TEXT[],
    metadata JSONB NOT NULL DEFAULT '{}',
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enriched BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(tenant_id, content_hash)
);

CREATE INDEX idx_signals_research ON signals(tenant_id, research_id);
CREATE INDEX idx_signals_enriched ON signals(enriched) WHERE enriched = FALSE;

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
