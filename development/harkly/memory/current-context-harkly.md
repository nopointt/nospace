---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-10 by Assistant (session 17)
---

## Project Phase

**Лендинг ✅ задеплоен на harkly-saas.vercel.app (session 17).**
Waitlist API переключён на Telegram. Middleware: публичные роуты пропускают auth. Следующий приоритет: **Стадия 5 — G3 Backend Build**.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-13 | **saas-v1** — Лендинг + деплой | ✅ DONE — harkly-saas.vercel.app | Sonnet + nopoint |
| HARKLY-12 | **saas-v1** — Стадия 3.5 Canvas Workspace Redesign | ⏸ on-hold — лендинг приоритет | Sonnet + nopoint |
| HARKLY-11 | **saas-v1** — Стадия 3 G3 Frontend Build | ✅ DONE — все E0-E6 завершены | Sonnet + nopoint |
| HARKLY-06 | Cold outreach Steam indie games | **⏸ on-hold** | nopoint |
| HARKLY-03 | ProxyMarket partnership | **on-hold** — юр. блокер | nopoint |

## saas-v1 — Дорожная карта (6 стадий)

| Стадия | Название | Статус |
|---|---|---|
| 0 | Research Foundation | ✅ DONE |
| 1 | Business Design (Opus) | ✅ DONE — opus_business_brief.md написан |
| 2 | Spec Lock | ✅ DONE — 8 спек (E0, E0.5, E1-E6), DoR 100% |
| 3 | G3 Frontend Build | ✅ DONE — E0-E6 все завершены |
| 4 | Tech Debt Analysis | ✅ DONE — tech-debt-frontend.md + ux-debt-report.md |
| 3.5 | Canvas Workspace Redesign | ⏸ on-hold — floor nav + per-floor content pending |
| L | Landing Page | ✅ DONE — deployed harkly-saas.vercel.app |
| 5 | G3 Backend Build | 🔜 — следующий приоритет |
| 6 | Manual Testing + Beta | 🔒 |

## Canvas Workspace — Компоненты (Стадия 3.5)

| Компонент | Статус | Файл |
|---|---|---|
| ChatPanel | ✅ redesigned | `components/chat/ChatPanel.tsx` |
| ChatSettingsBar | ✅ redesigned | `components/chat/ChatSettingsBar.tsx` |
| AgentStatusBar | ✅ redesigned | `components/agents/AgentStatusBar.tsx` |
| FloorBadge | ✅ redesigned | `components/canvas/FloorBadge.tsx` |
| Omnibar | ✅ connected | `components/omnibar/Omnibar.tsx` |
| CanvasToolbar | ✅ existing | `components/canvas/CanvasToolbar.tsx` |
| NVIDIA NIM provider | ✅ connected | `useAgents.ts` + `providers/openai.ts` |
| Floor navigation | ⬜ TODO | — |
| Per-floor canvas content | ⬜ TODO | — |

## Product State — saas-v1 Frontend (E0-E6, legacy routes)

| Компонент | Статус | Маршрут |
|---|---|---|
| E0 Scaffold + Auth | ✅ DONE | `/auth/login`, `/app/dashboard` |
| E1 Framing Studio | ✅ DONE | `/app/projects/[id]/frame` |
| E2 Corpus Triage | ✅ DONE | `/app/projects/[id]/corpus` |
| E3 Evidence Extractor | ✅ DONE | `/app/projects/[id]/extract` |
| E4 Insight Canvas | ✅ DONE | `/app/projects/[id]/canvas` |
| E5 Research Notebook | ✅ DONE | `/app/projects/[id]/notebook` |
| E6 Share + Export | ✅ DONE | `/app/projects/[id]/share` + `/share/[token]` |

## Технический стек — saas-v1

| Слой | Технология | Где |
|---|---|---|
| Runtime | Bun | локально |
| Framework | Next.js 16 App Router + shadcn/ui | Vercel |
| Font | Inter (Google Fonts) | layout.tsx |
| ORM | Prisma 7 (adapter-pg) | — |
| Auth + DB | Supabase (itkzskhsjcfokvrdtjlv) | US |
| AI Provider (test) | NVIDIA NIM (meta/llama-3.3-70b-instruct) | `.env.local` |
| CI/CD | GitHub Actions | — |
| Deploy | Vercel | `harkly-saas.vercel.app` (production) |
| Repo | `harkly-saas` | `nospace/development/harkly/harkly-saas/` |

## Blockers

