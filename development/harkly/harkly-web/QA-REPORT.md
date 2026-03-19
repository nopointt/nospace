# Harkly MVP — QA Report
> Date: 2026-03-19 | Session: Axis QA Epic
> Codebase: ~10,500 lines, 86 source files

---

## Track 1: Bug Hunt — 54 bugs found

### CRITICAL (7)

| # | Bug | File | Domain |
|---|---|---|---|
| B1 | PUT upload endpoint has NO authentication | `routes/api/kb/[kbId]/upload/[sourceId].ts` | Backend |
| B2 | Job detail endpoint unauthenticated, no tenant isolation | `routes/api/kb/[kbId]/jobs/[jobId]/index.ts` | Backend |
| B3 | Schema GET/PUT have no auth — read/overwrite any schema | `routes/api/kb/[kbId]/schemas/[schemaId]/index.ts` | Backend |
| B4 | Schema confirm has no auth | `routes/api/kb/[kbId]/schemas/[schemaId]/confirm.ts` | Backend |
| M1 | Open redirect + JS injection via `next` parameter | `workers/harkly-mcp/src/handlers/login-ui.ts` | MCP |
| M2 | CSRF on consent form — no state binding | `workers/harkly-mcp/src/handlers/default.ts` | MCP |
| M3 | Cross-tenant chunk access (no tenant_id on chunks query) | `workers/harkly-mcp/src/lib/mcp-protocol.ts` | MCP |

### HIGH (16)

| # | Bug | File | Domain |
|---|---|---|---|
| B5 | Stack trace leaked in auth error response | `routes/api/auth/[...auth].ts` | Backend |
| B6 | Hardcoded fallback secret `harkly-dev-secret-change-in-production` | `lib/auth.ts` | Backend |
| B7 | Embedder silently drops chunks on partial AI response | `lib/pipeline/embedder.ts` | Backend |
| B8 | Infinite loop in chunker when overlap >= chunkSize | `lib/pipeline/chunker.ts` | Backend |
| B9 | UTF-8 truncation produces mojibake (Cyrillic/CJK) | `lib/pipeline/token-counter.ts` | Backend |
| B10 | Schema lookup has no projectId/tenantId check | `routes/api/kb/[kbId]/extract.ts` | Backend |
| B11 | Documents query missing tenantId filter | `routes/api/kb/[kbId]/extract.ts` | Backend |
| F1 | `createEffect` inside `onMount` — canvas grid never redraws | `components/canvas/Space.tsx` | Frontend |
| F4 | Falsy-zero trap: frames at x=0/y=0 snap to (100,100) | `components/canvas/FrameContainer.tsx` | Frontend |
| F6 | No error state when session fetch fails | `components/layout/ProtectedLayout.tsx` | Frontend |
| F8 | Upload reads kbId from window.location, not router params | `routes/(protected)/kb/[kbId]/upload.tsx` | Frontend |
| F9 | Job polling silently stops under fast API responses | `routes/(protected)/kb/[kbId]/upload.tsx` | Frontend |
| F11 | Signal writes inside ErrorBoundary render fallback | `components/canvas/ErrorBoundary.tsx` | Frontend |
| F18 | kb/index.tsx missing ProtectedLayout auth guard | `routes/(protected)/kb/index.tsx` | Frontend |
| F19 | extract.tsx and schema/index.tsx missing auth guard | `routes/(protected)/kb/[kbId]/` | Frontend |
| M10 | Email verification disabled — identity spoofing | `workers/harkly-mcp/src/lib/auth.ts` | MCP |

### MEDIUM (21) + LOW (10)

See full reports per domain in agent output files.

---

## Track 2: Tech Debt

Key findings (Qwen + OpenCode audits):
- 29 pre-existing TS errors (APIEvent, FetchEvent, entry-server, embedder, zod-compiler types)
- Dual MCP tool implementation (mcp-protocol.ts vs registry.ts) — live one is less secure
- KvSessionStore defined but never wired up — MCP sessions in-memory only
- `src/routes/api/debug.ts` exposed in production with no auth
- Queues commented out in wrangler.toml (needs Workers Paid)
- No CSP/X-Frame-Options on OAuth pages
- No rate limiting on auth endpoints

---

## Track 3: Auto Tests — 770 tests

| Suite | Tests | Files | Status |
|---|---|---|---|
| Smoke (vitest + mocks) | 17 | 1 | PASS |
| MCP Worker | 79 | 5 | PASS |
| Pipeline + Extraction | 102 | 7 | PASS |
| Canvas + Commands + Hooks | 212 | 8+ | PASS |
| API Routes | 115 | 16 | PASS |
| Pre-existing (schema, etc.) | 245 | 13 | PASS |
| **TOTAL** | **770** | **50** | **PASS** |

Note: Full suite OOMs when run together (50 jsdom forks). Run per-domain: `npx vitest run src/__tests__/pipeline` etc. Fix: add `pool: "threads"` or `maxWorkers: 2` to vitest.config.ts.

---

## Priority Fix Order

**Before any production traffic:**
1. B1-B4: Add `requireAuth` to upload PUT, job GET, schema GET/PUT/confirm
2. M1+M2: Fix open redirect + CSRF on OAuth pages
3. M3: Add tenant_id filter to chunk/search queries
4. B6: Remove hardcoded secret fallback (throw on missing)
5. B10-B11: Add tenantId to extract.ts queries
6. F18-F19: Wrap unprotected pages in ProtectedLayout

**Before beta:**
7. B7-B9: Fix embedder alignment, chunker infinite loop, UTF-8 truncation
8. F1+F4: Fix canvas reactivity (createEffect scope, nullish coalescing)
9. M9: Delete dead mcp-protocol.ts, use registry.ts
10. Wire up KvSessionStore for MCP sessions
