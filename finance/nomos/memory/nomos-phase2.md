---
# nomos-phase2.md — Phase 2: Observability Dashboard
> Layer: L3 | Status: PLANNED | Started: 2026-04-21 | Target finish: TBD
> Last updated: 2026-04-21 (session 4 — specs written)
---

## Goal

Web dashboard at `https://nomos.contexter.cc` for full visibility and control over the paper/real trading runner. Replaces CLI `monitor.py` with rich multi-page SPA.

Frontend: Cloudflare Pages.
Backend: FastAPI on Hetzner (shared VPS with Contexter).
Design: Bauhaus classical adaptation of Contexter design system, light theme.

## Why now

- Phase 1B runner is live (paper trading) but only observable via CLI
- Before Phase 1C (real money): need at-a-glance risk visibility and manual halt capability
- Before Phase 3 (DCA Machine): need portfolio tracking UI
- Before Phase 5 (Automation): need runner control surface

## Sub-phases

### Phase 2A — Scaffolding (foundation before features)

| ID | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Hetzner: add `nomos-api` docker-compose service next to contexter | TODO | See `spec-infra.md` |
| 2.2 | DNS: `nomos.contexter.cc` (CF Pages) + `api.nomos.contexter.cc` (VPS) | TODO | via CF API or dashboard |
| 2.3 | Backend scaffolding: FastAPI + uv + SSE | TODO | See `spec-backend.md` §Scaffolding |
| 2.4 | Frontend scaffolding: Vite + SolidJS + Tailwind | TODO | See `spec-frontend.md` §Scaffolding |
| 2.5 | Bauhaus RAG adapter in backend (Qdrant client, localhost:6333 → dev, remote mode for prod) | TODO | See `spec-backend.md` §RAG |
| 2.6 | Design tokens file + Tailwind theme config | TODO | See `spec-design-tokens.md` |

### Phase 2B — Core pages (read-only, observability first)

| ID | Task | Status | Notes |
|---|---|---|---|
| 2.7 | Page: Overview (balance, P&L, runner status, live tick feed) | TODO | |
| 2.8 | Page: Trades (full history, filter/sort, CSV export) | TODO | |
| 2.9 | Page: Strategies (per-strategy stats, enable/disable toggle WIRED LATER) | TODO | |
| 2.10 | Page: Portfolio (asset breakdown, pie chart) | TODO | |
| 2.11 | Page: Charts (BTC/ETH candle + trade markers) | TODO | Use uPlot/lightweight-charts |
| 2.12 | Page: Risk (drawdown widgets, halt status banner) | TODO | |
| 2.13 | Page: Remizov ODE (p/q/R² live charts for debugging) | TODO | |
| 2.14 | Page: Settings (pairs/timeframes/risk rules — view only in 2B, edit in 2C) | TODO | |

### Phase 2C — Control surface (write operations)

| ID | Task | Status | Notes |
|---|---|---|---|
| 2.15 | `POST /api/runner/stop` + Stop button in header | TODO | Idempotent |
| 2.16 | `POST /api/runner/start` + Start button | TODO | Requires runner.py PID management |
| 2.17 | `POST /api/runner/config` + editable Settings page | TODO | Validate JSON schema, restart runner on save |
| 2.18 | `POST /api/strategies/{name}/toggle` | TODO | Pause individual strategy without full stop |
| 2.19 | `POST /api/halt` + Halt banner with reason input | TODO | Writes halt.flag |
| 2.20 | `DELETE /api/halt` — resume trading | TODO | Confirms via modal |

### Phase 2D — Polish + alerts

| ID | Task | Status | Notes |
|---|---|---|---|
| 2.21 | Telegram alerts on halt, error, daily drawdown threshold | TODO | Reuse Contexter bot token |
| 2.22 | Auth: single-user password gate via CF Access or custom | TODO | Nomos is private; simple token auth OK |
| 2.23 | Mobile-responsive (tested down to 375px) | TODO | Tailwind breakpoints |
| 2.24 | Playwright E2E tests for critical paths | TODO | Login, halt-resume, view trades |

## Acceptance Criteria — Phase 2 complete

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | `https://nomos.contexter.cc` loads Overview page in <2s from EU | `curl -w "%{time_total}"` |
| AC-2 | API endpoint `https://api.nomos.contexter.cc/health` returns `{"ok":true}` | `curl -sSf` |
| AC-3 | All 8 pages render with live journal.jsonl data | Manual check each route |
| AC-4 | Stop/Start/Halt buttons work from web (runner actually stops) | Click → verify `Get-Process python` empty |
| AC-5 | WebSocket/SSE live tick feed updates Overview within 2s of journal write | Open 2 tabs, place test order |
| AC-6 | Auth gate: wrong password → denied | Manual check |
| AC-7 | Mobile: all pages usable at 375px | Chrome DevTools responsive |
| AC-8 | Deploy pipeline: `ops/deploy-nomos-web.sh` + `ops/deploy-nomos-api.sh` both green | Run both scripts |

## Decisions (from session 4 clarify)

| ID | Decision | Rationale |
|---|---|---|
| D-01 | Hetzner = same VPS as Contexter (46.62.220.214), new docker-compose service | Cost, ops simplicity |
| D-02 | Frontend = Vite + SolidJS + Tailwind (same stack as Contexter) | Consistency, reuse design system |
| D-03 | Theme = light + Bauhaus classical (primary triad red/blue/yellow) | User override, not dark+red |
| D-04 | Backend = FULL (read + control), not read-only | "чтобы не переделывать потом" |
| D-05 | Design tokens = Contexter base adapted for Nomos Bauhaus palette | RAG-verified via bauhaus_knowledge |
| D-06 | Bauhaus RAG = Qdrant localhost:6333 dev, remote Hetzner 6333 prod | Dev uses local docker, prod Qdrant optional |
| D-07 | Live prices via CCXT in backend, SSE push to frontend | No frontend CCXT dependency |
| D-08 | Runner control = backend spawns/kills runner.py as subprocess, PID in state | Simple, no new daemon needed |
| D-09 | Auth = single-user, bearer token header, token in CF Pages env | Nomos is private for nopoint |
| D-10 | Telegram alerts via existing Contexter bot token, separate chat_id if needed | Reuse |

See `phase2-dashboard/CONTEXT.md` for full locked-decision log.

## Blockers / Risks

- **Runner process management on Windows host.** Backend on Hetzner can't kill Windows python process directly. Options: (a) runner moves to Hetzner too, or (b) WebSocket bridge from Windows runner to Hetzner backend, or (c) local dev only control surface.  
  **Decision needed before 2.15-2.17.** Leaning (a) — run runner on Hetzner.

- **Testnet API from Hetzner EU IP.** Binance testnet may rate-limit / block EU cloud IPs. Need to verify at scaffolding stage.

- **SSL for `api.nomos.contexter.cc`.** CF proxy + origin cert from Contexter VPS setup. Document in infra spec.

## Out of scope for Phase 2

- Real-money trading (Phase 1C)
- Multi-user auth
- Historical OHLCV replay UI
- Strategy editor (code editor in web)
- Mobile native app

## Resume instructions (next session)

1. Read this file
2. Read `phase2-dashboard/CONTEXT.md` for all D-01...D-10
3. Read 4 specs in `phase2-dashboard/`
4. Launch G3 agents per `spec-*.md` instructions
5. Start with Phase 2A tasks (scaffolding), then 2B, 2C, 2D sequentially
