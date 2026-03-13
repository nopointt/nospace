# G3 Turn B — Player Spec: Create letta-client.js

**Project:** tLOS — tlos-claude-bridge Letta integration
**Turn:** B
**Player role:** backend-developer agent
**References:** REQ-003, REQ-005 from `g3-plan/current_requirements.md`
**Status gate:** Coach (Claude main session) verifies — Player CANNOT self-declare done

---

## Pre-flight (do this FIRST, in order)

**Step 0 — Mark IN PROGRESS**

Edit `C:\Users\noadmin\nospace\development\tLOS\g3-plan\todo.g3.md`.
Change the Turn B row from `⬜ PENDING` to `⏳ IN PROGRESS`. Save.

**Step 1 — Discover actual Letta API routes**

Run:
```
curl -s http://localhost:8283/v1/
curl -s http://localhost:8283/v1/health
```

If Letta is not running, start it: `letta server --port 8283`
Letta must be reachable before you write any code. If `curl /v1/health` returns non-200, stop and report as a blocker.

Study the JSON response from `GET /v1/` — note the actual route shapes for:
- Creating an agent
- Getting agent memory
- Patching a memory block

The API shape documented below is the expected shape. If the actual API differs, adapt your implementation to match the real routes — do NOT blindly copy the documented shape.

---

## Exact task

Create one new file:

```
C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-claude-bridge\letta-client.js
```

The file exports exactly 6 async functions (see signatures below). No other files may be changed. `package.json`, `index.js`, and `grid.ps1` are off-limits this turn.

---

## File: letta-client.js

### Hard constraints

- File MUST be fewer than 200 lines (including blank lines and comments)
- ZERO external npm dependencies — use Node.js built-in `fetch` only (Node 18+)
- ZERO `require()` calls to anything outside Node.js builtins (no nats, no axios, nothing)
- ZERO `throw` statements anywhere — every error path returns null / false / []
- `package.json` MUST NOT be modified

### Required structure (implement in this exact order)

1. `'use strict';`
2. Constants: `BASE_URL`, `CACHE_TTL_MS`
3. Availability cache module-level variables: `_available`, `_cacheTs`
4. Private helper `req(method, path, body?)`
5. `isAvailable()`
6. `createAgent(sessionId, personaText, workspaceText)`
7. `getMemoryBlock(agentId, blockLabel)`
8. `updateMemoryBlock(agentId, blockLabel, value)`
9. `appendMessage(agentId, role, content)`
10. `getConversationHistory(agentId)`
11. `module.exports = { isAvailable, createAgent, getMemoryBlock, updateMemoryBlock, appendMessage, getConversationHistory }`

### Constants

```javascript
const BASE_URL = 'http://localhost:8283/v1';
const CACHE_TTL_MS = 30_000;
```

### Private helper: `req(method, path, body)`

- Accepts HTTP method string, path string (e.g. `'/agents'`), optional body object
- Builds full URL as `BASE_URL + path`
- Sets `Content-Type: application/json` when body is present
- Uses Node.js built-in `fetch`
- Returns the parsed JSON response object on success (any 2xx)
- Returns `null` on any error: network failure, non-2xx status, JSON parse failure
- Entire function body wrapped in try/catch — never throws

### Function signatures and behaviour

#### `isAvailable() → boolean`

- Checks `GET /v1/health`
- Caches result for 30 seconds using module-level `_available` and `_cacheTs` variables
- If `Date.now() - _cacheTs < CACHE_TTL_MS`, return cached `_available` immediately (no fetch)
- On any error: set `_available = false`, update `_cacheTs`, return `false`
- On HTTP 200: set `_available = true`, update `_cacheTs`, return `true`

#### `createAgent(sessionId, personaText, workspaceText) → { agentId } | null`

- Creates a new Letta agent via `POST /v1/agents`
- Request body:
  ```json
  {
    "name": "<sessionId>",
    "memory_blocks": [
      { "label": "persona",              "value": "<personaText>",   "limit": 5000  },
      { "label": "workspace",            "value": "<workspaceText>", "limit": 5000  },
      { "label": "conversation_summary", "value": "",               "limit": 10000 },
      { "label": "conversation_history", "value": "",               "limit": 50000 }
    ]
  }
  ```
