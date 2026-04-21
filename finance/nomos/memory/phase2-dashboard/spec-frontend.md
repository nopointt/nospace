# Spec: Frontend (nomos-web)

> Target: G3 Player — gropius (SolidJS/Tailwind specialist)
> References: `CONTEXT.md` (D-01..D-10), `spec-design-tokens.md`, `spec-backend.md` (API contract)
> Pre-inline: CONTEXT.md + design-tokens + backend endpoints list

---

## Stack

| Component | Choice | Version |
|---|---|---|
| Framework | SolidJS | ≥1.9 |
| Build | Vite | ≥5.4 |
| Styles | Tailwind CSS | ≥4.0 |
| Router | @solidjs/router | ≥0.14 |
| State | Solid signals + stores | builtin |
| Charts | uPlot | ≥1.6 |
| Icons | lucide-solid | ≥0.4 |
| Fetch | native fetch + custom `api.ts` wrapper | |
| Package mgr | bun | ≥1.0 |
| Deploy | wrangler pages | latest |

---

## Directory layout

```
finance/nomos/web/
├── package.json
├── bun.lockb
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .env.example
├── public/
│   └── favicon.svg          # Bauhaus geometric mark
├── src/
│   ├── main.tsx             # createRoot
│   ├── App.tsx              # Router + layout
│   ├── index.css            # Tailwind + design tokens
│   ├── lib/
│   │   ├── api.ts           # typed client (see CONTRACT)
│   │   ├── auth.ts          # bearer token, localStorage
│   │   ├── sse.ts           # EventSource wrapper, reconnect
│   │   ├── format.ts        # money/date/pair formatters
│   │   └── types.ts         # mirrors backend pydantic models
│   ├── stores/
│   │   ├── balance.ts
│   │   ├── trades.ts
│   │   ├── strategies.ts
│   │   ├── risk.ts
│   │   └── runner.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    # header + sidebar + main
│   │   │   ├── Nav.tsx
│   │   │   └── HaltBanner.tsx
│   │   ├── primitives/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Stat.tsx
│   │   │   └── Modal.tsx
│   │   ├── charts/
│   │   │   ├── Candlestick.tsx
│   │   │   ├── PnLSparkline.tsx
│   │   │   └── AllocationPie.tsx
│   │   └── feed/
│   │       └── LiveTickFeed.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Overview.tsx
│   │   ├── Trades.tsx
│   │   ├── Strategies.tsx
│   │   ├── StrategyDetail.tsx   # /strategies/:name
│   │   ├── Portfolio.tsx
│   │   ├── Charts.tsx
│   │   ├── Risk.tsx
│   │   ├── RemizovODE.tsx
│   │   └── Settings.tsx
│   └── assets/
│       └── fonts/               # JetBrains Mono (if self-hosted)
└── tests/
    └── e2e/                     # Playwright
```

---

## Routing (@solidjs/router)

```tsx
<Router>
  <Route path="/login" component={Login} />
  <Route path="/" component={AppShell}>
    <Route path="/" component={Overview} />
    <Route path="/trades" component={Trades} />
    <Route path="/strategies" component={Strategies} />
    <Route path="/strategies/:name" component={StrategyDetail} />
    <Route path="/portfolio" component={Portfolio} />
    <Route path="/charts" component={Charts} />
    <Route path="/risk" component={Risk} />
    <Route path="/remizov" component={RemizovODE} />
    <Route path="/settings" component={Settings} />
  </Route>
</Router>
```

Auth guard on AppShell: if no token → redirect /login.

---

## Pages — content spec

### 1. Overview (`/`)

**Above the fold:**
- Runner status pill: green "running" or red "stopped" + Start/Stop button
- Halt banner (red, full-width) if `risk.halt_active`
- 4 Stat cards: Total Balance USD, Daily P&L %, Weekly P&L %, Total P&L %
- Live tick feed (right column): scrolling list of latest 20 journal events

**Below:**
- Per-strategy mini-row: name + trades + latest signal + enabled toggle
- Current positions: table (strategy × pair → state LONG/FLAT + open since)

### 2. Trades (`/trades`)

- Filter bar: strategy dropdown, pair dropdown, side (BUY/SELL/ALL), date range
- Virtual checkbox (include/exclude Cramer)
- Table columns: Date, Strategy, Pair, Side, Amount, Price, Cost, Type (real/virtual), OrderID, Meta (expandable)
- CSV export button → `GET /api/trades.csv?...`
- Pagination (100/page, cursor by ts)

### 3. Strategies (`/strategies`)

- Cards grid (1 per strategy): name, timeframe, pairs, enabled toggle, trades count, last signal, position state per pair
- Click → `/strategies/:name` detail

### 4. StrategyDetail (`/strategies/:name`)

- Full stats + per-pair position state
- Last 50 signals (table)
- Per-pair P&L computed from buy/sell pairs
- Enable/disable toggle

### 5. Portfolio (`/portfolio`)

- Pie chart: allocation by asset (USDT/BTC/ETH/BNB) as % of total USD
- Table: asset, free, locked, USD value, %
- Total equity number prominent

### 6. Charts (`/charts`)

- Pair selector: BTC/USDT | ETH/USDT
- Timeframe selector: 5m / 1h / 4h / 1d
- uPlot candlestick with:
  - Real trades as dots (blue=BUY, red=SELL, size by amount)
  - Virtual Cramer as outlined dots
  - EMA50 overlay (from strategy indicators)

