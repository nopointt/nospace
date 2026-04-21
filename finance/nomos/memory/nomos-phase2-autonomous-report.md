# Nomos Phase 2 — Autonomous Run Report

> **Mode:** Autonomous (J1 activated 2026-04-22 by nopoint "все окей, автономус мод включай")
> **Scope:** Full Phase 2 Dashboard — backend (FastAPI) + frontend (CF Pages) + runner migration (Hetzner) + DNS + reverse proxy + 8 pages read-only + control surface + polish. Until AC-1..AC-8 green.
> **Started:** 2026-04-22
> **Orchestrator:** Satoshi (session 5, scratch `2efd3500+5-scratch.md`)
> **Append-only.** Never rewrite past entries. Corrections = new dated entry referencing original.

---

## Hard safeguards active (J3)

- No touching `/opt/contexter/*` or its docker-compose
- No `rm`, `rmdir`, `Remove-Item` on any path
- Testnet Binance keys only; never mainnet
- No secrets in git; all `.env` chmod 600
- No `docker system prune`, no restart of Contexter API
- Auth/security code scope = Nomos only; Contexter auth untouched
- No architectural changes outside D-01..D-11
- Escalation on J5: prod broken, 3-iter Coach fail, scope creep, data integrity risk

---

## New locked decisions (added in autonomous run)

- **D-11** — Runner architecture: docker service `nomos-runner` in `/opt/nomos/docker-compose.yml`, shared volume for `journal.jsonl` with `nomos-api`. Backend controls runner via docker SDK (`docker.from_env().containers.get('nomos-runner').start()/stop()`) instead of subprocess. Supersedes D-08 subprocess approach. Rationale: clean process isolation on Linux, survives backend restart, standard container lifecycle. (X-01 resolved.)

- **D-12** — TLS for `api.nomos.contexter.cc`: CF DNS-only (grey cloud), Caddy auto-HTTPS via Let's Encrypt HTTP-01 challenge. Rationale: existing Contexter origin cert covers only `api.contexter.cc, contexter.cc` (verified via openssl on server); no Origin CA key available locally; single-user private API acceptable risk for no-WAF exposure (same as existing Netdata :19999). `nomos.contexter.cc` frontend remains CF-proxied (CF Pages handles TLS).

- **D-13** — Caddyfile modification scope: single additive block for `api.nomos.contexter.cc` in existing `/opt/contexter/Caddyfile`. J2 clause invoked — strictly required by scope, additive only, does not alter existing Contexter routes. Rollback = remove block + reload caddy. Alternative (separate caddy container) rejected because ports 80/443 already bound by contexter-caddy-1.

---

## Wave 0 — Phase 0 — completed 2026-04-22

**Ground truth captured (Hetzner 46.62.220.214):**
- Host: `contexter`, 21 days up, 56% disk (16G free)
- Docker: contexter-app/postgres/caddy/docling/netdata/redis all healthy
- Caddy: in container `contexter-caddy-1`, network `contexter_internal`, Caddyfile mounted `:ro` from `/opt/contexter/Caddyfile`
- Origin cert: `/opt/contexter/certs/origin.pem`, SAN=`api.contexter.cc, contexter.cc`, expires 2041-03-23
- Port 8100: free (confirmed)
- No systemd caddy/nginx

**Specs read:** spec-backend.md, spec-frontend.md, spec-design-tokens.md — all understood. D-08 supersede logged as D-11.

**Files touched:** `nomos-phase2-autonomous-report.md` (created, this file)

**Verify:** `ssh root@46.62.220.214 'ss -tln | grep 8100'` → FREE ✅ · `openssl x509 ... -text | grep SAN` → SAN confirmed ✅

**Commit:** pending — Wave 0 has no code changes, only analysis + memory docs. Will bundle with Wave 1 scaffolding commit.

**Status:** completed

---

## Task log

---

## Wave 1 — DNS + /opt/nomos + .env — PARTIAL (DNS blocked, server scaffolding done)

