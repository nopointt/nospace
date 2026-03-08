# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-08 by Assistant (session 9)

---

## Где мы сейчас

**Стадия 4 DONE + новая Стадия 3.5 добавлена: Figma Design Audit + Frontend Redesign.**
figma-design-auditor агент создан. Ждёт: рестарт Claude Code → URL Figma файла → запуск.

---

## Следующий приоритет

1. **Рестарт Claude Code** — чтобы загрузился `figma-developer-mcp` (инструменты `mcp__figma__*`)
2. **Стадия 3.5** — дать URL Figma файла → запустить `figma-design-auditor` → он пишет `design-audit.md`
3. **После аудита** — я (Claude) читаю `design-audit.md` + текущий код → план фиксов → Qwen имплементирует

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
