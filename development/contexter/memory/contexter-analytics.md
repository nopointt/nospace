---
# contexter-analytics.md — CTX-11 Analytics Epic
> Layer: L3 | Epic: CTX-11 | Status: 🔶 IN PROGRESS
> Created: 2026-04-16 (session 244) | Predecessor: CTX-10 GTM Launch (research), CTX-12 Supporters Backend (complete)
> Foundation: 4 research documents (DEEP-1/3/4 + Methodology SEED) + codebase inventory + DEEP-1 SEED
---

## Goal

Deploy production-grade measurement system for Contexter launch. Answer three questions in real-time from the day of launch:

1. **Which acquisition channel drove this supporter?** — revenue attribution to specific HN post / Reddit thread / PH launch / MCP directory / Dev.to article / GitHub README link.
2. **Where do users drop off between visit and supporter?** — 5-step funnel (landing → register → activate → MCP-connect → pay) with per-step drop-off visibility.
3. **Are users getting value?** — NSM (Weekly Activated Users) of 4 value-core MCP tools + per-tool adoption + error rate + RAG quality score.

Hard deadline: **W1 + W2 + W3 deployed BEFORE CTX-13 Reddit Phase 3 (soft launch)**. UTM attribution data from first-wave supporters is unrecoverable if pipeline not live.

## Foundation Documents (READ these before any W1 implementation)

| Document | Path | Lines | Role |
|---|---|---|---|
| Codebase inventory | `docs/research/contexter-analytics-codebase-inventory-2026-04-16.md` | 131 | Ground truth: 6 payment flows, 12 MCP tools, 8 existing events, PG schema |
| DEEP-1 primary analytics | `docs/research/contexter-analytics-primary-deep-research.md` | 1055 | Platform decision + architecture + code snippets (SolidJS/Hono/CF Worker/LS webhook) + identity graph + migration path |
| DEEP-3 MCP telemetry | `docs/research/contexter-mcp-telemetry-deep-research.md` | ~1000 | 8 MCP events with full attribute specs + sampling strategy + abuse middleware code + OTel mapping |
| DEEP-4 measurement system | `docs/research/contexter-measurement-system-deep-research.md` | 893 | NSM decision + 24 events + guardrails + triggers + hypotheses + MVI + cadence + Sean Ellis schedule |
| SEED primary (platform) | `docs/research/contexter-analytics-seed-research.md` | 429 | 25 signals, 5 gaps (all resolved in DEEP-1) |
| SEED methodology | `docs/research/contexter-analytics-methodology-seed-research.md` | 627 | 38 signals, AARRR+HEART hybrid chosen |

**Pre-inline rule (standard C7):** For every G3 pair launched against this epic, paste the relevant DEEP section directly into the Player prompt. Do NOT rely on "read the file" — agents must have code snippets inline.

## Active Decisions (locked)

- **D-CTX11-01:** NSM = **WAU-A (Weekly Activated Users)** = `COUNT(DISTINCT distinct_id) WHERE event='mcp_tool_called' AND tool_name IN ('search_knowledge','ask_about_document','get_document','summarize_document') AND last 7d`. 4 value-core tools out of 12.
- **D-CTX11-02:** Primary analytics = **PostHog EU Cloud** (`eu.posthog.com`). Free tier 1M events/mo covers 12-18+ months growth. DEEP-1 confidence HIGH 90%.
- **D-CTX11-03:** UTM attribution via **LemonSqueezy `custom_data`** mechanism + sessionStorage → checkout URL → webhook → PG `attribution` table. Zero-cost, ~30 lines JS.
- **D-CTX11-04:** **GoAccess on Caddy** server-side logs = **mandatory**, not optional. 70.6% of AI-referred traffic arrives without HTTP referrer — PostHog misses it entirely. Separate vhost `analytics-internal.contexter.cc` basicauth.
- **D-CTX11-05:** Event taxonomy = **24 events** (16 new + 8 MCP from DEEP-3). All DEEP-3 MCP events preserved verbatim.
- **D-CTX11-06:** **7 Grove Paired Indicators** (guardrails) — every NSM lever paired with counter-metric. Thresholds per DEEP-4 §C.
- **D-CTX11-07:** **12 decision-trigger thresholds** (DEEP-4 §E): PMF check, channel kill/scale, churn spike, activation regression, abuse spike, pricing signals, NSM stall, error rate, RAG quality drop, tier upgrade pressure.
- **D-CTX11-08:** **Ambient delivery** — nopoint and Artem **NEVER** required to log into PostHog to do their job. Delivery via Slack alerts + PostHog daily/weekly Subscriptions (email).
- **D-CTX11-09:** GDPR posture = **PostHog standard mode + CF Worker proxy + `person_profiles: 'identified_only'`**. Anonymous visitors do NOT create person profiles (no PII until identify). Defensible under legitimate interest. NOT formally CNIL-exempt but minimizes data footprint.
- **D-CTX11-10:** `posthog-node` config on Bun (long-running) = **defaults** (`flushAt: 20`, `flushInterval: 10000`). NOT serverless config (`flushAt: 1, flushInterval: 0` is for CF Workers). Call `posthog.shutdown()` on `SIGTERM`.
- **D-CTX11-11:** RAG quality at launch = **offline batch only** (50 samples/week via free judge LLM — NVIDIA NIM or Groq). Online thumbs UI deferred post-100-supporters (<1% explicit feedback rate universally = statistically useless at n=100).
- **D-CTX11-12:** Sampling = `SAMPLE_RATE` env var (0.0-1.0). Default 1.0. Activate at 60% free tier threshold (~500 DAU). Only `mcp_tool_called` is sampled; 7 never-sample events (auth_failed, rate_limit_hit, payment_completed, tool_error, session_started, session_ended, token_created/revoked).
- **D-CTX11-13:** `users.persona_self_reported` field required **pre-launch** (zero-cost collect, impossible to recover retroactively). See pre-CTX11 micro-task.
- **D-CTX11-14:** **19 MUST-HAVE items block launch** (per DEEP-4 §J MVI). 9 SHOULD-HAVE items = W4+ post-MVI. 6 NICE-TO-HAVE post-launch.
- **D-CTX11-15:** Sean Ellis 40% PMF test trigger: `n ≥ 50` supporters with `tenure ≥ 14 days`. Re-run at n=100, n=200. In-app modal primary + Resend email fallback. 7 questions (4 Sean Ellis canonical + 3 Contexter-specific).
- **D-CTX11-16:** NOWPayments crypto events captured as `payment_completed` with `payment_provider: 'nowpayments'` property (secondary alongside LS primary `payment_provider: 'lemonsqueezy'`).
- **D-CTX11-17:** Supporter/subscription lifecycle events (freeze, demotion, quarantine, exit) tracked as `supporter_status_changed` event with `old_status` / `new_status` / `reason` properties. One event covers 5 transitions.
- **D-CTX11-18:** Framework = **AARRR primary + HEART signals** hybrid. AARRR = funnel scaffold. HEART Task Success + Happiness injected into Activation + Retention layers. NOT a separate HEART dashboard.
- **D-CTX11-19:** Weekly RAGAS batch: `faithfulness_mean` + `answer_relevancy_mean` on 50 random-sampled `mcp_tool_called` events (`tool_name IN search_knowledge/ask_about_document/summarize_document`). Free judge: NIM or Groq. Output: `rag_quality_batch_score` event weekly Sunday 00:00 UTC.
- **D-CTX11-20:** MCP client detection via **`User-Agent` header** on SSE upgrade. Patterns: `anthropic-claude-desktop/*` → `"claude"`, `Cursor/*` → `"cursor"`, `openai-gpt/*` → `"chatgpt"`, etc. Store as `mcp_client` property on `mcp_session_started` + all subsequent events via `session_id` join.

## Pre-CTX-11 Micro-task — persona capture + user_registered event

