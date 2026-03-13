# L3 Step 9 — Shared Letta Memory Blocks (tlos-langgraph-bridge)

**Branch:** l3-agents
**Step:** 9
**Domain:** backend
**Date:** 2026-03-11

---

## Goal

Create `letta_shared.py` — a synchronous Python HTTP client to Letta REST (http://letta:8283/v1) that
provides a per-domain singleton Letta agent and domain context read/write operations. Integrate into
`lead_frontend_node`, `lead_backend_node`, `senior_frontend_node`, `senior_backend_node` in `graph.py`.
Add `LETTA_URL` env var to `docker-compose.yml` and `requests>=2.32` to `pyproject.toml`.

**Frozen (zero changes allowed):**
- `build_graph()` and `build_chief_graph()` — do NOT modify these functions
- `bridge.py` routing — do NOT touch
- `bridge_handler.py` — do NOT touch
- `special_memory.py` — do NOT touch
- `GraphState`, `ChiefDevState`, `LeadState`, `SeniorState` TypedDicts — do NOT touch

---

## File 1: NEW — `core/kernel/tlos-langgraph-bridge/letta_shared.py`

**Absolute path:** `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\letta_shared.py`

```python
"""
letta_shared.py — Per-domain singleton Letta agent for tlos-langgraph-bridge.
Provides shared domain_context memory block across Lead and Senior nodes of the same domain.
NEVER raises — all public functions return empty string or False on any error.
Uses synchronous requests (not async) to match graph.py sync node pattern.
"""

import os
import requests

LETTA_URL = os.environ.get("LETTA_URL", "http://localhost:8283") + "/v1"
_BLOCK_LABEL = "domain_context"
_BLOCK_LIMIT = 10000
_domain_agents: dict = {}   # domain -> agent_id singleton cache


def _get_agent_id(domain: str):
    """
    Get or create a per-domain Letta agent. Caches agent_id in module-level dict.
    Returns agent_id string, or None if Letta is unavailable.
    NEVER raises.
    """
    try:
        if domain in _domain_agents:
            return _domain_agents[domain]

        agent_name = f"tlos-domain-{domain}"

        # Step 1 — search for existing agent by name
        resp = requests.get(f"{LETTA_URL}/agents", timeout=5)
        if resp.status_code == 200:
            agents = resp.json()
            # agents can be a list directly or wrapped in {"agents": [...]}
            if isinstance(agents, dict):
                agents = agents.get("agents", [])
            for agent in agents:
                if agent.get("name") == agent_name:
                    agent_id = agent.get("id")
                    if agent_id:
                        _domain_agents[domain] = agent_id
                        return agent_id

        # Step 2 — agent not found, create it
        create_resp = requests.post(
            f"{LETTA_URL}/agents",
            json={
                "name": agent_name,
                "memory_blocks": [
                    {
                        "label": _BLOCK_LABEL,
                        "value": "",
                        "limit": _BLOCK_LIMIT,
                    }
                ],
            },
            timeout=10,
        )
        if create_resp.status_code in (200, 201):
            data = create_resp.json()
            agent_id = data.get("id")
            if agent_id:
                _domain_agents[domain] = agent_id
                return agent_id

        print(f"[letta_shared] WARNING: could not get/create agent for domain={domain}")
        return None
    except Exception as exc:
        print(f"[letta_shared] WARNING: _get_agent_id({domain}) error: {exc}")
        return None


def read_domain_context(domain: str) -> str:
    """
    Read domain_context memory block for the given domain.
    Returns the block value as string, or "" on any error (Letta down, block missing, etc.).
    NEVER raises.
    """
    try:
        agent_id = _get_agent_id(domain)
        if not agent_id:
            return ""

        resp = requests.get(f"{LETTA_URL}/agents/{agent_id}/memory", timeout=5)
        if resp.status_code != 200:
            return ""

        data = resp.json()
        # Letta returns blocks under "blocks" or "memory_blocks" depending on version
        blocks = data.get("blocks") or data.get("memory_blocks") or []
        for block in blocks:
            if block.get("label") == _BLOCK_LABEL:
                return block.get("value", "")
        return ""
    except Exception as exc:
        print(f"[letta_shared] WARNING: read_domain_context({domain}) error: {exc}")
        return ""


def write_domain_context(domain: str, content: str) -> bool:
    """
    Overwrite the domain_context memory block for the given domain.
    Returns True on success, False on any error.
    NEVER raises.
    """
    try:
        agent_id = _get_agent_id(domain)
        if not agent_id:
            return False

        resp = requests.patch(
            f"{LETTA_URL}/agents/{agent_id}/memory/blocks/{_BLOCK_LABEL}",
            json={"value": content},
            timeout=5,
        )
        return resp.status_code in (200, 201, 204)
    except Exception as exc:
        print(f"[letta_shared] WARNING: write_domain_context({domain}) error: {exc}")
        return False


def append_domain_context(domain: str, entry: str, max_len: int = 8000) -> bool:
    """
    Append entry to domain_context block, truncating from the front if needed.
    Returns True on success, False on any error.
    NEVER raises.
    """
    try:
        existing = read_domain_context(domain)
        combined = existing + entry
        if len(combined) > max_len:
            combined = combined[-max_len:]
        return write_domain_context(domain, combined)
    except Exception as exc:
        print(f"[letta_shared] WARNING: append_domain_context({domain}) error: {exc}")
        return False
```

**Key design decisions:**
- Synchronous `requests` library (not `httpx`/`aiohttp`) — graph.py nodes are synchronous
- Module-level `_domain_agents` dict = in-process singleton (shared across all calls in one process lifetime)
- All functions: bare `try/except Exception` at top level, print WARNING and return safe default
- `_get_agent_id` returns `None` (not raises) when Letta is down — all callers handle `None`
- Letta REST API compatibility: handles both `"blocks"` and `"memory_blocks"` response keys (version variance)
- PATCH endpoint: `/v1/agents/{id}/memory/blocks/{label}` with `{"value": "..."}` body

---

## File 2: MODIFY — `core/kernel/tlos-langgraph-bridge/graph.py`

**Absolute path:** `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\graph.py`

### Change A — `lead_frontend_node` function

Read the existing `lead_frontend_node` function (lines ~368–413 in current file). Make two modifications:

**Modification A1 — read domain context at function start (after extracting user_content):**

After the block that extracts `user_content` (the `for msg in messages` loop), add:

```python
    # Step N — read Letta shared domain context (graceful — returns "" if Letta is down)
    from letta_shared import read_domain_context, append_domain_context
    domain_ctx = read_domain_context("frontend")
```

**Modification A2 — add domain_ctx to prompt:**

In the `prompt = f"""..."""` string, add a new section after the existing header lines and before "TASK FROM CHIEF/DEVELOPMENT:", insert:

```
DOMAIN HISTORY (previous tasks in this domain — may be empty on first run):
{domain_ctx or "No domain history yet."}

```

**Modification A3 — append to domain context after call_claude_cli:**

After `plan_json = call_claude_cli(prompt)`, add:

```python
    append_domain_context(
        "frontend",
        f"[Lead task]: {user_content[:200]}\n[Plan]: {plan_json[:300]}\n---\n",
    )
```

### Change B — `lead_backend_node` function

Same pattern as Change A, but with `domain="backend"`.

**Modification B1** — after `user_content` extraction:
```python
    # Step N — read Letta shared domain context (graceful — returns "" if Letta is down)
    from letta_shared import read_domain_context, append_domain_context
    domain_ctx = read_domain_context("backend")
```

**Modification B2** — add to prompt (before "TASK FROM CHIEF/DEVELOPMENT:"):
```
DOMAIN HISTORY (previous tasks in this domain — may be empty on first run):
{domain_ctx or "No domain history yet."}

```

**Modification B3** — after `plan_json = call_claude_cli(prompt)`:
```python
    append_domain_context(
        "backend",
        f"[Lead task]: {user_content[:200]}\n[Plan]: {plan_json[:300]}\n---\n",
    )
```

### Change C — `senior_frontend_node` function

The senior nodes already have a try/except wrapper. Add domain context reading inside the try block.

**Modification C1** — after `context = read_context(state["sessionId"], "frontend")`, add:
```python
        # Letta shared domain context (cross-session rolling history)
        from letta_shared import read_domain_context
        domain_ctx = read_domain_context("frontend")
```

**Modification C2** — in the prompt string for `senior_spec`, add after the SPECIAL MEMORY section:
```
DOMAIN HISTORY (cross-session rolling context from Letta — may be empty):
{domain_ctx or "No domain history yet."}

```

### Change D — `senior_backend_node` function

Same pattern as Change C, but with `domain="backend"`.

**Modification D1** — after `context = read_context(state["sessionId"], "backend")`:
```python
        # Letta shared domain context (cross-session rolling history)
        from letta_shared import read_domain_context
        domain_ctx = read_domain_context("backend")
```

**Modification D2** — add to prompt string after SPECIAL MEMORY section:
```
DOMAIN HISTORY (cross-session rolling context from Letta — may be empty):
{domain_ctx or "No domain history yet."}

```

**CRITICAL: Do NOT modify any of the following:**
- `build_graph()` function — leave completely untouched
- `build_chief_graph()` function — leave completely untouched
- `build_lead_graph()` function — leave completely untouched
- `build_senior_graph()` function — leave completely untouched
- `build_g3_subgraph()` function — leave completely untouched
- Any TypedDict class (GraphState, ChiefDevState, LeadState, SeniorState, G3State)
- `orchestrator_node`, `worker_node`, `chief_development_node`, `chief_worker_node`
- `g3_player_node`, `g3_coach_node`, `g3_should_continue`
- `call_claude_cli` function

---

## File 3: MODIFY — `core/kernel/docker-compose.yml`

**Absolute path:** `C:\Users\noadmin\nospace\development\tLOS\core\kernel\docker-compose.yml`

In the `langgraph-bridge` service `environment:` block, add one line after the existing `DB_NAME` line:

```yaml
      - LETTA_URL=http://letta:8283
```

Also add `letta` to the `depends_on` section of `langgraph-bridge`:

```yaml
      letta:
        condition: service_started
```

This ensures langgraph-bridge starts after letta is up (soft dependency — Letta being down doesn't break bridge startup because letta_shared.py degrades gracefully).

---

## File 4: MODIFY — `core/kernel/tlos-langgraph-bridge/pyproject.toml`

**Absolute path:** `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\pyproject.toml`

Add `requests>=2.32` to the `dependencies` list:

```toml
dependencies = [
    "nats-py>=2.0",
    "langgraph>=0.2",
    "anthropic>=0.40",
    "psycopg2-binary>=2.9",
    "requests>=2.32",
]
```

---

## Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | `letta_shared.py` created and imports cleanly | `cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge && python -c "import letta_shared; print('OK')"` → `OK` |
| AC-2 | `_get_agent_id` is idempotent singleton (same id on repeat calls, or both None if Letta down) | `python -c "from letta_shared import _get_agent_id; id1=_get_agent_id('frontend'); id2=_get_agent_id('frontend'); print(id1==id2)"` → `True` |
| AC-3 | `read_domain_context` never raises, always returns str | `python -c "from letta_shared import read_domain_context; v=read_domain_context('frontend'); print(type(v).__name__)"` → `str` |
| AC-4 | `write_domain_context` never raises, always returns bool | `python -c "from letta_shared import write_domain_context; r=write_domain_context('frontend','test'); print(type(r).__name__)"` → `bool` |
| AC-5 | `lead_frontend_node` calls `read_domain_context("frontend")` | Code inspection: function body contains `read_domain_context("frontend")` |
| AC-6 | `lead_frontend_node` calls `append_domain_context("frontend", ...)` | Code inspection: function body contains `append_domain_context("frontend"` |
| AC-7 | `lead_backend_node` calls `read_domain_context("backend")` | Code inspection: function body contains `read_domain_context("backend")` |
| AC-8 | `lead_backend_node` calls `append_domain_context("backend", ...)` | Code inspection: function body contains `append_domain_context("backend"` |
| AC-9 | `senior_frontend_node` calls `read_domain_context("frontend")` | Code inspection: function body contains `read_domain_context("frontend")` |
| AC-10 | `senior_backend_node` calls `read_domain_context("backend")` | Code inspection: function body contains `read_domain_context("backend")` |
| AC-11 | `docker-compose.yml` contains `LETTA_URL` in langgraph-bridge env | `grep "LETTA_URL" C:\Users\noadmin\nospace\development\tLOS\core\kernel\docker-compose.yml` → matches |
| AC-12 | `pyproject.toml` contains `requests>=2.32` | Code inspection: `requests>=2.32` in dependencies list |
| AC-13 | `build_graph()` and `build_chief_graph()` unchanged and importable | `python -c "from graph import build_graph, build_chief_graph, build_lead_graph, build_senior_graph; print('OK')"` → `OK` |

---

## tLOS Constraints (Player must follow)

- NEVER delete files — no `rm`, `del`, `rmdir`, `Remove-Item`
- NEVER raise exceptions from public functions in `letta_shared.py`
- NEVER modify frozen functions/classes listed above
- Read all files fully before editing
- Prefer `Edit` tool (targeted diffs) over full file rewrites
- If Letta is down, `letta_shared.py` degrades silently — empty strings, False booleans, print WARNINGs
- `requests` is synchronous — do NOT introduce async/await into `letta_shared.py`
