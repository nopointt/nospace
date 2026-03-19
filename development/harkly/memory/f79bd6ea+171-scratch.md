# f79bd6ea+171-scratch.md
> Closed · Axis · 2026-03-19

<!-- ENTRY:2026-03-19:CLOSE:172:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — сессия 172 CLOSE [Axis]

**Decisions:**
- Manual SolidStart scaffold (C3 broken on Windows) — 1.3.2 + cloudflare-pages preset
- MiniMax M2.5 выбран как лучшая free модель для OpenCode CLI (80.2% SWE-bench Verified)
- OpenCode CLI работает как Player для UI задач; Qwen CLI требует `-y` (YOLO mode) + абсолютные пути
- Proxy upload в R2 вместо presigned URLs (aws4fetch — проще для MVP)
- Workers AI Llama 3.3 70B для schema discovery и extraction
- D1 регион EEUR (KB_DB: 1e070dfd, AUTH_DB: 7909c74e)
- wrangler.toml как primary config; wrangler.jsonc нужно удалить (C3 artifact)

**Files created (53 src + 6 SQL + configs):**
- `development/harkly/harkly-web/` — весь проект с нуля
- 18.1: package.json, app.config.ts, wrangler.toml, tsconfig.json, app.tsx, entry-*.tsx, middleware, db.ts, global.d.ts, auth.ts, auth-client.ts, [...auth].ts, login.tsx, register.tsx, 6 schema/*.ts, 6 migrations, drizzle.config.ts, .gitignore, src-tauri/README.md
- 18.2: api/kb/ (6 route files), pipeline/ (7 files: text-extractor, chunker, embedder, process-source, queue-handler, id-utils, token-counter), FileDropZone.tsx, UploadProgress.tsx, (protected)/kb/ (3 UI pages)
- 18.3: api/kb/[kbId]/schemas/ (3 routes), schema/discover.ts, extract.ts, extractions.ts, extraction/ (4 lib files: parse-llm-json, types, zod-compiler, index), SchemaFieldEditor.tsx, (protected)/kb/[kbId]/schema/ (3 pages), extract.tsx, extractions.tsx

**CF Resources created:**
- D1 KB_DB: `1e070dfd-dc58-4e21-897d-4ca5f2287017` (EEUR)
- D1 AUTH_DB: `7909c74e-2f5a-4df3-a05b-0611e09e466c` (EEUR)
- R2: harkly-uploads
- KV: OAUTH_KV (9b76ce88), AUTH_KV (e46ea29d), SESSION_KV (07376228)
- Vectorize: harkly-kb (1024-dim, cosine)
- Migrations: 6/6 applied locally

**Completed:**
- [x] 18.1 Scaffold — project bootstrap, all bindings, Drizzle schema (15 tables), auth, middleware, Tauri stub
- [x] 18.2 Upload + Process — R2 upload, queue producer, text extraction pipeline, chunking, embedding, job status API, upload UI
- [x] 18.3 Schema + Extract — AI schema discovery, schema editor UI, Zod compilation, extraction pipeline, results table, CSV export
- [x] vinxi build passes (cloudflare-pages preset)
- [x] D1 migrations applied locally (KB: 5, Auth: 1)

**Opened:**
- [ ] 18.4 MCP + OAuth (workers-oauth-provider, mcp-ts-core, 6 MCP tools, consent UI)
- [ ] 18.5 Canvas Port (harkly-shell 77 files → web SolidStart)
- [ ] Remote D1 migrations (wrangler d1 migrations apply --remote)
- [ ] Integration testing 18.2 + 18.3 (wrangler pages dev)
- [ ] Auth session integration (replace hardcoded `tenantId = "demo-user"`)
- [ ] wrangler.jsonc cleanup (C3 artifact with invalid placeholders → needs delete)
- [ ] Temp spec files cleanup (.qwen-task*.md, .opencode-task*.md)

**Notes:**
- OpenCode (MiniMax M2.5) — хороший Player для UI. 18.1: создал auth (5 файлов), 18.2: upload UI (5 файлов). Один fix потребовался (route handler per-request D1).
- Qwen CLI — не заработал как Player. Нужен `-y` (YOLO mode) для write, абсолютные пути для task files. В 18.2 и 18.3 не записал файлы.
- Build всегда проходит — архитектура стабильна.
- `tenantId = "demo-user"` — tech debt, fix при интеграции auth session в middleware.
