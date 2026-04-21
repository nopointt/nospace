#!/usr/bin/env bash
# Deploy Nomos web to Cloudflare Pages.
set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$LOCAL_DIR/web"
CF_PROJECT="nomos-web"
PROD_URL="https://nomos.contexter.cc"

log()  { echo "$(date +%H:%M:%S) [deploy-nomos-web] $*"; }
fail() { echo "FATAL: $*" >&2; exit 1; }

log "Step 1: Pre-flight"
[[ -d "$WEB_DIR/src" ]] || fail "web/src not found"
command -v bun >/dev/null || fail "bun not installed"
command -v npx >/dev/null || fail "npx required for wrangler"
[[ -f "$HOME/.tlos/cf-api-token" ]] || fail "~/.tlos/cf-api-token missing"

log "Step 2: Install + build"
cd "$WEB_DIR"
bun install
bun run build

log "Step 3: Deploy to CF Pages ($CF_PROJECT)"
export CLOUDFLARE_API_TOKEN="$(cat "$HOME/.tlos/cf-api-token")"
npx wrangler pages deploy dist --project-name="$CF_PROJECT" --commit-dirty=true --branch=main 2>&1 | tee /tmp/wrangler-out.txt

log "Step 4: Verify"
sleep 5
for i in $(seq 1 15); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$PROD_URL" --max-time 10 || echo "000")
  if [[ "$code" == "200" ]]; then
    log "Frontend reachable at $PROD_URL"
    exit 0
  fi
  sleep 3
done
log "(DNS / CNAME may not yet resolve — check pages.dev URL in wrangler output above)"
