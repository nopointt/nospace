# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-08 by Assistant

---

## Где мы сейчас

**claude-bridge ПОЧИНЕН** (2026-03-08). Фиксы: `shell: true` вместо `cmd.exe /c` (двойное квотирование пути), `stdio: ['ignore','pipe','pipe']` (закрыт stdin), `--verbose` флаг (обязателен для stream-json), `delete env.CLAUDE_CODE + CLAUDE_CODE_ENTRYPOINT` (nested session bypass), `resultSeen` флаг (убирает дублирование ответов). End-to-end тест через NATS подтверждён.

**Dispatcher починен** — wasm загрузка стала optional (graceful skip если math_worker.wasm не собран).

**workspace-v1 создан** — sessions-map.md: 3 трека (A: Omnibar v2, B: BB Floors, C: Infra). Следующий шаг — nopoint запускает Opus с промптом, после этого Sonnet пишет tech spec.

---

## Следующий приоритет

1. **A-1 (nopoint)** — запустить Opus с промптом из `branches/omnibar/opus-prompt.md`, сохранить результат в `branches/omnibar/opus-output.md`
2. **B-1 (Regular)** — прочитать `App.tsx` и `src/types/frame.ts`: понять canvas state architecture перед G3 B-2 (BB Floors). Можно делать сейчас.
3. **C-1 (G3)** — починить `onLocalCommand('mcb')` в App.tsx. Быстро, не блокирует. Можно делать сейчас.

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| omnibar | omnibar-v2: production-ready Claude chat (epic-eidolon-v1) | OPEN — bridge работает, ждём Opus product spec |
| workspace-v1 | Организация рабочего пространства + сессионная карта | OPEN — sessions-map.md создан |
| mcb-v1 | Marketing Command Board для Артёма | BLOCKED — ждём API доступы от Артёма |
| node-v1 | Nostr patch pipeline | SHIPPED — ждём Артёма |
| website-v1 | THELOS marketing site | OPEN |

---

## Архитектура AI pipeline (актуальная)

```
Omnibar → agent:chat { provider: 'claude'|'nim', model, sessionId }
  ├── provider='claude' → tlos-claude-bridge (Node.js, core/kernel/tlos-claude-bridge/)
  │     └── spawn(CLAUDE_EXE, ['-p', content, '--output-format', 'stream-json',
  │                            '--verbose', '--include-partial-messages',
  │                            '--model', model, '--resume', claudeSessionId?],
  │                           { shell: true, stdio: ['ignore','pipe','pipe'],
  │                             env: {…без CLAUDECODE/CLAUDE_CODE/CLAUDE_CODE_ENTRYPOINT} })
  └── provider='nim'   → tlos-agent-bridge (Rust)
        └── NVIDIA NIM HTTP SSE
```

Auth: bridge читает `~/.claude.json` → `agent:auth:status` → Omnibar Connected/Sign in → `agent:auth:login` → `cmd /k claude login`

---

## Критические данные

| Ключ | Значение |
|---|---|
| nopoint Nostr npub | `npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw` |
| NIM key | `~/.tlos/nim-key` — временный (12ч), требует ручного обновления |
| NIM model | `meta/llama-3.1-8b-instruct` |
| Claude default model | `claude-sonnet-4-6` |
| Claude bridge path | `core/kernel/tlos-claude-bridge/index.js` |
| tlos-cyan | `#06B6D4` (Tailwind cyan-500) |
| tlos-primary | `#f2b90d` |
| BB-framework | `docs/tLOS/BB-framework/BB-00-Manifest-v2.md` |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Omnibar | development/tLOS/core/shell/frontend/src/components/Omnibar.tsx |
| Grid launcher | development/tLOS/core/grid.ps1 |
| NIM bridge | development/tLOS/core/kernel/tlos-agent-bridge/src/main.rs |
| Opus prompt | development/tLOS/branches/omnibar/opus-prompt.md |
| Sessions map | development/tLOS/branches/workspace-v1/sessions-map.md |
| BB-framework | docs/tLOS/BB-framework/BB-00-Manifest-v2.md |
| BB-51 tLOS интеграция | docs/tLOS/BB-framework/BB-51.md |

---

## BB-framework — структура уровней

9 уровней (здание + поле):

```
ФАСАД      — внешняя кибербезопасность (мета)
СТЕНЫ      — внутренний мониторинг (мета)
КАРКАС     — регуляция системы (мета)
  КРЫША      — «Что могло бы быть?»
  СТРАТЕГИЯ  — «Куда и Зачем?»
  ТАКТИКА    — «Что и Когда?»
  ОПЕРАЦИЯ   — «Как и Кто?»
  ПОДВАЛ     — «На чём работает?»
  ФУНДАМЕНТ  — «Что может нас опрокинуть?»
```

tLOS реализует Z-ось как этажи: 6 floors (Фундамент → Крыша), каждый floor = отдельный canvas state в localStorage (`tlos-canvas-z-{n}`). Навигация: Ctrl+Up/Down.

---

## Открытые вопросы

- [ ] Session persistence для claude-bridge (disk) — `~/.tlos/sessions.json`
- [ ] NIM key rotation: механизм автообновления
- [ ] MCB омнибар: команда `mcb` — починить (C-1)
- [ ] WebSocket → Tauri IPC (ADR-003 Phase 2, production milestone)
- [ ] Артём: когда пришлёт npub и доступы к API?
- [ ] PatchDialog.tsx:19 — kernel.subscribe() cleanup не подтверждён (LOW risk)
