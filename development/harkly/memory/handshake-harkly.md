# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-06 by Assistant

---

## Где мы сейчас

cx-platform Layer 1 технически завершён (G3 #1-#5 ✅, код запушен на GitHub). Разработка **приостановлена** — nopoint смещает фокус на заработок денег. Deploy не сделан (Render выбран, конфиги не написаны).

---

## Следующий приоритет

1. **Деньги** — разработка Harkly на паузе до решения денежного вопроса
2. **При возобновлении:** Deploy на Render (Dockerfile + render.yaml → Web Service + PostgreSQL + Static Site)
3. **При возобновлении:** G3 #4 — Create Research форма в UI + auth guard + logout

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Контекст проекта | development/harkly/memory/current-context-harkly.md |
| Rust backend | development/harkly/cx-platform/src/ |
| Next.js frontend | development/harkly/cx-platform-web/app/ |
| Запуск демо | development/harkly/cx-platform-web/start-demo.ps1 |
| API типы (TS) | development/harkly/cx-platform-web/lib/api.ts |
| GitHub репо | nopointt/nospace (монорепо) |

---

## Открытые вопросы

- [ ] Когда возобновляем разработку Harkly?
- [ ] Harkly как отдельный SaaS vs интеграция в tLOS (tLOS = Tauri/SolidJS, shell web-deployable)?
- [ ] ProxyMarket: законность парсинга СНГ площадок — нужна юр. консультация
- [ ] H-06 outreach: когда отправляем первые 15 сообщений Simteract?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-06` G3 #5 rate limiting + input validation done | код (60 файлов) запушен на GitHub | CF Workers отклонён (tokio::spawn) | Render выбран как деплой | Разработка приостановлена — фокус на деньги
