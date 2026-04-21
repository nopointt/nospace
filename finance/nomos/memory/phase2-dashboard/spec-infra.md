# Spec: Infra — Deploy Pipeline

> Target: G3 Player — backend-developer or lead-devops
> References: `CONTEXT.md` D-01, D-09, Contexter `ops/deploy.sh` + `ops/deploy-web.sh`
> Pre-inline: CONTEXT.md, Contexter deploy scripts

---

## Infrastructure topology

```
Internet
  │
  ├── Cloudflare DNS + Proxy
  │     ├── nomos.contexter.cc        →  Cloudflare Pages project "nomos-web"
  │     └── api.nomos.contexter.cc    →  Hetzner 46.62.220.214 (proxied via CF)
  │
Hetzner CAX21 (Helsinki) — 46.62.220.214 (SHARED with Contexter)
  │
  ├── /opt/contexter/   docker-compose up  (existing, untouched)
  │     ├── contexter-api:8000
  │     └── postgres, redis, etc.
  │
  ├── /opt/nomos/       docker-compose up  (NEW — this phase)
  │     ├── nomos-api:8100  (FastAPI)
  │     └── runner (python runner.py, shared filesystem)
  │
  └── caddy (or nginx) — reverse proxy
        ├── api.contexter.cc       →  127.0.0.1:8000
        └── api.nomos.contexter.cc →  127.0.0.1:8100  (NEW)
```

---

## Credentials (pre-existing, referenced by path)

| Credential | Path | Purpose |
|---|---|---|
| Cloudflare API token | `~/.tlos/cf-api-token` | Wrangler deploy, DNS management |
| Hetzner API token | `~/.tlos/hetzner-api-token` | (not needed if using SSH) |
| Binance testnet keys | `~/.tlos/binance-testnet` | Runner API keys |
| Hetzner SSH | `root@46.62.220.214` | Configured via SSH key on nopoint laptop |
| Telegram bot token | (env var set on server) | Alerts |

**Never** log credential values. Never commit them.

---

## DNS setup (one-time)

### `nomos.contexter.cc` (CF Pages)

After first `wrangler pages deploy`, Cloudflare auto-creates `nomos-web.pages.dev`. Then:

1. In CF dashboard: Pages → nomos-web → Custom domains → Add `nomos.contexter.cc`
2. Or via API:
   ```bash
   export CF_API_TOKEN=$(cat ~/.tlos/cf-api-token)
   curl -X POST "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT>/pages/projects/nomos-web/domains" \
     -H "Authorization: Bearer $CF_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "nomos.contexter.cc"}'
   ```
3. CF auto-provisions SSL + CNAME

### `api.nomos.contexter.cc` (Hetzner origin)

1. In CF dashboard: DNS → contexter.cc zone → Add record:
   - Type: A
   - Name: `api.nomos`
   - IPv4: `46.62.220.214`
   - Proxy: ON (orange cloud)
2. SSL: "Full (strict)" mode (already set for contexter.cc); origin cert covers wildcard `*.contexter.cc` — reuse
3. Reverse proxy on Hetzner (caddy or nginx config — see §Reverse proxy below)

---

## Hetzner server setup

### 1. SSH in and create directory

```bash
ssh root@46.62.220.214
mkdir -p /opt/nomos/{memory/trading,runner,logs}
cd /opt/nomos
```

### 2. Upload .env

Create `/opt/nomos/.env` on server (chmod 600):

```bash
NOMOS_ENV=prod
NOMOS_AUTH_TOKEN=<generate-32-char-hex>
NOMOS_BINANCE_TESTNET_API_KEY=<from ~/.tlos/binance-testnet>
NOMOS_BINANCE_TESTNET_SECRET=<from ~/.tlos/binance-testnet>
NOMOS_TELEGRAM_BOT_TOKEN=<shared with contexter>
NOMOS_TELEGRAM_CHAT_ID=620190856
NOMOS_CORS_ORIGINS=https://nomos.contexter.cc
NOMOS_QDRANT_URL=http://qdrant:6333   # later, if we add Qdrant prod
NOMOS_RAG_ENABLED=false
```

Generate auth token: `openssl rand -hex 16`

### 3. Upload docker-compose + Dockerfile + src

