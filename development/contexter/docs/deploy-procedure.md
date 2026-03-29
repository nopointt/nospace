# Contexter — Deploy Procedure & Rollback

> Server: root@46.62.220.214 (Hetzner CAX11, Helsinki)
> Config: /opt/contexter/ (docker-compose.yml, Caddyfile, .env, Dockerfile)
> App code: /opt/contexter/app/

---

## Pre-Deploy Checklist

1. **Build locally**: `bun build src/index.ts --target=bun --outdir=dist`
2. **Smoke tests**: `npx playwright test e2e/smoke.spec.ts --grep @smoke` (10 tests, <30s)
3. **Canary baseline** (if golden pairs exist): `bun run evaluation/canary.ts --api-url https://api.contexter.cc --token $TOKEN`

---

## Deploy Steps

### 1. SCP source files to server

```bash
scp -r /c/Users/noadmin/nospace/development/contexter/src/ root@46.62.220.214:/opt/contexter/app/src/
```

**New files**: SCP `-r` may not copy new files correctly on Windows. Verify new files explicitly:
```bash
ssh root@46.62.220.214 "ls /opt/contexter/app/src/services/chunker/block-classifier.ts"
```

If missing, copy individually:
```bash
scp /path/to/new-file.ts root@46.62.220.214:/opt/contexter/app/src/path/to/new-file.ts
```

### 2. Rebuild Docker image (no cache)

```bash
ssh root@46.62.220.214 "cd /opt/contexter && docker compose build --no-cache app"
```

### 3. Restart app

```bash
ssh root@46.62.220.214 "cd /opt/contexter && docker compose up -d app"
```

### 4. Verify

```bash
# Health check
curl -s https://api.contexter.cc/health

# Check logs
ssh root@46.62.220.214 "docker logs contexter-app-1 2>&1 | tail -10"

# Smoke test
npx playwright test e2e/smoke.spec.ts --grep @smoke
```

### 5. Post-deploy canary (if golden pairs exist)

```bash
bun run evaluation/canary.ts --api-url https://api.contexter.cc --token $TOKEN
```

---

## Rollback Procedure

### Quick rollback (restart previous image)

Docker keeps the previous image layer. If the new deploy is broken:

```bash
# Stop broken app
ssh root@46.62.220.214 "cd /opt/contexter && docker compose down app"

# Restore previous source from git
ssh root@46.62.220.214 "cd /opt/contexter/app && git checkout -- src/"
# OR: SCP the previous version from local git:
# git stash && scp -r src/ root@46.62.220.214:/opt/contexter/app/src/ && git stash pop

# Rebuild and restart
ssh root@46.62.220.214 "cd /opt/contexter && docker compose build --no-cache app && docker compose up -d app"

# Verify
curl -s https://api.contexter.cc/health
```

### Docker-compose rollback (if docker-compose.yml changed)

```bash
ssh root@46.62.220.214 "cp /opt/contexter/docker-compose.yml.bak /opt/contexter/docker-compose.yml && cd /opt/contexter && docker compose up -d"
```

### Database rollback (if migration broke data)

```bash
# Find latest backup
ssh root@46.62.220.214 "ls -lt /opt/contexter/backups/ | head -5"

# Restore from backup
ssh root@46.62.220.214 "cd /opt/contexter && docker compose down app && gunzip -c backups/contexter_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U contexter contexter && docker compose up -d app"
```

---

## Environment Variables

All in `/opt/contexter/.env`. Key variables:

| Variable | Purpose |
|---|---|
| GROQ_API_KEY | Primary LLM (Llama 3.3 70B) |
| NIM_API_KEY | Fallback 1 (NVIDIA NIM) |
| DEEPINFRA_API_KEY | Fallback 2 (not configured yet) |
| JINA_API_KEY | Embeddings (Jina v4) |
| TELEGRAM_ALERT_CHAT_ID | Health alert recipient |
| RATE_LIMIT_WHITELIST_IPS | IPs bypassing rate limits (E2E tests) |

---

## Automated Processes

| Process | Schedule | Config |
|---|---|---|
| PostgreSQL backup → R2 | Daily 3:00 UTC | `/opt/contexter/backup.sh` via cron |
| Health check → Telegram | Every 5 min | `/opt/contexter/health-check.sh` via cron |

---

## Monitoring

- **Health**: https://api.contexter.cc/health
- **Netdata**: http://46.62.220.214:19999
- **Logs**: `ssh root@46.62.220.214 "docker logs contexter-app-1 --tail 100"`
- **Pipeline health**: `curl -s https://api.contexter.cc/api/pipeline/health -H "Authorization: Bearer $TOKEN"`
