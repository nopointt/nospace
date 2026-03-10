---
# LANDING PAGE STATE — harkly-saas
> Детальная архитектура лендинга. Читать при работе с page.tsx.
> Tags: [harkly, landing, frontend, gsap, state]
> Last updated: 2026-03-10 by Assistant (session 17)
---

## Статус деплоя

- **URL:** harkly-saas.vercel.app ✅ live (deployed session 17, 2026-03-10)
- **Файлы:** `harkly-saas/src/app/page.tsx`, `globals.css`, `public/boy.png`, `public/empty-room.jpg`

## Hero блок — архитектура

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
- **Заголовок:** Urbanist, `fontWeight: 700`, `letterSpacing: -0.03em`, `clamp(28px, 3.6vw, 52px)`
- **AccentBtn:** стекло — `rgba(215,186,125,0.18)` + `blur(16px)` + `border: rgba(215,186,125,0.55)` + текст `#D7BA7D`

## globals.css

- `html/body background: #080950` — убран белый фон
- `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` — скроллбар скрыт
- `--color-white: #FFF8E7` в `@theme inline` — весь белый заменён на тёплый cream

## SocialProof блок

- `CARD_W=280`, `CARD_GAP=16`, `CYCLES=5`, `CYCLE_W=18×296=5328`
- `ROW_OFFSETS_SP` — 20 рядов (cycling pattern), `ROW_CARDS` = 5×18 = 90 карточек
- **Высота секции: `230vh`**
- GSAP Draggable: type 'x,y', `maxX: 48`, `minX: -(CYCLE_W*CYCLES)*2`
- Псевдо-бесконечный X: начало `x = -CYCLE_W*2`, wrap в onDrag/onDragEnd
- Карточки: `background: rgba(255,248,231,0.14)`, `blur(6px)`, прозрачный border

## GhostScrollGallery — архитектура

- Паттерн: ghost scroll (sticky 100vh viewport + absolute ghost divs)
- `GALLERY_GHOST_H = 300vh` на панель, 4 панели = `1200vh` total
- **ВАЖНО:** `marginTop: negative` на wrapper ЛОМАЕТ position:sticky. Не использовать.

### Панели (4 solution-блока)

| # | bg | dark | Заголовок |
|---|---|---|---|
| 0 | gold gradient | true | Все в одном приложении. |
| 1 | `#080950` | false | Широчайший выбор источников. |
| 2 | gold gradient | true | Глубокая кастомизация. |
| 3 | `#080950` | false | Полная автоматизация рутины. |

Gold gradient: `radial-gradient(ellipse 90% 45% at 50% -5%, #E8CC70, transparent) + radial-gradient(...#B8922E...) + linear-gradient(#DECB80→#D7BA7D→#C4A660)`

### Анимации (1:1 с референсом Moussa Mamadou)

- Panel 0: без clipPath — видна сразу при sticky входе
- clipPath reveal 1-3: `inset(100% 0 0% 0)` → `inset(0% 0 0 0)`, scrub
- Text lines: `yPercent: 125, rotate: 2.5`, toggleActions play/reverse
- Cards slide-in: `x: even→100vw, odd→-100vw`, scrub, 0→65%
- Overlay bg = `item.bg` (текущая панель, не чёрный)

### Контент карточек (4 панели × 3 карточки)

| Панель | Карточки |
|---|---|
| 0 «Все в одном» | Один процесс / Исследование не умирает с дедлайном / Артефакт внутри |
| 1 «Широчайший выбор» | Twitter/X (velocity) / Reddit (authenticity) / AI-агент (coverage) |
| 2 «Кастомизация» | Omnibar / Выбор методологии / Параллельные ветки |
| 3 «Автоматизация» | Скрининг 30-40% времени / 91% точность / граф из 1000 документов |

## CTA блок

- Макет: `grid 1fr 1fr` — лево: badge + заголовок, право: форма
- Заголовок: "Исследуйте, творите, меняйте." + "Всё остальное — за нами."
- Форма: Telegram @username + role select → `POST /api/waitlist { telegram, role }`
- Карточка формы: `background: none, border: 1px solid rgba(255,248,231,0.12)`
- Поля: `background: rgba(255,248,231,0.06)`

## Деплой — session 17 notes

- `/api/waitlist`: `{ telegram, role }` — Prisma WaitlistEntry + Supabase migration
- `middleware.ts`: `PUBLIC_PATHS = ['/', '/share']` — auth-free
- `tsconfig.json`: `forceConsistentCasingInFileNames: false` — GSAP Windows fix
