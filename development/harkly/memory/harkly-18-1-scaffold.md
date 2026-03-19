---
# HARKLY-18.1 — Scaffold
> Parent: HARKLY-18 | Status: 🔜 NEXT | Blocks: 18.2, 18.4
> Spec: `docs/research/harkly-mvp-build-plan.md` Phase 0
> Copy Map: `docs/research/harkly-mvp-copy-map.md`
---

## Goal

SolidStart app deploys to CF Pages, auth works, D1 reads/writes work, all bindings configured.

## Tasks

- [ ] Bootstrap SolidStart via `npm create cloudflare@latest harkly -- --framework=solid`
- [ ] Configure `app.config.ts`: `preset: "cloudflare-pages"`, compatibilityDate, middleware
- [ ] Add all CF bindings to `wrangler.toml`: D1(KB_DB), D1(AUTH_DB), R2, KV(OAUTH_KV), KV(AUTH_KV), Vectorize, Queues, AI
- [ ] Install Drizzle ORM + drizzle-kit, write initial D1 schema (15 tables from Data Model doc)
- [ ] FTS5 virtual table + trigger (copy from cloudflare-rag, fix rank sort bug)
- [ ] Port middleware from solid-pages: `wrangler.getPlatformProxy()` for dev, native context for prod
- [ ] `createDb(event)` per-request D1 pattern
- [ ] Generate `worker-configuration.d.ts` via `wrangler types`
- [ ] Install better-auth + better-auth-cloudflare, mount at `/api/auth/[...auth]`
- [ ] Lazy singleton auth pattern (D1 binding per-request)
- [ ] Verify: register, login, session check

## Clone From

| Source | What |
|---|---|
| C3 scaffold | Project skeleton |
| solid-pages | `app.config.ts`, `middleware.ts`, `db/client.ts`, `drizzle.config.ts` |
| cloudflare-rag | FTS5 DDL + trigger SQL |
| openai-sdk-knowledge-org | `ingest_jobs` + `query_stats` table DDL |
| better-auth docs | SolidStart integration |

## Acceptance

- [ ] `vinxi dev` starts, loads in browser
- [ ] `wrangler pages deploy` succeeds, site loads at CF Pages URL
- [ ] Register + login + session check works
- [ ] Server function reads/writes D1
- [ ] `wrangler d1 migrations apply` runs on remote
