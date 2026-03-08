# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-08 by Assistant (session 6)

---

## Где мы сейчас

**Стадия 3 — G3 Frontend Build ЗАВЕРШЕНА.** Все эпики E0–E6 реализованы и запушены на GitHub. Build чистый (`bun run build` exits 0).
Следующий этап: **Стадия 4 (Tech Debt Analysis)** + применить 3 SQL миграции в Supabase перед любым production тестированием.

---

## Следующий приоритет

1. **⚠️ Применить SQL миграции** в Supabase Dashboard (3 штуки):
   - E3: `ALTER TABLE research_projects ADD COLUMN...` (см. epics-log-harkly.md)
   - E4: `prisma/migrations/e4_artifacts.sql`
   - E6: `prisma/migrations/e6_share.sql`
2. **Стадия 4 — Tech Debt Analysis** → Explore-агент по codebase → `specs/tech-debt-frontend.md`
3. **Design pass** (Figma MCP, user упоминал) — до или после tech debt на усмотрение nopoint

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Текущее состояние | `harkly/memory/current-context-harkly.md` |
| Roadmap + все стадии | `.claude/plans/eager-juggling-flame.md` |
| E4 migration SQL | `harkly-saas/prisma/migrations/e4_artifacts.sql` |
| E6 migration SQL | `harkly-saas/prisma/migrations/e6_share.sql` |
| Prisma schema | `harkly-saas/prisma/schema.prisma` |
| Epics log | `harkly/memory/epics-log-harkly.md` |

---

## Открытые вопросы

- [ ] SQL миграции E3/E4/E6 — применить в Supabase Dashboard
- [ ] `bun run seed` запустить после миграций
- [ ] Figma MCP design pass — когда?
- [ ] Стадия 4 Tech Debt — запустить Explore-агент

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-07` semcomp ЗАВЕРШЁН. Инфраструктура outreach: LemonSqueezy + Brevo + Figma MCP. | следующее: Brevo DNS → warmup
`2026-03-08 (s4)` ПИВОТ → desk research SaaS. Roadmap. Стадии 0-2 полностью выполнены. E0+E1 готовы. | следующее: E2
`2026-03-08 (s5)` E2 Corpus Triage + E3 Evidence Extractor готовы. Token Counter SQLite. Параллельный паттерн (2 агента + Claude). | следующее: SQL миграция → E4 Insight Canvas
`2026-03-08 (s6)` E4 Insight Canvas + E5 Research Notebook + E6 Share+Export — ВСЕ ЭПИКИ LAYER 1 ЗАВЕРШЕНЫ. | следующее: SQL миграции → Стадия 4 Tech Debt
