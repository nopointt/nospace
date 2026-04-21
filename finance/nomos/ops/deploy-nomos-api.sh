#!/usr/bin/env bash
# Deploy Nomos API to Hetzner via tar+ssh + docker compose.
# Windows-friendly (no rsync dependency).
set -euo pipefail

SERVER="root@46.62.220.214"
REMOTE_DIR="/opt/nomos"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="https://api.nomos.contexter.cc"
HEALTH_URL="$API_URL/health"

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-620190856}"

log()  { echo "$(date +%H:%M:%S) [deploy-nomos-api] $*"; }
fail() { echo "FATAL: $*" >&2; exit 1; }
alert() {
  [[ -n "$TELEGRAM_BOT_TOKEN" ]] || return 0
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="🚀 Nomos Deploy: $1" > /dev/null || true
}

log "Step 1: Pre-flight"
[[ -d "$LOCAL_DIR/api/src/nomos_api" ]] || fail "api/src/nomos_api not found"
ssh "$SERVER" "test -d $REMOTE_DIR && test -f $REMOTE_DIR/.env" \
  || fail "$REMOTE_DIR or .env missing on server"

log "Step 2: Pack api/ + runner/ + docker-compose.yml locally"
cd "$LOCAL_DIR"
tar --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.venv' \
    --exclude='.pytest_cache' \
    --exclude='.ruff_cache' \
    --exclude='api/tests' \
    --exclude='runner/tools' \
    --exclude='runner/__pycache__' \
    --exclude='runner/strategies/__pycache__' \
    --exclude='runner/config.json' \
    -czf /tmp/nomos-deploy.tar.gz \
    api/ runner/ docker-compose.yml

log "Step 3: Upload tar to server"
scp -q /tmp/nomos-deploy.tar.gz "$SERVER:/tmp/nomos-deploy.tar.gz"

log "Step 4: Unpack on server (preserves /opt/nomos/.env and /opt/nomos/memory)"
ssh "$SERVER" "cd $REMOTE_DIR && tar -xzf /tmp/nomos-deploy.tar.gz && rm /tmp/nomos-deploy.tar.gz && ls -la"

log "Step 5: Build + start nomos-api"
ssh "$SERVER" "cd $REMOTE_DIR && docker compose build nomos-api 2>&1 | tail -30 && docker compose up -d nomos-api 2>&1 | tail -10"

log "Step 6: Health check"
for i in $(seq 1 30); do
  if curl -sfS "$HEALTH_URL" > /dev/null 2>&1; then
    body=$(curl -sfS "$HEALTH_URL")
    log "Health OK: $body"
    commit_sha=$(git -C "$LOCAL_DIR/../.." rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "$commit_sha" > "$LOCAL_DIR/ops/last-deploy-sha.txt"
    ssh "$SERVER" "echo '$commit_sha' > $REMOTE_DIR/last-good-commit.txt"
    alert "API deploy OK ($commit_sha)"
    rm -f /tmp/nomos-deploy.tar.gz
    exit 0
  fi
  sleep 2
done
alert "API deploy FAILED (health check timeout)"
log "Recent container logs:"
ssh "$SERVER" "docker logs nomos-api --tail 30 2>&1" || true
fail "Health check timeout after 60s"
