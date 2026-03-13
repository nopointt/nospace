# L3 Step 8 — Senior нода + Special Memory
> Domain: backend
> Date: 2026-03-11
> Branch: l3-agents
> Status: ACTIVE

---

## Goal

Добавить Senior уровень в LangGraph иерархию: Senior получает задачу → читает Special memory из pg → пишет полную implementation spec → запускает G3 subgraph inline → возвращает результат через NATS.

## Context

Steps 6+7 добавили Chief/Development и Lead/Frontend+Lead/Backend ноды. Step 8 добавляет Senior — следующий уровень под Lead. Senior самостоятельно подтягивает контекст из pg (distillation), пишет spec, запускает G3. Special memory хранится в новой таблице `special_memory_facts` в той же БД (`domain_memory`). NATS тип: `agent:senior:run`.

## Tech Stack

- Python 3.12, LangGraph, asyncio, NATS (nats-py)
- psycopg2-binary — pg connectivity (НОВАЯ зависимость)
- PostgreSQL: `db:5432` (internal Docker), DB `domain_memory`, user `tlos`
- uv — package manager (pyproject.toml + uv.lock)
- call_claude_cli — subprocess + stdin (существующий helper)

## Frozen Interfaces (DO NOT MODIFY)

- `build_graph()` — frozen, zero changes
- `build_chief_graph()` — frozen, zero changes
- `build_lead_graph(role)` — frozen, zero changes
- `handle_graph_run()` — frozen, zero changes
- `handle_chief_run()` — frozen, zero changes
- `handle_lead_run()` — frozen, zero changes
- `agent:graph:run`, `agent:chief:run`, `agent:lead:run` — NATS types frozen
- `tlos_facts` table schema — frozen
- `GraphState`, `ChiefDevState`, `LeadState`, `G3State` — frozen
- `call_claude_cli()` — frozen
- `orchestrator_node()`, `worker_node()` — frozen

## File Map

- Create: `core/kernel/tlos-langgraph-bridge/special_memory.py` — pg connectivity для Special memory
- Modify: `core/kernel/tlos-langgraph-bridge/graph.py` — +SeniorState, +senior_frontend_node, +senior_backend_node, +build_senior_graph
- Modify: `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — +_senior_graphs, +get_senior_graph, +handle_senior_run, pre-compile
- Modify: `core/kernel/tlos-langgraph-bridge/bridge.py` — +agent:senior:run routing
- Modify: `core/kernel/tlos-langgraph-bridge/pyproject.toml` — +psycopg2-binary>=2.9
- Modify: `core/kernel/docker-compose.yml` — +DB env vars в langgraph-bridge service

---

## Tasks

### Task 1: special_memory.py — pg module

**Files:**
- Create: `core/kernel/tlos-langgraph-bridge/special_memory.py`

**What to implement:**

```python
"""
special_memory.py — Senior-level Special memory in PostgreSQL.
Table: special_memory_facts (id, session_id, senior_domain, content, task_context, created_at)
Connects via env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
NEVER raises — all exceptions return empty string / False.
"""

import os
import psycopg2
from psycopg2 import sql

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "5432"))
DB_USER = os.environ.get("DB_USER", "tlos")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tlos")
DB_NAME = os.environ.get("DB_NAME", "domain_memory")
```

Three functions:

1. `create_table() -> bool`:
   - Connects to pg
   - Creates table if not exists:
     ```sql
     CREATE TABLE IF NOT EXISTS special_memory_facts (
         id SERIAL PRIMARY KEY,
         session_id TEXT NOT NULL,
         senior_domain TEXT NOT NULL,
         content TEXT NOT NULL,
         task_context TEXT DEFAULT '',
         created_at TIMESTAMP DEFAULT NOW()
     );
     CREATE INDEX IF NOT EXISTS idx_special_memory_session
         ON special_memory_facts(session_id);
     ```
   - Returns True on success, False on any exception
   - Catches all exceptions, prints warning, never raises

2. `write_spec(session_id: str, senior_domain: str, content: str, task_context: str = "") -> bool`:
   - Inserts one row into special_memory_facts
   - Returns True on success, False on any exception
   - Catches all exceptions, never raises

3. `read_context(session_id: str, senior_domain: str) -> str`:
   - SELECT content FROM special_memory_facts WHERE session_id = %s AND senior_domain = %s ORDER BY created_at DESC LIMIT 5
   - Returns joined content string (newline-separated) or "" on error/empty
   - Catches all exceptions, never raises

Auto-create table on module import:
```python
# At module level, after function definitions:
try:
    _table_ready = create_table()
    if not _table_ready:
        print("[special_memory] WARNING: table creation failed, Special memory disabled")
