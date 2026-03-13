# Player B Spec — TLOS-09 Turn B

## Role

You are a **backend-developer** Player in a G3 Dialectical Autocoding session.
Implement exactly what is specified. Do not self-declare done — Coach verifies.

## Prerequisites

Turn A is complete: `zep-client.js` exists with stubs, Zep is running, grid.ps1 updated.
Read `zep-client.js` first before writing anything.

## Your Task

Implement REQ-004 and REQ-005: full zep-client.js API + Development domain seeding.

---

## Working Directory

`C:\Users\noadmin\nospace\development\tLOS`

---

## Step 1: Verify Zep is running and discover actual API

Before writing code, probe the actual Zep API to confirm endpoints:

```bash
# Health check
curl http://localhost:8000/healthz

# Try creating a user (discover actual endpoint structure)
curl -s -X POST http://localhost:8000/api/v2/users \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-probe","metadata":{"domain":"test"}}'

# Check what endpoints exist
curl -s http://localhost:8000/openapi.json | python -c "import sys,json; d=json.load(sys.stdin); [print(p) for p in d.get('paths',{}).keys()]"
```

**CRITICAL**: If the actual Zep API differs from the REQ spec, adapt the implementation to match
the real API. Document any deviations in a comment at the top of the function.

---

## REQ-004 — zep-client.js full API

Replace the stub implementations in `core/kernel/tlos-claude-bridge/zep-client.js`.
Keep the file structure identical — only replace stub function bodies.

### ensureDomain(domain)

Creates a Zep user representing the domain if it doesn't exist. Idempotent.

```javascript
async function ensureDomain(domain) {
    try {
        // Try to get existing user
        const existing = await req('GET', `/api/v2/users/${domain}`);
        if (existing) return { domain, exists: true };
        // Create user if not found (404 → req returns null)
        const created = await req('POST', '/api/v2/users', {
            user_id: domain,
            metadata: { type: 'domain', created: new Date().toISOString() },
        });
        return created ? { domain, exists: false } : null;
    } catch {
        return null;
    }
}
```

### addFact(domain, content, metadata = {})

Adds a fact to the domain's knowledge base.

```javascript
async function addFact(domain, content, metadata = {}) {
    try {
        const result = await req('POST', `/api/v2/users/${domain}/facts`, {
            fact: content,
            metadata: { ...metadata, added: new Date().toISOString() },
        });
        return result !== null;
    } catch {
        return false;
    }
}
```

### getFacts(domain, limit = 20)

Returns array of fact objects `{ uuid, fact, created_at }`.

```javascript
async function getFacts(domain, limit = 20) {
    try {
        const data = await req('GET', `/api/v2/users/${domain}/facts?limit=${limit}`);
        if (!data) return [];
        return Array.isArray(data) ? data : (data.facts || []);
    } catch {
        return [];
    }
}
```

### searchFacts(domain, query, limit = 5)

Vector search over domain facts. Returns most relevant facts.

```javascript
async function searchFacts(domain, query, limit = 5) {
    try {
        const data = await req('POST', '/api/v2/graph/search', {
            query,
            scope: 'facts',
            user_id: domain,
            limit,
        });
        if (!data) return [];
        return Array.isArray(data) ? data : (data.results || data.facts || []);
    } catch {
        return [];
    }
}
```

### getContext(domain)

Returns a formatted string of recent facts for injection into system prompt.

```javascript
async function getContext(domain) {
    try {
        const facts = await getFacts(domain, 10);
        if (!facts.length) return '';
        return facts
            .map((f, i) => `${i + 1}. ${f.fact || f.content || String(f)}`)
            .join('\n');
    } catch {
        return '';
    }
}
```

---

## REQ-005 — Development domain seeding

Add to `zep-client.js` — called automatically from `ensureDomain` when facts count is 0:

