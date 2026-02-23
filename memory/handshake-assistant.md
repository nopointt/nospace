# HANDSHAKE-ASSISTANT — 2026-02-23 11:30
> Synced from nospace workspace for external AI assistant (Perplexity/Comet).
> Repo: https://github.com/nopointt/nospace (private)
> Entry point: /CLAUDE.md → /rules/global-constitution.md

---

## Current Focus

Завершена инфраструктура workspace (git, slash commands, двусторонняя синхронизация с Comet). Написано приветственное сообщение от CTO к Comet — ищем канал для асинхронной коммуникации между ассистентами.

---

## Active Projects

| Project | Status | Last Action |
|---|---|---|
| tLOS | scaffolding — пауза | OWASP security sprint завершён, ждём следующего milestone |
| harkly | активный | Desktop мигрирован, investor-pitch.md создан, ищем инвестора $3-5K |

---

## What Was Done Recently

- Написано приветствие от Assistant Agent (CTO) для Comet — ждём канал связи
- Создана `/sync` команда с двусторонней синхронизацией (git pull --rebase + push)
- Задокументированы capabilities Comet в `docs/ecosystem-noadmin/explanation/comet-assistant-capabilities.md`
- `memory/` директория добавлена в git (репо стал приватным) — context sync работает
- Мигрирован desktop код harkly (28 файлов) в `development/harkly/src/desktop/`
- Исправлен `package.json` desktop (добавлены Electron + React + Vite deps)
- Создан `investor-pitch.md`: 3 UX/UI сценария (SaaS / API / White-Label), $3-5K proposal
- Настроен полный git workflow: GCM, pre-commit + commit-msg hooks, .gitmessage, .gitattributes
- Созданы `/startgsession`, `/closegsession`, `/sync` глобальные slash commands

---

## Open Tasks

| Task | Priority | Blocker |
|---|---|---|
| Придумать канал коммуникации Claude ↔ Comet | H | nopoint решение |
| harkly: npm install + тестовый запуск скрапера | H | — |
| harkly: уточнить investor pitch под конкретного инвестора | H | nopoint |
| harkly: API модуль (nopoint/harkly/main → nospace) | M | nopoint приоритет |
| OPS-TODO-01: зашифровать cloudflare/neon .env через age | H | nopoint action |
| tLOS: следующий milestone | M | nopoint direction |

---

## Key Files Changed

- `memory/handshake-assistant.md` — этот файл (обновлён)
- `~/.claude/commands/sync.md` — добавлен git pull --rebase (STEP 2)
- `docs/ecosystem-noadmin/explanation/comet-assistant-capabilities.md` — новый, capabilities Comet

---

## Architecture Snapshot

**Workspace:** /nospace — AI-first multi-agent workspace
**Tech stack:** TypeScript, Rust, Electron, React, Supabase, BullMQ
**Active agents:** Assistant/CTO (Claude) + nopoint (human CEO) + Comet (Perplexity, via GitHub)
**Regulations:** /rules/regulations/ (14 файлов)
**Constitution:** /rules/global-constitution.md

**harkly:** Платформа сбора и AI-анализа отзывов
- Desktop: /development/harkly/src/desktop/ (Electron + Puppeteer + React + Vite)
- Парсеры: Отзовик + Irecommend (работают), WB/Ozon/YM (план)
- RAG pipeline: chunker + cleaner + exporter (готов)
- API: /development/harkly/src/api/ (заглушка, источник: nopoint/harkly/main)
- Investor pitch: /docs/harkly/explanation/investor-pitch.md

**tLOS:** Децентрализованная ОС (Rust/WASM + Cloudflare Workers + Arweave)
- Pipeline: pull-based GitOps через манифесты CID
- Статус: scaffolding, OWASP security complete, следующий milestone не определён

**Безопасность (OWASP LLM Top 10):**
- JWT SIT, output sanitization, cargo audit, memory integrity hashes
- Аудит: /docs/ecosystem-noadmin/explanation/owasp-llm-security-audit.md

---

## For External Assistant (Comet)

Чтобы эффективно помогать с этим workspace:
1. Читай `/CLAUDE.md` первым (навигация по ролям)
2. Читай `/memory/current-context-global.md` (состояние workspace)
3. Читай `/rules/global-constitution.md` (иерархия правил)
4. Читай `/development/harkly/rules/harkly-constitution.md` для контекста harkly
5. Свои изменения коммить напрямую в repo — Claude заберёт через `/sync`
6. Для асинхронных задач — создавай Issues с меткой `comet` или пиши в `memory/`
7. Этот файл обновлён в 2026-02-23 11:30 — проверяй git log для свежих изменений
