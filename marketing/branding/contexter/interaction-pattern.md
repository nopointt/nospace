---
name: contexter_interaction_pattern
description: Contexter UI = web app pattern (NOT spatial canvas like Harkly). Page routes, dual-pane layout, light/dark surfaces carry meaning.
type: project
---

Контекстер — **web-app**, не spatial canvas. Имеет страницы (routes), панели, шапку, навигацию. Это сознательное архитектурное решение: spatial canvas (как у Harkly с floors F0-F5) подходит для discovery + open-ended исследования; Контекстер — про **structured archive**, для которого web-app pattern точнее.

## Ключевое отличие от Harkly

| | Harkly | Contexter |
|---|---|---|
| **Topology** | Spatial canvas (бесконечная 2D плоскость с frames) | Web app (роуты, панели) |
| **Primary input** | Omnibar (text-first command surface) | Click-driven (с глобальным search) |
| **Element placement** | Frames floating spatially | Cards in dual-pane / list views |
| **Navigation** | Spatial movement (zoom, pan) | Page routes (`/dashboard`, `/archive`, `/rooms`) |
| **Empty space role** | Compositional whitespace = relationship distance | Structural separation = section boundary |
| **Density** | Spread out, contemplative | Information-dense, scan-friendly |

## Layout — Raw → Structured Axis (8:4 split)

Контекстер UI следует **Raw → Structured duality** (см. `nospace/design/contexter/foundations/philosophy.md`).

Каждый ключевой экран следует 8:4 asymmetric split:

```
┌──────────────────────────────────────────┐
│  Nav: con[text]er logo (left), user (right) │
├──────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────┐    │
│  │ raw input pole │  │ structured   │    │
│  │ (8 col)        │  │ output pole  │    │
│  │                │  │ (4 col)      │    │
│  │ - file list    │  │ - search     │    │
│  │ - upload zone  │  │ - query api  │    │
│  │ - drop area    │  │ - shared rooms│   │
│  └────────────────┘  └──────────────┘    │
└──────────────────────────────────────────┘
```

Левая колонка (raw) — что **поступает** (загруженные файлы, upload zone, drop area).
Правая колонка (structured) — что **уходит** (search, API, MCP query, shared rooms list).

## Page routes

| Route | Purpose | Layout |
|---|---|---|
| `/` (Hero/Landing) | Marketing — public surface, light theme by default | Hero text (left) + API output preview (right) |
| `/dashboard` | Logged-in start page — overview архива | Documents table (8 col left) + query panel (4 col right) |
| `/archive` | Все файлы (private) | List view, фильтры, состояние видимости |
| `/rooms` | Shared rooms management | Room list (8 col left) + active room detail (4 col right) |
| `/rooms/{id}` | Конкретная shared room | Members + files + activity |
| `/settings` | Account settings | Settings panel + danger zone |
| `/api` | API tokens + integration docs | Code blocks + curl examples |

**Не существует:** infinite canvas, omnibar-первичность, frames floating in space, zoom-pan navigation. Это всё Harkly.

## Theme axis carries meaning

Тема — не оформление, а **структурный signal**:

| Surface | Theme | Semantic |
|---|---|---|
| `contexter.cc` (main landing, marketing) | Light | Public surface. Anyone can see. Cold Bauhaus + blue accent. |
| `app.contexter.cc` (logged-in app) | User toggle (default light) | Mixed — может содержать и приватное. Default light for compatibility. User can switch via header toggle. |
| `blog.contexter.cc` (blog) | Dark | Editorial surface. Reading content. Dark theme defaults. |
| `vault.contexter.cc` (vault landing) | Dark | Privacy product. Tool itself dark. |
| `app.contexter.cc/rooms/{id}` (shared room) | Dark when room visible to <5 people; light when public | Theme = visibility scope. |
| `app.contexter.cc/archive/private` | Dark | Privacy-bound section. Always dark. |

## Components in this pattern

Все 11 reusable components в `design/contexter/contexter-ui.pen` (Section 05) предназначены для web-app pattern:

- **Buttons** (Primary / Secondary / Ghost / Danger) — clickable actions, не omnibar commands
- **Inputs** (Default / Focused) — form inputs, не command-line input
- **Badges** (Processing / Ready / Error / Pending) — status indicators
- **PipelineIndicator** — file processing visualization (parse → chunk → embed → index)
- **DropZone** — file upload area
- **DataTable** — file list, members list, activity log

Никаких spatial-only patterns: no floor frames, no canvas zoom, no omnibar-as-primary.

## Anti-patterns

- **Spatial canvas mimicry** — не имитировать Harkly. Web app — другая мета.
- **Infinite scroll lists** — paginate or virtualize. Архив должен быть scannable.
- **Hidden navigation** — нет hamburger без необходимости. Архив требует explicit ориентации.
- **Modal overload** — не каждое действие в модалке. Inline editing where reasonable.
- **Tooltip-as-primary-information** — критичная информация должна быть видна, не за hover.
- **Dashboard pattern (cards grid)** — Контекстер не дашборд. 8:4 split с conceptual левый/правый, не grid из 12 виджетов.
- **AI-magic surfacing** — не показываем "AI обрабатывает" с анимированным мозгом. Pipeline indicator (явный 4-step) — да; magic — нет.

## Loading states (Meme voice)

Loading states — место где Meme говорит. См. `mascot-meme.md` секцию «Голос Meme в копирайте».

Краткие фразы. Spatial vocabulary. Никаких spinner-without-text.

Examples:
- File processing: "Открываю карточку" / "Reading"
- Indexing: "Раскладываю по полкам" / "Filing"
- Search: "Просматриваю архив" / "Browsing"
- Sync: "Сверяю с моделью" / "Syncing with model"
- Error: "Не открывается" / "Card unreadable"

## Mobile

Mobile — через web (responsive), не native app в этой версии.

Layout collapses 8:4 → single column на мобильных. Raw input pole сначала (вверху), structured output pole — ниже.

Native mobile app — в backlog после PMF.
