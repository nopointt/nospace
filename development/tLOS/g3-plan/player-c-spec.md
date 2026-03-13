# G3 Turn C — Player Spec
# Migrate index.js: remove sessionLogs, add Letta dual-path memory

**Contract:** `/c/Users/noadmin/nospace/development/tLOS/g3-plan/current_requirements.md`
**Requirements in scope:** REQ-004 (sessionLogs replaced), REQ-006 (fallback silent and complete)
**File to edit:** `/c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js`
**Pre-condition:** `letta-client.js` already exists at the same directory (created in Turn B).
**DO NOT touch:** `grid.ps1`, `letta-client.js`, `sessions.json`, any other file outside index.js.

---

## Step 0 — Update todo.g3.md

Open `/c/Users/noadmin/nospace/development/tLOS/g3-plan/todo.g3.md`.
Change Turn C row from `⬜ PENDING` to `⏳ IN PROGRESS`.

---

## Step 1 — Read index.js first

Read the full file before making any changes:
`/c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js`

The file is 491 lines. All line number references below are relative to that file as it currently stands. Verify each reference before editing.

---

## Step 2 — REMOVE these exact blocks

### 2a. Remove section header comment + sessionLogs declaration + getSessionLog function

**Lines 142–158** — remove entirely (the full block):

```
// ─── In-memory session message log (context summarization) ───────────────────
// Tracks conversation per session for LLM-based compaction when nearLimit fires.
// Not persisted — in-memory only; cleared when bridge restarts.

const sessionLogs = {};

function getSessionLog(sessionId) {
    if (!sessionLogs[sessionId]) {
        sessionLogs[sessionId] = {
            messages: [],           // [{role: 'user'|'assistant', content: string}]
            assistantBuf: '',       // accumulates current streaming response text
            needsSummarization: false,
            summary: null,          // injected into next new session after compaction
        };
    }
    return sessionLogs[sessionId];
}
```

After removal, lines 142–158 are gone. Nothing replaces this block here — the new declarations go in Step 3.

---

## Step 3 — ADD new declarations after existing requires block

Insert the following block immediately after line 10 (`const sc = StringCodec();`), before line 12 (the `// ─── Agent config` comment):

```javascript
// ─── Letta memory client (optional, graceful fallback when unavailable) ───────

const LettaClient = require('./letta-client');

const lettaAgentIds = new Map();  // sessionId → lettaAgentId (in-process, cleared on restart)
const memoryFallback = {};        // fallback store when Letta unavailable

LettaClient.isAvailable().then(available => {
    if (!available) console.warn('[tlos-claude-bridge] Letta unavailable — using in-memory fallback');
});

async function getOrCreateLettaSession(sessionId, personaText, workspaceText) {
    if (lettaAgentIds.has(sessionId)) return lettaAgentIds.get(sessionId);
    if (!await LettaClient.isAvailable()) return null;
    const result = await LettaClient.createAgent(sessionId, personaText, workspaceText);
    if (result?.agentId) lettaAgentIds.set(sessionId, result.agentId);
    return result?.agentId || null;
}

function getFallbackLog(sessionId) {
    if (!memoryFallback[sessionId]) memoryFallback[sessionId] = { messages: [], summary: null };
    return memoryFallback[sessionId];
}
```

---

## Step 4 — Rewrite handleChat()

The current `handleChat` starts at line 227. After the removal in Step 2 and insertion in Step 3, the absolute line numbers will have shifted — locate the function by its signature `async function handleChat(nc, sessionId, content, model)` and work from there.

Apply the following changes inside `handleChat` in sequence:

### 4a. Replace the opening `getSessionLog` call and `needsSummarization` compaction block

**Old (first ~18 lines of handleChat body):**
```javascript
    const log = getSessionLog(sessionId);

    // Context summarization: if previous turn hit nearLimit, compact before proceeding
    if (log.needsSummarization && log.messages.length > 0) {
        console.log(`[tlos-claude-bridge] compacting session ${sessionId} (${log.messages.length} msgs)`);
        publish(nc, 'tlos.shell.broadcast', {
            type: 'agent:summarizing',
            payload: { sessionId },
        });
        const summary = await summarizeConversation(log.messages);
        console.log(`[tlos-claude-bridge] summary ready: ${summary.length} chars`);
        // Force new Claude session — old one is near limit
        delete sessionsData[sessionId];
        saveSessions(sessionsData);
        log.needsSummarization = false;
        log.messages = [];
        log.summary = summary;
    }
```