except Exception:
    _table_ready = False
```

**Constraints:**
- Each function opens and closes its own connection (no connection pool)
- ALL exceptions caught, NEVER raises
- Graceful degradation: if pg unavailable → return "" or False

**Verification:**
Run: `python -c "import special_memory; print('special_memory OK:', special_memory._table_ready)"`
Expected (when pg available): `special_memory OK: True`
Expected (when pg unavailable): `special_memory OK: False` (no crash)

---

### Task 2: SeniorState + senior nodes in graph.py

**Files:**
- Modify: `core/kernel/tlos-langgraph-bridge/graph.py`

**What to implement:**

Add after the existing `LeadState` and lead nodes section.

**SeniorState:**
```python
class SeniorState(TypedDict):
    messages: list        # [{"role": str, "content": str}]
    sessionId: str
    result: str
    senior_domain: str    # "frontend" | "backend"
    senior_context: str   # distilled Special memory read from pg
    senior_spec: str      # full implementation spec written by Senior
```

**`senior_frontend_node(state: SeniorState) -> SeniorState`:**

Step 1 — read context from special_memory:
```python
from special_memory import read_context
context = read_context(state["sessionId"], "frontend")
# If no stored context, use empty string (Senior still works)
```

Step 2 — call Claude CLI to write a full implementation spec. Prompt:
```
You are Senior/Frontend in the tLOS agent hierarchy.

Your domain expertise:
- SolidJS, TypeScript, Vite, Tailwind CSS
- tLOS frame system: DynamicComponent (window chrome, traffic lights, drag, resize)
- Frame layout: flex flex-col h-full, content in flex-1 overflow-hidden relative
- tLOS visual system: primary #f2b90d, bg #0a0a0f, border rgba(255,255,255,0.08)
- Omnibar commands, canvas state management, useComponents hook, frame types in src/types/frame.ts

SPECIAL MEMORY (distilled context):
{context or "No prior context for this session."}

TASK:
{user_content}

Write a complete implementation spec for the G3 Player to implement.
The spec must include:
1. Goal (one sentence)
2. Files to modify (exact paths from core/shell/frontend/src/)
3. Exact implementation steps (no ambiguity — Player must not need to ask questions)
4. Acceptance criteria (verifiable checks)
5. tLOS constraints: NEVER delete files, follow existing patterns, no rm/del/rmdir

Return ONLY the spec text. No preamble.
```

Step 3 — invoke G3 subgraph with the spec:
```python
g3 = build_g3_subgraph()
g3_result = g3.invoke({
    "spec": senior_spec,
    "criteria": "Spec fully implemented per acceptance criteria above.",
    "implementation": "",
    "coaching_feedback": "",
    "iterations": 0,
    "passed": False,
})
result = g3_result.get("implementation", "") or senior_spec
```

Step 4 — write spec to special_memory:
```python
from special_memory import write_spec
write_spec(state["sessionId"], "frontend", senior_spec, user_content)
```

Returns: `{**state, "senior_spec": senior_spec, "result": result}`

**`senior_backend_node(state: SeniorState) -> SeniorState`:**

Same structure as senior_frontend_node but with backend persona:
```
You are Senior/Backend in the tLOS agent hierarchy.

