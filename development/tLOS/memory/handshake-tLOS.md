# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-02-27 by Assistant

---

## Где мы сейчас

tLOS перенесён в `nospace/development/tLOS/core`, запускается через `grid.bat run`, работает (localhost:5173). Открыта ветка `mcb-v1` — первый enterprise продукт для Артёма (proxy.market).

---

## Следующий приоритет

1. **Спроектировать UI mcb-seo по BB-фреймворку** — 3 этажа (Стратегия / Тактика / Операция), какие сущности на каком этаже, какие фреймы на холсте tLOS
2. Получить от Артёма числовые цели Владимира (для расчёта Разрывов в деньгах)
3. Написать WIT-интерфейс mcb-seo актора

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| mcb-v1 | Marketing Command Board для proxy.market | open — spec готов, UI design next |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| MCB branch spec | development/tLOS/branches/mcb-v1/spec.md |
| MCB техдок (от Артёма) | /nospace/docs/tLOS/MCB/Marketing Command Board (MCB).md |
| MCB данные proxy.market | /nospace/docs/tLOS/MCB/mcb_context.md |
| BB-фреймворк | /nospace/docs/tLOS/BB-framework/BB-00-Manifest-v2.md |
| tLOS код (актуальный) | /nospace/development/tLOS/core/ |
| tLOS документация | /nopoint/tLOS_docs/The-Last-OS-tlos-/ |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |

---

## Открытые вопросы

- [ ] UI mcb-seo: какие фреймы на каком этаже холста tLOS
- [ ] Числовые цели Владимира (MRR, органика, нейровыдача)
- [ ] Telegram-парсинг в v1 или откладываем?
- [ ] Удалить старый `.tLOS` после проверки в следующей сессии
