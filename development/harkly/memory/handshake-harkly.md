# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-08 by Assistant

---

## Где мы сейчас

**ПИВОТ:** Harkly = desk research automation SaaS для CX/UX/Research Ops (RU+СНГ, домен harkly.ru). Активная ветка: saas-v1. Стадия 0 — Research Foundation: enemy.md v0 написан из домен-знания, hero.md не написан. Оба требуют валидации через реальное веб-исследование (50+ страниц каждый). Opus промпт готов, но нужно обновить список файлов для чтения.

---

## Следующий приоритет

1. **Веб-исследование enemy.md** — запустить агент, но с инструкцией писать результат прямо в файл `branches/saas-v1/enemy_research_raw.md`. Не возвращать в контекст — иначе лимиты.
2. **Веб-исследование hero.md** — то же самое → файл `branches/saas-v1/hero_research_raw.md`
3. **Написать финальные enemy.md + hero.md** на основе raw-файлов (в отдельной сессии)
4. **Обновить opus_business_brief_prompt.md**: добавить в список чтения hero.md + enemy.md + competitives.md + инструкцию "spine = гипотеза"
5. **Запустить Opus**: `claude --model claude-opus-4-6` → читает файлы через Read tool → пишет `opus_business_brief.md`

---

## КРИТИЧНО: Паттерн для агентов-исследователей

Агент должен **ПИСАТЬ результат в файл**, не возвращать в контекст — иначе кончаются лимиты.
В промпте агента добавлять: *"Write your complete output to file: C:\...\saas-v1\enemy_research_raw.md using the Write tool. Do not return output to me."*

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Полный roadmap (6 стадий) | `.claude/plans/eager-juggling-flame.md` |
| Текущий контекст | `development/harkly/memory/current-context-harkly.md` |
| Opus промпт (обновить!) | `branches/saas-v1/opus_business_brief_prompt.md` |
| Enemy Statement v0 | `branches/saas-v1/enemy.md` |
| Конкурентный teardown | `branches/saas-v1/competitives.md` |
| Layer 1 архитектура | `branches/saas-v1/harkly_layer1_architecture.md` |
| Jobs matrix | `branches/saas-v1/jobs_matrix_automation.md` |

---

## Открытые вопросы

- [ ] Монорепо или split repo для harkly-saas?
- [ ] Инфраструктура: nopoint создаёт аккаунты Vercel / YC PG / Supabase / Modal?
- [ ] HARKLY-06 (Steam outreach): Brevo DNS ещё не настроен. Когда возобновить?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-07` semcomp ЗАВЕРШЁН. Инфраструктура outreach: LemonSqueezy + Brevo + Figma MCP. 12 email-структур A/B теста. | следующее: рестарт Claude → Brevo DNS → warmup → тексты → тест

`2026-03-08` ПИВОТ: Harkly = desk research automation SaaS. Roadmap 6 стадий написан. Домен harkly.ru. enemy.md v0 создан (домен-знание). hero.md не написан. Opus промпт нужно обновить. | следующее: веб-исследование enemy+hero → агент пишет в файл → Opus