| Blocker | Raised | Resolution |
|---|---|---|
| prisma migrate dev зависает | 2026-03-08 | Использовать `DATABASE_URL=<DIRECT_URL> bunx prisma db execute --stdin` |
| Zero test coverage | 2026-03-08 | Нужна тестовая инфраструктура (critical debt) |
| SQL миграции E4 + E6 | 2026-03-08 | ⚠️ не применены в Supabase — блокирует backend features |

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Полный roadmap saas-v1 | `.claude/plans/eager-juggling-flame.md` | ✅ |
| Opus business brief | `branches/saas-v1/opus_business_brief.md` | ✅ |
| Architecture Spec (Floor 0-5) | `branches/saas-v1/Harkly Architecture Spec.md` | ✅ |
| Methodology schools (5 schools) | `branches/saas-v1/methodology_schools_detailed.md` | ✅ |
| Спеки E0-E6 | `branches/saas-v1/specs/` | ✅ DoR 100% |
| Prisma schema | `harkly-saas/prisma/schema.prisma` | ✅ все модели (E0-E6) |
| E6 Share migration | `harkly-saas/prisma/migrations/e6_share.sql` | ⚠️ применить в Supabase |
| E4 Artifacts migration | `harkly-saas/prisma/migrations/e4_artifacts.sql` | ⚠️ применить в Supabase |
| Epics log | `harkly/memory/epics-log-harkly.md` | ✅ E0-E6 залогированы |

## Landing Page — текущее состояние (session 14, 2026-03-09)

### Hero блок — финальная архитектура
```
[position: relative, z=100] Nav — НЕ fixed, transparent (убран glass)
[position: fixed, z=1]      #hero-bg  — room + hue + cube
[position: fixed, z=15]     #hero-overlay — heading + CTA
[normal flow, z=10]         Boy.png (100vh) + hero-fade внизу
[normal flow, z=20]         .harkly-bg wrapper — все секции + footer
```
- Lenis smooth scroll: wheelMultiplier/touchMultiplier 0.8, lerp 0.08
- Cube parallax: 40% скорости (translateY(-scroll * 0.4))
- Секции перекрывают hero (z=20 > z=15)

### globals.css
- `html/body background: #080950` — убран белый фон
- `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` — скроллбар скрыт
- `--color-white: #FFF8E7` в `@theme inline` — весь белый заменён на тёплый cream
- Все `#fff`/`#ffffff` → `#FFF8E7`, все CSS-переменные обновлены

### SocialProof блок (session 14)

**Константы:**
- `CARD_W=280`, `CARD_GAP=16`, `CYCLES=5`, `CYCLE_W=18×296=5328`
- `ROW_OFFSETS_SP` — 20 рядов (cycling pattern) — гарантирует заполнение любого экрана
- `ROW_CARDS` = 5×18 = 90 карточек на ряд
- **Высота секции: `230vh`**

**GSAP Draggable:**
- type: 'x,y', `maxX: 48`, `minX: -(CYCLE_W*CYCLES)*2`
- Псевдо-бесконечный X: начало `x = -CYCLE_W*2`, wrap в onDrag/onDragEnd
- `hasMoved` ref — различает drag от click

**Карточки отзывов (18 уникальных):**
- Стиль: `background: rgba(255,248,231,0.14)`, `blur(6px)`, прозрачный border
- Все rgba(255,255,255) → rgba(255,248,231) по всему файлу

### GhostScrollGallery — финальная архитектура (session 15)

**Паттерн:** ghost scroll (sticky 100vh viewport + absolute ghost divs)
- `GALLERY_GHOST_H = 300vh` на панель (1:1 референс), 4 панели = 1200vh total
- Sticky контейнер: `background: galleryData[0].bg` — золотой фон виден до первого reveal
- `subtitle: string` (не `subtitleLines[]`) — одна строка, `fontWeight: 600`, `width: clamp(220px, 28vw, 440px)`

**Панели (4 solution-блока, проблемные убраны):**
| # | bg | dark | Заголовок |
|---|---|---|---|
| 0 | gold gradient | true | Все в одном приложении. |
| 1 | `#080950` | false | Широчайший выбор источников. |
| 2 | gold gradient | true | Глубокая кастомизация. |
| 3 | `#080950` | false | Полная автоматизация рутины. |

**Gold gradient:** `radial-gradient(ellipse 90% 45% at 50% -5%, #E8CC70, transparent) + radial-gradient(...#B8922E...) + linear-gradient(#DECB80→#D7BA7D→#C4A660)`

**Анимации (1:1 с референсом Moussa Mamadou):**
- Panel 0: **без clipPath** — видна сразу при sticky входе (только панели 1-3 скрыты)
- clipPath reveal панели 1-3: `inset(100% 0 0% 0)` → `inset(0% 0 0 0)`, scrub, start: 'top bottom', end: '+75vh top'
- Text lines: `yPercent: 125, rotate: 2.5`, toggleActions play/reverse
- Cards slide-in: `x: even→100vw, odd→-100vw`, scrub, 0→65%
- Final: overlay opacity 0→1, cards yPercent 15, panel blur 1px
- **Overlay bg = `item.bg`** (текущая панель, не чёрный)

