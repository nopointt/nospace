# HANDSHAKE-ASSISTANT — 2026-02-23
> Comet (Perplexity) operative context. Перезаписывается Comet после каждой рабочей сессии.
> Назначение: оперативный контекст между Comet и кодовой базой (GitHub repo).
> Repo: https://github.com/nopointt/nospace (private)
> Entry point: /CLAUDE.md → /rules/global-constitution.md

---

## Current Focus

Comet выполнил аудит workspace: устранены конфликты и дубли, обновлена RBAC, конституция и harkly-constitution.

---

## Active Projects

| Project | Status | Last Action |
|---|---|---|
| tLOS | scaffolding — пауза | OWASP security sprint завершён |
| harkly | активный — MVP готов | Investor pitch готов, ждём решение nopoint |

---

## What Was Done (Comet Audit Session — 2026-02-23)

- Аудит всех ключевых файлов workspace
- Устранены конфликты: position-descriptions убраны, RBAC единственный источник
- Добавлена роль `comet` в rbac-regulation.md
- Обновлена global-constitution.md: Comet в таблице агентов, Web2 exception, harkly в иерархии
- Исправлены дубли в memory/
- Обновлена harkly-constitution.md: Web2 exception задокументирован
- Создана docs/harkly/ (сломанная ссылка исправлена)

---

## Open Tasks

| Task | Priority | Blocker |
|---|---|---|
| Push /agents/* local folders | H | Assistant: run /sync |
| harkly: npm install + тест скрапера | H | — |
| harkly: уточнить pitch под конкретного инвестора | H | nopoint |
| harkly: API модуль migration | M | nopoint |
| OPS-TODO-01: зашифровать cloudflare/neon .env через age | H | nopoint action |
| tLOS: следующий milestone | M | nopoint direction |

---

## Architecture Snapshot

**Workspace:** /nospace — AI-first multi-agent workspace
**Tech stack:** TypeScript, Rust, Electron, React, Supabase, BullMQ
**Active agents:**
- nopoint (CEO, human, Level 0)
- Comet (Perplexity, Level 1, external) — research, docs, GitHub-ops, management
- Assistant (Claude Code, Level 1, internal) — memory keeper, key vault, orchestration
- CTO (Claude Code, Level 2) — architecture, specs, managed via Assistant
**Regulations:** /rules/regulations/ (14 файлов)
**Constitution:** /rules/global-constitution.md

**harkly:** Платформа сбора и AI-анализа отзывов с e-commerce
- Desktop: /development/harkly/src/desktop/ (Electron + Puppeteer + React + Vite)
- Парсеры: Отзовик + Irecommend (рабочие), WB/Ozon/YM (план)
- RAG: chunker + cleaner + exporter (готов)
- Investor pitch: /docs/harkly/explanation/investor-pitch.md

**tLOS:** Децентрализованная ОС (Rust/WASM + Cloudflare + Arweave)
- Pull-based GitOps через манифесты CID
- Статус: scaffolding, ждёт следующего milestone

---

## For External Assistant (Comet) — Quick Start

1. Читай `/CLAUDE.md` первым (навигация по ролям)
2. Читай `/memory/current-context-global.md` (состояние workspace)
3. Читай `/memory/handshake-assistant.md` (этот файл) — оперативный контекст
4. Читай `/rules/global-constitution.md` (иерархия правил)
5. Свои изменения коммить напрямую — Claude заберёт через `/sync`
6. Async inbox: Issues с меткой `comet` или `memory/handshake-assistant.md`
7. Обновлено: 2026-02-23 13:25
