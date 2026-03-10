# G3-D1 Spec — Dockerfile: tlos-claude-bridge

## Task

Create `Dockerfile` for the `tlos-claude-bridge` Node.js service.

## Context

`tlos-claude-bridge` is the Eidolon/Orchestrator AI service. It:
- Connects to NATS (no HTTP port exposed)
- Reads agent config files at `../../agents/eidolon/` relative to `__dirname`
- Spawns `claude --print` as a subprocess (Claude CLI must be installed in the container)
- Reads credentials from `~/.claude.json` (mounted at `/root/.claude.json`)
- Reads `~/.tlos/nim-key` and `~/.tlos/sessions.json` (mounted at `/root/.tlos/`)

## File to create

**`C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-claude-bridge\Dockerfile`**

## Requirements

1. **Base image**: `node:22-alpine`

2. **Install Claude CLI** globally:
   ```
   npm install -g @anthropic-ai/claude-code
   ```

3. **WORKDIR**: `/app/kernel/tlos-claude-bridge`
   - This is critical: `index.js` resolves `AGENT_DIR = path.resolve(__dirname, '../../agents/eidolon')`
   - With WORKDIR `/app/kernel/tlos-claude-bridge`, agents resolve to `/app/agents/eidolon/`

4. **Build context** is `core/` (two levels above the Dockerfile).
   - All COPY paths must be relative to `core/`:
     - `COPY kernel/tlos-claude-bridge/package.json ./`
     - `COPY kernel/tlos-claude-bridge/package-lock.json ./` (if exists, optional)
     - `RUN npm ci --omit=dev`
     - `COPY kernel/tlos-claude-bridge/index.js ./`
     - `COPY kernel/tlos-claude-bridge/zep-client.js ./`
     - `COPY kernel/tlos-claude-bridge/qdrant-client.js ./`
     - `COPY kernel/tlos-claude-bridge/letta-client.js ./`
     - `COPY kernel/tlos-claude-bridge/check-auth.js ./`

5. **ENV**:
   ```
   ENV NATS_URL=nats://host.docker.internal:4222
   ```
   `host.docker.internal` is used because NATS runs on the Windows host (not in Docker).
   Docker Desktop for Windows resolves `host.docker.internal` automatically.

6. **No EXPOSE** — service uses NATS pub/sub, no HTTP port.

7. **CMD**: `["node", "index.js"]`

8. Also create **`.dockerignore`** at `core/kernel/tlos-claude-bridge/.dockerignore`:
   ```
   node_modules
   *.log
   ```

## Source files that exist in tlos-claude-bridge/

- `index.js` — main entry
- `zep-client.js` — domain memory (pg)
- `qdrant-client.js` — associative routing
- `letta-client.js` — session memory
- `check-auth.js` — auth helper
- `package.json` — deps: nats@^2.28.2, pg@^8.20.0

## Verification

After writing the Dockerfile, verify by running:
```bash
cd /c/Users/noadmin/nospace/development/tLOS/core
docker build -f kernel/tlos-claude-bridge/Dockerfile -t tlos-claude-bridge-test .
docker run --rm tlos-claude-bridge-test which claude
```

Expected: `docker build` exits 0, `which claude` prints a path (e.g. `/usr/local/bin/claude`).

## Done when

- `Dockerfile` exists at `core/kernel/tlos-claude-bridge/Dockerfile`
- `.dockerignore` exists at `core/kernel/tlos-claude-bridge/.dockerignore`
- `docker build` exits 0
- `docker run --rm tlos-claude-bridge-test which claude` returns a valid path
