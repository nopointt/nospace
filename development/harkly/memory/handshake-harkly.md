# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-08 by Assistant (session 8)

---

## Где мы сейчас

**Стадия 4 ПОЛНОСТЬЮ ЗАВЕРШЕНА + Critical Debt Fixed.** Все tech debt критические issues устранены. Build чистый.
Следующий этап: **Стадия 5 — G3 Backend Build** (реальный API вместо mock data).

---

## Следующий приоритет

1. **Стадия 5 — Backend Build** — реальный Anthropic API для extraction + артефактов
2. **Figma MCP** — теперь работает (--stdio флаг добавлен). Перезапустить Claude Code для активации.
3. **Test infrastructure** — Jest + RTL (остаётся единственным незакрытым critical debt)

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Текущее состояние | `harkly/memory/current-context-harkly.md` |
| Roadmap + все стадии | `.claude/plans/eager-juggling-flame.md` |
| Auth helper (новый) | `harkly-saas/src/lib/api-auth.ts` |
| Prisma schema | `harkly-saas/prisma/schema.prisma` |
| Epics log | `harkly/memory/epics-log-harkly.md` |
| UX debt report | `branches/saas-v1/specs/ux-debt-report.md` |
| Tech debt report | `branches/saas-v1/specs/tech-debt-frontend.md` |

---

## Открытые вопросы

- [ ] Стадия 5 Backend — когда начинаем?
- [ ] Test infrastructure — Jest + RTL (единственный критический debt, ещё не закрытый)
- [ ] Figma MCP design pass — после Стадии 5?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-07` semcomp ЗАВЕРШЁН. Инфраструктура outreach: LemonSqueezy + Brevo + Figma MCP. | следующее: Brevo DNS → warmup
`2026-03-08 (s4)` ПИВОТ → desk research SaaS. Roadmap. Стадии 0-2 полностью выполнены. E0+E1 готовы. | следующее: E2
`2026-03-08 (s5)` E2 Corpus Triage + E3 Evidence Extractor готовы. Token Counter SQLite. Параллельный паттерн (2 агента + Claude). | следующее: SQL миграция → E4 Insight Canvas
`2026-03-08 (s6)` E4 Insight Canvas + E5 Research Notebook + E6 Share+Export — ВСЕ ЭПИКИ LAYER 1 ЗАВЕРШЕНЫ. | следующее: SQL миграции → Стадия 4 Tech Debt
`2026-03-08 (s8)` Figma MCP исправлен (--stdio). ui-designer агент. Весь critical tech debt закрыт: security (20 routes), Prisma try/catch, UX toasts, confirmations, ExtractPage fixes, mock feature flags. | следующее: Стадия 5 Backend