**Why before W1:** `users.persona_self_reported` field is zero-cost to collect at register time but **impossible** to get retroactively from 100 users. `user_registered` event is the NSM funnel anchor — needed even if PostHog not yet wired (can be console.log initially, backfilled to PostHog in W3 via DB backfill). Adding the field + event now means when W1-W3 deploy, first 100 users already have persona data.

### Task 0-1: Add `users.persona_self_reported` column + register form field

**Action:**
- Migration: `ALTER TABLE users ADD COLUMN persona_self_reported TEXT` (nullable, no backfill)
- Register form (SolidJS): add single optional dropdown "Какая у вас основная роль?" with options: "Разработчик / инженер", "Исследователь / аналитик", "Писатель / контент-мейкер", "Консультант / операции", "Другое" + free text. i18n key `register.personaLabel` + `register.personaOptions.*`. Field is optional (`NOT_NULL = false`).
- Backend: receive field on `POST /api/auth/register` and `POST /api/auth/oauth/google/callback`; insert into `users.persona_self_reported` if present.

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
# Migration exists
ls drizzle-pg/0018_*.sql
# Field in schema
grep -n "persona_self_reported" src/db/schema.ts
# Register route handles field
grep -n "persona_self_reported\|personaSelfReported" src/routes/auth.ts src/routes/auth-social.ts
# Test: register with persona → row contains persona_self_reported
curl -X POST http://localhost:3000/api/auth/register -d '{"email":"test@test.com","password":"testpass123","persona_self_reported":"Разработчик"}'
psql $DATABASE_URL -c "SELECT persona_self_reported FROM users WHERE email='test@test.com'"
# Expected: 'Разработчик'
```

**Done when:**
- [ ] Migration 0018 applied on dev; rollback tested
- [ ] Schema.ts reflects new column
- [ ] Register form shows dropdown in RU
- [ ] Backend accepts + persists field on both auth routes (email/password + Google OAuth)
- [ ] Null handling: skipping field does NOT break register
- [ ] Atomic commit: `feat(contexter): users.persona_self_reported for analytics segmentation`
- [ ] GSD-Task trailer: `CTX-11 / Pre-W1 / Task 0-1`

### Task 0-2: console.log `user_registered` event with required properties

**Action:**
- In `src/routes/auth.ts` (after DB insert into users): `console.log(JSON.stringify({ ts: Date.now(), event: 'user_registered', user_id, email_hash: sha256(email), auth_method: 'email_password', persona_self_reported, utm_source_first, utm_source_last, ph_id }))`
- In `src/routes/auth-social.ts` (Google OAuth callback): same structure with `auth_method: 'google_oauth'`
- `utm_source_first`, `utm_source_last`, `ph_id` come from request body (frontend sends them from sessionStorage — to be wired in W2 Task 2-2); for now accept as null

**Verify:**
```bash
# Trigger register, check logs
curl -X POST http://localhost:3000/api/auth/register -d '{"email":"test2@test.com","password":"test","persona_self_reported":"Аналитик"}'
docker logs contexter-app 2>&1 | grep user_registered | tail -1
# Expected: JSON line with event=user_registered, user_id, email_hash, auth_method=email_password, persona_self_reported=Аналитик
```

**Done when:**
- [ ] Event fires on both email/password + Google OAuth signup
- [ ] Required fields present: `event`, `user_id`, `email_hash`, `auth_method`, `persona_self_reported`
- [ ] Null-safe: missing utm/ph_id don't break handler
- [ ] Atomic commit: `feat(contexter): user_registered event logging (pre-PostHog)`
- [ ] GSD-Task: `CTX-11 / Pre-W1 / Task 0-2`

### Task 0-3: Pro tier backend storageLimitBytes = 100 GB (fix drift)

**Action:**
- `src/services/billing.ts`: `TIERS.pro.storageLimitBytes: 50 * 1024^3` → `100 * 1024^3`
- No other changes (UI already shows 100 GB)

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
grep -n "storageLimitBytes" src/services/billing.ts | grep -i pro
# Expected: 100 * 1024 * 1024 * 1024 (or equivalent 107374182400)
bun run build 2>&1 | tail -3
# Expected: built successfully
```

**Done when:**
- [ ] Pro tier backend = 100 GB
- [ ] Build passes
- [ ] Atomic commit: `fix(contexter/billing): Pro tier storage 50GB → 100GB sync with UI`
- [ ] GSD-Task: `CTX-11 / Pre-W1 / Task 0-3`

---

## Waves

### Wave Dependencies

```
Pre-CTX-11 (persona field + user_registered event + Pro tier fix)
    ↓
W1 Foundation (PostHog + CF Worker + PG migration + env + GSC)
    ↓
W2 Frontend (SolidJS posthog-js + UTM + pageviews + identify)
    ↓
W3 Backend (Hono middleware + webhook extension + attribution table writes)
    ↓            ↓
W4 MCP          W5 Server-side logs (GoAccess) [parallel with W4]
    ↓            ↓
    └────────────┴────────── W6 Delivery + Dashboards + Smoke test
```

**Critical path for launch:** Pre-CTX-11 → W1 → W2 → W3. These MUST deploy before CTX-13 Reddit Phase 3 soft launch.
**Post-launch OK:** W4, W5, W6 can stabilise during/after first-wave traffic.

---

## Wave 1 — Foundation

**Goal:** PostHog EU Cloud account ready, CF Worker proxy live at `e.contexter.cc`, PG `attribution` table created, GSC verified. No code instrumentation yet — just infrastructure.

### Task W1-01: PostHog EU Cloud project setup

**Action:**
- Sign up at `eu.posthog.com` with `nopoint@contexter.cc`
- Create project: name `contexter-prod`, region EU Frankfurt
- Generate project API key (public, read-only), write to `~/.tLOS/posthog-key`
- Enable `person_profiles: 'identified_only'` in project settings (privacy → profile creation → identified only)
- Set billing caps: $0 on all products (prevent surprise bills if free tier overflow)
- Add `nopoint@contexter.cc` as admin, future `artem@contexter.cc` as read-only (defer until Artem onboarded)

**Verify:**
```bash
cat ~/.tLOS/posthog-key | head -c 10
# Expected: phc_XXXXXX (PostHog project key prefix)
curl -s -X POST "https://eu.i.posthog.com/capture/" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$(cat ~/.tLOS/posthog-key)\",\"event\":\"w1_smoke_test\",\"distinct_id\":\"test\"}" \
  -w "%{http_code}"
# Expected: 200
```

**Done when:**
- [ ] PostHog EU project live
- [ ] API key saved to `~/.tLOS/posthog-key` (chmod 600)
- [ ] `person_profiles: 'identified_only'` enabled
- [ ] Billing cap = $0 set on all products
- [ ] Smoke event `w1_smoke_test` appears in PostHog Events tab within 60s
- [ ] **No commit** — this is account setup, not code

### Task W1-02: CF Worker proxy `contexter-analytics-proxy`

**Action:**
- Create new CF Worker project: `contexter-analytics-proxy/` (separate repo OR subdirectory of nospace with its own wrangler config)
- Implement per DEEP-1 §C5 (paste verbatim):

