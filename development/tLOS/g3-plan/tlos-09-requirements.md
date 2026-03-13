# TLOS-09 Requirements Contract — Zep self-hosted + Domain memory

## Context

L2 Kernel Step 3. Steps 1 (Letta) and 2 (LangGraph bridge) are complete.
Goal: self-hosted Zep as CMA substrate for Domain memory. First domain: **Development**.
Integration: claude-bridge injects Development domain context into Eidolon system prompt.

---

## REQ-001 — Zep installation (Windows, no Docker assumption)

Player A probes in order of priority:

1. **Docker** (`docker --version`): if available →
   ```
   docker run -d --name zep-server -p 8000:8000 ghcr.io/getzep/zep:latest
   ```
2. **Windows binary**: download from https://github.com/getzep/zep/releases/latest
   (look for `zep_windows_amd64.zip` or similar)
3. **mem0 fallback**: if Zep CE is not available →
   `uv tool install mem0ai` — then create a minimal FastAPI wrapper
   that exposes the same HTTP interface on port 8001

Verification:
- Zep: `curl http://localhost:8000/healthz` → HTTP 200
- mem0 fallback: `curl http://localhost:8001/health` → HTTP 200

---

## REQ-002 — grid.ps1 integration

Add service entry **after langgraph, before frontend**:
```powershell
@{ name="zep"; title="Zep memory"; dir=$Root; cmd="<Player A fills in>"; optional=$true }
```

Pre-flight block: check Docker or binary availability (similar to letta/langgraph blocks).
Stop: `docker stop zep-server` (Docker) or WMI kill by process name (binary).
Status: check `/healthz` or process running.

Verification: read grid.ps1 — entry present, pre-flight block present, stop/status work.

---

## REQ-003 — zep-client.js skeleton

File: `core/kernel/tlos-claude-bridge/zep-client.js`

Pattern: **exact structural copy of letta-client.js** (zero external deps, built-in fetch, zero-throw, 30s isAvailable cache).

Exports at minimum: `{ isAvailable }` (stubs for Turn B functions may be included).

Verification:
- `node -e "require('./zep-client')"` → no error
- `node --check zep-client.js` → syntax OK

---

## REQ-004 — zep-client.js full API

File: same `zep-client.js`, extended by Turn B.

Functions:
```javascript
async function isAvailable()                           // GET /healthz, 30s cache
async function ensureDomain(domain)                    // POST /api/v2/users — idempotent
async function addFact(domain, content, metadata={})   // POST /api/v2/users/{id}/facts
async function getFacts(domain, limit=20)              // GET /api/v2/users/{id}/facts
async function searchFacts(domain, query, limit=5)     // POST /api/v2/graph/search
async function getContext(domain)                      // getFacts(10) → formatted string
```

All functions: zero-throw (try/catch wrapping), return null/false/[] on error.

Verification:
- `node --check zep-client.js` → syntax OK
- `node -e "const z=require('./zep-client'); z.isAvailable().then(console.log)"` → runs without crash

---

## REQ-005 — Development domain seeding

In `zep-client.js`, exported `ensureDomain('development-domain')`:
1. Try GET user → if exists, get facts count
2. If facts count === 0 → seed `DEVELOPMENT_DOMAIN_SEED` array (10–15 facts)
3. Seed is idempotent: no duplicate check needed (Zep deduplicates by content hash)

Seed facts represent current tLOS state: L2 Kernel steps done, architecture, key paths, G3 methodology.

Verification: after `ensureDomain()` call, `getFacts('development-domain')` returns length > 0.

---

## REQ-006 — claude-bridge integration (index.js)

Turn C modifies `core/kernel/tlos-claude-bridge/index.js`:

1. **Import**: `const ZepClient = require('./zep-client');` (after LettaClient import)

2. **Startup** (after Letta startup block):
   ```javascript
   ZepClient.isAvailable().then(available => {
       if (!available) console.warn('[tlos-claude-bridge] Zep unavailable — domain context disabled');
       else ZepClient.ensureDomain('development-domain').then(() =>
           console.log('[tlos-claude-bridge] Zep: Development domain ready')
       );
   });
   ```

3. **getDomainContext()** async helper:
   ```javascript
   async function getDomainContext() {
       if (!await ZepClient.isAvailable()) return '';
       const ctx = await ZepClient.getContext('development-domain');
       return ctx ? `<domain_memory>\n${ctx}\n</domain_memory>` : '';
   }
   ```
   Called in `handleChat` before building system prompt. Injected after `<workspace>` block.

4. **NATS handler** in the message routing switch:
   ```javascript
   if (type === 'agent:zep:add_fact') {
       await ZepClient.addFact(data.domain || 'development-domain', data.content, data.metadata || {});
   }
   ```

Verification:
- `node --check index.js` → syntax OK
- Start bridge + Zep → log shows "Development domain ready"

---

## Zep CE REST API reference (v2)

```
GET  /healthz
POST /api/v2/users                  body: { user_id, email?, metadata? }
GET  /api/v2/users/{userId}
POST /api/v2/users/{userId}/facts   body: { fact: string, metadata? }
GET  /api/v2/users/{userId}/facts   query: ?limit=N
POST /api/v2/graph/search           body: { query, scope: "facts", user_id, limit }
```

If actual CE endpoints differ — Player B documents and adapts accordingly.

---

## Cascade

```
Turn A (Player):  REQ-001 + REQ-002 + REQ-003
Turn B (Player):  REQ-004 + REQ-005
Turn C (Player):  REQ-006
```

Coach reviews each Turn before next Player starts.
Coach A + Player B run in parallel.
Coach B + Player C run in parallel.