```javascript
const DEVELOPMENT_DOMAIN_SEED = [
    "tLOS is a sovereign spatial OS built with SolidJS + Tauri (L3 Shell), NATS transport (L1 Grid), and Rust kernel services (L2 Kernel).",
    "L2 Kernel Step 1 complete: Letta self-hosted (port 8283, uv tool install) — Session memory for Workers and Coaches.",
    "L2 Kernel Step 2 complete: tlos-langgraph-bridge (Python service) — NATS subscriber → LangGraph → orchestrator→worker → G3 cyclic subgraph.",
    "tlos-claude-bridge uses Claude CLI subprocess via stdin (--print --output-format stream-json). No Anthropic SDK, no API key required.",
    "G3 Dialectical Autocoding: Coach verifies independently, Player implements. Max 3 iterations per subgraph cycle.",
    "NATS subjects: tlos.shell.events (subscribe), tlos.shell.broadcast (publish). Zero-Web2 — no HTTP between internal actors.",
    "Eidolon is the Orchestrator agent (Claude Sonnet) — L1. System prompt injected via XML blocks: <persona>, <workspace>, <domain_memory>.",
    "Session persistence: ~/.tlos/sessions.json — claudeSessionId + turns per conversationSessionId.",
    "Letta memory blocks: persona, workspace, conversation_summary, conversation_history. Dual-path: Letta UP or in-memory fallback.",
    "LangGraph G3 subgraph: G3State TypedDict, g3_player_node → g3_coach_node → conditional edge (passed OR iter≥3 → END).",
    "grid.ps1 manages all tLOS services: NATS, Rust binaries, claude-bridge (Node), letta, langgraph (Python uv), frontend (Tauri).",
    "tLOS identity: Secp256k1 keypair at ~/.tlos/identity.key. Nostr NIP-44 for inter-node communication (Phase 1, shipped).",
];

// Called internally from ensureDomain when domain is empty
async function seedDomainIfEmpty(domain) {
    try {
        const existing = await getFacts(domain, 1);
        if (existing.length > 0) return; // already seeded
        console.log(`[zep-client] Seeding ${DEVELOPMENT_DOMAIN_SEED.length} facts to ${domain}...`);
        for (const fact of DEVELOPMENT_DOMAIN_SEED) {
            await addFact(domain, fact, { source: 'tlos-seed', version: '09' });
        }
        console.log(`[zep-client] Seeding complete.`);
    } catch {
        // non-fatal
    }
}
```

Update `ensureDomain` to call `seedDomainIfEmpty` after ensuring domain exists:
```javascript
async function ensureDomain(domain) {
    // ... create if not exists ...
    await seedDomainIfEmpty(domain);  // idempotent
    return { domain };
}
```

---

## Verification Checklist (run all, report results)

```bash
# 1. Syntax check
node --check core/kernel/tlos-claude-bridge/zep-client.js
# Expected: no output

# 2. Module exports
node -e "const z=require('./core/kernel/tlos-claude-bridge/zep-client'); console.log(Object.keys(z))"
# Expected: includes all 6 functions

# 3. isAvailable (Zep must be running)
node -e "const z=require('./core/kernel/tlos-claude-bridge/zep-client'); z.isAvailable().then(console.log)"
# Expected: true

# 4. ensureDomain + getFacts (Zep must be running)
node -e "
const z=require('./core/kernel/tlos-claude-bridge/zep-client');
(async()=>{
  await z.ensureDomain('development-domain');
  const facts = await z.getFacts('development-domain', 5);
  console.log('Facts count:', facts.length);
  if(facts.length > 0) console.log('First fact:', facts[0].fact || facts[0]);
})();"
# Expected: Facts count: >= 12 (seeded)

# 5. getContext
node -e "
const z=require('./core/kernel/tlos-claude-bridge/zep-client');
(async(){ const ctx = await z.getContext('development-domain'); console.log(ctx.slice(0,200)); })()"
# Expected: numbered list of facts
```

Report each check as PASS/FAIL with actual output.
If Zep API endpoints differ from spec — document actual endpoints used in a comment.

---

## Files to modify

| File | Action |
|------|--------|
| `core/kernel/tlos-claude-bridge/zep-client.js` | MODIFY (replace stubs with full implementation + seed) |

Do NOT modify index.js — that is Turn C's responsibility.
Do NOT modify grid.ps1 — that is Turn A's responsibility.
