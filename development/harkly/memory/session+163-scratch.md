# session+163-scratch.md
> Session: 0475e634 · 2026-03-18 · Axis

<!-- ENTRY: session-163 -->

## Контекст сессии

Работали над F1 (Connectors floor) дизайном для Harkly. Провели 3 параллельных исследования перед тем как идти в Pencil.

## Исследования F1 — результаты

### Файлы
- `nospace/docs/research/f1-connector-ux-research.md` — 427 строк, competitor UX (Notion, Airtable, n8n, Dovetail, Mixpanel, Segment, Zapier + saasframe.io паттерны)
- `nospace/docs/research/f1-pm-sources-web-research.md` — web research по источникам данных PM
- `nospace/docs/research/f1-audience-sources-mining.md` — mining 13 audience analysis файлов

### Приоритет коннекторов (финальный)

| Tier | Коннектор | Обоснование |
|---|---|---|
| P0 | Manual upload (PDF/audio/transcript) | 10-11/13 чатов, core workflow RU PM |
| P0 | Telegram | RU-дифференциация, ни один global tool не имеет |
| P1 | vc.ru | уникальный RU сигнал |
| P1 | Support tickets (Zendesk/Intercom) | 5/13 чатов |
| P2 | VK, App Store/GP/G2, Surveys/CSV | — |
| P4 | Reddit, HN, Twitter/X | ноль упоминаний в аудитории |

### UX паттерны (конкурентный анализ)

- **Layout:** card grid 3-4 col + search bar + category chips — стандарт
- **Status:** 5 состояний: Connected (зелёный) / Expired (оранжевый) / Error (красный) / Not connected (серый) / Pending (spinner)
- **API keys:** "show once" контракт — generate → name → scope → reveal once → masked + copy/rotate/revoke
- **Rate limits:** progress bar green/yellow/red + "resets in X days"
- **Категории:** по mental model исследователя — Research Sources / Ticketing / CRM / Communication / Storage
- **Empty state:** positive headline + value prop + primary CTA + greyed suggested integrations

### Ключевой инсайт по языку
Аудитория не говорит "коннектор". Говорят: **"нет централизованного места где всё хранится"** и **"данные лежат мёртвым грузом"**. F1 фреймируется через unified view, не через integration mechanism.

## Idea зафиксирована

**Data Marketplace** — шейринг датасетов внутри Harkly с монетизацией. Записано в `nospace/ideas_inbox.md` (2026-03-18).

## Технические решения сессии

- **eidolon-register.py** hook создан и добавлен в settings.json (PostToolUse → Agent). Автоматическая регистрация всех субагентов в `~/.tlos/eidolons.json`.

## Следующий шаг

→ `/compact` → открыть Pencil → дизайн F1 Connectors artboard (1440×900, x:1500 y:2176)

<!-- END ENTRY -->
