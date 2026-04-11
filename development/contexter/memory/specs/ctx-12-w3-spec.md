---
# ctx-12-w3-spec.md — CTX-12 Wave 3 Master Spec
> Epic: CTX-12 Supporters Backend
> Wave: 3 — Frontend Integration (replace hardcoded data with live API)
> Author: Axis
> Mode: Autonomous G3 (Sonnet Player + Sonnet Coach)
> Precedent: Wave 1 (10 commits deployed) + Wave 2 (10 commits deployed) — backend complete
---

## Context (inlined per C7)

### Stack
- Frontend: **SolidJS** (NOT React), Vite bundler, Tailwind CSS, TypeScript strict
- Router: `@solidjs/router`
- i18n: custom `t("key")` from `src/lib/i18n.ts`, keys in `src/lib/translations/{en,ru}.ts`
- Auth: `lib/store.ts` — `auth()` signal, `isAuthenticated()`, `getToken()`; uses localStorage key `contexter_auth`; better-auth session cookie sent via `credentials: "include"`
- API client: `lib/api.ts` — `api<T>(path, opts)` helper, base URL from `VITE_API_URL` env or `https://api.contexter.cc`
- Deploy: **Cloudflare Pages** at `contexter.cc` (Axis handles, not via `ops/deploy.sh`)
- Repo path: `C:\Users\noadmin\nospace\development\contexter\web\`

### Live backend endpoints (W1+W2, deployed)
- `GET /api/supporters` — public leaderboard, returns `{supporters: [{rank, tier, tokens, displayName, joinedAt, status}], totalCount, thresholds}`
- `GET /api/supporters/me` — authed self status (401 unauth), returns `{isSupporter: false}` OR `{isSupporter: true, rank, tier, tokens, status, warningSentAt, freezeStart, freezeEnd, joinedAt}`
- `POST /api/supporters/freeze` — activate freeze (401 unauth, 403 not-supporter, 409 already/annual, 200 ok)

### Existing frontend state
- `web/src/pages/Supporters.tsx` (804 lines) has `SUPPORTERS_DATA` hardcoded array (line 376) with 8 demo supporters. `LeaderboardSection` component at line 394 renders via `<For each={SUPPORTERS_DATA}>`.
- Hardcoded `92 spotsLeft` at line 443.
- `web/src/pages/Landing.tsx` may have a smaller supporters teaser with `8/100` counter (spec-hinted; Player should verify).
- `web/src/pages/Dashboard.tsx` (379 lines) — authed user dashboard, imports `auth`, `isAuthenticated`, uses SolidJS primitives `createSignal, createEffect, onMount, Show, For`.
- `web/src/components/` has `Badge`, `Button`, `Nav`, `Toast`, `ErrorState`, `EmptyState`, etc.
- i18n keys starting with `supporters.leaderboard.*` already exist (see `web/src/lib/translations/en.ts` lines 618+).

### Existing api.ts pattern (inline for Player reference)
```ts
export const API_BASE = import.meta.env.VITE_API_URL || "https://api.contexter.cc"

async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...opts.headers }
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`
  if (typeof opts.body === "string") headers["Content-Type"] = "application/json"
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body,
    credentials: "include",
  })
  if (res.status === 401) {
    localStorage.removeItem("contexter_auth")
    throw new Error("Session expired — please sign in again")
  }
  if (!res.ok) { /* parse + throw */ }
  return res.json()
}
```

### LS checkout URLs (for W3-05)
Existing checkout links in the frontend point to `pay.contexter.cc/...`. The spec's W3-05 task is to APPEND `?checkout[custom][user_id]=<userId>` to these URLs when the user is logged in — matches W1 matchSupporter primary path (custom_data.user_id beats email).

LemonSqueezy custom checkout data docs: the URL parameter format is `?checkout[custom][user_id]=X` or via JS SDK `checkout({ checkoutData: { custom: { user_id: X } } })`. Frontend uses URL params (simpler, no SDK change needed).

---

## Scope

