# HANDSHAKE — 2026-03-10
> Operative context for the next session. Read this LAST during /startgsession.
> Written by: Assistant Agent at session close.

---

## CRITICAL — Read First

1. **OPS-TODO-01** — .env файлы не зашифрованы. Критический риск безопасности. Требует действий nopoint (age-шифрование).
2. **Gemini API ключ скомпрометирован** — старый ключ опубликован в чате. Отозвать на aistudio.google.com и создать новый.
3. **SQL миграции E4 + E6** — не применены в Supabase. Блокируют старт Стадии 5.

---

## Active Work

| Item | Status | Next Action |
|---|---|---|
| HARKLY-05 web platform | in-progress | Стадия 5 — G3 Backend Build |
| SQL миграции E4 + E6 | blocked | применить в Supabase (DIRECT_URL) перед Backend Build |
| OPS-TODO-01 encrypt .env | blocked | nopoint action required |
| Gemini API ключ | compromised | заменить на aistudio.google.com |
| tLOS enterprise update | unknown | nopoint briefing at /startTsession |

---

## Context Snapshot

**Workspace phase:** active-dev
**Active projects:** harkly (active), tLOS (pause)
**Team:** nopoint (founder) + Артем (co-founder, роли TBD)

**Last major actions:**
- Лендинг задеплоен: harkly-saas.vercel.app (session 17, 2026-03-10)
- Waitlist API: email → Telegram (@handle + role)
- Middleware: PUBLIC_PATHS = ['/', '/share'] — auth-free landing
- HARKLY-03 закрыт: ProxyMarket не активен, Артем входит как co-founder отдельно
- G3 #1-#4 завершены: весь фронтенд E0-E6 готов

---

## Open Decisions

- [ ] Роли: nopoint vs Артем — что делает каждый
- [ ] Gemini API ключ — заменить
- [ ] Применить SQL E4 + E6 в Supabase

---

## Files Changed Last Session (session 17, 2026-03-10)

- `harkly-saas/prisma/schema.prisma` — WaitlistEntry: email → telegram + role
- `harkly-saas/src/app/api/waitlist/route.ts` — Telegram waitlist API
- `harkly-saas/src/middleware.ts` — PUBLIC_PATHS auth bypass
- `harkly-saas/tsconfig.json` — forceConsistentCasingInFileNames: false (GSAP Windows fix)
- `development/harkly/memory/current-context-harkly.md` — обновлён
- `development/harkly/memory/handshake-harkly.md` — перезаписан
- `memory/current-context-global.md` — обновлён (Артем, HARKLY-03 закрыт, infra stack)
- `memory/semantic-context-global.md` — добавлен entity Artem

---

## Recommended First Action Next Session

> `/startHsession` → применить SQL E4 + E6 (DIRECT_URL workaround) → начать Стадию 5 G3 Backend Build.
