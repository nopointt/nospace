# MULTI-AGENT ECOSYSTEM MAP
> Архитектура агентной системы /nospace (tLOS & Harkly).
> Читать перед любым взаимодействием между агентами.
> Tags: [ecosystem, agents, architecture, topology, communication]

---

## Топология коммуникации

```
nopoint (Creator)
    │
    ▼
Assistant Agent ◄──────────────────────────────────────────────────────────┐
    │                                                                       │
    ├──► Reviewer Agent  (schedule-triggered · memory consolidation only)  │
    │                                                                       │
    ├──► CTO Agent ◄──────────────────────────────────► QA Lead ◄── DevOps Lead ◄── SRE Lead
    │        │                                              │
    │        ├──► Tech Lead ◄──────────────────────────────┘
    │        │        │
    │        │        └──► [Senior Coder Swarm] (isolated branches) ──► (MCP SERVER CALL)
    │        │
    │        └──► [QA Swarm / Release Swarm / Monitor Swarm]
    │
    └──── /private_knowledge (keys, secrets — выдаются Lead-агентам по запросу)
```

**Вертикальная изоляция:** Агенты Роя не видят соседей. Рой ↔ Lead только.  
**Горизонтальная синхронизация:** Leads ↔ Assistant ↔ CTO ↔ nopoint.  
**Context Economy:** Передача только через сжатые артефакты (spec, commit, report).

### Инфраструктура Инструментов (MCP & Sandboxing)

В 2026 году агенты **НЕ ИМЕЮТ ПРЯМОГО ДОСТУПА** к выполнению системных команд или интернету. Все инструменты проксируются через `/tools/`:
1. **Model Context Protocol (MCP)**: Агент отправляет JSON-RPC запрос серверу (`/tools/mcp-servers/cargo-mcp-rust`).
2. **Sandboxing**: Сервер не запускает команду в хост-ОС. Он загружает код агента в изолированный контейнер (`/tools/sandboxes/rust-compiler-env`) с отключенной сетью (seccomp + Docker).
3. **Auth Gates**: Если запрос деструктивный (деплой, удаление БД), запрос блокируется процессом `approval-router` до подтверждения CTO или CEO (nopoint).

---

## Уровни

| Уровень | Агент | Роль | Память |
|---|---|---|---|
| 0 | nopoint (Creator) | Стратегическое управление, Human-in-the-loop | — |
| 1 | Assistant Agent | Глобальный мост, хранитель памяти и ключей | `/memory/` (global) |
| 1.5 | Reviewer Agent | Memory Consolidator (schedule-triggered, no code) | `/memory/logs/system/consolidation-*.md` |
| 2a | CTO Agent | Архитектор систем, декомпозиция эпиков | `/development/<p>/rules/`, `/memory/` |
| 2b | Tech Lead | Ревьюер веток, компрессор контекста | `/development/<p>/branches/` |
| 2c | Senior Coder Swarm | Генерация кода по спецификациям (tLOS) | `/branches/<b>/` (изолировано) |
| 2c | Frontend Engineer Swarm | Генерация UI-кода (Harkly) · scaffolded with harkly | `/branches/<b>/` (изолировано) |
| 2d | **Gropius** (G3 Player) | Frontend implementation — pixel-perfect SolidJS/Tailwind | `/agents/gropius/` · постоянный |
| 2d | **Itten** (G3 Player) | Web design — visual composition, spacing, typography | `/agents/itten/` · постоянный |
| 2e | **Breuer** (G3 Coach) | Frontend QA — visual regression, code quality, bug patterns | `/agents/breuer/` · постоянный |
| 2e | **Albers** (G3 Coach) | Design audit — token compliance, Bauhaus, accessibility | `/agents/albers/` · постоянный |
| 2d | **Mies** (G3 Player) | Backend — Hono/CF Workers/D1, pipeline, async | `/agents/mies/` · постоянный |
| 2e | **Schlemmer** (G3 Coach) | Backend QA — API testing, pipeline verification, data integrity | `/agents/schlemmer/` · постоянный |
| 3c | **Moholy** (QA Engineer) | E2E testing, Playwright, CJM coverage, test→fix→test loops | `/agents/moholy/` · постоянный |
| 3a | QA Lead | Стратегия тестирования, релиз-кандидаты | `/development/<p>/` |
| 3b | QA Swarm | Manual / Auto / Breakers / Hackers | изолировано |
| 4a | DevOps Lead | Web3 Pipeline, деплой | `/production/<p>/` |
| 4b | Release Swarm | Build / On-Chain / DStorage | изолировано |
| 5a | SRE Lead | Стабильность продакшена, телеметрия | `/memory/logs/system/` |
| 5b | Monitor Swarm | P2P / On-Chain / Native Profilers | изолировано |

