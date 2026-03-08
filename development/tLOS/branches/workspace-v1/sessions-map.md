# workspace-v1 — Карта сессий
> Легендарная ветка: организация рабочего пространства nopoint + Артём в tLOS
> Создан: 2026-03-08

---

## Как читать этот документ

**Regular сессия** = Sonnet + nopoint: планирование, анализ, Opus-запросы, документация.
**G3 сессия** = Sonnet (Coach) + Qwen/OpenCode (Player): имплементация кода.

Каждая сессия: вход (что читать) → задача → выход (что создаётся).

---

## Активные треки

### Трек A — Omnibar v2 (Eidolon)
*Цель: production-ready Claude Code в tLOS*

| # | Тип | Название | Вход | Задача | Выход | Статус |
|---|---|---|---|---|---|---|
| A-1 | Regular | Opus product design | `branches/omnibar/opus-prompt.md` | nopoint запускает Opus, вставляет промпт | `branches/omnibar/opus-output.md` | ⏳ ждём nopoint |
| A-2 | Regular | Tech spec | `opus-output.md` + `Omnibar.tsx` + `claude-bridge/index.js` | Sonnet пишет state interface, NATS protocol, план impl | `branches/omnibar/spec.md` | 🔒 после A-1 |
| A-3 | G3 | P0 fixes — bridge | `spec.md` секция bridge | sessionId persistence (disk), multi-turn fix | bridge работает multi-turn | 🔒 после A-2 |
| A-4 | G3 | P0 fixes — frontend | `spec.md` секция frontend | persistent sessionId, token routing, markdown | чат без дублей, с markdown | 🔒 после A-2 |
| A-5 | G3 | P1 fixes | `spec.md` секция P1 | auto-scroll, error/timeout, thinking indicator, textarea | полный UX | 🔒 после A-4 |

---

### Трек B — BB Floors (Z-ось)
*Цель: многоэтажный tLOS canvas по BB-framework*

| # | Тип | Название | Вход | Задача | Выход | Статус |
|---|---|---|---|---|---|---|
| B-1 | Regular | Читаем App.tsx | `src/App.tsx`, `src/types/frame.ts` | понять текущий canvas state, точки интеграции | знаем архитектуру | ⏳ можно сейчас |
| B-2 | G3 | Floors Phase 1 | sessions-map + App.tsx | `bb-floors.ts`, currentFloor signal, per-floor storage, FloorIndicator, Ctrl+Up/Down | tLOS с 6 этажами | 🔒 после B-1 |
| B-3 | G3 | Floors Phase 2 | B-2 результат | T-навигация в Omnibar (past/today/future) | 4D canvas | 🔒 после A-5 + B-2 |

---

### Трек C — Инфраструктура
*Мелкие фиксы и тех долг*

| # | Тип | Название | Задача | Статус |
|---|---|---|---|---|
| C-1 | G3 | mcb command fix | починить `onLocalCommand('mcb')` в App.tsx | ⏳ можно сейчас |
| C-2 | G3 | NIM key rotation | механизм автообновления `~/.tlos/nim-key` | 🔒 нет приоритета |

---

## Порядок выполнения

```
СЕЙЧАС (параллельно):
  nopoint → A-1: запускает Opus с промптом
  Sonnet  → B-1: читает App.tsx (подготовка к B-2)
  G3      → C-1: mcb fix (быстро, не блокирует)

ПОСЛЕ A-1:
  Regular → A-2: tech spec (Sonnet)

ПОСЛЕ A-2 (параллельно):
  G3 → A-3: bridge P0
  G3 → A-4: frontend P0

ПОСЛЕ A-3 + A-4:
  G3 → A-5: P1 UX

ПОСЛЕ B-1:
  G3 → B-2: floors

ПОСЛЕ A-5 + B-2:
  G3 → B-3: T-axis
```

---

## G3 правила

- **Coach (Sonnet)**: верифицирует, не пишет код, не доверяет самоотчётам Player
- **Player (Qwen)**: `qwen --approval-mode yolo --output-format text "..."`
- Промпт через файл: `cat spec.md` → передать в Qwen
- Артефакты: `.g3/sessions/review-turn-N.md`
- Player не может закрыть задачу — только Coach

---

## Файлы для навигации

| Документ | Путь |
|---|---|
| **Этот файл** | `branches/workspace-v1/sessions-map.md` |
| Omnibar промпт для Opus | `branches/omnibar/opus-prompt.md` |
| Omnibar результат Opus | `branches/omnibar/opus-output.md` (после A-1) |
| Omnibar tech spec | `branches/omnibar/spec.md` (после A-2) |
| BB-51 tLOS интеграция | `docs/tLOS/BB-framework/BB-51.md` |
| BB-01 Архитектура уровней | `docs/tLOS/BB-framework/BB-01-Architecture.md` |
| Handshake tLOS | `development/tLOS/memory/handshake-tLOS.md` |
