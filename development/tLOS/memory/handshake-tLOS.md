# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-02-28 by Assistant

---

## Где мы сейчас

MCB-v1 в работе. Стек запускается через `grid.ps1 run` (сервисы в фоне, логи в терминал + `branches/mcb-v1/logs/`). Shell на localhost:5173 — MCB 6 фреймов как дефолтный экран. Дизайн фреймов реализован в .tsx, но рендер не подтверждён в браузере.

---

## Следующий приоритет

1. **Подтвердить рендер MCB фреймов** — запустить grid.ps1 run, открыть localhost:5173, сделать hard refresh (Ctrl+Shift+R), проверить F12 console на ошибки. Если "Frame crashed" — читать ошибку.
2. **Протестировать grid.ps1 логи** — убедиться что логи идут в main terminal с префиксами `[service-name]` и пишутся в `branches/mcb-v1/logs/`
3. **Команда mcb** — убедиться что ввод `mcb` в омнибаре заменяет канвас на 6 MCB фреймов

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| mcb-v1 | Marketing Command Board для proxy.market | open — фреймы реализованы, нужно подтвердить рендер |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| MCB frames константа | core/shell/frontend/src/data/mcb-frames.ts |
| Canvas state hook | core/shell/frontend/src/hooks/useComponents.ts |
| App + mcb команда | core/shell/frontend/src/App.tsx |
| Grid лончер | core/grid.ps1 |
| MCB branch spec | development/tLOS/branches/mcb-v1/spec.md |
| HTML дизайн-спеки фреймов | development/tLOS/branches/mcb-v1/{Strategy-frame, SEO-command-panel, ...} |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |

---

## Открытые вопросы

- [ ] Рендер MCB фреймов: user видит "окна без дизайна" — нужен hard refresh + F12 console
- [ ] grid.ps1 Start-Job логи: работают ли Receive-Job в цикле на Windows?
- [ ] Правило Qwen-as-coder нарушено в этой сессии — в следующей строго: Claude промптит, Qwen кодирует через `qwen -y -p "..."`
- [ ] Получить числовые цели Владимира (MRR, органика, нейровыдача) от Артёма
- [ ] API доступы (Alytics, Topvisor, Метрика) — ждём от Артёма