```typescript
// contexter-analytics-proxy/src/index.ts
const EU_POSTHOG_HOST = 'eu.i.posthog.com';
const EU_ASSET_HOST = 'eu-assets.i.posthog.com';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/static/')) {
      return fetch(`https://${EU_ASSET_HOST}${url.pathname}`, {
        method: request.method,
        headers: request.headers,
      });
    }

    const proxyUrl = `https://${EU_POSTHOG_HOST}${url.pathname}${url.search}`;
    const headers = new Headers(request.headers);
    headers.set('host', EU_POSTHOG_HOST);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) headers.set('X-Forwarded-For', ip);

    return fetch(proxyUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });
  },
};
```

- `wrangler.toml`:

```toml
name = "contexter-analytics-proxy"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[env.production]
route = { pattern = "e.contexter.cc/*", zone_id = "fed8fa9deb10ab0e414ab739da428c03" }
```

- Deploy: `wrangler deploy --env production`
- Add DNS CNAME: `e.contexter.cc` → `contexter-analytics-proxy.workers.dev` (or direct worker route if zone-binding works)

**Verify:**
```bash
# Static asset passthrough
curl -s -o /dev/null -w "%{http_code}" https://e.contexter.cc/static/array.js
# Expected: 200 (PostHog static asset served)
# Event capture passthrough
curl -s -X POST "https://e.contexter.cc/capture/" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\":\"$(cat ~/.tLOS/posthog-key)\",\"event\":\"w1_proxy_test\",\"distinct_id\":\"test\"}" \
  -w "%{http_code}"
# Expected: 200 (event reaches PostHog EU via proxy)
```

**Done when:**
- [ ] `wrangler deploy` successful
- [ ] DNS `e.contexter.cc` resolves
- [ ] Static asset passthrough works (HTTP 200)
- [ ] Event capture via proxy appears in PostHog within 60s
- [ ] Atomic commit in `nospace` (if worker lives under nospace): `feat(contexter): CF Worker analytics proxy contexter-analytics-proxy`
- [ ] GSD-Task: `CTX-11 / W1 / Task W1-02`

### Task W1-03: PG migration 0019 — `attribution` table

**Action:**
- Drizzle migration `drizzle-pg/0019_attribution_table.sql` per DEEP-1 §D2:

```sql
CREATE TABLE attribution (
    id              BIGSERIAL PRIMARY KEY,
    order_id        TEXT NOT NULL UNIQUE,
    ph_id           TEXT,
    user_id         TEXT,
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,
    utm_term        TEXT,
    utm_content     TEXT,
    amount_cents    INTEGER NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'USD',
    payment_provider TEXT NOT NULL DEFAULT 'lemonsqueezy',
    ls_event        TEXT NOT NULL,
    referrer_user_id TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_referrer FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_attribution_utm_source ON attribution(utm_source);
CREATE INDEX idx_attribution_created_at ON attribution(created_at);
CREATE INDEX idx_attribution_ph_id ON attribution(ph_id) WHERE ph_id IS NOT NULL;
CREATE INDEX idx_attribution_user_id ON attribution(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_attribution_referrer ON attribution(referrer_user_id) WHERE referrer_user_id IS NOT NULL;
```

- Append-only rule enforced in application code (no UPDATE statements on `attribution` table anywhere)
- Schema update in `src/db/schema.ts` with matching Drizzle types

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
ls drizzle-pg/0019_attribution_table.sql
# Test migration applies cleanly on dev
psql $DATABASE_URL -f drizzle-pg/0019_attribution_table.sql
psql $DATABASE_URL -c "\d attribution"
# Expected: table exists with all columns + 5 indexes
grep -n "attribution" src/db/schema.ts
# Expected: Drizzle table definition present
bun run build 2>&1 | tail -3
# Expected: built successfully (schema.ts compiles)
```

**Done when:**
- [ ] Migration 0019 applies on dev cleanly
- [ ] 5 indexes present
- [ ] Schema.ts updated
- [ ] Build passes
- [ ] Rollback tested (DROP TABLE attribution; re-run migration)
- [ ] Atomic commit: `feat(contexter/db): attribution table for revenue attribution (CTX-11 W1)`
- [ ] GSD-Task: `CTX-11 / W1 / Task W1-03`

### Task W1-04: Env vars (Hetzner + CF Pages)

**Action:**
- **Hetzner `.env`** (`/opt/contexter/.env`):
  - `POSTHOG_KEY=phc_XXXXXX` (from `~/.tLOS/posthog-key`)
  - `POSTHOG_HOST=https://eu.i.posthog.com`
  - `SAMPLE_RATE=1.0` (no sampling at launch)
- **CF Pages project `contexter-web`** (Dashboard → Settings → Environment Variables):
  - `VITE_POSTHOG_KEY=phc_XXXXXX` (same public key)
  - `VITE_POSTHOG_HOST=https://e.contexter.cc` (our CF Worker proxy, NOT eu.posthog.com directly)

**Verify:**
```bash
ssh root@46.62.220.214 "grep -E 'POSTHOG_KEY|POSTHOG_HOST|SAMPLE_RATE' /opt/contexter/.env"
# Expected: 3 lines present (values masked in output acceptable)
# CF Pages env via wrangler
wrangler pages project list | grep contexter-web
# Then check env in dashboard (no CLI read — manual verify)
```

**Done when:**
- [ ] 3 vars set on Hetzner `.env`
- [ ] 2 vars set on CF Pages env
- [ ] Existing services restarted to pick up new env (`systemctl restart contexter-app` or `docker compose restart`)
- [ ] Nothing breaks (smoke test existing `/health` endpoint: 200 OK)
- [ ] **No commit** — env changes are operational, not code

### Task W1-05: Google Search Console setup

**Action:**
- Go to `search.google.com/search-console` → Add property → Domain property → `contexter.cc`
- Google provides DNS TXT record (e.g., `google-site-verification=XXXXXX`)
- Add TXT to Cloudflare DNS (zone `contexter.cc`): `TXT @ google-site-verification=XXXXXX`
- Wait 5-60 min DNS propagation → click Verify in GSC
- Submit sitemap: GSC → Sitemaps → enter `https://contexter.cc/sitemap.xml` → Submit
- Create `contexter-web/public/sitemap.xml` with landing page, /pricing, /privacy, /terms, /supporters URLs (minimal static)

**Verify:**
```bash
dig TXT contexter.cc +short | grep google-site-verification
# Expected: google-site-verification=XXXXXX
curl -s -o /dev/null -w "%{http_code}" https://contexter.cc/sitemap.xml
# Expected: 200
```

**Done when:**
- [ ] GSC property verified (green check in dashboard)
- [ ] Sitemap submitted
- [ ] sitemap.xml accessible at `contexter.cc/sitemap.xml`
- [ ] Atomic commit: `feat(contexter/seo): GSC verification + sitemap.xml`
- [ ] GSD-Task: `CTX-11 / W1 / Task W1-05`

---

## Wave 2 — Frontend Analytics (SolidJS SPA on CF Pages)

**Goal:** posthog-js initialized in SolidJS SPA. UTM capture module. Pageview events + signup_started + checkout_started events firing. Identity preserved from anonymous visit → authenticated user.

### Task W2-01: posthog-js + `analytics.ts` initialization

**Action:**
- `cd contexter-web && bun add posthog-js`
- Create `web/src/lib/analytics.ts` per DEEP-1 §C1 (paste verbatim):

```typescript
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://e.contexter.cc';

export function initAnalytics(): void {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    capture_pageview: 'history_change',
    session_recording: { maskAllInputs: true },
    loaded: (ph) => {
      const anonId = ph.get_distinct_id();
      if (anonId) sessionStorage.setItem('ph_id', anonId);
    },
  });
}

export function identifyUser(userId: string, props?: Record<string, string>): void {
  posthog.identify(userId, props);
  sessionStorage.setItem('ph_id', userId);
}

export function captureEvent(event: string, props?: Record<string, unknown>): void {
  posthog.capture(event, props);
}
```

- Call `initAnalytics()` in `web/src/index.tsx` (app root) before render

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
grep -n "posthog-js" package.json
# Expected: "posthog-js": "^1.X.X"
grep -n "initAnalytics" src/index.tsx src/lib/analytics.ts
# Expected: found in both files
bun run build 2>&1 | tail -3
# Expected: built successfully
# Browser smoke test (manual): open contexter.cc, check DevTools Network: request to e.contexter.cc/decide or /capture appears
```

**Done when:**
- [ ] `posthog-js` dep installed
- [ ] `analytics.ts` created with exact code from DEEP-1 §C1
- [ ] `initAnalytics()` called at app root
- [ ] Browser smoke: on landing page, `window.posthog` is defined, `posthog.get_distinct_id()` returns UUID, `sessionStorage.ph_id` is set
- [ ] `$pageview` event appears in PostHog Events tab within 60s
- [ ] Atomic commit: `feat(contexter/web): posthog-js initialization + analytics module`
- [ ] GSD-Task: `CTX-11 / W2 / Task W2-01`

### Task W2-02: UTM capture module `utm.ts`

**Action:**
- Create `web/src/lib/utm.ts` per DEEP-1 §C2 (paste verbatim):

```typescript
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
type UtmKey = typeof UTM_KEYS[number];
type UtmData = Partial<Record<UtmKey, string>>;

export function captureUtmParams(): void {
  const params = new URLSearchParams(window.location.search);
  const found: UtmData = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) found[key] = val;
  }
  if (Object.keys(found).length > 0) {
    sessionStorage.setItem('utm_data', JSON.stringify(found));
  }
}