**IN SCOPE for W3 (5 atomic tasks):**
- W3-01: Leaderboard — fetch `/api/supporters`, replace `SUPPORTERS_DATA` in Supporters.tsx, handle loading/error/empty states
- W3-02: Dynamic counter — replace hardcoded `92 spotsLeft` and Landing `8/100` with API `totalCount` → `100 - totalCount` spots left, `totalCount/100` taken
- W3-03: Dashboard supporter section — new component `SupporterStatusCard` shown to authed users who are supporters. Rank, tier, tokens, freeze button (POST /api/supporters/freeze)
- W3-04: "Supporter #N" badge in Nav — small badge near user profile icon/menu when `isSupporter && rank !== null`
- W3-05: Pass `user_id` in checkout URLs for logged-in users — update all `pay.contexter.cc/...` links to append `?checkout[custom][user_id]=<userId>` when `auth()?.userId` present

**OUT OF SCOPE (do NOT touch):**
- Backend (W1+W2 complete, deployed)
- W4 task submission UI, admin review UI, rev share math
- W5 legal/polish, token expiry, anti-abuse
- `web/src/pages/Dashboard.tsx` beyond adding the new supporter card (don't refactor unrelated sections)
- Better-auth changes
- `ops/deploy.sh`
- Backend routes (no changes to api.contexter.cc)
- New dependencies (no npm install unless absolutely needed — all W3 work should fit within existing SolidJS primitives)

---

## Hard constraints (J3 CRITICAL + UI specifics)

- Immutability (H1), files <800 lines (Supporters.tsx is already 804 — if W3-01 pushes it over 850, EXTRACT the `LeaderboardSection` into `web/src/components/SupportersLeaderboard.tsx`)
- Functions <50 lines typical
- No `any` types — use proper TypeScript types matching backend response shapes
- No inline `fetch()` — use the `api<T>()` helper from `lib/api.ts` (add new functions there)
- No breaking changes to existing pages — `/supporters`, `/dashboard`, `/` (Landing) must continue to render for both authed and unauthed users
- No secret logging, no PII in URLs or localStorage beyond what's already there
- Loading states: show skeleton or spinner, NOT "Loading..." text
- Error states: use existing `ErrorState` component pattern from `web/src/components/`
- Empty states: use existing `EmptyState` pattern; for leaderboard empty = "Be the first supporter" CTA
- i18n: ALL user-facing strings must go through `t("supporters.w3.*")` keys added to BOTH `en.ts` AND `ru.ts`. Russian keys should be natural Russian, not transliteration.
- Light theme default (D3) — NO dark mode
- Design consistency: match existing Supporters.tsx visual language (Swiss/Bauhaus style, text-[14px]/text-[12px] sizes, `border-border-default`, `text-text-tertiary`, `text-accent`, etc.)

---

## Phase Zero for Wave 3 (J7 MANDATORY)

Before any code, the Player MUST:
1. Read `memory/specs/ctx-12-w3-spec.md` (this file, full)
2. Read `memory/ctx-12-autonomous-report.md` for W1+W2 backend state
3. Read files that will be touched:
   - `web/src/pages/Supporters.tsx` (804 lines — read fully)
   - `web/src/pages/Landing.tsx` (for W3-02 counter hook)
   - `web/src/pages/Dashboard.tsx` (for W3-03 supporter card insertion point)
   - `web/src/components/Nav.tsx` (for W3-04 badge)
   - `web/src/lib/api.ts` (for W3-01/W3-03 API client functions to add)
   - `web/src/lib/store.ts` (for userId access)
   - `web/src/lib/i18n.ts` (t function signature)
   - `web/src/lib/translations/en.ts` (existing supporter keys — lines 618+)
   - `web/src/lib/translations/ru.ts` (Russian equivalents)
   - Existing `Badge`, `ErrorState`, `EmptyState`, `Button`, `Toast` component props
4. Report understanding checklist:
   - Framework primitives used in this codebase (`createResource` vs `createSignal+onMount`)
   - Where checkout URLs are defined (grep for `pay.contexter.cc`)
   - Does Dashboard already have auth-gated sections?
   - Does Nav render differently for authed vs unauthed users?
5. Find and report ALL hardcoded locations that need replacing:
   - SUPPORTERS_DATA in Supporters.tsx
   - "92" spotsLeft count
   - "8/100" counter in Landing (if exists — confirm)
   - Any other `SUPPORTERS_DATA`-like demo constants

---

## Tasks

### W3-01 — Leaderboard: fetch live data from /api/supporters

**Action:**

1. Add new type + function to `web/src/lib/api.ts`:
   ```ts
   export interface SupporterRow {
     rank: number
     tier: "diamond" | "gold" | "silver" | "bronze" | "pending"
     tokens: number
     displayName: string
     joinedAt: string  // ISO timestamp
     status: string
   }
   export interface TierThreshold { maxRank: number }
   export interface LeaderboardResponse {
     supporters: SupporterRow[]
     totalCount: number
     thresholds: Record<string, TierThreshold>
   }
   export function getSupportersLeaderboard() {
     return api<LeaderboardResponse>("/api/supporters")
   }
   ```
   - NO `token` param — endpoint is public, no auth cookie needed.

2. In `web/src/pages/Supporters.tsx`:
   - DELETE `SUPPORTERS_DATA` constant (line 376).
   - Convert `LeaderboardSection` from pure render to reactive component using `createResource`:
     ```ts
     const LeaderboardSection: Component = () => {
       const [data] = createResource(() => getSupportersLeaderboard())
       return (
         <section id="leaderboard" ...>
           <Container>
             {/* header + title stay */}
             <Show
               when={!data.loading && !data.error && data()?.supporters}
               fallback={<LeaderboardFallback loading={data.loading} error={data.error} />}
             >
               {/* table header + For loop over data().supporters */}
             </Show>
           </Container>
         </section>
       )
     }
     ```
   - Tier display: map lowercase tier from API (`"diamond"`) to display label (`"Diamond"`) — small helper `tierLabel(tier)` inside the component. Preserve existing `tierColor` helper but update its input to accept lowercase.
   - Fallback component: show a table-row skeleton with 8 placeholder rows while loading; show `ErrorState` on error with retry button; show "Be the first" CTA when `totalCount === 0`.
   - When data is loaded but `totalCount === 0`: show a single "Be the first supporter" row linking to `#join`.

3. If Supporters.tsx grows past 850 lines, extract `LeaderboardSection` into `web/src/components/SupportersLeaderboard.tsx` — keep spec compliance. Player decides based on actual growth.

4. Add i18n keys to BOTH `en.ts` and `ru.ts`:
   ```
   supporters.leaderboard.loading: "Loading leaderboard..." / "Загружаем доску почёта..."
   supporters.leaderboard.error: "Failed to load leaderboard" / "Не удалось загрузить доску почёта"
   supporters.leaderboard.retry: "Retry" / "Повторить"
   supporters.leaderboard.empty.title: "Be the first supporter" / "Будьте первым поддержавшим"
   ```
   Do NOT duplicate existing keys like `supporters.leaderboard.title`, `supporters.leaderboard.col.rank`.

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter/web && bunx tsc --noEmit 2>&1 | tail -10
# Expected: 0 new errors (pre-existing errors are OK if not caused by W3 edits)
```

```bash
cd C:/Users/noadmin/nospace/development/contexter/web && bun run build 2>&1 | tail -5
# Expected: `build` completes, emits dist/
```

**Done when:**
- [ ] `SUPPORTERS_DATA` constant removed
- [ ] `getSupportersLeaderboard()` exists in api.ts
- [ ] LeaderboardSection renders loading → data / empty / error states
- [ ] i18n keys added to en + ru
- [ ] tsc clean, build succeeds
- [ ] File size under 850 lines (or extracted to component)

**Commit:** `feat(ctx12-w3-01): live leaderboard fetch from /api/supporters`

---

### W3-02 — Dynamic counter replaces hardcoded "92 spotsLeft" + Landing "8/100"

**Action:**

1. Find all hardcoded counter spots via grep:
   ```bash
   grep -rn "spotsLeft\|8/100\|92\s*{\|8\s*{" web/src/pages/Supporters.tsx web/src/pages/Landing.tsx web/src/pages/Hero.tsx
   ```

2. Add a small reactive helper in the Supporters.tsx page (or as a hook if easier): share the leaderboard response from W3-01. Options:
   - Option A: Each consumer (Leaderboard, Hero spotsTaken, Landing teaser) independently calls `getSupportersLeaderboard()`. Simple but duplicates the request.
   - Option B: Lift the resource to a shared store (e.g., new `lib/supporters-store.ts` with a single `createResource` memoized by route).
   - **Player decision:** Prefer Option A for simplicity — `createResource` is cached per component instance but that's fine for a page load. If duplication becomes painful, consider Option B. Document your choice in the commit.

3. Update each consumer:
   - Supporters.tsx leaderboard `92 spotsLeft` → `${100 - totalCount} spotsLeft` (with Show fallback to "…" while loading)
   - Supporters.tsx hero section `supporters.hero.spotsTaken` (line 630) — current count display
   - Landing.tsx supporters teaser — find `8/100` counter or similar, replace with dynamic
   - Any other hardcoded spot counts

4. If `totalCount === 100` (sold out), show a different copy — reuse an existing i18n key or add `supporters.counter.soldOut`.

**Verify:**
```bash
# grep must return NO hardcoded numbers in a "spots" context:
cd C:/Users/noadmin/nospace/development/contexter && grep -rn "92.*spotsLeft\|8/100" web/src/pages/ 2>&1 | head
# Expected: empty

cd C:/Users/noadmin/nospace/development/contexter/web && bun run build 2>&1 | tail -5
# Expected: build succeeds
```

**Done when:**
- [ ] No hardcoded `92` or `8/100` in supporter-related copy
- [ ] Counter updates when API returns data
- [ ] Loading fallback doesn't flash "-92" or negative numbers
- [ ] Sold-out state handled (>= 100 case)
- [ ] tsc clean, build succeeds

**Commit:** `feat(ctx12-w3-02): dynamic spots counter from totalCount`

---

### W3-03 — Dashboard supporter section with freeze button

**Action:**

1. Add to `web/src/lib/api.ts`:
   ```ts
   export interface SupporterMeNotSupporter { isSupporter: false }
   export interface SupporterMeSupporter {
     isSupporter: true
     rank: number | null
     tier: "diamond" | "gold" | "silver" | "bronze" | "pending"
     tokens: number
     status: "active" | "warning" | "frozen" | "quarantined" | "exiting"
     warningSentAt: string | null
     freezeStart: string | null
     freezeEnd: string | null
     joinedAt: string
   }
   export type SupporterMeResponse = SupporterMeNotSupporter | SupporterMeSupporter

   export function getSupporterMe() {
     return api<SupporterMeResponse>("/api/supporters/me")
   }
   export function activateFreeze() {
     return api<{ ok: true; freezeStart: string; freezeEnd: string }>(
       "/api/supporters/freeze",
       { method: "POST" }
     )
   }
   ```

2. Create `web/src/components/SupporterStatusCard.tsx` — new SolidJS component rendering:
   - Rank badge "#N" (or "Pending" if rank null)
   - Tier label with color
   - Tokens count, big bold number
   - Status pill (active / warning / frozen / quarantined / exiting) with appropriate color
   - If status is `"warning"`: show `warningSentAt` formatted + copy "Pay to keep your rank"
   - If status is `"frozen"`: show `freezeEnd` as "Unfreezes on {date}", hide freeze button
   - If status is `"active"` or `"warning"` and not frozen: show "Activate freeze" button — opens confirm dialog → calls `activateFreeze()` → refreshes data
   - If status is `"quarantined"`: show "Quarantined — reach rank 100 to activate" copy
   - Error handling: freeze API errors (409 → "Already used this year", 403 → shouldn't happen, 500 → generic)

3. Insert `SupporterStatusCard` into `web/src/pages/Dashboard.tsx`:
   - Near the top of the main content area, after nav and before documents list
   - Only render if `isAuthenticated()` — use `<Show when={isAuthenticated()}>`
   - Inside the card's own mount logic, fetch `/me` via `createResource`; if `isSupporter === false`, render NOTHING (no card at all) — don't show "you're not a supporter" clutter on Dashboard for non-supporters
   - If error loading, render nothing silently (Dashboard is core UX; supporter card is supplementary)

4. Add i18n keys (en + ru) — minimum set:
   - `supporters.status.label`
   - `supporters.status.rank`
   - `supporters.status.tier`
   - `supporters.status.tokens`
   - `supporters.status.freezeButton`
   - `supporters.status.freezeConfirm` (body of confirm dialog)
   - `supporters.status.frozen` ("Frozen until {date}")
   - `supporters.status.warning` ("Pay to keep your rank")
   - `supporters.status.quarantined` ("Climb to rank 100")
   - `supporters.status.freezeErrorAnnual` ("Freeze already used this year")
   - `supporters.status.freezeErrorGeneric`

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter/web && bunx tsc --noEmit 2>&1 | tail -10
# Expected: 0 new errors

cd C:/Users/noadmin/nospace/development/contexter/web && bun run build 2>&1 | tail -5
# Expected: build succeeds
```

Manual verify (optional if time permits — Axis will do full browser smoke after deploy):
- Mock login (or use nopoint's account) → Dashboard → supporter card visible if nopoint is a supporter
- Click freeze → confirm dialog → POST → card updates

**Done when:**
- [ ] `getSupporterMe` + `activateFreeze` in api.ts with explicit types (no `any`)
- [ ] `SupporterStatusCard.tsx` component exists, <250 lines
- [ ] Dashboard renders card only for authed supporters (isSupporter === true)
- [ ] All status variants handled (active, warning, frozen, quarantined, exiting)
- [ ] Freeze button with confirm + error handling
- [ ] i18n en + ru
- [ ] tsc clean, build succeeds

**Commit:** `feat(ctx12-w3-03): Dashboard supporter status card with freeze`

---

### W3-04 — "Supporter #N" badge in Nav

**Action:**

1. In `web/src/components/Nav.tsx`, add a small reactive fetch for `/api/supporters/me` (only if `isAuthenticated()`). Render a `Badge` component with "Supporter #N" next to the profile icon/menu when `isSupporter === true && rank !== null`.

2. Implementation notes:
   - Use `createResource` inside Nav, same pattern as Dashboard
   - If Nav already does a supporter fetch (e.g., if W3-03 lifted to a global store), reuse that resource — don't duplicate requests across the page. Player decides: duplicate ok for W3, extract to store if Nav becomes complex.
   - Badge styling: match existing Badge component's `variant` prop — likely `"accent"` or `"neutral"`. Use Swiss/Bauhaus aesthetic, JetBrains Mono for the rank number.
   - If `rank === null` (pending tier, cron hasn't run yet) — show "Supporter" without `#N` or hide entirely. Player decides based on visual weight.

3. i18n:
   - `supporters.nav.badge`: "Supporter" / "Поддержавший"
   - Rank number stays numeric, no i18n needed

**Verify:**
```bash
cd C:/Users/noadmin/nospace/development/contexter/web && bunx tsc --noEmit 2>&1 | tail -5
cd C:/Users/noadmin/nospace/development/contexter/web && bun run build 2>&1 | tail -5
```

**Done when:**
- [ ] Nav renders "Supporter #N" badge when authed supporter
- [ ] No flash of wrong state during load (use `Show` guard)
- [ ] Works on mobile nav (if Nav has mobile variant)
- [ ] tsc clean, build succeeds

**Commit:** `feat(ctx12-w3-04): Supporter rank badge in Nav`

---

### W3-05 — Pass user_id as custom_data in checkout URLs

**Action:**

1. Find all `pay.contexter.cc` URL references:
   ```bash
   cd C:/Users/noadmin/nospace/development/contexter && grep -rn "pay.contexter.cc\|lemonsqueezy.com/checkout\|lemonsqueezy.com/buy" web/src/ web/index.html 2>&1
   ```

2. For each checkout URL (Supporter, Starter, Pro products), wrap in a helper function `buildCheckoutUrl(baseUrl: string): string` in `web/src/lib/api.ts` (or a new `lib/checkout.ts`):
   ```ts
   import { auth } from "./store"

   export function buildCheckoutUrl(baseUrl: string): string {
     const userId = auth()?.userId
     if (!userId) return baseUrl
     const sep = baseUrl.includes("?") ? "&" : "?"
     // LemonSqueezy: ?checkout[custom][user_id]=X — encode the bracket keys
     const params = new URLSearchParams()
     params.set("checkout[custom][user_id]", userId)
     return `${baseUrl}${sep}${params.toString()}`
   }
   ```
   Note: URLSearchParams will encode `[` and `]` — that's fine, LemonSqueezy accepts URL-encoded bracket keys.

3. Update ALL checkout link usages:
   - Static `<a href="pay.contexter.cc/...">` → convert to reactive: use SolidJS `href={buildCheckoutUrl("...")}` where the signal re-evaluates when `auth()` changes
   - Lemon.js overlay: `LemonSqueezy.Url.Open("...")` — wrap in helper too
   - Landing.tsx pricing buttons
   - Supporters.tsx hero CTA
   - Supporters.tsx join section CTA
   - Any other checkout entry points

4. Verify the helper handles:
   - Unauthed user: returns baseUrl unchanged
   - Authed user with userId: appends params correctly
   - Base URL with existing query string: uses `&` separator, not `?`

**Verify:**
```bash
# No bare pay.contexter.cc URLs in TSX (all go through helper):
cd C:/Users/noadmin/nospace/development/contexter && grep -rn 'pay\.contexter\.cc' web/src/ 2>&1 | grep -v 'buildCheckoutUrl\|checkout.ts\|// ' | head
# Expected: empty (or only the helper file itself and comments)

cd C:/Users/noadmin/nospace/development/contexter/web && bun run build 2>&1 | tail -5
# Expected: build succeeds

# Manual regex sanity check for the generated dist:
cd C:/Users/noadmin/nospace/development/contexter/web && grep -l "checkout%5Bcustom%5D" dist/assets/*.js 2>&1 | head
# Expected: at least 1 file contains the encoded param key (means helper is in the bundle)
```

**Done when:**
- [ ] `buildCheckoutUrl` helper exists
- [ ] All checkout URLs go through helper
- [ ] No bare `pay.contexter.cc` strings remain in TSX (except helper + docs)
- [ ] Unauthed and authed both work (helper returns valid URLs in both cases)
- [ ] Build output contains encoded `checkout[custom][user_id]` param
- [ ] tsc clean, build succeeds

**Commit:** `feat(ctx12-w3-05): pass user_id as LS custom_data on checkout`

---

## Post-W3 Deploy Plan (Axis, manual)

Frontend is on Cloudflare Pages, not Docker. Steps:
1. Local smoke: `cd web && bun run build` → confirm dist emits
2. Local browser smoke via `bun run preview` if possible (Axis will do this)
3. Deploy: `cd web && bunx wrangler pages deploy dist --project-name=contexter` (or per existing deploy script — Axis will check `ops/deploy-web.sh` if present)
4. Post-deploy verify:
   - `curl https://contexter.cc/supporters` → 200 HTML
   - Visual smoke via Playwright or manual: leaderboard shows "Be the first" empty state (no real supporters yet), counter shows `0/100`
   - Click Supporter checkout CTA → verify URL contains `checkout%5Bcustom%5D%5Buser_id%5D=...` if logged in
5. Monitor CF Pages analytics for errors in the first 5 minutes

If any task fails in prod smoke, rollback is `wrangler pages deployment list` → previous deployment → `wrangler pages deployment rollback`.

---

## Coach 8-Dimension POST-REVIEW

Standard 8 dims + W3-specific:
- **Reactivity correctness**: `createResource` usages don't cause infinite re-runs, don't leak
- **Type safety**: no `any`, no `as any`, explicit response types for API functions
- **i18n completeness**: every new string in both en.ts AND ru.ts, Russian not machine-translated
- **Visual consistency**: match Swiss/Bauhaus existing patterns, no new color tokens, no new fonts
- **No backend changes**: zero edits to api.contexter.cc routes
- **Build success**: `bun run build` exits 0 with no warnings beyond pre-existing

## Out of scope repeat (DO NOT let scope creep)

- NO backend changes
- NO new npm dependencies
- NO dark mode
- NO new routes in `@solidjs/router` (leaderboard is part of existing `/supporters`, status card is part of existing `/dashboard`)
- NO changes to unrelated Dashboard sections
- NO refactoring of Supporters.tsx beyond what W3-01 requires (don't "clean up while I'm here")
- NO changes to Landing.tsx beyond W3-02 counter hook
- NO W4 task submission UI
- NO W5 legal/polish

## End of W3 spec
