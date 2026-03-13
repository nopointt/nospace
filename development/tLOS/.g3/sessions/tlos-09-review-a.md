# Coach Review — TLOS-09 Turn A (Zep install + grid.ps1 + zep-client.js skeleton)
Date: 2026-03-10

## REQ-001 — Zep installation

| Check | Result | Notes |
|-------|--------|-------|
| Docker probe | PASS | `docker` not found — correctly skipped |
| Binary probe | PASS | getzep/zep latest release is `zep-crewai-v1.1.5` (cloud SDK, no Windows binary) — correctly skipped |
| mem0 fallback | PASS | `uv pip install --system mem0ai fastapi uvicorn` succeeded |
| mem0-wrapper.py created | PASS | `core/kernel/tlos-zep-bridge/mem0-wrapper.py` — FastAPI, SQLite at `~/.tlos/zep/facts.db`, zero external API keys |
| healthz responds | PASS | HTTP 200 `{"status":"ok","backend":"mem0-sqlite"}` |
| Installation method documented | PASS | Comment block lines 6-9 in zep-client.js |

**GOOD**: mem0-wrapper.py is fully self-contained — SQLite backend, no LLM API keys, no vector DB.
The custom SQLite + substring search is an appropriate V1 (exact match sufficient for seeded facts).

## REQ-002 — grid.ps1 integration

| Check | Result | Notes |
|-------|--------|-------|
| Service entry present | PASS | Line 18 — after langgraph (17), before frontend (19) |
| Entry fields | PASS | `name="zep"`, `title="Zep memory (mem0)"`, correct dir and cmd |
| Pre-flight block | PASS | Lines 94-101: checks `uv` + `mem0-wrapper.py` existence |
| Stop block | PASS | Lines 187-190: WMI kill `python.exe` where CommandLine contains `mem0-wrapper` |
| Status block | PASS | Lines 233-238: HTTP check `localhost:8001/healthz` → `[UP]` / `[ ]` |

## REQ-003 — zep-client.js skeleton

| Check | Result | Notes |
|-------|--------|-------|
| File created | PASS | `core/kernel/tlos-claude-bridge/zep-client.js` |
| `node --check` | PASS | SYNTAX_OK |
| Module exports | PASS | `isAvailable, ensureDomain, addFact, getFacts, searchFacts, getContext` |
| Pattern match (letta-client.js) | PASS | Same structure: BASE_URL, CACHE_TTL_MS, _available, _cacheTs, req(), isAvailable(), stubs, module.exports |
| `isAvailable()` implemented | PASS | GET /healthz, 30s cache, zero-throw |
| Stubs return correct types | PASS | ensureDomain→null, addFact→false, getFacts→[], searchFacts→[], getContext→'' |
| Zero external deps | PASS | Built-in fetch only |

## Runtime Checks (Orchestrator)

| Check | Result | Notes |
|-------|--------|-------|
| `node --check zep-client.js` | PASS | SYNTAX_OK |
| `node -e "Object.keys(require('./zep-client'))"` | PASS | All 6 exports present |

## Issues Found

None.

## Verdict

TURN_A_APPROVED ✅

REQ-001, REQ-002, REQ-003 all verified and passed.
mem0 fallback approach is sound — wrapper is minimal, self-contained, zero external keys.
