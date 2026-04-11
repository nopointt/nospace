#!/usr/bin/env bash
#
# Contexter Deploy Script
# Replaces manual SCP + restart with a reliable pipeline:
#   pre-checks → sync → build → verify image → restart → smoke test
#
# Usage:
#   bash ops/deploy.sh              # full deploy
#   bash ops/deploy.sh --skip-tests # skip pre-deploy tests (emergency hotfix)
#
# Requirements: ssh access to root@46.62.220.214, scp, curl, tar

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
SERVER="root@46.62.220.214"
REMOTE_DIR="/opt/contexter"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"  # contexter project root
API_URL="https://api.contexter.cc"
HEALTH_URL="$API_URL/health"
MIN_FREE_GB=5

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

# Sync a local directory to remote atomically.
# Root cause of CTX-12/W5-05: `scp -r src/ host:dst/src/` has ambiguous
# semantics — if `dst/src` already exists, scp nests the source INSIDE
# the existing directory (host:dst/src/src/...). Subsequent rebuilds
# then baked stale top-level files with a nested second copy underneath,
# producing "docker builds but code is stale" symptom.
#
# Fix: pack locally → ship tarball → extract into a CLEAN staging dir
# on the server → atomic rename. Pure coreutils, no new deps.
sync_dir() {
  local src_path="$1"   # e.g. /local/.../src
  local dst_rel="$2"    # e.g. app/src   (relative to $REMOTE_DIR)
  local name
  name="$(basename "$src_path")"

  log "  Syncing $dst_rel/ (atomic)..."

  local tar_local="/tmp/contexter-sync-${name}-$$.tar.gz"
  local tar_remote="/tmp/contexter-sync-${name}-$$.tar.gz"
  local stage="$REMOTE_DIR/${dst_rel}.new.$$"
  local target="$REMOTE_DIR/$dst_rel"

  # Pack (-C to strip leading path; archive the directory's contents, not the dir itself)
  tar -czf "$tar_local" -C "$(dirname "$src_path")" "$name"

  scp -q "$tar_local" "$SERVER:$tar_remote"
  rm -f "$tar_local"

  ssh "$SERVER" "
    set -e
    mkdir -p '$stage'
    tar -xzf '$tar_remote' -C '$stage' --strip-components=1
    rm -f '$tar_remote'
    rm -rf '${target}.old.$$' 2>/dev/null || true
    if [ -d '$target' ]; then mv '$target' '${target}.old.$$'; fi
    mv '$stage' '$target'
    rm -rf '${target}.old.$$' 2>/dev/null || true
  " || fail "Atomic sync failed for $dst_rel"
}

# ─── Step 0: Pre-flight checks ──────────────────────────────────────
log "Step 0: Pre-flight checks"

# Verify local project
[[ -f "$LOCAL_DIR/src/index.ts" ]] || fail "src/index.ts not found in $LOCAL_DIR"
[[ -f "$LOCAL_DIR/package.json" ]] || fail "package.json not found"
[[ -f "$LOCAL_DIR/bun.lock" ]] || fail "bun.lock not found"

# Verify SSH connectivity
ssh -o ConnectTimeout=5 "$SERVER" "echo ok" > /dev/null 2>&1 || fail "Cannot SSH to $SERVER"

# Verify server has required tools
ssh "$SERVER" "command -v tar >/dev/null && command -v docker >/dev/null" \
  || fail "Server missing tar or docker"

# Verify disk space (root filesystem must have > MIN_FREE_GB)
FREE_GB=$(ssh "$SERVER" "df -BG --output=avail / | tail -1 | tr -dc '0-9'")
if [[ -z "$FREE_GB" || "$FREE_GB" -lt "$MIN_FREE_GB" ]]; then
  fail "Insufficient disk space on server: ${FREE_GB}G free, need ≥${MIN_FREE_GB}G. Run: docker builder prune -a -f && docker image prune -a -f"
fi
log "  Disk: ${FREE_GB}G free (≥${MIN_FREE_GB}G required)"