Your domain expertise:
- Python 3.12, asyncio, NATS (nats-py), LangGraph (StateGraph, TypedDict, conditional edges, END)
- tLOS bridge pattern: subprocess + stdin for claude CLI, stream-json parsing
- NEVER raises pattern: all exceptions caught, published as agent:graph:error
- bridge_handler singleton pattern: module-level graph cache compiled once
- Docker Compose, service networking (NATS, db, litellm, qdrant containers)
- psycopg2 for pg access, env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

SPECIAL MEMORY (distilled context):
{context or "No prior context for this session."}

TASK:
{user_content}

Write a complete implementation spec for the G3 Player to implement.
The spec must include:
1. Goal (one sentence)
2. Files to modify (exact paths from core/kernel/)
3. Exact implementation steps with code snippets where needed
4. Verification commands (python -c "..." style)
5. Acceptance criteria
6. tLOS constraints: NEVER raises, graceful degradation to "" or {}, NEVER delete files

Return ONLY the spec text. No preamble.
```

**Constraints:**
- Import `build_g3_subgraph` at function call time (not at module level) to avoid circular imports
- Import `read_context`, `write_spec` from special_memory inside the function body
- ALL exceptions in senior nodes caught, return `{**state, "senior_spec": "", "result": ""}` on failure
- Wrap the entire function body in try/except

**Verification:**
Run: `python -c "from graph import SeniorState; print('SeniorState OK')"`
Expected: `SeniorState OK`

Run: `python -c "from graph import build_senior_graph; g=build_senior_graph('frontend'); print('frontend OK')"`
Expected: `frontend OK`

---

### Task 3: build_senior_graph in graph.py

**Files:**
- Modify: `core/kernel/tlos-langgraph-bridge/graph.py`

**What to implement:**

Add after senior node functions:

```python
def build_senior_graph(domain: str):
    """
    Build and compile a Senior graph for the given domain.
    domain: "frontend" | "backend"
    Topology: orchestrator -> senior_{domain}_node -> END
    Uses SeniorState.
    Raises ValueError for unknown domains.
    Senior node internally invokes G3 subgraph inline.
    """
    if domain == "frontend":
        senior_node_fn = senior_frontend_node
    elif domain == "backend":
        senior_node_fn = senior_backend_node
    else:
        raise ValueError(f"Unknown senior domain: {domain}")

    graph = StateGraph(SeniorState)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node(f"senior_{domain}", senior_node_fn)
    graph.set_entry_point("orchestrator")
    graph.add_edge("orchestrator", f"senior_{domain}")
    graph.add_edge(f"senior_{domain}", END)
    return graph.compile()
```

**Constraints:**
- `orchestrator_node` used as-is (it accepts any TypedDict with `messages`, `sessionId`, `result` — SeniorState has all three)
- No changes to any other existing graph builders

**Verification:**
Run: `python -c "from graph import build_senior_graph; g=build_senior_graph('backend'); print('backend OK')"`
Expected: `backend OK`

---

### Task 4: bridge_handler.py — senior singleton + handler

**Files:**
- Modify: `core/kernel/tlos-langgraph-bridge/bridge_handler.py`

**What to implement:**

Add after the `_lead_graphs` / `get_lead_graph` section:

```python
# ── Singleton senior graphs ───────────────────────────────────────────────────

_senior_graphs: dict = {}


def get_senior_graph(domain: str):
    """Per-domain singleton. Builds on first call, returns cached on subsequent calls."""
    global _senior_graphs
    if domain not in _senior_graphs:
        from graph import build_senior_graph
        _senior_graphs[domain] = build_senior_graph(domain)
    return _senior_graphs[domain]


# Pre-compile both domains at import time
try:
    get_senior_graph("frontend")
    get_senior_graph("backend")
except Exception as _init_err:
    print(f"[langgraph-bridge] WARNING: senior graphs pre-compile failed: {_init_err}")
