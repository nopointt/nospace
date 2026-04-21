# Phase 2 Dashboard — CONTEXT (Locked Decisions)

> Source of truth for all decisions made before implementation.
> G3 Players and Coaches MUST treat D-nn items as frozen. Challenge only via Orchestrator.

---

## D-01 — Hetzner deployment (shared VPS)

Nomos backend runs on the **same Hetzner CAX21** as Contexter: `root@46.62.220.214` (Helsinki).

- Remote path: `/opt/nomos/` (new directory, peer to `/opt/contexter/`)
- Docker: new service `nomos-api` in a new `/opt/nomos/docker-compose.yml` (isolated stack — do NOT modify contexter compose)
- Network: separate docker network, port 8100 exposed on localhost only, reverse-proxied via existing nginx/caddy to `api.nomos.contexter.cc`
- Rationale: cost (one VPS), ops simplicity, shared backup/monitoring

**Not negotiable** without nopoint approval.

---

## D-02 — Frontend stack

Vite + SolidJS + Tailwind CSS 4.

- Matches Contexter stack → design tokens portable
- Package manager: `bun` (per Contexter `deploy-web.sh`)
- Location: `finance/nomos/web/` (peer to `finance/nomos/runner/`)
- Build: `bun run build` → static in `dist/` → wrangler pages deploy

**Not negotiable.**

---

## D-03 — Theme + colors

Light theme. Classical Bauhaus palette via primary triad.

- Kandinsky / Itten primary triad: **yellow (Gelb)**, **red (Rot)**, **blue (Blau)**
- Neutral ground: warm off-white (NOT Contexter's cold pure white)
- Text: near-black (following Contexter)
- Semantic mapping:
  - Red = danger, SELL, error, halt
  - Blue = interactive, links, primary actions, info
  - Yellow = warning, pending, caution
  - Green = success, BUY profitable, resume (departure from strict triad — required for P&L readability)
- Verify every color decision via Bauhaus RAG (`bauhaus_knowledge`)

Details in `spec-design-tokens.md`. Rejected alternatives: dark theme (nopoint reverted), fiery red primary (shifted to Bauhaus triad).

---

## D-04 — Backend scope = FULL

Backend is NOT read-only. It must also control the runner.

- Read endpoints: balance, trades, strategies, portfolio, live prices, halt status
- Control endpoints: start/stop runner, toggle strategy, halt/resume, edit config
- Rationale (nopoint): "чтобы не переделывать потом"

---

## D-05 — Design tokens source

Contexter tokens (`nospace/design/contexter/guidelines/*.md`) = structural base. Adapt, don't replace.

Keep: typography scale, spacing scale, elevation levels, motion durations, layout grid.
Replace: cold B&W → Bauhaus triad palette.
Add: trading-specific tokens (P&L up/down, position LONG/FLAT, halt active).

---

## D-06 — Bauhaus RAG

Qdrant at `http://localhost:6333` (dev, docker container `kernel-qdrant-1`, volumes on nopoint laptop).

- Collections used: `bauhaus_knowledge` (10,288 vectors), `persona_kandinsky`, `persona_klee`, `persona_gropius`, `persona_moholy`
- Production Qdrant: out of scope for Phase 2 — design decisions made during dev, baked into static tokens
- RAG query template: `POST /collections/bauhaus_knowledge/points/search` with embedding
- Embedding model: jina-embeddings-v4, 2048-dim (matches existing collection)
- RAG is a DEV tool; runtime app does NOT query RAG

---

## D-07 — Live prices architecture

Backend (FastAPI) polls CCXT every 5s for configured pairs and broadcasts via SSE to connected clients.

- No frontend-side CCXT calls (avoids CORS, rate-limit leakage of testnet keys)
- SSE endpoint: `GET /api/live/stream` — streams JSON lines
- Events: `price_update`, `balance_update`, `trade`, `halt_changed`, `signal_dedup` (opt-in filter)

---

## D-08 — Runner control mechanism

Backend manages runner.py as a subprocess.

- `POST /api/runner/start` → `subprocess.Popen(['python', 'runner.py'])`, save PID to `runner.pid` file
- `POST /api/runner/stop` → read PID, SIGTERM, wait 10s, SIGKILL if alive
- `GET /api/runner/status` → check PID alive, return last journal tick ts
- **On Hetzner deployment**: runner.py runs INSIDE backend container (not on Windows). Runner code is shared via `finance/nomos/runner/` bind-mounted or COPY into image.

Risk: this moves the runner from Windows dev to Linux prod. Testnet keys transfer to server (secret management via `.env` file, chmod 600, NEVER in git).

---

## D-09 — Auth

Single-user bearer token.

- Token stored in Hetzner `.env` (NOMOS_AUTH_TOKEN)
- Frontend stores token in localStorage after initial login
- Login = single input box at `/login` route
- All `/api/*` endpoints require `Authorization: Bearer <token>` (except `/health`)
- Not OAuth, not CF Access — simple and sufficient for private tool

---

## D-10 — Alerts

Reuse Contexter Telegram bot (token env: `TELEGRAM_BOT_TOKEN`, chat_id: `620190856`).

- Alerts sent on: halt triggered, order_error, daily_drawdown > 2% (warning), > 3% (halt-level)
- Format: short text with deep link to relevant dashboard page
- Backend sends, frontend has NO direct Telegram integration

---

## Non-decisions (explicit TODO for next session)

- **X-01** Is runner running on Windows (dev) or Hetzner (prod)? If different — how does dev runner push state to prod dashboard? See Phase 2 Blockers.
- **X-02** Monorepo vs separate repo for `finance/nomos/web/`? Default: stay in `nospace/` monorepo.
- **X-03** CI/CD: GitHub Actions or manual deploy scripts? Default: manual scripts matching Contexter.

---

## Locked 2026-04-21, session 4 (Satoshi)

Any change requires nopoint approval + new D-nn entry. Never edit existing D-nn silently.
