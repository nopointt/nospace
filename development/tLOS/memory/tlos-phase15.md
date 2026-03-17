---
# tlos-phase15.md — Phase 15: Content Router
> Layer: L3 | Frequency: fast | Epic: phase-15
> Created: 2026-03-17
> Last updated: 2026-03-17 (auto-scratch fix)
> Promoted from: Phase 13 Track 4 (research complete, design complete)
---

## Epic Overview

**Goal:** Automatic context window management — anchor files stable, operational memory clean, long-term memory populated — without manual `/compact`.
**Status:** 🔶 IN PROGRESS — design phase
**Entry criteria:** Phase 13 complete (or parallel)
**Exit criteria:** MEMORY_PRESSURE signal works · two checkpoint types implemented · summarizer subagent tested · hooks live · protocols/ migrated

---

## Memory Model — L0–L5

### Frozen (anchor — загружается каждый запрос)

| Layer | File | Content |
|---|---|---|
| L0 | `~/.claude/CLAUDE.md` | Глобальные правила + роуты в `protocols/` (только он авто-загружается) |
| L1 | `~/.claude/memory/MEMORY.md` | Память + роуты в memory файлы (общий для всех агентов) |

### Slow (session — загружаются при старте сессии)

| Layer | File | Content |
|---|---|---|
| L2 | `memory/{project}-roadmap.md` | Фазы + эпики (thelos, harkly — отдельные файлы) |
| L3 | `memory/{epic}-{project}.md` | Контекст эпика (много параллельных, политика ниже) |

### Ephemeral (operational — живут внутри сессии)

| Layer | File | Content |
|---|---|---|
| L4 | `memory/scratches/{sid}+N-scratch.md` | Manual scratch — структурированный лог, пишет Eidolon |
| L5 | `memory/auto-scratch.md` | Auto scratch — шум OK, пишет PostToolUse hook |

---

## Checkpoint Protocol

### Срочный checkpoint (`/Tcheckpoint --fast`)

```
Eidolon → Write L4 manual scratch  ←  ТОЛЬКО запись, 0 чтений
L4 + L5 остаются в operational memory
```

При `/continue`: L4 обогащается L5 → идёт в long-term.

### Обычный checkpoint (`/Tcheckpoint`)

```
Eidolon читает L5 auto-scratch + текущий контекст + ответы nopoint
→ пишет структурированный L4 manual scratch
→ L4 → chronicle (long-term)
→ L5 очищается
```

---

## MEMORY_PRESSURE — Eidolon Summarizer

### Сигнал

`quota-guard.ts` (UserPromptSubmit hook) читает JSONL файл сессии → считает размер → инжектирует:

```
<!-- MEMORY_PRESSURE: ~43K tokens in messages -->
```

### Реакция Eidolon

Eidolon видит сигнал → решает сам (можно игнорировать если задача на финише) → запускает Haiku subagent:

```
промпт от Eidolon:
  "вот что происходит: [контекст задачи]
   вот что важно сохранить: [решения, файлы, open questions]
   вот что можно отбросить: [debugging tangents, trivial reads]"
+ L5 auto-scratch как content

→ subagent пишет ~/.tlos/summaries/YYYYMMDD-HHmm-summary.md
→ Eidolon рекомендует /compact или переход в новую сессию
```

### Почему subagent, не Stop хук

Stop хук слепой — не знает что важно. Eidolon-промпт = интеллектуальная дистилляция контекста. Haiku получает точное задание, не угадывает.

### При старте новой сессии

`mem-session-start.ts` (SessionStart hook) читает последние 3 summary → `additionalContext`. Messages начинаются чисто, знание сохранено.

---

## Агентная топология

**Вариант B — пиры.** nopoint запускает всех трёх в параллельных терминалах.

```
nopoint
  ├── Axis    (Claude Code — primary orchestrator, код/оркестрация)
  ├── Logos   (Claude Code — data/DB: PostgreSQL, Qdrant, Letta)
  └── Praxis  (Claude Code — фон/задачи, управляет Eidolon{hash})
        └── Eidolon{hash} × N  (эфемерные субагенты)
```

### Eidolon Registry

Файл: `~/.tlos/eidolons.json` — простой реестр активных Eidolon.

```json
{
  "active": [
    {
      "id": "eidolon3a7f2c1b",
      "launched_by": "praxis",
      "task": "summarize auto-scratch",
      "started_at": "2026-03-17T10:23:00Z"
    }
  ]
}
```