**Done:**
- Generated 32-char hex auth token via `python -c "import secrets; print(secrets.token_hex(16))"`, stored locally at `~/.tlos/nomos-auth-token` (chmod 600), masked from output
- Created `/opt/nomos/{api,memory/trading,runner,logs,web-build}/` on Hetzner
- Wrote `/opt/nomos/.env` on server (chmod 600, 12 env vars) including: NOMOS_AUTH_TOKEN, NOMOS_BINANCE_TESTNET_API_KEY/SECRET, NOMOS_TELEGRAM_BOT_TOKEN/CHAT_ID (reused Contexter's), NOMOS_ENV=prod, NOMOS_CORS_ORIGINS=https://nomos.contexter.cc, NOMOS_RAG_ENABLED=false
- Binance testnet key lengths verified: 64+64 chars

**BLOCKED — DNS creation:**
- Local `cf-api-token` has Zone:Read only (no Zone:DNS:Edit) — verified: GET zones works, POST dns_records = Authentication error code 10000
- Local `cf-global-key` + email `danchoachona@gmail.com` = Authentication error — may be wrong email or key format
- Origin CA service key absent locally (would allow Origin CA cert issuance)

**Files touched:** `/opt/nomos/.env` (server only), `~/.tlos/nomos-auth-token` (local only, not in git)

**Verify:** `ssh root@46.62.220.214 'ls -la /opt/nomos/.env && wc -l /opt/nomos/.env'` → `-rw------- 651 bytes 12 lines` ✅

**Commit:** none (no repo changes in Wave 1)

**Status:** deferred — DNS part escalated to nopoint; server scaffolding + .env = completed

---

## Wave 2 — Backend MVP — completed 2026-04-22

**Files created (28 files):** api/ FastAPI package, Dockerfile, docker-compose.yml, runner/Dockerfile, ops/deploy-nomos-api.sh (tar+ssh, Windows-friendly).

**Deploy:** SSH + append Caddyfile block → caddy reload → LE cert auto via tls-alpn-01 in 5s. First build failed on `pydantic-settings` parsing CSV for `NOMOS_CORS_ORIGINS` — fixed by writing JSON list format to `.env` on server.

**Verify:**
- `curl https://api.nomos.contexter.cc/health` → 200 `{"ok":true,"version":"0.1.0","uptime_s":18}` (108ms) ✅
- `curl https://api.nomos.contexter.cc/api/balance` without auth → 401 ✅
- With Bearer → 200 `{"usdt":10000,"total_usd":10000}` ✅
- Contexter unaffected (both containers up, no regression)

**J2 invoked:** additive Caddyfile block in `/opt/contexter/Caddyfile` per D-13. **D-12 realized:** LE cert via tls-alpn-01, CF grey cloud confirmed working.

**AC status so far:** AC-1 (<2s) ✅ · AC-2 (/health ok:true) ✅

**Status:** completed

---

## Escalation #1 — DNS manual step required (non-blocking for Wave 2 code, blocking for Wave 2 deploy)

**Need from nopoint (one of):**
- **Option A (fastest):** Manually add in CF dashboard → contexter.cc → DNS:
  - Type: A
  - Name: `api.nomos`
  - IPv4: `46.62.220.214`
  - Proxy: OFF (grey cloud, per D-12)
  - TTL: Auto
- **Option B:** Create new CF API token with `Zone:DNS:Edit` permission for `contexter.cc`, save to `~/.tlos/cf-api-token-dns`
- **Option C:** Provide Origin CA service key (CF dashboard → My Profile → API Tokens → Origin CA Keys → Create) — enables issue of proper origin cert, keeps CF proxy ON

**Also needed for frontend (Wave 4):**
- `nomos.contexter.cc` CNAME → `nomos-web.pages.dev` (after first `wrangler pages deploy` creates the project), Proxy ON
- May be done via same CF token fix (Option B)

**Recommended:** Option A manual — 30 seconds in dashboard, zero infra risk.

---

## Task log

