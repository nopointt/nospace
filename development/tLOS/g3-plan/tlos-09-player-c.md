# Player C Spec — TLOS-09 Turn C

## Role

You are a **backend-developer** Player in a G3 Dialectical Autocoding session.
Implement exactly what is specified. Do not self-declare done — Coach verifies.

## Prerequisites

Turn A complete: zep-client.js exists with stubs, grid.ps1 updated, Zep running.
Turn B complete: zep-client.js has full API implementation, Development domain seeded.
Read `index.js` (full file) and `zep-client.js` before modifying anything.

## Your Task

Implement REQ-006: integrate zep-client.js into `core/kernel/tlos-claude-bridge/index.js`.
Three changes: import, startup init, system prompt injection, NATS event handler.

---

## Working Directory

`C:\Users\noadmin\nospace\development\tLOS`

---

## Read First

```bash
# Read the full index.js to understand current structure
cat core/kernel/tlos-claude-bridge/index.js

# Read zep-client.js to understand exports
node -e "const z=require('./core/kernel/tlos-claude-bridge/zep-client'); console.log(Object.keys(z))"
```

---

## REQ-006 — index.js changes

### Change 1: Import (after LettaClient require, line ~13)

Current:
```javascript
const LettaClient = require('./letta-client');
```

Add immediately after:
```javascript
const ZepClient = require('./zep-client');
```

### Change 2: Startup initialization (after Letta startup block, ~line 21)

Current (Letta startup):
```javascript
LettaClient.isAvailable().then(available => {
    if (!available) console.warn('[tlos-claude-bridge] Letta unavailable — using in-memory fallback');
});
```

Add immediately after:
```javascript
ZepClient.isAvailable().then(available => {
    if (!available) {
        console.warn('[tlos-claude-bridge] Zep unavailable — domain context disabled');
    } else {
        ZepClient.ensureDomain('development-domain').then(() =>
            console.log('[tlos-claude-bridge] Zep: Development domain ready')
        );
    }
});
```

### Change 3: getDomainContext() helper (add near loadSystemPrompt, before handleChat)

Add as a new async function:
```javascript
// Retrieves Development domain context from Zep for injection into system prompt
async function getDomainContext() {
    try {
        if (!await ZepClient.isAvailable()) return '';
        const ctx = await ZepClient.getContext('development-domain');
        if (!ctx) return '';
        return `<domain_memory>\n${ctx}\n</domain_memory>`;
    } catch {
        return '';
    }
}
```

### Change 4: Inject domain_memory into system prompt

Inside `handleChat` (or wherever the system prompt is assembled), find where the XML blocks are built.
Currently the system prompt uses `loadSystemPrompt()` which is synchronous.

Find the call site in handleChat where systemPrompt is used, and add domain context:

```javascript
// BEFORE (approximate current code):
const systemPrompt = loadSystemPrompt();

// AFTER:
const [systemPrompt, domainCtx] = await Promise.all([
    Promise.resolve(loadSystemPrompt()),
    getDomainContext(),
]);
const fullSystemPrompt = domainCtx
    ? systemPrompt + '\n\n' + domainCtx
    : systemPrompt;
```

Use `fullSystemPrompt` (not `systemPrompt`) when passing to claude CLI stdin.

**IMPORTANT**: `handleChat` may already be async — check before adding await. If it's not async, make it async or use `.then()` chain. Do NOT break existing functionality.

### Change 5: NATS event handler for agent:zep:add_fact

In the message routing section (where `type` is checked), add:

```javascript
if (type === 'agent:zep:add_fact') {
    const { domain = 'development-domain', content, metadata = {} } = data;
    if (content) {
        ZepClient.addFact(domain, content, metadata).then(ok => {
            if (!ok) console.warn('[tlos-claude-bridge] Zep: addFact failed for domain', domain);
        });
    }
    return; // fire and forget — no response needed
}
```

---

## Verification Checklist (run all, report results)

```bash
# 1. Syntax check
node --check core/kernel/tlos-claude-bridge/index.js
# Expected: no output (syntax OK)

# 2. Dry require (module loads without crashing)
node -e "require('./core/kernel/tlos-claude-bridge/index')" 2>&1 | head -5
# Expected: may print startup warnings (Letta/Zep unavailable) but NO unhandled exceptions

# 3. Grep: ZepClient import present
Select-String -Path "core/kernel/tlos-claude-bridge/index.js" -Pattern "ZepClient"
# Expected: at least 3 matches (require, startup, getDomainContext)

# 4. Grep: domain_memory injection present
Select-String -Path "core/kernel/tlos-claude-bridge/index.js" -Pattern "domain_memory"
# Expected: 1 match (the template literal in getDomainContext)

# 5. Grep: agent:zep:add_fact handler present
Select-String -Path "core/kernel/tlos-claude-bridge/index.js" -Pattern "zep:add_fact"
# Expected: 1 match
```

Report each check as PASS/FAIL with actual output.

---

## Critical Constraints

- `loadSystemPrompt()` is synchronous — do NOT make it async. Use getDomainContext() separately.
- If `handleChat` is not already async — make it `async function handleChat(...)`.
- Do NOT change Letta integration logic — Zep is additive only.
- Do NOT remove or rename any existing exports from index.js.
- The `<domain_memory>` block must appear AFTER `<persona>` and `<workspace>` in the final prompt.

---

## Files to modify

| File | Action |
|------|--------|
| `core/kernel/tlos-claude-bridge/index.js` | MODIFY (5 changes as specified above) |

Do NOT modify zep-client.js — that is Turn B's responsibility.
Do NOT modify grid.ps1 — that is Turn A's responsibility.