```

Add handler function after `handle_lead_run`:

```python
async def handle_senior_run(nc, session_id: str, task: str, domain: str, model: str):
    """
    Handle agent:senior:run message.
    Same streaming pattern as handle_lead_run but uses senior graph + SeniorState.
    Never raises — all exceptions caught, logged, published as agent:graph:error.
    """
    try:
        graph = get_senior_graph(domain)
        state = {
            "messages": [{"role": "user", "content": task}],
            "sessionId": session_id,
            "result": "",
            "senior_domain": domain,
            "senior_context": "",
            "senior_spec": "",
        }

        loop = asyncio.get_event_loop()
        final_state = await loop.run_in_executor(None, graph.invoke, state)
        result: str = final_state.get("result", "") or ""

        if result:
            for i in range(0, len(result), _CHUNK_SIZE):
                chunk = result[i:i + _CHUNK_SIZE]
                await nc.publish(PUBLISH_SUBJECT, encode({
                    "type": "agent:graph:token",
                    "sessionId": session_id,
                    "delta": chunk,
                    "done": False,
                }))
                await asyncio.sleep(0)

        await nc.publish(PUBLISH_SUBJECT, encode({
            "type": "agent:graph:token",
            "sessionId": session_id,
            "delta": "",
            "done": True,
        }))

    except Exception as exc:
        print(f"[langgraph-bridge] handle_senior_run error (session={session_id}, domain={domain}): {exc}")
        try:
            await nc.publish(PUBLISH_SUBJECT, encode({
                "type": "agent:graph:error",
                "sessionId": session_id,
                "error": str(exc),
            }))
        except Exception as pub_exc:
            print(f"[langgraph-bridge] failed to publish error event: {pub_exc}")
```

**Verification:**
Run: `python -c "from bridge_handler import get_senior_graph; g=get_senior_graph('frontend'); g2=get_senior_graph('frontend'); print('singleton OK:', g is g2)"`
Expected: `singleton OK: True`

---

### Task 5: bridge.py — agent:senior:run routing

**Files:**
- Modify: `core/kernel/tlos-langgraph-bridge/bridge.py`

**What to implement:**

In `handle_message`, after the `agent:lead:run` block, add:

```python
        if msg_type == "agent:senior:run":
            session_id = data.get("sessionId", "")
            task = data.get("task", "")
            domain = data.get("domain", "backend")
            model = data.get("model", "claude-sonnet-4-6")
            from bridge_handler import handle_senior_run
            await handle_senior_run(nc, session_id, task, domain, model)
```

**Constraints:**
- Use `if` (not `elif`) — consistent with existing routing pattern
- Default domain: `"backend"` (same pattern as role default in lead)

**Verification:**
Run: `python -c "import bridge; print('bridge OK')"`
Expected: `bridge OK`

---

### Task 6: pyproject.toml — add psycopg2-binary

**Files:**
- Modify: `core/kernel/tlos-langgraph-bridge/pyproject.toml`

**What to implement:**

Add `psycopg2-binary>=2.9` to dependencies:

```toml
dependencies = [
    "nats-py>=2.0",
    "langgraph>=0.2",
    "anthropic>=0.40",
    "psycopg2-binary>=2.9",
]
```

**After editing pyproject.toml — manual step (NOT in code, note in verification):**
Run `uv lock` in `core/kernel/tlos-langgraph-bridge/` to regenerate uv.lock before Docker build.

**Verification:**
Run: `python -c "import psycopg2; print('psycopg2 OK:', psycopg2.__version__)"`
Expected: `psycopg2 OK: 2.9.x`
(Only works after `uv sync` or `pip install psycopg2-binary`)

---

### Task 7: docker-compose.yml — DB env vars for langgraph-bridge

**Files:**
- Modify: `core/kernel/docker-compose.yml`

**What to implement:**

In the `langgraph-bridge` service, add DB env vars (same as claude-bridge):

```yaml
  langgraph-bridge:
    build:
      context: ..
      dockerfile: kernel/tlos-langgraph-bridge/Dockerfile
    environment:
      - NATS_URL=nats://nats:4222
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=${DB_USER:-tlos}
      - DB_PASSWORD=${DB_PASSWORD:-tlos}
      - DB_NAME=${DB_NAME:-domain_memory}
    volumes:
      - ${USERPROFILE}/.claude.json:/root/.claude.json:ro
      - ${USERPROFILE}/.tlos:/root/.tlos
    depends_on:
      ...
