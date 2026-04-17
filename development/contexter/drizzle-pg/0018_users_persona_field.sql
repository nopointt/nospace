-- CTX-11 Pre-W1: analytics segmentation + Pro tier drift fix
-- Adds persona_self_reported to users (nullable, no index — cardinality ≤6).
-- Backfill Pro tier storage 50GB → 100GB per D-AXIS-10 (zero rows on prod now, defensive).

ALTER TABLE users ADD COLUMN persona_self_reported TEXT;

UPDATE subscriptions
SET storage_limit_bytes = 107374182400
WHERE tier = 'pro' AND storage_limit_bytes = 53687091200;