Either manual scp or via `ops/deploy-nomos-api.sh` (see below).

### 4. Build + start

```bash
cd /opt/nomos
docker compose up -d --build
docker compose logs -f nomos-api   # verify no errors
curl -f http://127.0.0.1:8100/health   # expect 200
```

### 5. Reverse proxy

Assuming Contexter uses caddy at `/etc/caddy/Caddyfile`. Add block:

```caddyfile
api.nomos.contexter.cc {
    reverse_proxy 127.0.0.1:8100
    log {
        output file /var/log/caddy/nomos.log
    }
}
```

Then:
```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
curl -f https://api.nomos.contexter.cc/health   # expect 200 via HTTPS
```

If Contexter uses nginx instead:
```nginx
server {
    listen 443 ssl http2;
    server_name api.nomos.contexter.cc;
    # ssl certs from Let's Encrypt or CF origin cert
    ssl_certificate /etc/ssl/certs/contexter.cc.pem;
    ssl_certificate_key /etc/ssl/private/contexter.cc.key;
    location / {
        proxy_pass http://127.0.0.1:8100;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;   # critical for SSE
    }
}
```

---

## Deploy scripts

### `finance/nomos/ops/deploy-nomos-api.sh`

Pattern-match Contexter `deploy.sh` but for nomos:

```bash
#!/usr/bin/env bash
set -euo pipefail

SERVER="root@46.62.220.214"
REMOTE_DIR="/opt/nomos"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"   # finance/nomos root
API_URL="https://api.nomos.contexter.cc"
HEALTH_URL="$API_URL/health"

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-620190856}"

log()  { echo "$(date +%H:%M:%S) [deploy-nomos] $*"; }
fail() { echo "FATAL: $*" >&2; exit 1; }
alert() {
  [[ -n "$TELEGRAM_BOT_TOKEN" ]] && curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="🚀 Nomos Deploy: $1" > /dev/null || true
}

log "Step 1: Pre-flight"
[[ -d "$LOCAL_DIR/api/src" ]] || fail "api/src not found"
ssh "$SERVER" "test -d $REMOTE_DIR" || fail "$REMOTE_DIR missing on server"

log "Step 2: Rsync api/ + runner/ + memory/ (excluding .env)"
rsync -az --delete \
  --exclude '.env' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude 'tests/' \
  "$LOCAL_DIR/api/" "$SERVER:$REMOTE_DIR/api/"
rsync -az --delete \
  --exclude '__pycache__' \
  "$LOCAL_DIR/runner/" "$SERVER:$REMOTE_DIR/runner/"

log "Step 3: Build + restart"
ssh "$SERVER" "cd $REMOTE_DIR && docker compose -f api/docker-compose.yml up -d --build"

log "Step 4: Health check"
for i in {1..30}; do
  if curl -sfS "$HEALTH_URL" > /dev/null; then
    log "Health OK"
    alert "Deploy OK ($(git rev-parse --short HEAD))"
    exit 0
  fi
  sleep 2
done
alert "Deploy FAILED (health check timeout)"
fail "Health check timeout"
```

### `finance/nomos/ops/deploy-nomos-web.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$LOCAL_DIR/web"
PROD_URL="https://nomos.contexter.cc"
CF_PROJECT="nomos-web"

log()  { echo "$(date +%H:%M:%S) [deploy-web-nomos] $*"; }
fail() { echo "FATAL: $*" >&2; exit 1; }

log "Step 1: Pre-flight"
[[ -d "$WEB_DIR/src" ]] || fail "web/src not found"
command -v bun > /dev/null || fail "bun not installed"
command -v npx > /dev/null || fail "npx required for wrangler"

log "Step 2: Install + build"
cd "$WEB_DIR"
bun install --frozen-lockfile
bun run build

log "Step 3: Deploy to CF Pages"
export CLOUDFLARE_API_TOKEN="$(cat ~/.tlos/cf-api-token)"
npx wrangler pages deploy dist --project-name="$CF_PROJECT" --commit-dirty=true

log "Step 4: Verify"
sleep 10
for i in {1..15}; do
  if curl -sfS -o /dev/null -w "%{http_code}" "$PROD_URL" | grep -q 200; then
    log "Frontend reachable at $PROD_URL"
    exit 0
  fi
  sleep 2
