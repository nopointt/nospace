# Coach Review — TLOS-08 Turn A (Python skeleton + NATS + grid.ps1)
Date: 2026-03-10

## REQ-001 — Python project structure

| Check | Result | Notes |
|-------|--------|-------|
| pyproject.toml exists | PASS | `nats-py>=2.0`, `langgraph>=0.2`, `anthropic>=0.40`, hatchling build |
| main.py exists | PASS | `asyncio.run(run_bridge())` |
| bridge.py exists | PASS | NATS connect + subscribe + publish |
| bridge_handler.py exists | PASS | Stub — publishes stub response |
| graph.py exists | PASS | Stub — raises NotImplementedError |
| uv imports check | PASS | Player verified: `import nats, langgraph, anthropic` → REQ-001 OK |

**NOTE (minor):** pyproject.toml contains extra `[tool.hatch.build.targets.wheel] include = ["*.py"]` section not in spec template. This is a **correct fix** — hatchling requires it for flat-file layouts without package subdirectory. Not a defect.

## REQ-002 — NATS connectivity

| Check | Result | Notes |
|-------|--------|-------|
| subscribe `tlos.shell.events` | PASS | bridge.py line 41 |
| publish `tlos.shell.broadcast` | PASS | bridge.py line 7, 44 |
| `agent:graph:status` published on startup | PASS | bridge.py lines 44-48: `{type, ready: True, service: "langgraph"}` |
| `agent:graph:run` handled | PASS | bridge.py line 18: `msg_type == "agent:graph:run"` |
| reconnect logic | PASS | `max_reconnect_attempts=-1` (infinite), `reconnect_time_wait=2` |
| error handling in message handler | PASS | try/except in handle_message → print, no crash |

**NOTE (good):** `from bridge_handler import handle_graph_run` deferred inside handle_message (line 23). This is better than spec — allows Turn B to replace bridge_handler.py without bridge.py being re-imported. Clean isolation.

## REQ-005 — grid.ps1 integration (4 points)

| Check | Result | Notes |
|-------|--------|-------|
| $Services entry | PASS | Line 17: after letta, before frontend; `uv run python main.py`; optional=true |
| pre-flight block | PASS | Lines 84-90: checks `uv` + `pyproject.toml` existence |
| stop block | PASS | Lines 172-175: WMI Win32_Process filter by CommandLine `*tlos-langgraph-bridge*` |
| status block | PASS | Lines 210-213: same WMI pattern; `[UP]` / `[ ]` output |

**NOTE (minor):** help text (line 239) still says `claude-bridge (optional), letta (optional)` without `langgraph (optional)`. Not blocking for Turn A — help text is cosmetic.

## Runtime Checks (Coach)

| Check | Result | Notes |
|-------|--------|-------|
| Syntax check (py_compile all 4 files) | PASS | SYNTAX_OK |
| REQ-001 imports | PASS | Player verified: nats, langgraph, anthropic all import |

## Issues Found

**MINOR — help text missing `langgraph (optional)`**
Line 239 in grid.ps1: help `Write-Host` lists `claude-bridge, letta` but not `langgraph`. Not blocking — cosmetic only. Can be fixed in any future turn.

## Verdict

TURN_A_APPROVED ✅ — все REQ-001, REQ-002, REQ-005 проверки пройдены.
