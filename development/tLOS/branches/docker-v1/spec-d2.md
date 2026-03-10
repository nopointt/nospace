# G3-D2 Spec — Code patch + Dockerfile: tlos-langgraph-bridge

## Task

1. Patch `bridge.py` to make NATS_URL configurable via environment variable
2. Create `Dockerfile` for the `tlos-langgraph-bridge` Python service

## Context

`tlos-langgraph-bridge` is the LangGraph Python service. It:
- Connects to NATS to receive `agent:graph:run` messages
- Runs LangGraph orchestrator → worker graph
- Spawns `claude --print` as a subprocess (Claude CLI must be in the container)
- Currently has NATS_URL hardcoded as `"nats://127.0.0.1:4222"` — **must be patched**

## Change 1: Patch bridge.py

**File to modify**: `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\bridge.py`

Find the line:
```python
NATS_URL = "nats://127.0.0.1:4222"
```

Replace with:
```python
import os
NATS_URL = os.environ.get("NATS_URL", "nats://127.0.0.1:4222")
```

Important: add `import os` only if it's not already imported. Check the top of the file first.

## Change 2: Create Dockerfile

**File to create**: `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\Dockerfile`

### Requirements

1. **Base image**: `python:3.12-slim`

2. **Install Node.js 22** (needed for Claude CLI):
   ```dockerfile
   RUN apt-get update && apt-get install -y curl ca-certificates \
       && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
       && apt-get install -y nodejs \
       && rm -rf /var/lib/apt/lists/*
   ```

3. **Install Claude CLI** globally:
   ```dockerfile
   RUN npm install -g @anthropic-ai/claude-code
   ```

4. **Install uv**:
   ```dockerfile
   RUN pip install uv --no-cache-dir
   ```

5. **WORKDIR**: `/app/kernel/tlos-langgraph-bridge`

6. **Build context** is `core/` (set in docker-compose).
   Copy and install dependencies first (layer caching), then copy source:
   ```dockerfile
   COPY kernel/tlos-langgraph-bridge/pyproject.toml ./
   COPY kernel/tlos-langgraph-bridge/uv.lock ./
   RUN uv sync --frozen --no-dev
   COPY kernel/tlos-langgraph-bridge/ ./
   ```

7. **ENV**:
   ```dockerfile
   ENV NATS_URL=nats://host.docker.internal:4222
   ```

8. **CMD**:
   ```dockerfile
   CMD ["uv", "run", "python", "main.py"]
   ```

9. Also create **`.dockerignore`** at `core/kernel/tlos-langgraph-bridge/.dockerignore`:
   ```
   __pycache__
   .venv
   *.pyc
   *.log
   ```

## Source files in tlos-langgraph-bridge/

- `main.py` — entry point
- `bridge.py` — NATS subscriber loop ← **this file needs the NATS_URL patch**
- `graph.py` — LangGraph graph definition + `call_claude_cli()`
- `pyproject.toml` — Python deps (nats-py, langgraph, anthropic)
- `uv.lock` — locked dependencies

## Verification

```bash
cd /c/Users/noadmin/nospace/development/tLOS/core
docker build -f kernel/tlos-langgraph-bridge/Dockerfile -t tlos-langgraph-bridge-test .
docker run --rm tlos-langgraph-bridge-test which claude
docker run --rm tlos-langgraph-bridge-test python -c "import nats; import langgraph; print('ok')"
```

Expected: all commands exit 0.

## Done when

- `bridge.py` patched: `NATS_URL = os.environ.get("NATS_URL", "nats://127.0.0.1:4222")`
- `Dockerfile` exists at `core/kernel/tlos-langgraph-bridge/Dockerfile`
- `.dockerignore` exists
- `docker build` exits 0
- `which claude` returns a valid path
- `import nats; import langgraph` succeeds