---

## Правила коммуникации

### Vertical Isolation (Вертикальная изоляция)
- Swarm-агенты НИКОГДА не общаются между собой горизонтально.
- Swarm получает только `spec.md`, возвращает только `commit-summary.md` / `log-raw.md`.
- Swarm-агент NOT ALLOWED читать память соседних веток.

### Horizontal Sync (Горизонтальная синхронизация)
- Lead-агенты МОГУТ общаться друг с другом через Assistant.
- Прямые сообщения между Leads — только для архитектурных блокеров.
- Все решения, принятые горизонтально, MUST быть запротоколированы в `/memory/logs/agents/`.

### Context Economy
- НИКОГДА не передавать `log-raw.md` или `scratchpad.md` между уровнями.
- Передавать только: `spec.md` (вниз), `commit-summary.md` (вверх), `bug-report.md` (обратная связь).
- Размер артефакта-хэндоффа MUST быть минимальным — только решения, не мысли.

---

## Жизненный цикл задачи (DAG Flow)

> Строгий граф. Переходы только по стрелкам. Свобода — только внутри ветки (scratchpad).

```
nopoint ──[Epic]──► Assistant ──► CTO
                                    │
                              [spec.md + Verification Gates]
                                    │
                                    ▼
                               Tech Lead ──────────────────────────────────┐
                                    │                                       │
                              [assign branch]                         [REJECT + bug-report]
                                    │                                       │
                                    ▼                                       │
                             Swarm (branch)                                │
                          [OTAA cycle + Gates]                             │
                                    │                                       │
                          [commit-summary.md]                              │
                          [Confidence Score]                               │
                                    │                                       │
                                    ▼                                       │
                               Tech Lead ◄──────────────────────────────────┘
                              [code review]
                                    │
                        ┌──────────┴──────────┐
                    APPROVE                REJECT ──► Swarm (fix)
                        │
                        ▼
                     QA Lead
                  [test strategy]
                   [QA Swarm]
                        │
                ┌───────┴───────┐
              PASS           FAIL ──► Tech Lead + bug-report
                │
                ▼
          DevOps Lead ──► Assistant [request deploy token]
           [Web3 Pipeline]
                │
                ▼
            SRE Lead
          [monitoring + telemetry]
                │
                ▼
        episodic-context [release entry]
```

**MoE Model Routing:** QA Swarm и Monitor Swarm используют Flash-tier модели (одна функция → один дешёвый агент).

---

## Эскалация и блокеры

| Сценарий | Кто получает | Как |
|---|---|---|
| Swarm не может выполнить spec | Tech Lead | Возврат с `blocker.md` |
| Tech Lead не может решить архитектурный вопрос | CTO | Синхронный вызов |
| QA нашел критический баг | Tech Lead → CTO → nopoint (если P0) | Bug report |
| SRE фиксирует критический сбой продакшена | CTO + nopoint | Запись в `current-context-global.md` |
| Нужны ключи/секреты | Assistant | Запрос с обоснованием |