**Правило:** если `active` пуст → гарантированно нет висящих Eidolon, нет утечки квоты.
Хэш: random 8 hex символов при запуске. Прямо от Claude Code — никакого NATS/HTTP посредника.

### Параллельные L3 — политика по агентам

L3 файлы организованы по протоколам агентов, не по проектам:

| Агент | Протокол | Что грузит |
|---|---|---|
| **Axis** | `~/.claude/protocols/axis.md` | активные L3 для Axis (явный список) |
| **Logos** | `~/.claude/protocols/logos.md` | активные L3 для Logos |
| **Praxis** | `~/.claude/protocols/praxis.md` | активные L3 для Praxis |

`startTsession` читает протокол текущего агента → загружает только нужные L3.

---

## Track 0 — Orch Project Binding Fix

| Task | Status | Notes |
|---|---|---|
| Переработать `/startaxis` — убрать хардкод tLOS, читать `axis-active` → роутить L1/L3 по `{project}` | [x] | Сделано 2026-03-17 · `[Axis]` |
| Переработать `/continueaxis` — то же что startaxis | [x] | Сделано 2026-03-17 · `[Axis]` |
| Переработать `/startlogos` — убрать хардкод tLOS, читать `logos-active` → роутить по `{project}` | [x] | L2 + L3 из L1 Navigation · `[Axis · 2026-03-17]` |
| Переработать `/continuelogos` — то же | [x] | L2 + L3 из L1 Navigation · `[Axis · 2026-03-17]` |
| Переработать `/closelogos` — писать `{project}` в logos-active при закрытии | [x] | L3 из L1 Navigation · `[Axis · 2026-03-17]` |
| Переработать `/startpraxis` — убрать хардкод tLOS, читать `praxis-active` → роутить по `{project}` | [x] | L2 + L3 из L1 Navigation · `[Axis · 2026-03-17]` |
| Переработать `/continuepraxis` — то же | [x] | L2 + L3 из L1 Navigation · `[Axis · 2026-03-17]` |
| Переработать `/closepraxis` — писать `{project}` в praxis-active при закрытии | [x] | `rm` заменён на `echo {project}|...`, git commit `{project}/praxis` · `[Axis · 2026-03-17]` |
| Переработать `/closeaxis` — писать `{project}` в axis-active при закрытии | [x] | Сделано 2026-03-17 · [Axis] |

### Audit 2026-03-17 — полный скан хардкодов `tlos`/`harkly` в логике скиллов

| Скилл | Статус | Баги найдены и исправлены |
|---|---|---|
| `startaxis.md` | ЧИСТ | — |
| `continueaxis.md` | ЧИСТ | — |
| `closeaxis.md` | ЭТАЛОН | — |
| `startlogos.md` | ИСПРАВЛЕН | `echo "tlos|..."` → `echo "{project}|..."` в STEP 5 |
| `continuelogos.md` | ИСПРАВЛЕН | `echo "tlos|..."` → `echo "{project}|..."` в STEP 4 |
| `closelogos.md` | ИСПРАВЛЕН | `rm logos-active` → `echo "{project}|..."` (STEP 6); `chore(tlos/logos):` → `chore({project}/logos):` (STEP 7) |
| `startpraxis.md` | ИСПРАВЛЕН | `echo "tlos|..."` → `echo "{project}|..."` в STEP 6 |
| `continuepraxis.md` | ИСПРАВЛЕН | `echo "tlos|..."` → `echo "{project}|..."` в STEP 5 |
| `closepraxis.md` | ИСПРАВЛЕН | `rm praxis-active` → `echo "{project}|..."` (STEP 7); `chore(tlos/praxis):` → `chore({project}/praxis):` (STEP 8) |

Итого: 6 файлов исправлено, 2 чисты, 1 эталон. Все правки — только в командах bash и echo, текст описаний не тронут. `[Axis · 2026-03-17]`

### Дополнение — L1/L2 routing fix (logos/praxis skills)

Все 6 файлов logos/praxis также исправлены на полный project-routing по L1/L2 (не только echo команды). `[Axis · 2026-03-17]`

