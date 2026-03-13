# Requirements Contract — TLOS-07-LETTA-MEMORY

**Created:** 2026-03-10
**Project:** tLOS — tlos-claude-bridge Letta integration
**Status:** ACTIVE
**Coach:** Claude main session (Orchestrator)

---

## Problem Statement

`sessionLogs` в `core/kernel/tlos-claude-bridge/index.js` хранит историю
разговоров и compaction summary в памяти Node.js процесса. При рестарте bridge
всё теряется — Eidolon не помнит предыдущего контекста.

Letta (stateful memory service) заменяет in-memory sessionLogs на персистентные
memory blocks, которые переживают рестарт bridge.

---

## Scope

**In scope:**
- Установить Letta (`pip install letta`) и добавить `letta server` в grid.ps1 как optional service на порту 8283
- Создать `core/kernel/tlos-claude-bridge/letta-client.js` — Node.js HTTP клиент к Letta REST API (только built-in fetch, без npm зависимостей)
- Мигрировать `index.js`: заменить `sessionLogs` in-memory объект на вызовы letta-client.js, с graceful fallback когда Letta недоступна

**Out of scope:**
- Использование Letta для LLM inference (Claude CLI продолжает обрабатывать все запросы)
- Letta authentication/API keys (локальный сервер, без auth)
- Multi-agent Letta routing
- Frontend изменения
- Rust kernel изменения

---

## REQ-001 — Letta server accessible

**Condition:** `letta server --port 8283` стартует без ошибок на Windows 11, Python 3.x.
Health endpoint отвечает.

**Verification gate (Coach):**
```
curl -s http://localhost:8283/v1/health
```
Expected: HTTP 200, JSON body без ошибок.

---

## REQ-002 — grid.ps1 Letta service entry

**Condition:** grid.ps1 `$Services` array содержит Letta entry:
- `name = "letta"`, `optional = $true`
- `cmd` запускает `letta server --port 8283`
- Pre-flight check: skip если `letta` не найден в PATH (тот же паттерн что у claude-bridge)
- Process корректно останавливается через `grid stop`
- `grid status` показывает состояние Letta

**Verification gate (Coach):**
- Читаю grid.ps1 — confirm `$Services` array включает letta entry
- Читаю `"stop"` block — confirm kill by port 8283
- Читаю `"status"` block — confirm health check добавлен

---

## REQ-003 — LettaClient module created

**Condition:** Файл `core/kernel/tlos-claude-bridge/letta-client.js` существует
и экспортирует ровно 6 async функций:

```
createAgent(sessionId, personaText, workspaceText) → { agentId } | null
getMemoryBlock(agentId, blockLabel)                → { value } | null
updateMemoryBlock(agentId, blockLabel, value)      → boolean
appendMessage(agentId, role, content)              → boolean
getConversationHistory(agentId)                    → [{ role, content }] | []
isAvailable()                                      → boolean  // кэш 30s
```

Constraints:
- Base URL: `http://localhost:8283/v1`
- Только Node.js built-in `fetch` (Node 18+) — никаких внешних npm зависимостей
- Все функции: catch ALL errors → return null/false/[] (никогда не throw)
- `isAvailable()`: кэш результата на 30s
- `appendMessage`: read → append → trim(last 8000 chars) → write
- Файл < 200 строк
- `package.json` bridge НЕ меняется

**Letta REST API endpoints:**
```
POST   /v1/agents                               → { id, ... }
GET    /v1/agents/{id}/memory                   → { blocks: [...] }
PATCH  /v1/agents/{id}/memory/blocks/{label}    body: { value: string }
GET    /v1/health
```

**Verification gate (Coach):**
- Файл существует, < 200 строк
- grep exports = 6 функций
- grep throw = 0 (нет неперехваченных)
- grep require (внешние) = 0
- `node -e "require('./letta-client').isAvailable().then(console.log)"` → true (если сервер запущен)

---

## REQ-004 — sessionLogs replaced in index.js

**Condition:** `const sessionLogs = {}` и все обращения к `sessionLogs[sessionId]`
удалены из `index.js`. Вся функциональность делегирована `letta-client.js` с
in-memory fallback когда Letta недоступна.

**Карта замен:**

