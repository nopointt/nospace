#!/usr/bin/env bash
#
# Contexter Rollback Script
# Restores previous Docker image and restarts.
#
# Usage:
#   bash ops/rollback.sh           # rollback app only
#   bash ops/rollback.sh --db      # rollback app + restore latest DB backup

set -euo pipefail

SERVER="root@46.62.220.214"
REMOTE_DIR="/opt/contexter"
HEALTH_URL="https://api.contexter.cc/health"

log()  { echo "$(date +%H:%M:%S) [rollback] $*"; }
fail() { echo "$(date +%H:%M:%S) [rollback] FATAL: $*" >&2; exit 1; }

ROLLBACK_DB=false
if [[ "${1:-}" == "--db" ]]; then
  ROLLBACK_DB=true
  log "⚠  Database rollback requested (--db)"
fi

# ─── Step 1: Stop broken app ────────────────────────────────────────
log "Step 1: Stopping app container..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose stop app" 2>&1

# ─── Step 2: Restore docker-compose.yml if backup exists ─────────────
if ssh "$SERVER" "test -f $REMOTE_DIR/docker-compose.yml.bak"; then
  log "Step 2: Restoring docker-compose.yml from backup"
  ssh "$SERVER" "cp $REMOTE_DIR/docker-compose.yml.bak $REMOTE_DIR/docker-compose.yml"
else
  log "Step 2: No docker-compose.yml backup found, skipping"
fi

# ─── Step 3: Database rollback (if --db) ─────────────────────────────
if [[ "$ROLLBACK_DB" == "true" ]]; then
  log "Step 3: Database rollback"

  # Find latest backup
  LATEST_BACKUP=$(ssh "$SERVER" "ls -t $REMOTE_DIR/backups/*.sql.gz 2>/dev/null | head -1")
  if [[ -z "$LATEST_BACKUP" ]]; then
    fail "No database backups found in $REMOTE_DIR/backups/"
  fi

  log "  Restoring from: $LATEST_BACKUP"
  log "  ⚠ This will DROP and recreate all tables!"
  echo "  Press Ctrl+C within 5 seconds to abort..."
  sleep 5

  ssh "$SERVER" "cd $REMOTE_DIR && gunzip -c $LATEST_BACKUP | docker compose exec -T postgres psql -U contexter -d contexter"
  log "  Database restored"
else
  log "Step 3: SKIPPED (no --db flag)"
fi

# ─── Step 4: Rebuild and restart ─────────────────────────────────────
log "Step 4: Rebuilding and restarting..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose build --no-cache app && docker compose up -d app" 2>&1 | tail -5

# ─── Step 5: Verify ─────────────────────────────────────────────────
log "Step 5: Waiting for health check..."
sleep 5

for i in $(seq 1 6); do
  if curl -sf --max-time 5 "$HEALTH_URL" > /dev/null 2>&1; then
    log "  ✅ Health check PASSED"
    log ""
    log "═══════════════════════════════════════════"
    log "  ROLLBACK COMPLETE"
    log "═══════════════════════════════════════════"
    exit 0
  fi
  sleep 5
done

log "  ❌ Health check still failing after rollback"
log "  Check logs: ssh $SERVER 'docker logs contexter-app-1 --tail 30'"
exit 1