| Скилл | Что исправлено |
|---|---|
| `startlogos.md` | STEP 2: хардкодные пути tLOS заменены на routing table + `{project}` lookup; STEP 3: L3 routing по проекту; STEP 5: `echo "tlos|..."` → `echo "{project}|..."` |
| `continuelogos.md` | STEP 1: добавлена routing table; STEP 2: L1/L2 пути заменены на `{project}`-routing; L3 routing по проекту; STEP 4: `echo "tlos|..."` → `echo "{project}|..."` |
| `closelogos.md` | STEP 3: chronicle queue path — routing table tlos/harkly; STEP 4: L3 lookup через L1 Navigation по проекту; заголовок "tLOS · Logos" → "[Project] · Logos" |
| `startpraxis.md` | STEP 3: хардкодные пути tLOS заменены на routing table + `{project}` lookup; STEP 4: L3 routing по проекту; STEP 6: `echo "tlos|..."` → `echo "{project}|..."` |
| `continuepraxis.md` | STEP 1: добавлена routing table; STEP 3: L1/L2 пути заменены на `{project}`-routing; L3 routing по проекту; STEP 5: `echo "tlos|..."` → `echo "{project}|..."` |
| `closepraxis.md` | STEP 4: chronicle queue path — routing table tlos/harkly; STEP 5: L3 lookup через L1 Navigation по проекту; заголовок "tLOS · Praxis" → "[Project] · Praxis" |

FRESH behavior изменён: был `tlos` по умолчанию → теперь спрашивает nopoint (Logos и Praxis — multi-project агенты, как Axis).

---

## Track 1 — Layer Model Migration

| Task | Status | Notes |
|---|---|---|
| Переименовать `~/.claude/rules/` → `~/.claude/protocols/` | [ ] | Переместить все files |
| Обновить CLAUDE.md — убрать авто-импорт rules/*.md, добавить роуты | [ ] | L0 грузит только себя |
| Обновить MEMORY.md — новая нумерация L0-L5, убрать старые L1-L4 ссылки | [ ] | |
| Создать `protocols/eidolon.md` — протокол + список активных L3 | [ ] | |
| Создать `protocols/axis.md` — протокол Axis | [ ] | |
| Обновить `/startTsession` skill — читать протокол агента для L3 | [ ] | |

---

## Track 2 — Checkpoint Protocol

| Task | Status | Notes |
|---|---|---|
| Обновить `/Tcheckpoint` skill — добавить `--fast` флаг | [ ] | urgent vs normal |
| Обновить `/closeTsession` skill — обычный checkpoint + отправка в chronicle | [ ] | |
| Обновить `/TafterCompact` skill — загрузка last summary если есть | [ ] | |

---

## Track 3 — Hooks

| Task | Status | Notes |
|---|---|---|
| Написать `quota-guard.ts` | [x] | UserPromptSubmit → last assistant input_tokens → инжектирует MEMORY_PRESSURE · `[Axis · 2026-03-17]` |
| Написать `mem-session-start.ts` | [x] | SessionStart → читает 3 summary → additionalContext · `[Axis · 2026-03-17]` |
| Обновить `~/.claude/settings.json` — добавить оба хука | [x] | `[Axis · 2026-03-17]` |

---

## Track 4 — Eidolon Summarizer Subagent

| Task | Status | Notes |
|---|---|---|
| Написать шаблон промпта для саммаризатора | [x] | `protocols/eidolon.md` создан — полный протокол + шаблон · `[Axis · 2026-03-17]` |
| Создать `~/.tlos/summaries/` директорию | [x] | `[Axis · 2026-03-17]` |
| Протестировать: запуск subagent → summary → session start загружает | [x] | Тест пройден: summary файл создан → mem-session-start инжектирует в additionalContext · `[Axis · 2026-03-17]` |

---

## Carried from Phase 13 Track 4 (research complete)

| Research | Результат |
|---|---|
| JSONL structure | tool_results only in Messages, нет "loaded docs" слоя |
| Content taxonomy | Read→DROP, assistant text→KEEP, tool_result→DROP first |
| Content Router design | lossless routing settled — Eidolon пишет, Haiku форматирует |

---

## Blockers

— нет активных блокеров —

## Open Questions

- [ ] Axis — какой агент тип? (general-purpose? отдельный .md в agents/?) Полное описание роли.
- [ ] L3 параллельная загрузка — максимум сколько L3 одновременно? Бюджет токенов.
- [x] quota-guard threshold — 40K, настраиваемый через `~/.tlos/quota-guard.json`
- [ ] summaries TTL — сколько держать? Авто-архив в chronicle на startaxis?
- [x] Haiku launch mechanism — Agent tool с model=haiku работает (28K токенов, ~10с). `claude --print` в Bash tool = висит (nested session). `[Axis · 2026-03-17]`
- [ ] SessionStart hook — проверить поддержку после перезапуска VS Code.
