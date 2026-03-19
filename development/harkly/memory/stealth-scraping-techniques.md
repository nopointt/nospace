# Stealth Browser Automation — Техники маскировки робот-трафика
> Контекст: LinkedIn scraper для Harkly JTBD research pipeline
> Дата: 2026-03-09
> Статус: Применено в `nospace/tools/linkedin-scraper/scrape.ts`

---

## Почему LinkedIn детектит ботов

LinkedIn (и большинство anti-bot систем) детектирует по нескольким векторам одновременно:

| Вектор | Что проверяется | Как фиксируется |
|--------|----------------|-----------------|
| CDP leak | `Runtime.enable` команда в DevTools Protocol | Patchright (патч на уровне source) |
| `navigator.webdriver` | `true` в автоматизированных браузерах | Patchright fix |
| Timing | Одинаковые интервалы между действиями | Gaussian distribution |
| Mouse | Прямые линии, телепортация | Bezier curves |
| Scroll | Нет скролла или моментальный | Scroll simulation |
| URL pattern | Одинаковый порядок посещения | URL shuffle |
| Viewport | Идентичный размер каждый раз | Randomized per session |
| Timezone | Не совпадает с IP-локацией | Match proxy timezone |

---

## Реализованные техники

### 1. Patchright вместо Playwright
```typescript
import { chromium } from 'patchright'  // не playwright
```
- Патчит CDP так, чтобы не отправлять `Runtime.enable`
- Выполняет JS в isolated ExecutionContexts
- `navigator.webdriver = false`
- Убирает `HeadlessChrome` из User-Agent
- **Критично для LinkedIn** — они специфически детектят `Runtime.enable`

### 2. Gaussian delays (Box-Muller transform)
```typescript
function gaussian(mean: number, std: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}
```
- **НЕ** `Math.random() * range` (равномерное → машинное)
- Нормальное распределение: большинство задержек около mean, редкие выбросы
- Межстраничная задержка: mean=3500ms, std=1800ms → естественный диапазон ~1-8s

### 3. Bezier curve mouse movement
```typescript
function cubicBezierPoint(p0, p1, p2, p3, t): number { ... }
async function bezierMove(page, x0, y0, x1, y1): Promise<void> {
  // 18-40 шагов, контрольные точки с jitter ±100px
  // Переменная скорость: медленнее у начала/конца, быстрее в середине
}
```
- Кривые Безье между случайными точками на экране
- Переменная скорость движения (slow start/end — human overshoot)
- **Нет зависимостей** — реализовано напрямую

### 4. Scroll simulation
```typescript
async function humanScroll(page, vh): Promise<void> {
  // Читает 35-85% страницы
  // Чанки ~40% viewport, Gaussian-distributed
  // 25% шанс micro-scrollback (имитация перечитывания)
  // Возврат вверх после прочтения
}
```
- Страница читается перед extraction (не сразу берём данные)
- Случайная глубина чтения каждый раз
- Micro-scrollback = самый убедительный паттерн человека

### 5. Viewport randomization
```typescript
const vw = 1240 + Math.floor(Math.random() * 120)  // 1240-1360
const vh = 860 + Math.floor(Math.random() * 100)   // 860-960
```
- Каждая сессия — другой размер окна
- Fingerprint diversification

### 6. URL shuffle
```typescript
const urls = [...URLS].sort(() => Math.random() - 0.5)
```
- Непредсказуемый порядок посещения
- Нет паттерна "всегда в одном порядке"

### 7. Timezone = proxy location
- Webshare proxies — US → `timezoneId: 'America/New_York'`
- Несоответствие timezone и IP = сильный сигнал бота

---

## Стек для scraper (текущий)

| Компонент | Выбор | Причина |
|-----------|-------|---------|
| Browser automation | **Patchright** | CDP leak fix, drop-in Playwright replacement |
| Profile | `launchPersistentContext` + copied Chrome profile | Сохранение LinkedIn cookies |
| Runtime | **Node.js** + `--experimental-strip-types` | Bun не может spawn Chrome subprocess (зависает) |
| Proxies | Webshare residential (1GB shared) | Ротация IP |
| Mouse | Custom Bezier (no deps) | Нет ESM-проблем с ghost-cursor |

---

## Известные рабочие прокси (Webshare, 2026-03-09)

```
107.172.163.27:6543:jckdvgtm:qlb0tmbu0i26   ✓ confirmed
142.111.67.146:5611:jckdvgtm:qlb0tmbu0i26   ✓ confirmed
198.23.239.134:6540:jckdvgtm:qlb0tmbu0i26   ✗ bandwidth exhausted
31.59.20.176:6754:jckdvgtm:qlb0tmbu0i26     ✗ no response
216.10.27.159:6837:jckdvgtm:qlb0tmbu0i26    ✗ no response
```
Shared 1GB bandwidth — экономить: блокировать image/media/font/stylesheet в `page.route()`

---

## Дополнительные техники (не реализованы, но известны)

- **ghost-cursor-play** / **ghost-cursor-playwright** — npm, Bezier мышь без ручной реализации
- **humanization-playwright** — Python lib, более полная гуманизация (typing, drag)
- **playwright-stealth** (playwright-extra) — патч navigator.webdriver и др., но не против Cloudflare
- **Профиль fingerprinting** — randomize canvas fingerprint, WebGL renderer, fonts list
- **Session cookies** (`li_at`) — использовать куки напрямую вместо persistent profile
- **Residential proxy rotation** — новый IP каждые N запросов (не shared bandwidth)

---

## Важно для Harkly pipeline

Этот scraper используется для сбора сигналов UX/CX researcher pain points с LinkedIn.
Output: `nospace/tools/linkedin-scraper/linkedin-results.json`
Далее: Phase 2 (Perplexity ONE SHOT) → Phase 3 (JTBD Canvas) → Phase 4 (Opportunity Scores) → Phase 5 (OST)

Если сессия слетит (AUTH_WALL) → nopoint должен вручную зайти в LinkedIn в Chrome,
затем перекопировать Default профиль в PlaywrightProfile.