**ВАЖНО:** `marginTop: negative` на wrapper ЛОМАЕТ position:sticky. Не использовать.

### Контент GhostScrollGallery (session 16 — ФИНАЛ)

Каждая панель: 3 карточки `{ num, title, text, stat }` — структурно РАЗНЫЕ углы, не вариации одного

| Панель | Карточки (углы) |
|---|---|
| 0 «Все в одном» | Один процесс вместо 4 инструментов / Исследование не умирает с дедлайном / Артефакт готовится внутри |
| 1 «Широчайший выбор» | Twitter/X (velocity) / Reddit (authenticity) / AI-агент по запросу (coverage) |
| 2 «Глубокая кастомизация» | Omnibar / Выбор методологии / Параллельные ветки |
| 3 «Полная автоматизация» | Семантический скрининг (время) / Верификация фактов (доверие) / Методологическая база (качество) |

**Стат-линии Panel 3 используют реальные данные:**
- Скрининг: `Экономия 30–40% времени (Maze ResearchOps, 2025)`
- Верификация: `91% исследователей беспокоятся о точности AI`
- Методобаза: `Из 1000 документов — граф знаний. Без единой вручную прочитанной строки.`

### CTA блок — финал (session 16)

**Макет:** `grid 1fr 1fr` — левая: badge + большой заголовок, правая: форма
**Заголовок:** "Исследуйте, творите, меняйте." (clamp 38-76px, bold) + "Всё остальное — за нами." (clamp 20-36px, muted)
**Форма:** Telegram @username + role select + gold button — в карточке `background: none, border: 1px solid rgba(255,248,231,0.12)`
**Поля:** `background: rgba(255,248,231,0.06)` — лёгкий тинт для видимости на прозрачном фоне
**API:** шлёт `{ telegram, role }` вместо `{ email, role }` — нужно обновить `/api/waitlist`

### Stats блок — УДАЛЁН (session 16)

Блок с 4 цифрами удалён из страницы целиком.

### Hero блок — изменения (session 16)

- **Заголовок:** Inter → Urbanist, `fontWeight: 700`, `letterSpacing: -0.03em`, `clamp(28px, 3.6vw, 52px)`
- **AccentBtn:** стекло — `rgba(215,186,125,0.18)` + `blur(16px)` + `border: rgba(215,186,125,0.55)` + текст `#D7BA7D`

### Файлы лендинга
- `harkly-saas/src/app/page.tsx` — весь лендинг
- `harkly-saas/src/app/globals.css` — .hc-*, .box-gleam, .harkly-bg, .hero-fade, scrollbar, --color-white
- `harkly-saas/public/boy.png` — foreground фигура
- `harkly-saas/public/empty-room.jpg` — фоновая комната

### Деплой — session 17 (2026-03-10) — ✅ DONE

- `/api/waitlist` обновлён: `{ telegram, role }` — Prisma schema + Supabase migration применены
- `middleware.ts`: `PUBLIC_PATHS = ['/', '/share']` — пропускают auth check
- `tsconfig.json`: `forceConsistentCasingInFileNames: false` — фикс GSAP Windows
- Production URL: **harkly-saas.vercel.app**

### Следующее (session 18+)

## Ключевые решения (session 11)

- **Research plan зафиксирован** — `.claude/plans/synthetic-skipping-engelbart.md`
- **Qwen = только темы/сообщества** — не даёт реальных URL, галлюцинирует ссылки (1 URL → 25 фейков)
- **LinkedIn scraper: Patchright** — не playwright-extra. Фиксит CDP leaks. Chrome 145, persistent context, копия профиля в `AppData\Local\PlaywrightProfile\`
- **Perplexity = триангуляция последней** — не первый инструмент, а финальная валидация пробелов
- **Research frameworks**: JTBD Canvas + ODI (Ulwick), Opportunity Algorithm, Opportunity Solution Tree (Teresa Torres), Value Proposition Canvas
- **Субагент-шапка**: объявлять роль + отключать онбординг + отключать эскалацию — иначе CLAUDE.md останавливает субагента

## Ключевые решения (session 10)

- **Inter font** — заменён Geist на Inter (axiom template дизайн-система)
- **Tailwind scale only** — убраны все `text-[Npx]` в canvas-компонентах, только `text-xs / text-sm / text-base`
- **gray-100 borders** — заменены `border-[#D9D9D9]` на `border-gray-100`
- **NVIDIA NIM** — `meta/llama-3.3-70b-instruct` как default agent (`custom` provider, OpenAI-compatible)
- **Omnibar** — подключён к `/app/[workspaceId]` (был built но не импортирован)
- **Floor architecture** — задокументирована в `handshake-harkly.md` (Floor 0-5, 5 методологических школ)
- **useAgents version: 2** — бамп для сброса старого localStorage при смене default provider