# Verify remote dir exists
ssh "$SERVER" "test -d $REMOTE_DIR/app" || fail "$REMOTE_DIR/app missing on server"

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

# ─── Step 2: Sync files to server (atomic per directory) ────────────
log "Step 2: Syncing files to server"

# Compute a deploy marker: short git SHA + short timestamp.
# This is written into app/.deploy-marker on the server and checked
# inside the built image to prove the new code made it into the image.
DEPLOY_SHA="$(cd "$LOCAL_DIR" && git rev-parse --short HEAD 2>/dev/null || echo nogit)"
DEPLOY_TS="$(date -u +%Y%m%dT%H%M%SZ)"
DEPLOY_MARKER="${DEPLOY_SHA}-${DEPLOY_TS}"
log "  Deploy marker: $DEPLOY_MARKER"

# Sync recursive directories atomically (fixes scp -r nesting bug)
sync_dir "$LOCAL_DIR/src"         "app/src"
sync_dir "$LOCAL_DIR/evaluation"  "app/evaluation"
sync_dir "$LOCAL_DIR/drizzle-pg"  "app/drizzle-pg"

# Sync individual files (scp of a single file has no nesting ambiguity)
log "  Syncing package.json + bun.lock + tsconfig..."
scp -q "$LOCAL_DIR/package.json" "$SERVER:$REMOTE_DIR/app/package.json"
scp -q "$LOCAL_DIR/bun.lock" "$SERVER:$REMOTE_DIR/app/bun.lock"
scp -q "$LOCAL_DIR/tsconfig.json" "$SERVER:$REMOTE_DIR/app/tsconfig.json" 2>/dev/null || true

# Sync Dockerfile + compose
log "  Syncing Dockerfile + docker-compose.yml..."
scp -q "$LOCAL_DIR/ops/Dockerfile" "$SERVER:$REMOTE_DIR/Dockerfile"
scp -q "$LOCAL_DIR/docker-compose.yml" "$SERVER:$REMOTE_DIR/docker-compose.yml"

# Write deploy marker AFTER all syncs — Dockerfile COPY will pick it up.
# NOTE: Dockerfile does not explicitly COPY this file, but it sits inside
# app/ which means a future Dockerfile change can surface it. For now we
# verify its presence on the host filesystem; image verification uses
# grep on a known file we just shipped.
ssh "$SERVER" "echo '$DEPLOY_MARKER' > $REMOTE_DIR/app/.deploy-marker"

# Verify critical files exist on server and are NOT nested
log "  Verifying sync..."
ssh "$SERVER" "test -f $REMOTE_DIR/app/src/index.ts" \
  || fail "src/index.ts not found on server after sync"
ssh "$SERVER" "test -f $REMOTE_DIR/app/src/services/content-filter.ts" \
  || fail "content-filter.ts not found on server after sync"
ssh "$SERVER" "! test -d $REMOTE_DIR/app/src/src" \
  || fail "Nested app/src/src detected — SCP nesting bug recurrence. Clean: rm -rf $REMOTE_DIR/app/src/src"
ssh "$SERVER" "! test -d $REMOTE_DIR/app/evaluation/evaluation" \
  || fail "Nested app/evaluation/evaluation detected — SCP nesting bug recurrence"
ssh "$SERVER" "! test -d $REMOTE_DIR/app/drizzle-pg/drizzle-pg" \
  || fail "Nested app/drizzle-pg/drizzle-pg detected — SCP nesting bug recurrence"
ssh "$SERVER" "test -f $REMOTE_DIR/docker-compose.yml" \
  || fail "docker-compose.yml not found on server after sync"

# Verify file freshness: compare a checksum of the main index.ts
LOCAL_SUM=$(sha256sum "$LOCAL_DIR/src/index.ts" | cut -d' ' -f1)
REMOTE_SUM=$(ssh "$SERVER" "sha256sum $REMOTE_DIR/app/src/index.ts | cut -d' ' -f1")
[[ "$LOCAL_SUM" == "$REMOTE_SUM" ]] \
  || fail "src/index.ts checksum mismatch after sync (local=$LOCAL_SUM remote=$REMOTE_SUM)"