| Старый код | Новый код |
|-----------|-----------|
| `const sessionLogs = {}` | УДАЛИТЬ |
| `getSessionLog(sessionId)` | УДАЛИТЬ (заменить на getOrCreateLettaSession + getFallbackLog) |
| `log.messages.push(r,c)` | `agentId ? await LettaClient.appendMessage(agentId,r,c) : fallback.messages.push(…)` |
| `log.summary = summary` | `agentId ? await LettaClient.updateMemoryBlock(agentId,'conversation_summary',summary) : fallback.summary=summary` |
| `log.summary` (read) | `agentId ? (await LettaClient.getMemoryBlock(agentId,'conversation_summary'))?.value : fallback.summary` |
| `log.needsSummarization` | вычислять inline: `(tokensUsed/contextTotal) > 0.8` |

**Новые структуры:**
```javascript
const LettaClient = require('./letta-client')
const lettaAgentIds = new Map()   // sessionId → lettaAgentId (in-process)
const memoryFallback = {}         // fallback когда Letta down

async function getOrCreateLettaSession(sessionId, persona, workspace) {
  if (lettaAgentIds.has(sessionId)) return lettaAgentIds.get(sessionId)
  if (!await LettaClient.isAvailable()) return null
  const result = await LettaClient.createAgent(sessionId, persona, workspace)
  if (result?.agentId) lettaAgentIds.set(sessionId, result.agentId)
  return result?.agentId || null
}

function getFallbackLog(sessionId) {
  if (!memoryFallback[sessionId]) memoryFallback[sessionId] = { messages: [], summary: null }
  return memoryFallback[sessionId]
}
```

**Verification gate (Coach):**
- `grep -n "sessionLogs" index.js` → 0 результатов
- `grep -n "getSessionLog" index.js` → 0 результатов
- `grep -n "require('./letta-client')" index.js` → 1 результат
- `grep -n "lettaAgentIds" index.js` → присутствует
- `grep -n "memoryFallback\|getFallbackLog" index.js` → присутствует

---

## REQ-005 — Memory blocks initialised from files

**Condition:** При создании нового Letta агента (`createAgent()`), bridge передаёт
контент `memory/persona.md` и `memory/workspace.md` как начальные значения блоков
`persona` и `workspace`.

**4 блока при создании агента:**
```json
{
  "memory_blocks": [
    { "label": "persona",              "value": "<content of persona.md>",   "limit": 5000  },
    { "label": "workspace",            "value": "<content of workspace.md>", "limit": 5000  },
    { "label": "conversation_summary", "value": "",                          "limit": 10000 },
    { "label": "conversation_history", "value": "",                          "limit": 50000 }
  ]
}
```

**Verification gate (Coach):**
- После создания новой сессии: `GET /v1/agents/{id}/memory`
- Confirm: `persona` block value = content of persona.md
- Confirm: `workspace` block value = content of workspace.md

---

## REQ-006 — Fallback is silent and complete

**Condition:** Когда Letta недоступна — bridge падает на in-memory поведение.
Fallback:
- НЕ крашится и НЕ throw
- НЕ логирует ошибки на каждое сообщение (только при старте/availability check)
- Использует локальный объект `{ messages: [], summary: null }` идентичный старому `sessionLogs[sessionId]`

**Verification gate (Coach):**
1. Остановить letta server
2. Перезапустить bridge (`node index.js`)
3. Отправить 3 chat сообщения через NATS `agent:chat`
4. Все 3 получают `agent:token` ответы с `done: true`
5. Bridge log показывает ровно ОДНУ строку "Letta unavailable" (не на каждое сообщение)

---

## Definition of Done

- [ ] REQ-001 через REQ-006: все PASS (верифицированы Coach, не Player)
- [ ] Нет регрессий в claude-bridge core flow (session resume, streaming, compaction работают)
- [ ] `letta-client.js` < 200 строк
- [ ] `index.js` net change: удалено строк >= добавлено строк
- [ ] `.g3/sessions/review-turn-3.md` содержит `IMPLEMENTATION_APPROVED`

---

## Rollback

1. В `index.js`: удалить `require('./letta-client')`, `lettaAgentIds`, `getOrCreateLettaSession`, `memoryFallback`/`getFallbackLog`
2. Восстановить `const sessionLogs = {}` и `getSessionLog()` (из git)
3. В `grid.ps1`: удалить letta entry из `$Services` (или оставить — optional, просто скипнется)
4. `letta-client.js` можно оставить — активируется только через `require`
