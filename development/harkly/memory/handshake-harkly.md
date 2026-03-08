# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-08 by Assistant (session 9)

---

## Где мы сейчас

**Стадия 3.5 IN PROGRESS — Canvas workspace redesign + Floor architecture.**
- Canvas-based workspace активен на `/app/[workspaceId]` (маршрут `/app/main`)
- ChatPanel, FloorBadge, CanvasToolbar, Omnibar — подключены и работают
- Дизайн: Inter font, gray-100 borders, Tailwind scale без хардкода
- Omnibar: Cmd+K → открывается → вводишь вопрос → FramingStudio

## Продуктовая архитектура (важно!)

**Floor Architecture (6 этажей):**
- Floor 0 — Scratchpad: глобальный холст, Omnibar, PICOT Framing Studio
- Floor 1 — Sources: коннекторы (Twitter, Reddit, upload), API keys
- Floor 2 — Raw: скрининг корпуса (Include/Exclude/Maybe)
- Floor 3 — Insights: NLP граф сущностей, тематики, цитаты
- Floor 4 — Artifacts: Empathy Map, Fact Pack, Journey Map, Evidence Map
- Floor 5 — Stakeholders: Presentation, Brief, Report

**5 методологических школ Harkly автоматизирует:**
- Academic/Cochrane–PRISMA: PICO-фрейм, скрининг, PRISMA-flow
- IDEO/Design Thinking: Empathy Map, Customer Journey, Personas
- McKinsey: Issue Tree, Fact Pack, Triangulation
- MIT AI Lab: Research Notebook, Weak Signals, граф связей
- Consumer Intelligence: агрегация OSINT-источников

**Уникальная ниша:** все существующие инструменты заточены под свои панели/опросы. Harkly = первая платформа гоняющая открытые OSINT-источники через полный multi-методологический pipeline.

---

## Следующий приоритет

1. **Стадия 3.5 продолжается** — floor navigation (кликабельный FloorBadge), per-floor canvas content
2. **Стадия 5 Backend** — после завершения 3.5
3. **SQL миграции E4 + E6** — не применены в Supabase (блокирует backend)

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Текущее состояние | `harkly/memory/current-context-harkly.md` |
| Roadmap + все стадии | `.claude/plans/eager-juggling-flame.md` |
| Figma-auditor агент | `~/.claude/agents/figma-design-auditor.md` |
| Auth helper | `harkly-saas/src/lib/api-auth.ts` |
| Prisma schema | `harkly-saas/prisma/schema.prisma` |

---

## Открытые вопросы

- [ ] Стадия 3.5: URL Figma файла (проект harkly, desktop 1-5)?
- [ ] Figma write: пока невозможно через REST API — рассмотреть Figma Plugin если понадобится
- [ ] Test infrastructure (Jest + RTL) — единственный незакрытый critical debt
- [ ] SQL миграции E4 + E6 — не применены в Supabase

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-07` semcomp ЗАВЕРШЁН. Инфраструктура outreach: LemonSqueezy + Brevo + Figma MCP. | следующее: Brevo DNS → warmup
`2026-03-08 (s4)` ПИВОТ → desk research SaaS. Roadmap. Стадии 0-2 полностью выполнены. E0+E1 готовы. | следующее: E2
`2026-03-08 (s5)` E2 Corpus Triage + E3 Evidence Extractor готовы. Token Counter SQLite. Параллельный паттерн (2 агента + Claude). | следующее: SQL миграция → E4 Insight Canvas
`2026-03-08 (s6)` E4 Insight Canvas + E5 Research Notebook + E6 Share+Export — ВСЕ ЭПИКИ LAYER 1 ЗАВЕРШЕНЫ. | следующее: SQL миграции → Стадия 4 Tech Debt
`2026-03-08 (s8)` Figma MCP исправлен (--stdio). ui-designer агент. Весь critical tech debt закрыт: security (20 routes), Prisma try/catch, UX toasts, confirmations, ExtractPage fixes, mock feature flags. | следующее: Стадия 5 Backend
`2026-03-08 (s9)` Добавлена Стадия 3.5. Figma write = невозможно (REST read-only). Создан figma-design-auditor агент. | следующее: рестарт CC → URL Figma → запуск аудита
`2026-03-08 (s10)` Редизайн canvas workspace: Inter, axiom template дизайн-система, ChatPanel/FloorBadge/Omnibar/AgentStatusBar переделаны. Floor architecture + 5 методологических школ зафиксированы в памяти. Omnibar подключён (Cmd+K). | следующее: floor navigation, per-floor content