export function getUtmData(): UtmData {
  const raw = sessionStorage.getItem('utm_data');
  return raw ? (JSON.parse(raw) as UtmData) : {};
}

export function buildCheckoutUrl(baseUrl: string, userId?: string): string {
  const url = new URL(baseUrl);
  const utms = getUtmData();
  const phId = sessionStorage.getItem('ph_id') ?? '';
  if (phId) url.searchParams.set('checkout[custom][ph_id]', phId);
  if (userId) url.searchParams.set('checkout[custom][user_id]', userId);
  for (const [key, value] of Object.entries(utms)) {
    if (value) url.searchParams.set(`checkout[custom][${key}]`, value);
  }
  return url.toString();
}
```

- Call `captureUtmParams()` in `web/src/index.tsx` BEFORE `initAnalytics()` (capture UTMs from URL on first arrival)

**Verify:**
```bash
grep -n "captureUtmParams\|buildCheckoutUrl" src/lib/utm.ts src/index.tsx
# Expected: captureUtmParams called in index.tsx; buildCheckoutUrl defined in utm.ts
# Browser smoke: visit https://contexter.cc?utm_source=hn&utm_medium=post&utm_campaign=show-hn-2026
# Check: sessionStorage.getItem('utm_data') returns JSON with utm_source=hn
```

**Done when:**
- [ ] `utm.ts` created with exact DEEP-1 §C2 code
- [ ] `captureUtmParams()` called on app load
- [ ] Browser smoke: URL with UTM → sessionStorage has UTM data; URL without UTM → sessionStorage NOT overwritten
- [ ] Atomic commit: `feat(contexter/web): UTM capture module with buildCheckoutUrl helper`
- [ ] GSD-Task: `CTX-11 / W2 / Task W2-02`

### Task W2-03: Pageview events + pricing_pageview (discrete)

**Action:**
- `posthog-js` auto-captures pageviews via `capture_pageview: 'history_change'` (already set in W2-01)
- For `pricing_pageview` (discrete event, separate from generic `$pageview`): in `web/src/pages/Landing.tsx` or pricing route, on mount: `captureEvent('pricing_pageview', { tier_viewed: 'all' })`
- For `docs_pageview`: if Contexter has a docs route, same pattern

**Verify:**
```bash
# Browser smoke: visit /pricing, check PostHog Events tab for pricing_pageview event
# Also verify $pageview fires on /app, /login, /register routes
```

**Done when:**
- [ ] `$pageview` fires on all SPA routes (auto via posthog-js)
- [ ] `pricing_pageview` fires on pricing route mount with `tier_viewed` prop
- [ ] Events visible in PostHog within 60s
- [ ] Atomic commit: `feat(contexter/web): pricing_pageview discrete event`
- [ ] GSD-Task: `CTX-11 / W2 / Task W2-03`

### Task W2-04: `signup_started` + `checkout_started` events

**Action:**
- `web/src/components/AuthModal.tsx` (or register form mount): `captureEvent('signup_started', { auth_method: 'email_password' })` on modal open / form render
- On Google OAuth button click: `captureEvent('signup_started', { auth_method: 'google_oauth' })`
- `web/src/pages/Pricing.tsx` (checkout button click, BEFORE redirect to LS): `captureEvent('checkout_started', { tier: 'supporter' | 'starter' | 'pro' | 'business', pwyw_amount_cents: X, utm_source_last: getUtmData().utm_source, ph_id: sessionStorage.getItem('ph_id') })` — then redirect to `buildCheckoutUrl(LS_URL, userId)`

**Verify:**
```bash
# Browser: click "Register" → signup_started fires
# Browser: click "Подключить Starter" → checkout_started fires → redirects to LS with checkout[custom][ph_id]=X in URL
```

**Done when:**
- [ ] `signup_started` fires on both auth methods
- [ ] `checkout_started` fires on all 4 tier CTAs (Supporter / Starter / Pro / Business — if Business becomes visible per D-AXIS-11 it stays hidden)
- [ ] LS checkout URL contains `checkout[custom][ph_id]` and UTM params
- [ ] Atomic commit: `feat(contexter/web): signup_started + checkout_started events with UTM + ph_id injection`
- [ ] GSD-Task: `CTX-11 / W2 / Task W2-04`

### Task W2-05: CF Pages deploy

**Action:**
- `cd contexter-web && bun run build`
- `wrangler pages deploy dist --project-name=contexter-web`
- Smoke test: visit contexter.cc in incognito, DevTools Network → requests to `e.contexter.cc/decide` and `e.contexter.cc/capture/` appear (proxy working)

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
wrangler pages deploy dist --project-name=contexter-web 2>&1 | tail -5
# Expected: deployment URL, success
curl -s -o /dev/null -w "%{http_code}" https://contexter.cc/
# Expected: 200
```

**Done when:**
- [ ] Build passes
- [ ] CF Pages deploy successful
- [ ] contexter.cc serving new version (check page view in PostHog within 60s)
- [ ] `$pageview` event from real browser visit appears in PostHog
- [ ] `sessionStorage.ph_id` populated for new visitors
- [ ] Atomic commit reflects already committed W2-01..W2-04; deployment is operational
- [ ] **No new commit** (deploy only)

---

## Wave 3 — Backend Analytics (Hono / Bun on Hetzner)

**Goal:** `posthog-node` wired into Hono. `identify()` on signup. `user_registered` event (replaces console.log from Pre-W1). LS webhook extended to emit `payment_completed` + `alias()` + insert into `attribution` table.

### Task W3-01: `posthog-node` middleware

**Action:**
- `cd . && bun add posthog-node` (backend dep, root of contexter — not web/)
- Create `src/middleware/analytics.ts` per DEEP-1 §C3 (paste verbatim, Bun-long-running config):

```typescript
import { PostHog } from 'posthog-node';
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';

export const posthog = new PostHog(process.env.POSTHOG_KEY!, {
  host: 'https://eu.i.posthog.com',
  // flushAt: 20 (default), flushInterval: 10000 (default) — correct for Bun long-running
});

export async function shutdownAnalytics(): Promise<void> {
  await posthog.shutdown();
}

export const analyticsMiddleware = createMiddleware(async (c: Context, next) => {
  c.set('analytics', posthog);
  await next();
});
```

