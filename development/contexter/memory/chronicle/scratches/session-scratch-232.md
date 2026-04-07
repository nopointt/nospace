# session-scratch.md
> Placeholder · Axis · 2026-04-07 · session 232
> Last processed checkpoint: #231

<!-- ENTRY:2026-04-07:CLOSE:232:contexter:contexter-gtm-launch [AXIS] -->
## 2026-04-07 — сессия 232 CLOSE [Axis]

**Decisions:**
- D-42: LemonSqueezy APPROVED. Primary payment processor. Card payments enabled.
- D-43: $300 invested in project total
- D-44: ChatGPT MCP compat: /mcp route + CORS (chatgpt.com, chat.openai.com) + 15 tool annotations
- D-45: OpenAI App Directory: draft submitted, domain verified. Needs $5 individual verification.
- D-46: Alpha mode — text-only formats (~55+). Frontend restriction only, backend untouched.
- D-47: Pricing tiers need review — 1GB Starter too small. Deferred to next session.
- D-48: Pro Launch Special = single payment variants ($10/30/60/120) for 1/3/6/12 months of Pro

**Files changed:**
- `src/index.ts` — added /mcp route alias, ChatGPT CORS origins
- `src/routes/mcp-remote.ts` — tool annotations (15 tools), ChatGPT CORS in SSE_CORS_ORIGINS, create_share dual URL
- `src/services/parsers/docling.ts` — TextParser expanded to 55 MIME types, octet-stream warning, detectFormat 56 mappings
- `web/src/pages/Upload.tsx` — SUPPORTED_EXTENSIONS → 50+ text-only formats
- `web/src/pages/Hero.tsx` — SUPPORTED_EXTENSIONS → 50+ text-only formats
- `web/src/lib/translations/en.ts` — 7 format strings updated for alpha
- `web/src/lib/translations/ru.ts` — 7 format strings updated for alpha
- `memory/specs/chatgpt-mcp-compat-spec.md` — created
- `memory/specs/alpha-text-formats-spec.md` — created

**Completed:**
- ChatGPT MCP compat: /mcp endpoint + CORS + tool annotations — deployed + E2E tested (13/13 AC pass)
- OpenAI App Directory: full submission (app info, MCP server, testing, screenshots, domain verified)
- LemonSqueezy approval confirmed — blocker resolved
- Alpha text formats: 50+ extensions frontend + 55 MIME types backend — deployed
- Reviewer test account created (reviewer@contexter.cc) with 3 test documents

**Opened:**
- LemonSqueezy billing integration (store products, checkout overlay, webhook endpoint)
- Pricing tier review — 1GB Starter too small
- OpenAI App Directory: $5 individual verification pending
- Perplexity MCP URL still on workers.dev
- Copy audit still not applied (W1-01)

**Notes:**
- Deploy script (ops/deploy.sh) doesn't sync index.ts properly — had to manual SCP
- 4 git commits this session: chatgpt-compat, alpha-B1, alpha-F1, plus memory updates