**New (replace with):**
```javascript
    // Resolve Letta agent (or null if Letta unavailable — fallback path used throughout)
    const personaText = safeRead(path.join(AGENT_DIR, 'memory', 'persona.md'));
    const workspaceText = safeRead(path.join(AGENT_DIR, 'memory', 'workspace.md'));
    const agentId = await getOrCreateLettaSession(sessionId, personaText, workspaceText);

    // Context summarization: if previous turn hit nearLimit, compact before proceeding
    const fallbackLog = getFallbackLog(sessionId);
    const needsSummarization = !agentId && fallbackLog.messages.length > 0 && fallbackLog._needsSummarization;
    if (needsSummarization) {
        console.log(`[tlos-claude-bridge] compacting session ${sessionId} (${fallbackLog.messages.length} msgs)`);
        publish(nc, 'tlos.shell.broadcast', {
            type: 'agent:summarizing',
            payload: { sessionId },
        });
        const summary = await summarizeConversation(fallbackLog.messages);
        console.log(`[tlos-claude-bridge] summary ready: ${summary.length} chars`);
        // Force new Claude session — old one is near limit
        delete sessionsData[sessionId];
        saveSessions(sessionsData);
        fallbackLog._needsSummarization = false;
        fallbackLog.messages = [];
        fallbackLog.summary = summary;
    }
```

### 4b. Replace the `log.messages.push({ role: 'user', content })` user-message tracking line

**Old (currently around line 253):**
```javascript
    // Track user message in conversation log
    log.messages.push({ role: 'user', content });
    log.assistantBuf = '';
```

**New:**
```javascript
    // Track user message in conversation log
    if (agentId) {
        await LettaClient.appendMessage(agentId, 'user', content);
    } else {
        getFallbackLog(sessionId).messages.push({ role: 'user', content });
    }
    let assistantBuf = '';
```

Note: `log.assistantBuf` becomes the local variable `assistantBuf` declared here. The `log.assistantBuf` property no longer exists.

### 4c. Replace the `log.summary` read in the "inject summary" block

**Old (currently around lines 260–264):**
```javascript
    // Inject summary from previous compacted session into fresh session context
    if (isNewSession && log.summary) {
        const base = systemPrompt || loadSystemPrompt();
        systemPrompt = `${base}\n\n<PREVIOUS_CONTEXT_SUMMARY>\n${log.summary}\n</PREVIOUS_CONTEXT_SUMMARY>`;
        log.summary = null;
    }
```

**New:**
```javascript
    // Inject summary from previous compacted session into fresh session context
    const currentFallback = getFallbackLog(sessionId);
    const previousSummary = agentId
        ? (await LettaClient.getMemoryBlock(agentId, 'conversation_summary'))?.value || null
        : currentFallback.summary;
    if (isNewSession && previousSummary) {
        const base = systemPrompt || loadSystemPrompt();
        systemPrompt = `${base}\n\n<PREVIOUS_CONTEXT_SUMMARY>\n${previousSummary}\n</PREVIOUS_CONTEXT_SUMMARY>`;
        if (!agentId) currentFallback.summary = null;
        // Letta path: summary persists in Letta block — no need to clear here
    }
```

### 4d. Replace `log.assistantBuf = block.text` inside the stdout streaming loop

**Old (currently around line 349):**
```javascript
                            log.assistantBuf = block.text; // accumulate full text for message log
```

**New:**
```javascript
                            assistantBuf = block.text; // accumulate full text for message log
```

### 4e. Replace the `log.messages.push assistant` and `log.assistantBuf = ''` inside the `result` block

**Old (currently around lines 363–367):**
```javascript
                // Save completed assistant response to conversation log
                if (log.assistantBuf) {
                    log.messages.push({ role: 'assistant', content: log.assistantBuf });
                    log.assistantBuf = '';
                }
```

