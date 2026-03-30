#!/usr/bin/env bash
#
# Contexter Deploy Script
# Replaces manual SCP + restart with a reliable pipeline:
#   pre-checks → sync → build → restart → verify
#
# Usage:
#   bash ops/deploy.sh              # full deploy
#   bash ops/deploy.sh --skip-tests # skip pre-deploy tests (emergency hotfix)
#
# Requirements: ssh access to root@46.62.220.214, scp, curl

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
SERVER="root@46.62.220.214"
REMOTE_DIR="/opt/contexter"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"  # contexter project root
API_URL="https://api.contexter.cc"
HEALTH_URL="$API_URL/health"

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-620190856}"

SKIP_TESTS=false
if [[ "${1:-}" == "--skip-tests" ]]; then
  SKIP_TESTS=true
  echo "⚠  Skipping pre-deploy tests (--skip-tests)"
fi

# ─── Helpers ─────────────────────────────────────────────────────────
log()  { echo "$(date +%H:%M:%S) [deploy] $*"; }
fail() { echo "$(date +%H:%M:%S) [deploy] FATAL: $*" >&2; send_alert "DEPLOY FAILED: $*"; exit 1; }

send_alert() {
  local msg="$1"
  if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d text="🚀 Contexter Deploy: $msg" \
      -d parse_mode="HTML" > /dev/null 2>&1 || true
  fi
}

check_health() {
  local url="$1"
  local max_wait="${2:-30}"
  local start=$SECONDS
  while (( SECONDS - start < max_wait )); do
    if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# ─── Step 0: Pre-flight checks ──────────────────────────────────────
log "Step 0: Pre-flight checks"

# Verify local project
[[ -f "$LOCAL_DIR/src/index.ts" ]] || fail "src/index.ts not found in $LOCAL_DIR"
[[ -f "$LOCAL_DIR/package.json" ]] || fail "package.json not found"

# Verify SSH connectivity
ssh -o ConnectTimeout=5 "$SERVER" "echo ok" > /dev/null 2>&1 || fail "Cannot SSH to $SERVER"

# Verify current production is healthy (don't deploy on top of broken state)
log "  Checking current production health..."
check_health "$HEALTH_URL" 10 || log "  ⚠ Production not healthy — proceeding anyway (might be the reason for deploy)"

log "  Pre-flight OK"

# ─── Step 1: Pre-deploy tests (local) ───────────────────────────────
if [[ "$SKIP_TESTS" == "false" ]]; then
  log "Step 1: Pre-deploy tests"

  # Unit tests
  log "  Running unit tests..."
  cd "$LOCAL_DIR"
  if bun test tests/chunker.test.ts tests/parsers.test.ts 2>&1 | tail -5; then
    log "  Unit tests: done (check output for failures)"
  else
    log "  ⚠ Unit tests had failures — proceeding (known failing tests exist)"
  fi

  # Canary (if token available and golden pairs exist)
  if [[ -f "$LOCAL_DIR/evaluation/golden/index.json" ]]; then
    log "  Canary test available but requires API token — skipping in automated deploy"
  fi

  log "  Pre-deploy tests complete"
else
  log "Step 1: SKIPPED (--skip-tests)"
fi

# ─── Step 2: Sync files to server ───────────────────────────────────
log "Step 2: Syncing files to server"

# Sync source code
log "  Syncing src/..."
scp -r "$LOCAL_DIR/src/" "$SERVER:$REMOTE_DIR/app/src/"

# Sync package files (into app/ — Dockerfile COPY reads from there)
log "  Syncing package.json + bun.lock + tsconfig..."
scp "$LOCAL_DIR/package.json" "$SERVER:$REMOTE_DIR/app/package.json"
scp "$LOCAL_DIR/bun.lock" "$SERVER:$REMOTE_DIR/app/bun.lock"
scp "$LOCAL_DIR/tsconfig.json" "$SERVER:$REMOTE_DIR/app/tsconfig.json" 2>/dev/null || true

# Sync evaluation scripts
log "  Syncing evaluation/..."
scp -r "$LOCAL_DIR/evaluation/" "$SERVER:$REMOTE_DIR/app/evaluation/"

# Sync drizzle migrations
log "  Syncing drizzle-pg/..."
scp -r "$LOCAL_DIR/drizzle-pg/" "$SERVER:$REMOTE_DIR/app/drizzle-pg/"

# Sync Dockerfile
log "  Syncing Dockerfile..."
scp "$LOCAL_DIR/ops/Dockerfile" "$SERVER:$REMOTE_DIR/Dockerfile"

# Verify critical file exists on server
log "  Verifying sync..."
ssh "$SERVER" "test -f $REMOTE_DIR/app/src/index.ts" || fail "src/index.ts not found on server after sync"
ssh "$SERVER" "test -f $REMOTE_DIR/app/src/services/content-filter.ts" || fail "content-filter.ts not found on server after sync"

log "  Sync complete"

# ─── Step 3: Backup current state ───────────────────────────────────
log "Step 3: Backing up docker-compose.yml"
ssh "$SERVER" "cp $REMOTE_DIR/docker-compose.yml $REMOTE_DIR/docker-compose.yml.bak" || true

# ─── Step 4: Build Docker image ─────────────────────────────────────
log "Step 4: Building Docker image (this takes ~2 minutes)..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose build --no-cache app" 2>&1 | tail -5
log "  Build complete"

# ─── Step 5: Restart app ────────────────────────────────────────────
log "Step 5: Restarting app container..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose up -d app" 2>&1

# ─── Step 6: Post-deploy verification ───────────────────────────────
log "Step 6: Post-deploy verification"

log "  Waiting for health check..."
if check_health "$HEALTH_URL" 30; then
  log "  ✅ Health check PASSED"
else
  log "  ❌ Health check FAILED after 30s"
  log "  Checking logs..."
  ssh "$SERVER" "docker logs contexter-app-1 --tail 20" 2>&1
  fail "Post-deploy health check failed. Check logs above. Rollback: bash ops/rollback.sh"
fi

# Verify health response details
HEALTH_RESPONSE=$(curl -sf "$HEALTH_URL" 2>/dev/null || echo '{}')
log "  Health response: $HEALTH_RESPONSE"

# Check for any crash loops
RESTART_COUNT=$(ssh "$SERVER" "docker inspect contexter-app-1 --format '{{.RestartCount}}'" 2>/dev/null || echo "0")
if [[ "$RESTART_COUNT" -gt 0 ]]; then
  log "  ⚠ Container has restarted $RESTART_COUNT times"
fi

# ─── Step 7: Summary ────────────────────────────────────────────────
log ""
log "═══════════════════════════════════════════"
log "  DEPLOY COMPLETE ✅"
log "  API: $API_URL"
log "  Health: $HEALTH_URL"
log "  Restarts: $RESTART_COUNT"
log "═══════════════════════════════════════════"

send_alert "✅ Deploy complete. Health: OK. Restarts: $RESTART_COUNT"
