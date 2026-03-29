#!/bin/bash
set -euo pipefail

# --- Config ---
COMPOSE_DIR="/opt/contexter"
BACKUP_DIR="/opt/contexter/backups"
LOG_FILE="/var/log/contexter-backup.log"
RETENTION_DAYS=7

# Load R2 credentials from .env
set -a
source "${COMPOSE_DIR}/.env"
set +a

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="contexter_${TIMESTAMP}.sql.gz"

log() { echo "[$(date -Iseconds)] $1" >> "$LOG_FILE"; }

log "=== Backup started ==="

# Create backup dir
mkdir -p "$BACKUP_DIR"

# Dump PostgreSQL via container (no host pg_dump needed)
log "Running pg_dump..."
docker compose -f "${COMPOSE_DIR}/docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-contexter}" "${POSTGRES_DB:-contexter}" --no-owner --no-privileges \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || echo 0)
log "Local backup created: ${BACKUP_FILE} (${BACKUP_SIZE} bytes)"

# Validate: backup must be > 1KB (empty dump is ~200 bytes gzipped)
if [ "$BACKUP_SIZE" -lt 1024 ]; then
  log "ERROR: Backup file suspiciously small (${BACKUP_SIZE} bytes). Aborting offsite upload."
  exit 1
fi

# Upload to R2 offsite
log "Uploading to R2..."
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" \
  "s3://${R2_BUCKET}/backups/db/${BACKUP_FILE}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --quiet

log "Offsite upload complete: s3://${R2_BUCKET}/backups/db/${BACKUP_FILE}"

# Rotate local backups (keep last N days)
DELETED=$(find "$BACKUP_DIR" -name "contexter_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete -print | wc -l)
log "Rotated ${DELETED} old local backups (retention: ${RETENTION_DAYS} days)"

log "=== Backup completed successfully ==="
