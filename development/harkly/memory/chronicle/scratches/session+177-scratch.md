# session-scratch.md

<!-- ENTRY:2026-03-19:CLOSE:177:harkly:harkly-mvp-data-layer [AXIS] -->
## 2026-03-19 — session 177 CLOSE [Axis]

**Decisions:**
- QA Epic executed as 3 parallel tracks: Bug Hunt (3 Claude agents), Tech Debt (Qwen + OpenCode CLI), Auto Tests (vitest + 4 writer agents)
- AUTH REGISTRATION 500 deprioritized per nopoint
- vitest 4.1.0 + jsdom chosen as test framework (no Playwright unit tests)
- Full suite OOMs on 50 jsdom forks — need `maxWorkers: 2` or pool: threads

**Files changed:**
- `harkly-web/QA-REPORT.md` — consolidated report (54 bugs, 770 tests, tech debt)
- `harkly-web/vitest.config.ts` + `src/__tests__/` — full test infrastructure (50 test files)
- `harkly-web/package.json` — vitest deps + test scripts
- `harkly/memory/harkly-mvp-data-layer.md` — L3 updated with QA results

**Completed:**
- Bug Hunt: 54 bugs found (7 CRITICAL, 16 HIGH, 21 MEDIUM, 10 LOW)
- Tech Debt: Qwen + OpenCode audits (29 TS errors, dual MCP impl, debug endpoint, no CSP)
- Auto Tests: 770 tests across 50 files (smoke 17, MCP 79, pipeline 102, canvas 212, API 115, pre-existing 245)
- Embedder test fix (afterEach scope outside describe)

**Opened:**
- Fix 7 CRITICAL security bugs (missing auth on 4 endpoints, XSS/open redirect, CSRF, cross-tenant leak)
- Fix 16 HIGH bugs (reactivity, auth guards, logic)
- Fix vitest OOM (add maxWorkers config)
- Quota recalibrated: 227M tokens per 5h window

**Notes:**
- 10% quota remaining at session close
- No code fixes applied — this was audit-only session
- Priority fix order in QA-REPORT.md