- Register middleware in `src/index.ts` (Hono app root): `app.use('*', analyticsMiddleware)`
- Register graceful shutdown: `process.on('SIGTERM', () => shutdownAnalytics())` and same for `SIGINT`

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter
grep -n "posthog-node" package.json
grep -n "analyticsMiddleware\|shutdownAnalytics" src/middleware/analytics.ts src/index.ts
bun run build 2>&1 | tail -3
# Expected: builds
```

**Done when:**
- [ ] `posthog-node` installed
- [ ] Middleware file created with exact DEEP-1 §C3 code
- [ ] Middleware registered in Hono app
- [ ] Shutdown hooks on SIGTERM + SIGINT
- [ ] Build passes
- [ ] Atomic commit: `feat(contexter/api): posthog-node middleware for Hono (CTX-11 W3)`
- [ ] GSD-Task: `CTX-11 / W3 / Task W3-01`

### Task W3-02: `user_registered` event + `posthog.identify()` in auth routes

**Action:**
- Replace console.log in `src/routes/auth.ts` (from Pre-W1 Task 0-2) with:

```typescript
// After users table insert:
c.var.analytics.capture({
  distinctId: user.id,
  event: 'user_registered',
  properties: {
    email_hash: sha256(user.email),
    auth_method: 'email_password',
    persona_self_reported: user.persona_self_reported,
    utm_source_first: body.utm_source_first,
    utm_source_last: body.utm_source_last,
    ph_id: body.ph_id,
  },
});
// Identify call — merges anonymous events into this user
c.var.analytics.identify({
  distinctId: user.id,
  properties: {
    email: user.email,
    signup_method: 'email_password',
    persona_self_reported: user.persona_self_reported,
    utm_source_first: body.utm_source_first,
  },
});
// Also: alias anonymous ph_id → user.id if present
if (body.ph_id && body.ph_id !== user.id) {
  c.var.analytics.alias({ distinctId: user.id, alias: body.ph_id });
}
```

- Same pattern in `src/routes/auth-social.ts` Google OAuth callback with `auth_method: 'google_oauth'`
- Frontend W2-04 must send `ph_id` + UTM params in request body (already wired)

**Verify:**
```bash
# End-to-end smoke: register new user from browser
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.com","password":"test1234","persona_self_reported":"Developer","ph_id":"ph_anon_xyz","utm_source_last":"hn"}'
# Check PostHog: user_registered event with user_id; identify merges ph_anon_xyz → user_id; subsequent events attributed to user
```

**Done when:**
- [ ] `user_registered` event fires on both auth routes
- [ ] `identify()` called with user_id + properties
- [ ] `alias()` called if anonymous ph_id present
- [ ] Event visible in PostHog with correct distinctId
- [ ] Atomic commit: `feat(contexter/auth): user_registered event + posthog identify+alias for both auth flows`
- [ ] GSD-Task: `CTX-11 / W3 / Task W3-02`

### Task W3-03: LS webhook extension — `payment_completed` + attribution table write

**Action:**
- Extend `src/routes/webhooks.ts` handler for LS events per DEEP-1 §C4 (paste verbatim, adapt to existing handler):

```typescript
// Add to existing LS webhook handler — extend, don't replace
async function captureLsPaymentEvent(payload: LsWebhookPayload, db: DbConnection) {
  const { event_name, custom_data } = payload.meta;
  const { id: order_id, attributes } = payload.data;
  if (!['order_created', 'subscription_payment_success'].includes(event_name)) return;

  const phId = custom_data?.ph_id;
  const userId = custom_data?.user_id;
  const distinctId = userId ?? phId ?? `ls_order_${order_id}`;

  // 1. PostHog payment event
  posthog.capture({
    distinctId,
    event: 'payment_completed',
    properties: {
      order_id,
      amount_cents: attributes.total,
      currency: attributes.currency,
      event_type: event_name,
      payment_provider: 'lemonsqueezy',
      utm_source: custom_data?.utm_source ?? 'unknown',
      utm_medium: custom_data?.utm_medium,
      utm_campaign: custom_data?.utm_campaign,
      utm_term: custom_data?.utm_term,
      utm_content: custom_data?.utm_content,
      is_first_payment: await isFirstPayment(userId, db),
    },
  });

  // 2. Guest checkout alias: anon ph_id → order pseudo-id
  if (phId && !userId) {
    posthog.alias({ distinctId: `ls_order_${order_id}`, alias: phId });
  }

  // 3. Append-only insert into attribution table
  await db.execute(
    `INSERT INTO attribution (order_id, ph_id, user_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, amount_cents, currency, payment_provider, ls_event, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
     ON CONFLICT (order_id) DO NOTHING`,
    [order_id, phId ?? null, userId ?? null, custom_data?.utm_source ?? null, custom_data?.utm_medium ?? null, custom_data?.utm_campaign ?? null, custom_data?.utm_term ?? null, custom_data?.utm_content ?? null, attributes.total, attributes.currency, 'lemonsqueezy', event_name]
  );
}
```

- Also add `subscription_cancelled` + `payment_refunded` handlers per DEEP-4 §B.5 (separate events, no attribution table update needed — just PostHog capture)
- For NOWPayments webhook (existing in `src/routes/webhooks.ts:29-104`): add same `payment_completed` capture with `payment_provider: 'nowpayments'` (per D-CTX11-16)

**Verify:**
```bash
# Trigger LS webhook from Stripe-style test tool or manual curl with valid HMAC
# Then: check PostHog for payment_completed event
psql $DATABASE_URL -c "SELECT * FROM attribution ORDER BY created_at DESC LIMIT 5"
# Expected: attribution rows present
```

**Done when:**
- [ ] `payment_completed` captures for LS order_created + subscription_payment_success
- [ ] `payment_completed` captures for NOWPayments crypto (with `payment_provider: 'nowpayments'`)
- [ ] `subscription_cancelled` + `payment_refunded` captures
- [ ] `attribution` table INSERT on each payment
- [ ] Alias call for guest checkout
- [ ] Idempotent on ON CONFLICT (order_id) DO NOTHING
- [ ] Atomic commit: `feat(contexter/webhooks): payment_completed + attribution table inserts (LS + NOWPayments)`
- [ ] GSD-Task: `CTX-11 / W3 / Task W3-03`

### Task W3-04: Supporter lifecycle + subscription events

**Action:**
- `src/services/supporters-lifecycle.ts` (existing): emit `supporter_status_changed` event on any transition (active ↔ warning ↔ quarantined ↔ frozen ↔ exiting) with `old_status`, `new_status`, `reason` properties
- `src/services/supporters.ts` freeze flow: `supporter_freeze_activated` → replace console.log with `posthog.capture('supporter_freeze_activated', ...)`

**Verify:**
```bash
# Trigger supporter lifecycle via test script (e.g., soft demotion cron)
# Check PostHog events
```

**Done when:**
- [ ] `supporter_status_changed` event fires on all 5 transitions
- [ ] Existing console.log replaced with posthog.capture
- [ ] Atomic commit: `feat(contexter/supporters): analytics events for lifecycle + freeze`
- [ ] GSD-Task: `CTX-11 / W3 / Task W3-04`

### Task W3-05: Deploy to Hetzner

**Action:**
- `bash ops/deploy.sh` — SCP + docker rebuild + health check
- Manual smoke via SSH: `curl -s -X POST "https://eu.i.posthog.com/capture/" -H "..." -d '{"event":"w3_deploy_smoke",...}'`

**Verify:**
```bash
ssh root@46.62.220.214 "docker logs contexter-app 2>&1 | grep -i posthog | tail -5"
# Expected: PostHog events captured
curl -s https://api.contexter.cc/health
# Expected: 200 OK
```

**Done when:**
- [ ] Deploy successful, no build/deploy errors
- [ ] Health endpoint 200
- [ ] Registering a real user triggers `user_registered` event in PostHog
- [ ] A test LS webhook call triggers `payment_completed` + attribution row
- [ ] **No commit** — deploy is operational

---

## Wave 4 — MCP Telemetry

**Goal:** All 8 MCP events from DEEP-3 §D.1 wired. `mcpQuotaMiddleware` enforcing per-token quotas. Abuse detection signals flowing to PostHog. Derived events (`activation_completed`, `first_mcp_connected`, `first_document_uploaded`) firing.

### Task W4-01: `mcp_session_started` + `mcp_session_ended` + MCP client detection

**Action:**
- In `src/routes/mcp-remote.ts` SSE upgrade handler: 
  - Generate `session_id` UUID
  - Parse `User-Agent` header → detect client (`anthropic-claude-desktop/*` → `claude`, `Cursor/*` → `cursor`, etc.) — fallback `unknown`
  - Emit `mcp_session_started` with `token_hash, session_id, mcp_client, client_address, protocol_version, transport: 'tcp'` (full DEEP-3 §D.2 Event 1 attribute set)
  - On SSE close (error or client-disconnect): emit `mcp_session_ended` with `duration_ms, tool_calls_count, error_count, end_reason`

**Verify:**
```bash
# Connect Claude Desktop to MCP with real token
# Check PostHog: mcp_session_started with mcp_client='claude'
# Disconnect → mcp_session_ended fires with non-zero duration_ms
```

**Done when:**
- [ ] Events fire with full attribute set
- [ ] `mcp_client` correctly detected for Claude / Cursor / ChatGPT (manual test with each)
- [ ] `session_id` UUID unique per session
- [ ] Atomic commit: `feat(contexter/mcp): session_started + session_ended events with client detection`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-01`

### Task W4-02: `mcp_tool_called` + `mcp_tool_error` wrap 12 tools

**Action:**
- In `src/services/mcp/` or wherever 12 tool handlers live: wrap each handler with `captureMcpTool()` from DEEP-3 §A.5 code (with sampling support via `SAMPLE_RATE` env)
- Paste verbatim the code from DEEP-3 §A.5 (includes never-sample logic for errors, OTel attribute mapping)

**Verify:**
```bash
# Make 10+ tool calls via MCP client, check PostHog mcp_tool_called events
# Force an error (e.g., get_document with invalid id) → mcp_tool_error fires
```

**Done when:**
- [ ] All 12 tools wrapped
- [ ] `mcp_tool_called` properties: `tool_name, session_id, duration_ms, sample_rate, mcp.method.name, gen_ai.tool.name, gen_ai.operation.name, result_size_bytes`
- [ ] `mcp_tool_error` fires on any throw with `error_type, error_code`
- [ ] Never-sample rule: errors always captured regardless of SAMPLE_RATE
- [ ] Atomic commit: `feat(contexter/mcp): tool_called + tool_error instrumentation with sampling (12 tools)`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-02`

### Task W4-03: `mcp_auth_failed`

**Action:**
- In SSE upgrade auth handler + tool call auth check: on invalid/expired/missing/revoked token, emit `mcp_auth_failed` with `failure_reason, client_address, mcp_method, token_prefix` (first 6 chars of token)
- `distinctId`: `ip_hash_${sha256(ip)}` (no valid user)

**Verify:**
```bash
# Connect to MCP with fake token → mcp_auth_failed fires
```

**Done when:**
- [ ] Event fires on 4 failure reasons (invalid/expired/missing/revoked)
- [ ] `distinctId` hashed IP (no user)
- [ ] Atomic commit: `feat(contexter/mcp): auth_failed event`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-03`

### Task W4-04: `mcpQuotaMiddleware` + `mcp_rate_limit_hit`

**Action:**
- Create `src/middleware/quota.ts` per DEEP-3 §C.4 (paste verbatim the full TypeScript implementation including `QUOTA_BY_TIER`, `EXPENSIVE_TOOLS`, in-memory sliding window, hourly/daily checks, posthog capture)
- Attach after auth middleware in MCP routes
- `cleanupQuotaCache()` registered on daily cron

**Verify:**
```bash
# Simulate burst: 31 requests/hour from free-tier token
# Expected: 30 succeed, 31st returns 429 + mcp_rate_limit_hit fires
```

**Done when:**
- [ ] Middleware wired to all MCP routes
- [ ] 429 returned on limit exceeded
- [ ] `mcp_rate_limit_hit` event captures `limit_type, limit_value, current_count, tier, tool_name`
- [ ] Free tier: 30 hourly + 50 daily expensive
- [ ] Daily cleanup cron registered
- [ ] Atomic commit: `feat(contexter/mcp): mcpQuotaMiddleware with 4-layer abuse enforcement`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-04`

### Task W4-05: `activation_completed` derived event

**Action:**
- In `captureMcpTool` handler (from W4-02): BEFORE capturing the `mcp_tool_called` event, check if this is the FIRST successful value-core tool call for this user
- If yes AND user has not previously fired `activation_completed`: emit `activation_completed` with `user_id, days_since_signup, first_value_tool_name` properties
- Track "has previously fired" via DB: add `users.activated_at` nullable column, set on first activation (app-level, transactional with tool call success)

**Action — schema**: `drizzle-pg/0020_users_activated_at.sql`: `ALTER TABLE users ADD COLUMN activated_at TIMESTAMPTZ`

**Verify:**
```bash
# Register new user, make first search_knowledge call → activation_completed fires
# Make second search_knowledge call → activation_completed does NOT fire again
```

**Done when:**
- [ ] `activation_completed` fires exactly once per user
- [ ] `users.activated_at` column added and set atomically
- [ ] Atomic commit: `feat(contexter/mcp): activation_completed derived event (NSM denominator)`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-05`

### Task W4-06: `first_document_uploaded` + `first_mcp_connected`

**Action:**
- `first_document_uploaded`: in `add_context` / `upload_document` tool handlers, check if user has any prior documents → fire event ONCE with `document_type, document_size_bytes, days_since_signup`
- `first_mcp_connected`: in `mcp_session_started` handler, check if user has any prior SSE sessions (via DB or count of prior mcp_session_started events) → fire event ONCE with `mcp_client, days_since_signup, minutes_since_first_doc`

**Verify:**
```bash
# New user uploads first doc → first_document_uploaded fires
# Same user uploads second doc → first_document_uploaded does NOT fire
# Similar for first_mcp_connected
```

**Done when:**
- [ ] Both events fire exactly once per user
- [ ] Atomic commit: `feat(contexter/mcp): first_document_uploaded + first_mcp_connected derived events`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-06`

### Task W4-07: Token lifecycle events `mcp_token_created` + `mcp_token_revoked`

**Action:**
- In `src/routes/auth.ts` or wherever tokens are generated/revoked (per inventory `users.api_token` or dedicated token table): emit `mcp_token_created` on new token + `mcp_token_revoked` on revoke
- Attributes per DEEP-3 §D.2 Events 7 + 8

**Verify:**
```bash
# User creates new API token via dashboard → mcp_token_created fires
# User revokes token → mcp_token_revoked fires
```

**Done when:**
- [ ] Both events fire
- [ ] Atomic commit: `feat(contexter/auth): mcp_token_created + mcp_token_revoked events`
- [ ] GSD-Task: `CTX-11 / W4 / Task W4-07`

### Task W4-08: Deploy W4 to Hetzner

**Action:** `bash ops/deploy.sh`; smoke test.

**Done when:**
- [ ] Deploy successful
- [ ] All 8 MCP events + 3 derived events verified in PostHog from real MCP client connection
- [ ] Quota middleware tested with burst

---

## Wave 5 — Server-side Log Layer (GoAccess)

**Goal:** GoAccess installed on Hetzner CAX21. Real-time HTML dashboard at `analytics-internal.contexter.cc` (basicauth). Captures 100% of `api.contexter.cc` HTTP requests including ad-blocked and MCP-client traffic.

### Task W5-01: GoAccess install + Caddy log format check

**Action:**
- On Hetzner: `apt-get install goaccess` (or install latest from GoAccess repo for Caddy support)
- Verify Caddy emits JSON logs: check `/opt/contexter/Caddyfile` for `log { format json }`
- Verify log file path: `/var/log/caddy/access.log` (or wherever Caddy writes; mount into Docker if dockerized)

**Verify:**
```bash
ssh root@46.62.220.214 "goaccess --version"
# Expected: GoAccess 1.7+ (must support --log-format=CADDY)
ssh root@46.62.220.214 "head -1 /var/log/caddy/access.log | jq ."
# Expected: valid JSON with fields request, status, etc.
```

**Done when:**
- [ ] GoAccess installed on server
- [ ] Caddy log file accessible
- [ ] JSON format confirmed
- [ ] **No commit** — server config

### Task W5-02: Caddyfile vhost `analytics-internal.contexter.cc`

**Action:**
- Add to `/opt/contexter/Caddyfile`:

```caddy
analytics-internal.contexter.cc {
    root * /var/www/analytics
    file_server
    basicauth /* {
        nopoint {env.ANALYTICS_HASH}
    }
}
```

- `{env.ANALYTICS_HASH}` = bcrypt hash of password; generate via `caddy hash-password --plaintext "$(openssl rand -hex 16)"`; save password + hash to `~/.tLOS/analytics-creds`
- Add to `.env`: `ANALYTICS_HASH=<bcrypt hash>`
- Add DNS: `CNAME analytics-internal.contexter.cc → contexter.cc` (or A record → Hetzner IP)
- Reload Caddy: `docker exec caddy caddy reload`

**Verify:**
```bash
curl -s -o /dev/null -w "%{http_code}" -u "nopoint:wrongpass" https://analytics-internal.contexter.cc/
# Expected: 401
curl -s -o /dev/null -w "%{http_code}" -u "nopoint:correctpass" https://analytics-internal.contexter.cc/
# Expected: 200 (directory index or 404 if no index — both OK)
```

**Done when:**
- [ ] Vhost reachable
- [ ] basicauth blocks wrong password
- [ ] Correct password grants access
- [ ] Atomic commit in `ops/`: `feat(contexter/ops): analytics-internal vhost with basicauth`
- [ ] GSD-Task: `CTX-11 / W5 / Task W5-02`

### Task W5-03: GoAccess daemon for real-time HTML

**Action:**
- systemd service or Docker container:
```bash
goaccess /var/log/caddy/access.log \
  --log-format=CADDY \
  --real-time-html \
  --output=/var/www/analytics/index.html \
  --ws-url=wss://analytics-internal.contexter.cc \
  --daemonize
```

- Systemd service file at `/etc/systemd/system/goaccess.service`
- `systemctl enable goaccess && systemctl start goaccess`

**Verify:**
```bash
ssh root@46.62.220.214 "systemctl status goaccess"
# Expected: active (running)
curl -s -u "nopoint:correctpass" https://analytics-internal.contexter.cc/index.html | grep -i goaccess
# Expected: HTML report
```

**Done when:**
- [ ] Daemon running
- [ ] HTML report served at `analytics-internal.contexter.cc`
- [ ] Report updates in near-real-time (check WebSocket connection in browser devtools)
- [ ] Atomic commit in `ops/`: `feat(contexter/ops): goaccess systemd service + real-time report`
- [ ] GSD-Task: `CTX-11 / W5 / Task W5-03`

---

## Wave 6 — Delivery + Dashboards + Smoke Test

**Goal:** NSM Insight configured. Slack alerts live. PostHog Subscriptions sending daily + weekly digests. 7 guardrail alerts. 12 trigger alerts. 7 dashboards set up. End-to-end smoke test passes.

### Task W6-01: NSM Insight in PostHog

**Action:**
- PostHog UI → Insights → New Insight
- Name: `NSM — Weekly Activated Users (WAU-A)`
- Type: Unique users (trend)
- Event: `mcp_tool_called`
- Filter: `tool_name IN ('search_knowledge', 'ask_about_document', 'get_document', 'summarize_document')`
- Breakdown: none
- Interval: Week
- Save + pin to default dashboard

**Verify:**
- [ ] Insight saved
- [ ] Number displayed matches manual count via PostHog Events tab filter
- [ ] No commit — UI config

### Task W6-02: 5 real-time Slack alerts

**Action:**
- Create Slack workspace channel `#contexter-alerts` (if not exists)
- PostHog → Settings → Integrations → Slack → connect webhook
- Create 5 Insight alerts per DEEP-4 §H.1:
  1. `mcp_auth_failed` count >20/hour → Slack
  2. `mcp_tool_error` rate >5% over 30-min → Slack
  3. `payment_refunded` any fire → Slack
  4. GoAccess /health non-200 >5/min → Slack (via GoAccess webhook or separate monitoring)
  5. `subscription_cancelled` any fire → Slack

**Done when:**
- [ ] All 5 alerts configured
- [ ] Manually trigger one (e.g., force a test mcp_auth_failed burst) → Slack message arrives
- [ ] No commit — UI config

### Task W6-03: PostHog Subscriptions (daily + weekly)

**Action:**
- Create 2 Insights: Daily digest (5 numbers), Weekly digest (10 numbers + 1 segment) per DEEP-4 §H.2 + §H.3
- PostHog → Subscriptions:
  - Daily digest → `nopoint@contexter.cc`, time 08:00 CET, frequency daily
  - Weekly digest → `nopoint@contexter.cc` + `artem@contexter.cc` (when onboarded), Monday 09:00 CET, frequency weekly

**Done when:**
- [ ] Subscriptions active
- [ ] First daily digest received at 08:00 CET
- [ ] First weekly digest received Monday 09:00 CET
- [ ] No commit

### Task W6-04: 7 Guardrail Insight alerts

**Action:** Create PostHog alerts for all 7 guardrails from DEEP-4 §C (G1-G7):
1. G1: signup → activation rate <40% (7d) → alert
2. G2: supporter 30-day retention <70% → alert
3. G3: `mcp_tool_error / mcp_tool_called` >5% over 24h → alert
4. G4: doc engagement rate <50% (7d) → alert
5. G5: abuse signal ratio >10% → alert
6. G6: supporter churn rate >10%/month → alert
7. G7: `rag_quality_batch_score.faithfulness` <0.7 weekly mean → alert (fires only after W4+ RAG eval wave is implemented)

**Done when:**
- [ ] All 7 alerts configured
- [ ] No commit

### Task W6-05: 12 Decision-Trigger Insight alerts

**Action:** Create PostHog alerts for all 12 triggers from DEEP-4 §E (T1-T12). Each alert routes to `#contexter-alerts` Slack.

**Done when:**
- [ ] All 12 alerts configured
- [ ] No commit

### Task W6-06: 7 Dashboards

**Action:** Create 7 dashboards per DEEP-3 §D.3:
1. MCP Activation Funnel
2. Tool Usage Distribution
3. Session Duration Histogram
4. Error Rate by Tool
5. Auth Failure Map
6. Rate Limit Pressure
7. Power Users

Plus per DEEP-4 H.4 monthly review — AARRR Funnel + Cohort Retention Grid + Channel Cost-per-Supporter table.

**Done when:**
- [ ] Dashboards created
- [ ] Pinned to PostHog home
- [ ] No commit

### Task W6-07: End-to-end smoke test

**Action:** Complete user journey validation:
1. Open contexter.cc in incognito with UTM: `?utm_source=e2e_smoke&utm_campaign=w6_verify`
2. Verify: `landing_pageview` in PostHog with `utm_source=e2e_smoke`; sessionStorage has UTM data + ph_id
3. Register new user with persona `Developer`
4. Verify: `signup_started` + `user_registered` + `identify()` call merges ph_id → user_id
5. Verify: `users.persona_self_reported = 'Developer'` in DB
6. Upload a test document
7. Verify: `first_document_uploaded` + `mcp_session_started` (if MCP connected) fire
8. Connect Claude Desktop with API token
9. Run `search_knowledge` tool
10. Verify: `mcp_tool_called` with `tool_name='search_knowledge'` + `activation_completed` fires
11. Initiate supporter checkout with ph_id + UTM in URL
12. Complete payment (Stripe test mode or real $10 test)
13. Verify: `payment_completed` + `attribution` table row + `alias()` linked payment to anon session
14. End-to-end dashboard: dashboard shows this journey as funnel entry

**Done when:**
- [ ] All 14 verification points pass
- [ ] End-to-end journey visible in PostHog funnel
- [ ] Attribution table has correct UTM → order_id mapping
- [ ] Identity merge: payment attributed to correct user journey from HN-simulated UTM
- [ ] Atomic commit (if any smoke fix): `chore(contexter): end-to-end analytics smoke test pass`

---

## SHOULD-HAVE Tasks (CTX-11 W7+, post-launch first 2 weeks)

These are DEEP-4 §J SHOULD-HAVE items. NOT blocking launch. Do after MUST-HAVE stable.

- SH-01: `email_verified` event on Resend confirmation callback
- SH-02: Monthly PostHog Subscription report automation
- SH-03: `referral_link_generated` + `referral_converted` events (existing feature per inventory)
- SH-04: `external_referrer_detected` backend event parsing Caddy logs
- SH-05: `rag_quality_batch_score` cron — 50 samples/week via NIM or Groq judge LLM (DEEP-4 §D.1, DEEP-3 would integrate). Output: PostHog event with `faithfulness_mean + answer_relevancy_mean`.

## NICE-TO-HAVE Tasks (post-100-supporters)

- NH-01: Online thumbs UI feedback on `ask_about_document` results → `user_feedback_given` event
- NH-02: Sean Ellis 40% PMF survey (via Resend + in-app modal) at n=50 supporters
- NH-03: Public metrics dashboard (Open Startup pattern — Baremetrics-style public MRR)
- NH-04: MCP sampling activation at 60% free tier threshold (SAMPLE_RATE=0.75)
- NH-05: Langfuse integration for online RAG eval
- NH-06: Artem onboarded to PostHog as read-only marketing dashboard viewer

---

## Acceptance Criteria (Epic-level)

| ID | Criterion | Verify |
|---|---|---|
| AC-1 | All 19 MUST-HAVE tasks complete with atomic commits + GSD-Task trailers `CTX-11 / W1-W6` | `git log --oneline --grep="GSD-Task: CTX-11"` shows 19+ commits |
| AC-2 | PostHog EU Cloud dashboard shows events from real browser visits within 60s of contexter.cc load | Manual: incognito visit → PostHog Events tab |
| AC-3 | All 24 events present in PostHog Event taxonomy with correct property types | PostHog → Data Management → Events → verify 24 events |
| AC-4 | `attribution` PG table receives row on every payment (LS + NOWPayments) with correct UTM fields | SQL query + PostHog webhook test |
| AC-5 | NSM PostHog Insight (`WAU-A`) displays non-zero number within 7d of launch traffic | Insight value >0 |
| AC-6 | GoAccess HTML report at `analytics-internal.contexter.cc` shows >0 requests | basicauth login → HTML report |
| AC-7 | 5 Slack alerts + 7 guardrail alerts + 12 trigger alerts configured | PostHog UI audit + one manual trigger test |
| AC-8 | Daily + Weekly PostHog Subscriptions reach `nopoint@contexter.cc` on schedule | Email inbox verification |
| AC-9 | End-to-end smoke test (W6-07) passes 14/14 | Smoke test output |
| AC-10 | Zero regression in existing Contexter functionality (auth / MCP / payments / health endpoint) | Pre-launch smoke tests still pass |
| AC-11 | GDPR posture: `person_profiles: 'identified_only'` verified in PostHog project settings | PostHog Project → Settings → Privacy |
| AC-12 | `users.persona_self_reported` collected from ≥80% of new registrations post-deploy | SQL query on users table after 14 days |

---

## Blockers + Escalation

| Risk | Severity | Mitigation |
|---|---|---|
| PostHog EU Cloud outage before launch | HIGH | CF Worker proxy makes switching backends a config change. Fall back plan: Plausible Cloud $9/mo + separate session replay via Microsoft Clarity (adds cookie banner) |
| LS Stripe migration forces webhook structure change | MEDIUM | Monitor LS blog weekly. `custom_data` unchanged per April 2026 verification. If forced migration: retest attribution pipeline |
| 70.6% AI traffic dark attribution | HANDLED | GoAccess W5 captures server-side floor. User-Agent detection on SSE reveals MCP client mix |
| `auth()` / `/api/billing` tier field shape change | MEDIUM | W3-02 depends on billing endpoint shape. Pre-coding Phase Zero verification required |
| CF Pages build fails after analytics.ts added | LOW | posthog-js is well-tested. Build smoke in Task W2-05 catches |
| Hetzner disk exhaustion from analytics events buffered locally | LOW | posthog-node batches in memory (max 20 events × ~5 KB = 100 KB). Not a disk risk |

## Write Authority

| File | Owner |
|---|---|
| `memory/contexter-analytics.md` (this L3) | Axis — epic progress, task completion checkmarks |
| `memory/specs/w1-foundation-*.md` (future per-wave specs) | Axis — G3 spec authoring |
| `drizzle-pg/0018_users_persona.sql` | Backend Player (Mies) — Pre-W1 Task 0-1 |
| `drizzle-pg/0019_attribution_table.sql` | Backend Player (Mies) — W1 Task W1-03 |
| `drizzle-pg/0020_users_activated_at.sql` | Backend Player — W4 Task W4-05 |
| `contexter-analytics-proxy/` (new CF Worker subdirectory or repo) | Backend Player — W1 Task W1-02 |
| `web/src/lib/analytics.ts` + `utm.ts` | Frontend Player (Gropius) — W2 |
| `src/middleware/analytics.ts` + `quota.ts` | Backend Player (Mies) — W3 + W4 |
| All PostHog UI config (Insights, Subscriptions, Alerts, Dashboards) | nopoint — manual UI, not code |

## G3 Pair Assignments

| Wave | Player | Coach | Spec file |
|---|---|---|---|
| Pre-CTX-11 (0-1..0-3) | Mies (backend) | Schlemmer | `specs/pre-ctx11-persona-and-fixes.md` (to write) |
| W1 Foundation | Mies (backend) | Schlemmer | `specs/ctx11-w1-foundation.md` (to write) |
| W2 Frontend | Gropius (frontend) | Breuer | `specs/ctx11-w2-frontend.md` (to write) |
| W3 Backend | Mies (backend) | Schlemmer | `specs/ctx11-w3-backend.md` (to write) |
| W4 MCP Telemetry | Mies (backend) | Schlemmer | `specs/ctx11-w4-mcp-telemetry.md` (to write) |
| W5 Server-side logs | Mies + ops | Schlemmer | `specs/ctx11-w5-goaccess.md` (to write) |
| W6 Delivery + dashboards | Axis (Orchestrator) — PostHog UI config by hand | — | Tasks described in this L3 are sufficient |

## Next Steps (Orchestrator)

1. **Write per-wave spec file** (first: `specs/pre-ctx11-persona-and-fixes.md` + `specs/ctx11-w1-foundation.md`)
2. **Verify Pro tier fix (Task 0-3) backend spec** — confirm single-line change in `src/services/billing.ts` does not break existing storage enforcement
3. **Launch G3 Pre-CTX-11 pair** (Mies + Schlemmer) for persona field + user_registered event + Pro tier fix
4. **After Pre-CTX-11 passes Coach:** write W1 spec + launch W1 G3 pair
5. **Sequence W1 → W2 → W3 linearly** (depends on infra existing)
6. **W4 + W5 can parallel** after W3 Deploy
7. **W6 = Orchestrator UI work** (PostHog dashboards) + final smoke test

---

## Decision log (append-only)

- **2026-04-16 session 244:** L3 file created on 4 DEEP + 2 SEED + 1 inventory foundation. 20 locked decisions (D-CTX11-01..20). 19 MUST-HAVE + 5 SHOULD-HAVE + 6 NICE-TO-HAVE. Pre-CTX11 micro-task identified (persona + user_registered + Pro fix) to unblock retroactive gap closing.