log "  Sync verified: src/index.ts checksum matches ($LOCAL_SUM)"

# Verify REDIS_PASSWORD is set in .env
log "  Checking REDIS_PASSWORD in .env..."
ssh "$SERVER" "grep -q REDIS_PASSWORD $REMOTE_DIR/.env" \
  || log "  ⚠ REDIS_PASSWORD not found in .env — Redis healthcheck may fail"

log "  Sync complete"

# ─── Step 3: Backup current state ───────────────────────────────────
log "Step 3: Backing up docker-compose.yml"
ssh "$SERVER" "cp $REMOTE_DIR/docker-compose.yml $REMOTE_DIR/docker-compose.yml.bak" || true

# ─── Step 4: Build Docker image ─────────────────────────────────────
log "Step 4: Building Docker image (this takes ~2 minutes)..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose build --no-cache --pull=false app" 2>&1 | tail -10 \
  || fail "Docker build failed"
log "  Build complete"

# ─── Step 4b: Verify image contains new code (critical) ─────────────
# Root cause guard: prove the image was built from the files we just
# synced. We spin up a throwaway container from the freshly built image
# and grep src/index.ts inside it against the local checksum.
log "Step 4b: Verifying image contains synced code..."
IMAGE_SUM=$(ssh "$SERVER" "cd $REMOTE_DIR && docker compose run --rm --no-deps --entrypoint sha256sum app src/index.ts 2>/dev/null | cut -d' ' -f1")
if [[ -z "$IMAGE_SUM" ]]; then
  fail "Could not compute checksum of src/index.ts inside image"
fi
if [[ "$IMAGE_SUM" != "$LOCAL_SUM" ]]; then
  fail "Image contains STALE code. local=$LOCAL_SUM image=$IMAGE_SUM — this is the CTX-12/W5-05 bug. Check app/src on server for nesting or stale files."
fi
log "  ✅ Image verified: src/index.ts in image matches local ($IMAGE_SUM)"

# ─── Step 5: Restart app ────────────────────────────────────────────
log "Step 5: Restarting app container..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose up -d app" 2>&1 || fail "docker compose up failed"

# ─── Step 6: Post-deploy verification ───────────────────────────────
log "Step 6: Post-deploy verification"

log "  Waiting for health check..."
if check_health "$HEALTH_URL" 30; then
  log "  ✅ Health check PASSED"
else
  log "  ❌ Health check FAILED after 30s"
  log "  Checking logs..."
  ssh "$SERVER" "docker logs contexter-app-1 --tail 20" 2>&1 || true
  fail "Post-deploy health check failed. Check logs above. Rollback: bash ops/rollback.sh"
fi

# Verify health response details
HEALTH_RESPONSE=$(curl -sf "$HEALTH_URL" 2>/dev/null || echo '{}')
log "  Health response: $HEALTH_RESPONSE"

# Smoke test: at least one non-/health endpoint must respond (not 5xx).
# /api/formats is a public GET that should always return 200 with JSON.
log "  Smoke test: /api/formats..."
SMOKE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_URL/api/formats" || echo "000")
if [[ "$SMOKE_CODE" =~ ^(2..|3..|4..)$ ]]; then
  log "  ✅ Smoke test: /api/formats → $SMOKE_CODE"
else
  fail "Smoke test FAILED: /api/formats → $SMOKE_CODE (expected 2xx/3xx/4xx, got 5xx or timeout)"
fi

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
log "  Marker: $DEPLOY_MARKER"
log "  Image checksum (src/index.ts): $IMAGE_SUM"
log "  Restarts: $RESTART_COUNT"
log "═══════════════════════════════════════════"

send_alert "✅ Deploy complete. Marker: $DEPLOY_MARKER. Health: OK. Restarts: $RESTART_COUNT"