### 7. Risk (`/risk`)

- 3 drawdown gauges (day/week/total) — SVG arc, red fill at threshold
- Halt status card: active/inactive + manual HALT button (with reason input modal)
- History of halt events (ts, reason, resumed_at)

### 8. RemizovODE (`/remizov`)

- 3 line charts stacked:
  - `p` (damping coefficient) over last 500 ticks, threshold lines at 0.1 and 0
  - `R²` (fit quality) over last 500 ticks, threshold 0.6 / 0.78
  - `slope` (log-price trend) over last 500 ticks, threshold 5e-4
- Overlay: vertical lines where BUY/SELL signal fired
- Pair selector

### 9. Settings (`/settings`)

- Runner config editor (JSON textarea with validation)
- Risk thresholds (3 number inputs)
- Cramer mode toggle
- Pairs multi-select
- Timeframe per strategy
- Save → `PUT /api/runner/config` → runner restart

---

## API client (`lib/api.ts`)

Typed wrapper per backend endpoint. Example:

```typescript
import type { Trade, Balance, StrategyStats } from "./types";

class ApiClient {
  constructor(private baseUrl: string, private token: () => string) {}

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token()}`,
        ...init?.headers,
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }

  balance = () => this.req<Balance>("/api/balance");
  trades = (q: TradesQuery) => this.req<Trade[]>(`/api/trades?${new URLSearchParams(q)}`);
  strategies = () => this.req<StrategyStats[]>("/api/strategies");
  runnerStart = () => this.req<void>("/api/runner/start", { method: "POST" });
  runnerStop = () => this.req<void>("/api/runner/stop", { method: "POST" });
  halt = (reason: string) =>
    this.req<void>("/api/halt", { method: "POST", body: JSON.stringify({ reason }) });
  resume = () => this.req<void>("/api/halt", { method: "DELETE" });
  // ...
}
```

---

## SSE client (`lib/sse.ts`)

```typescript
import { createSignal } from "solid-js";

export function createLiveStream(token: () => string) {
  const [latest, setLatest] = createSignal<StreamEvent[]>([]);
  let es: EventSource | null = null;
  let retry = 1000;

  const connect = () => {
    es = new EventSource(`${BASE_URL}/api/live/stream?token=${token()}`);
    es.onmessage = (e) => {
      const evt = JSON.parse(e.data);
      setLatest((prev) => [evt, ...prev].slice(0, 100));
      retry = 1000;
    };
    es.onerror = () => {
      es?.close();
      setTimeout(connect, Math.min(retry *= 2, 30000));
    };
  };
  connect();

  return { latest, close: () => es?.close() };
}
```

Note: EventSource doesn't support custom headers → token via query string (backend accepts both).

---

## Design token integration (Tailwind 4)

`tailwind.config.ts` reads from `src/index.css` where tokens are CSS variables. See `spec-design-tokens.md` for full token list.

Example usage:

```tsx
<button class="bg-accent text-white hover:bg-accent-hover px-4 py-2">
  Halt runner
</button>
```

---

## E2E tests (Playwright)

Minimum suite:

1. `login.spec.ts` — wrong token → error, correct token → redirect to /
2. `overview.spec.ts` — loads, shows runner status, balance visible
3. `runner-control.spec.ts` — click Stop → confirms runner stopped
4. `halt.spec.ts` — click Halt → modal → reason → banner appears
5. `trades-csv.spec.ts` — download CSV, verify content

---

## Task breakdown for G3 Player

1. **Scaffolding** (Phase 2A task 2.4)  
   Action: `bun create vite@latest finance/nomos/web --template solid-ts`, install tailwind, create AppShell skeleton, hello-world route.  
   Verify: `bun run dev` → localhost:5173 shows "Nomos" page.  
   Done when: tailwind classes work, route navigates.

2. **Design tokens → Tailwind**  
   Action: apply tokens from `spec-design-tokens.md` to index.css + tailwind.config.  
   Verify: `div` with `bg-primary-blue` has correct color (inspect DevTools).  
   Done when: all 4 color groups, typography scale, spacing visible in demo page.

3. **Auth flow + API client**  
   Action: Login page, localStorage token, `lib/api.ts`.  
   Verify: Login with wrong token → error; correct → redirect.  
   Done when: protected routes require auth.

4-11. (1 page per task, sequential)  
12. **Polish + E2E**  
    Action: mobile responsive, E2E tests, a11y audit.  
    Done when: Playwright suite green.

---

## Phase Zero for G3 Player (C6)

Before coding, Player must:
1. Read `nospace/design/contexter/` — ALL guidelines (color, typo, spacing, layout, elevation, motion, data-viz)
2. Read `spec-design-tokens.md` — Nomos-specific adaptations
3. Query Bauhaus RAG (`POST /api/rag/query` or direct Qdrant) for "primary triad", "Kandinsky yellow red blue", "Itten color theory"
4. Report understanding of: Bauhaus color language, Swiss grid, semantic mapping (red=danger etc.)
5. Confirm design direction with Domain Lead before first Tailwind config

---

## Definition of Done (frontend)

- 8 pages rendering with live backend data
- Auth gate works
- SSE delivers live updates (verified in DevTools)
- Runner control buttons work end-to-end
- Mobile tested at 375px
- Playwright suite green
- Deployed to `https://nomos.contexter.cc`
- Lighthouse score ≥90 performance, ≥95 accessibility
