# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-06 by Assistant

---

## Где мы сейчас

cx-platform Layer 1 в финальном production-ready спринте. JWT auth и sentiment scoring завершены (G3 #2, #3). Цель — prod-ready Layer 1, доступный по вебу без white-label. Следующее: Create Research форма в UI + deploy.

---

## Следующий приоритет

1. **G3 #4** — Create Research форма в UI + auth guard (редирект на /login) + logout кнопка
2. **G3 #5** — Rate limiting на API + input validation (appid, limit)
3. **Deploy** — выбрать хостинг (VPS/Railway/Fly.io) и выложить на публичный URL с HTTPS

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Контекст проекта | development/harkly/memory/current-context-harkly.md |
| Rust backend | development/harkly/cx-platform/src/ |
| Next.js frontend | development/harkly/cx-platform-web/app/ |
| Запуск демо | development/harkly/cx-platform-web/start-demo.ps1 |
| API типы (TS) | development/harkly/cx-platform-web/lib/api.ts |

---

## Открытые вопросы

- [ ] Где деплоить? VPS (Hetzner/DO) vs Railway vs Fly.io
- [ ] ProxyMarket: законность парсинга СНГ площадок — нужна юр. консультация
- [ ] H-06 outreach: когда отправляем первые 15 сообщений Simteract?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-06` JWT auth работает, пользователь зарегистрирован | G3 #3 sentiment scoring done (cargo check ✅, tsc ✅) | Цель уточнена: prod-ready Layer 1, не демо | G3 #4: Create Research форма + auth guard + logout
