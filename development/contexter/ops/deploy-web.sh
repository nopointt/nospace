#!/usr/bin/env bash
#
# Contexter Frontend Deploy Script
# Builds SolidJS SPA and deploys to Cloudflare Pages.
#
# Usage:
#   bash ops/deploy-web.sh
#
# Requirements: bun, wrangler (npx), CF account configured

set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$LOCAL_DIR/web"
PROD_URL="https://contexter.cc"

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-620190856}"

log()  { echo "$(date +%H:%M:%S) [deploy-web] $*"; }
fail() { echo "$(date +%H:%M:%S) [deploy-web] FATAL: $*" >&2; exit 1; }

send_alert() {
  if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d text="🌐 Contexter Web: $1" > /dev/null 2>&1 || true
  fi
}

# ─── Step 0: Pre-flight ─────────────────────────────────────────────
log "Step 0: Pre-flight checks"
[[ -d "$WEB_DIR/src" ]] || fail "web/src not found"
[[ -f "$WEB_DIR/package.json" ]] || fail "web/package.json not found"
command -v bun > /dev/null || fail "bun not installed"
log "  OK"

# ─── Step 1: Install deps ───────────────────────────────────────────
log "Step 1: Installing dependencies"
cd "$WEB_DIR"
bun install 2>&1 | tail -3
log "  Done"

# ─── Step 2: Build ──────────────────────────────────────────────────
log "Step 2: Building SolidJS SPA"
bun run build 2>&1 | tail -5

[[ -f "$WEB_DIR/dist/index.html" ]] || fail "Build failed — dist/index.html not found"

BUILD_SIZE=$(du -sh "$WEB_DIR/dist" 2>/dev/null | cut -f1)
log "  Build complete: $BUILD_SIZE"

# ─── Step 3: Deploy to CF Pages ─────────────────────────────────────
log "Step 3: Deploying to Cloudflare Pages"
npx wrangler pages deploy dist/ --project-name=contexter-web --branch=production --commit-dirty=true 2>&1 | tail -10
log "  Deploy complete"

# ─── Step 4: Verify ─────────────────────────────────────────────────
log "Step 4: Verifying production"
sleep 5

# Check landing page
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$PROD_URL" 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "200" ]]; then
  log "  Landing page: 200 OK"
else
  log "  ⚠ Landing page returned $HTTP_CODE"
fi

# Check privacy page
HTTP_CODE_PRIV=$(curl -sf -o /dev/null -w "%{http_code}" "$PROD_URL/privacy" 2>/dev/null || echo "000")
log "  Privacy page: $HTTP_CODE_PRIV"

# Check terms page
HTTP_CODE_TERMS=$(curl -sf -o /dev/null -w "%{http_code}" "$PROD_URL/terms" 2>/dev/null || echo "000")
log "  Terms page: $HTTP_CODE_TERMS"

# ─── Step 5: Summary ────────────────────────────────────────────────
log ""
log "═══════════════════════════════════════════"
log "  WEB DEPLOY COMPLETE"
log "  URL: $PROD_URL"
log "  Build size: $BUILD_SIZE"
log "  Landing: $HTTP_CODE | Privacy: $HTTP_CODE_PRIV | Terms: $HTTP_CODE_TERMS"
log "═══════════════════════════════════════════"

send_alert "Deploy complete. Landing: $HTTP_CODE, Privacy: $HTTP_CODE_PRIV, Terms: $HTTP_CODE_TERMS"