**New:**
```javascript
                // Save completed assistant response to conversation log
                if (assistantBuf) {
                    if (agentId) {
                        await LettaClient.appendMessage(agentId, 'assistant', assistantBuf);
                    } else {
                        getFallbackLog(sessionId).messages.push({ role: 'assistant', content: assistantBuf });
                    }
                    assistantBuf = '';
                }
```

### 4f. Replace `log.needsSummarization = true` in the nearLimit block

**Old (currently around lines 386–389):**
```javascript
                        const nearLimit = tokensUsed / contextTotal > 0.8;
                        if (nearLimit) {
                            log.needsSummarization = true;
                            console.log(`[tlos-claude-bridge] session ${sessionId} nearLimit — scheduled compaction`);
                        }
```

**New:**
```javascript
                        const nearLimit = tokensUsed / contextTotal > 0.8;
                        if (nearLimit) {
                            if (!agentId) getFallbackLog(sessionId)._needsSummarization = true;
                            console.log(`[tlos-claude-bridge] session ${sessionId} nearLimit — scheduled compaction`);
                        }
```

Note: When `agentId` is set (Letta path), `_needsSummarization` is not needed — Letta's persistent memory blocks survive restart. The compaction logic at the top of `handleChat` is guarded by `!agentId` so it only activates on the fallback path.

---

## Step 5 — Verify summarizeConversation() call

The `summarizeConversation` function is called with `fallbackLog.messages` in Step 4a. Confirm it is called as:

```javascript
const summary = await summarizeConversation(fallbackLog.messages);
```

(Already covered in Step 4a replacement text above — no separate change needed.)

---

## Step 6 — Verification checks

Run each check and confirm output BEFORE declaring done:

```bash
# Must return 0 matches:
grep -n "sessionLogs" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js

# Must return 0 matches:
grep -n "getSessionLog" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js

# Must return exactly 1 match:
grep -n "require('./letta-client')" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js

# Must have matches (Letta path present):
grep -n "lettaAgentIds" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js

# Must have matches (fallback path present):
grep -n "memoryFallback\|getFallbackLog" /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js

# Must have 0 matches (no bare log.* references remain):
grep -n "\blog\." /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js

# Syntax check — must exit 0:
node --check /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge/index.js
```

If any check fails, fix before proceeding to Step 7.

---

## Step 7 — Confirm unchanged items

Verify that NONE of the following are modified:

- `sessions.json` persistence: `loadSessions`, `saveSessions`, `getSessionEntry`, `saveSessionEntry`, `sessionsData` — all must remain exactly as-is
- Claude CLI spawn logic: `CLAUDE_EXE`, spawn args, `--resume claudeSessionId` flag, stdin write — untouched
- `summarizeConversation` function body — untouched
- `loadSystemPrompt()`, `loadMatchingMicroagents()`, `safeRead()` — untouched
- `publish()` helper — untouched
- `main()` function — untouched
- `letta-client.js` — DO NOT OPEN OR EDIT
- `grid.ps1` — DO NOT OPEN OR EDIT

---

## Step 8 — Update todo.g3.md

Open `/c/Users/noadmin/nospace/development/tLOS/g3-plan/todo.g3.md`.
Change Turn C row from `⏳ IN PROGRESS` to `✅ DONE`.

---

## Rules

1. Reference REQ-004 and REQ-006 ONLY from the requirements contract.
2. DO NOT touch `grid.ps1` or `letta-client.js`.
3. Read `index.js` FIRST, verify line numbers match before each edit.
4. Preserve ALL existing behaviour for the non-Letta path (REQ-006 is critical).
5. `sessions.json` persistence (`claudeSessionId`, `turns`) must remain UNTOUCHED.
6. `assistantBuf` transitions from `log.assistantBuf` (property) to a local `let` variable in `handleChat` — intentional.
7. `_needsSummarization` on `fallbackLog` is the fallback-only equivalent of the removed `log.needsSummarization`.
8. Never throw or propagate errors from Letta calls.

---

## Output format

End your response with exactly this block:

```
TURN_C_COMPLETE
Files changed: core/kernel/tlos-claude-bridge/index.js, g3-plan/todo.g3.md
Blockers: none | <description if any>
```
