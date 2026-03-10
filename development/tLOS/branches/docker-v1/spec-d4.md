# G3-D4 Spec — Unified docker-compose.yml + grid.ps1 cleanup

## Task

1. Create unified `docker-compose.yml` at `core/kernel/docker-compose.yml` that brings up ALL kernel services
2. Patch `core/grid.ps1` to remove services now managed by Docker

## Context

**Current state:**
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — only db + litellm + qdrant
- `core/grid.ps1` — starts nats, rust services, letta, langgraph, claude-bridge, and zep (docker compose)

**Target state:**
- `core/kernel/docker-compose.yml` — db + litellm + qdrant + letta + langgraph-bridge + claude-bridge
- `core/grid.ps1` — only starts nats + rust services; zep compose → new compose path

NATS stays native (Rust kernel services also connect to it). Docker services connect via `host.docker.internal:4222`.

## Change 1: Create `core/kernel/docker-compose.yml`

**Full path**: `C:\Users\noadmin\nospace\development\tLOS\core\kernel\docker-compose.yml`

Read the existing compose first:
`C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-zep-bridge\docker-compose.yml`

Create the new unified compose. Important path notes (relative to compose file at `core/kernel/`):
- litellm config: `./tlos-zep-bridge/litellm-config.yaml` (was `./litellm-config.yaml` in old compose)
- Agent configs bind mount: `../agents/eidolon` (goes up to `core/`, then into `agents/eidolon`)

```yaml
# tLOS Kernel — Always-On Docker Stack
# Replaces: tlos-zep-bridge/docker-compose.yml (db+litellm+qdrant)
# Adds: letta, langgraph-bridge, claude-bridge
#
# Start: docker compose up -d
# Build: docker compose build
# NIM_KEY must be set in environment (from ~/.tlos/nim-key)

services:

  db:
    image: ghcr.io/getzep/postgres:latest
    environment:
      POSTGRES_USER: zep
      POSTGRES_PASSWORD: zep
      POSTGRES_DB: zep
    volumes:
      - zep_postgres:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "zep", "-d", "zep"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./tlos-zep-bridge/litellm-config.yaml:/app/config.yaml:ro
    environment:
      NIM_API_KEY: ${NIM_KEY}
    ports:
      - "4000:4000"
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    healthcheck:
      test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:4000/health/liveliness')"]
      interval: 10s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:v1.13.0
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD-SHELL", "bash -c ':> /dev/tcp/localhost/6333' || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  letta:
    image: letta/letta:latest
    ports:
      - "8283:8283"
    volumes:
      - letta_data:/root/.letta
    restart: unless-stopped

  langgraph-bridge:
    build:
      context: ..
      dockerfile: kernel/tlos-langgraph-bridge/Dockerfile
    environment:
      - NATS_URL=nats://host.docker.internal:4222
    volumes:
      - ${USERPROFILE}/.claude.json:/root/.claude.json:ro
      - ${USERPROFILE}/.tlos:/root/.tlos
    depends_on:
      db:
        condition: service_healthy
      litellm:
        condition: service_healthy
      qdrant:
        condition: service_healthy
    restart: unless-stopped

  claude-bridge:
    build:
      context: ..
      dockerfile: kernel/tlos-claude-bridge/Dockerfile
    environment:
      - NATS_URL=nats://host.docker.internal:4222
    volumes:
      - ${USERPROFILE}/.claude.json:/root/.claude.json:ro
      - ${USERPROFILE}/.tlos:/root/.tlos
      - ../agents/eidolon:/app/agents/eidolon:ro
    depends_on:
      db:
        condition: service_healthy
      litellm:
        condition: service_healthy
      qdrant:
        condition: service_healthy
      letta:
        condition: service_started
    restart: unless-stopped

volumes:
  zep_postgres:
  qdrant_data:
  letta_data:
```

Notes:
- `context: ..` from `core/kernel/` = `core/` — correct for both Dockerfiles
- `${USERPROFILE}` is expanded from Windows environment by Docker Desktop
- `../agents/eidolon` from `core/kernel/` = `core/agents/eidolon/` — matches `AGENT_DIR` in index.js
- `letta_data` volume stores Letta's internal state
- `letta` uses `service_started` (not `service_healthy`) because letta/letta image may not have healthcheck

## Change 2: Patch `core/grid.ps1`

**File to modify**: `C:\Users\noadmin\nospace\development\tLOS\core\grid.ps1`

Read the file first, then make these changes:

**Remove** from `$Services` array:
- The `letta` service entry (`name = "letta"`)
- The `langgraph` service entry (`name = "langgraph"`)
- The `claude-bridge` service entry (`name = "claude-bridge"`)

**Update** the `zep` service entry — change the `cmd` to point to the new compose file:
```powershell
# Before (approximately):
@{ name = "zep"; ...; cmd = "docker compose up"; dir = (Join-Path $Kernel "tlos-zep-bridge") }

# After:
@{ name = "docker-kernel"; title = "Docker kernel (db+litellm+qdrant+letta+bridges)"; dir = (Join-Path $Kernel); cmd = "docker compose up"; optional = $true }
```

Note: the new `docker compose up` should run from `core/kernel/` directory (where the new `docker-compose.yml` lives).

Also add a comment near the top of the services section explaining which services are now managed by Docker.

## Verification

```bash
cd /c/Users/noadmin/nospace/development/tLOS/core/kernel
docker compose config
docker compose build claude-bridge langgraph-bridge
```

Expected:
- `docker compose config` prints valid YAML with 6 services
- `docker compose build` completes without errors

## Done when

- `core/kernel/docker-compose.yml` exists with 6 services (db, litellm, qdrant, letta, langgraph-bridge, claude-bridge)
- `core/grid.ps1` no longer has letta/langgraph/claude-bridge as native services
- `docker compose config` exits 0
- `docker compose build` exits 0