- On success: return `{ agentId: response.id }` (use the `id` field from the Letta response)
- On any error or if response has no `id`: return `null`
- Verify the actual field name for agent id by checking `curl /v1/` first — adapt if Letta uses a different field

#### `getMemoryBlock(agentId, blockLabel) → { value } | null`

- Calls `GET /v1/agents/{agentId}/memory`
- Response may be shaped as `{ blocks: [...] }` OR `{ memory_blocks: [...] }` — handle both
- Find the block where `block.label === blockLabel`
- Return `{ value: block.value }` if found
- Return `null` if not found or on any error

#### `updateMemoryBlock(agentId, blockLabel, value) → boolean`

- Calls `PATCH /v1/agents/{agentId}/memory/blocks/{blockLabel}`
- Request body: `{ "value": value }`
- Return `true` on any 2xx response
- Return `false` on any error or non-2xx

#### `appendMessage(agentId, role, content) → boolean`

Algorithm (all steps in one function, no helpers):

1. Read current `conversation_history` block: call `getMemoryBlock(agentId, 'conversation_history')`
2. If result is null, treat existing value as empty string `''`
3. Format new entry as: `` `[${role}]: ${content}\n\n` ``
4. Concatenate: `existing + newEntry`
5. If combined length exceeds 8000 chars: trim to last 8000 chars using `.slice(-8000)`
6. Write back: call `updateMemoryBlock(agentId, 'conversation_history', trimmed)`
7. Return the boolean result of `updateMemoryBlock`
8. On any error at any step: return `false`

#### `getConversationHistory(agentId) → [{ role, content }] | []`

Algorithm:

1. Call `getMemoryBlock(agentId, 'conversation_history')`
2. If null or empty string: return `[]`
3. Parse lines: split value by `'\n'`, iterate over lines
4. For each line matching pattern `/^\[(\w+)\]: (.+)/`: push `{ role: match[1], content: match[2] }` to result array
5. Return result array (may be empty if no lines match)
6. On any error: return `[]`

---

## Letta REST API reference (expected shape — verify with curl first)

```
POST  /v1/agents
      Body: { name, memory_blocks: [{ label, value, limit }] }
      Response: { id, name, ... }

GET   /v1/agents/{id}/memory
      Response: { blocks: [{ label, value, limit, ... }] }
      OR:       { memory_blocks: [{ label, value, limit, ... }] }

PATCH /v1/agents/{id}/memory/blocks/{label}
      Body: { value: string }
      Response: 2xx on success

GET   /v1/health
      Response: HTTP 200 on healthy
```

IMPORTANT: The actual API shape may differ. Run `curl http://localhost:8283/v1/` before writing code and adapt to what you actually see.

---

## Verification checklist (self-check before reporting done)

```bash
# File exists
ls -la /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/letta-client.js

# Line count must be < 200
wc -l /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/letta-client.js

# Zero throw statements
grep -n "throw" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/letta-client.js
# Expected: no output

# Zero external requires
grep -n "require(" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/letta-client.js
# Expected: no output

# Smoke test (Letta must be running)
cd /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge && \
  node -e "require('./letta-client').isAvailable().then(console.log)"
# Expected output: true
```

---

## Rules

- Reference REQ-003 and REQ-005 ONLY for this turn
- DO NOT touch `index.js`
- DO NOT touch `grid.ps1`
- DO NOT touch `package.json`
- DO NOT install any npm packages
- DO NOT create any files other than `letta-client.js`

---

## Final step — Mark DONE

After self-verification passes, edit `todo.g3.md`:
Change Turn B row from `⏳ IN PROGRESS` to `✅ DONE`. Save.

---

## Output format

End your response with exactly this block:

```
TURN_B_COMPLETE
Files changed: [core/kernel/tlos-claude-bridge/letta-client.js]
Blockers: [none | <description if any>]
```