```

**Constraints:**
- Add only to `langgraph-bridge` service environment
- Do NOT modify any other service
- Keep existing `depends_on` block intact

**Verification:**
Check: `docker-compose.yml` langgraph-bridge section contains `DB_HOST=db`

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | `SeniorState` TypedDict with 6 fields (messages, sessionId, result, senior_domain, senior_context, senior_spec) | `python -c "from graph import SeniorState; print('OK')"` |
| AC-2 | `senior_frontend_node` contains SolidJS/TypeScript/tLOS-frame persona | Code inspection: prompt contains "SolidJS", "flex flex-col h-full", "#f2b90d" |
| AC-3 | `senior_backend_node` contains Python/NATS/LangGraph/bridge persona | Code inspection: prompt contains "NATS", "LangGraph", "NEVER raises" |
| AC-4 | `build_senior_graph("frontend")` returns compiled graph | `python -c "from graph import build_senior_graph; g=build_senior_graph('frontend'); print('OK')"` |
| AC-5 | `build_senior_graph("backend")` returns compiled graph | `python -c "from graph import build_senior_graph; g=build_senior_graph('backend'); print('OK')"` |
| AC-6 | `get_senior_graph(domain)` — singleton per-domain | `python -c "from bridge_handler import get_senior_graph; g=get_senior_graph('frontend'); g2=get_senior_graph('frontend'); print(g is g2)"` → `True` |
| AC-7 | `handle_senior_run` — same streaming pattern as handle_lead_run (never raises) | Code inspection: try/except wraps all, publishes agent:graph:error on failure |
| AC-8 | bridge.py routes `agent:senior:run` to `handle_senior_run` | Code inspection: `if msg_type == "agent:senior:run"` present |
| AC-9 | `special_memory.py` module with create_table, write_spec, read_context | `python -c "import special_memory; print(dir(special_memory))"` shows all 3 functions |
| AC-10 | `special_memory.py` reads DB env vars | Code inspection: `os.environ.get("DB_HOST", ...)` pattern |
| AC-11 | docker-compose.yml langgraph-bridge has DB env vars | `grep DB_HOST core/kernel/docker-compose.yml` → shows db value |
| AC-12 | pyproject.toml includes psycopg2-binary | `grep psycopg2 core/kernel/tlos-langgraph-bridge/pyproject.toml` |
| AC-13 | `build_graph()`, `build_chief_graph()`, `build_lead_graph()` — without changes, no regressions | `python -c "from graph import build_graph, build_chief_graph; g1=build_graph(); g2=build_chief_graph(); print('no regression OK')"` |

---

## Out of Scope

- Connection pooling for pg (each call opens/closes connection — sufficient for Step 8)
- Qdrant-based distillation (pg substring search is sufficient)
- Senior-initiated distillation from Lead data (Lead and Senior are independent paths for now)
- uv.lock regeneration — manual step for nopoint AFTER implementation
- Docker rebuild — separate step AFTER verification

---

## tLOS Constraints (always apply)

- NEVER delete files — move to `core/kernel/archive/` if needed
- `rm`, `rm -rf`, `rmdir`, `del`, `rd`, `Remove-Item` — FORBIDDEN
- Follow existing naming and code patterns (orchestrator_node reuse, singleton pattern, _CHUNK_SIZE)
- NEVER raises — all exceptions caught, published as agent:graph:error (bridge) or return "" / False (special_memory)
- Graceful degradation — if pg unavailable, Senior still works (uses empty context)