done
fail "Frontend verification failed"
```

Make executable: `chmod +x ops/deploy-nomos-*.sh`.

---

## Rollback procedure

### Backend

1. SSH to server
2. `cd /opt/nomos && docker compose down`
3. Restore previous image: `docker compose up -d` (compose pins `image: nomos-api:prev`)
4. Verify health
5. Alert Telegram

### Frontend

1. `npx wrangler pages deployment list --project-name=nomos-web`
2. Find prior successful deployment ID
3. `npx wrangler pages deployment rollback --project-name=nomos-web <id>`

Document the last good commit SHA in server `/opt/nomos/last-good-commit.txt` after every successful deploy.

---

## Monitoring + alerts

- **Netdata** (existing on Hetzner): add `nomos-api` to monitored containers list
- **Health check cron** (add to existing crontab):
  ```
  */5 * * * * curl -sfS https://api.nomos.contexter.cc/health > /dev/null || curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" -d chat_id=620190856 -d text="Nomos API health check failed"
  ```
- **Log rotation** on Hetzner (logrotate for `/opt/nomos/logs/*`):
  ```
  /opt/nomos/logs/*.log {
      daily
      rotate 14
      compress
      missingok
      notifempty
  }
  ```

---

## Security checklist (H6)

- [ ] `.env` files chmod 600, never committed
- [ ] Auth token 32+ hex chars, unique per environment
- [ ] CORS restricted to exactly `https://nomos.contexter.cc`
- [ ] No secrets in Dockerfile layers
- [ ] `docker-compose.yml` uses `env_file: .env`, not inline secrets
- [ ] CF Pages env vars encrypted
- [ ] Binance testnet keys (not mainnet) in dev and prod until Phase 1C
- [ ] Telegram alerts never leak secret values (only action names)
- [ ] Reverse proxy disables exposing of Docker metadata

---

## Port allocation

| Port | Service | Exposure |
|---|---|---|
| 22 | SSH | public (root login via key only) |
| 80/443 | Caddy/Nginx | public |
| 8000 | Contexter API | 127.0.0.1 only (existing) |
| 8100 | Nomos API | 127.0.0.1 only (NEW) |
| 5432 | Postgres | 127.0.0.1 (existing) |
| 6379 | Redis | 127.0.0.1 (existing) |
| 6333 | Qdrant (if added prod) | 127.0.0.1 only |

No port clashes.

---

## Task breakdown for G3 Player

1. **DNS records**  
   Action: Create `nomos.contexter.cc` + `api.nomos.contexter.cc` in CF.  
   Verify: `dig nomos.contexter.cc +short` returns CF IPs.  

2. **Server /opt/nomos layout + .env**  
   Action: SSH, mkdir, scp .env.  
   Verify: `ssh ... test -f /opt/nomos/.env && echo OK`.  

3. **Reverse proxy config**  
   Action: add caddy/nginx block, reload.  
   Verify: `curl -I https://api.nomos.contexter.cc/health` returns 502 (no backend yet) — confirms proxy works.  

4. **Backend docker-compose up**  
   Action: first deploy via `deploy-nomos-api.sh`.  
   Verify: `curl https://api.nomos.contexter.cc/health` = 200.  

5. **Frontend CF Pages initial deploy**  
   Action: `deploy-nomos-web.sh`.  
   Verify: `https://nomos.contexter.cc` returns index.html.  

6. **Custom domain bind**  
   Action: add `nomos.contexter.cc` to CF Pages project.  
   Verify: SSL works, CNAME resolves.  

7. **Monitoring hook**  
   Action: cron health check, logrotate, netdata config.  
   Verify: break health endpoint briefly, confirm Telegram alert fires.  

8. **Rollback dry run**  
   Action: deploy twice, then rollback to prior, confirm.  
   Verify: `wrangler pages deployment list` shows two, rollback works.  

---

## Definition of Done (infra)

- [ ] `https://nomos.contexter.cc` loads over HTTPS
- [ ] `https://api.nomos.contexter.cc/health` returns 200
- [ ] Deploy scripts both green, reproducible
- [ ] Health check cron active
- [ ] Telegram alerts firing on failure
- [ ] Rollback tested
- [ ] Secrets audit clean (no leakage)
