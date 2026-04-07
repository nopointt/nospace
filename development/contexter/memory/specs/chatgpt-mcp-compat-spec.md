# Spec: ChatGPT Developer Mode MCP Compatibility

**Phase:** chatgpt-compat  
**Author:** Domain Lead  
**Date:** 2026-04-07  
**Player:** mies (backend specialist)

---

## Context

Contexter MCP endpoint (`/sse`) is Streamable HTTP JSON-RPC. ChatGPT Developer Mode requires:
1. Endpoint at `/mcp` (ChatGPT hardcodes this path expectation)
2. CORS headers covering `chatgpt.com` and `chat.openai.com` origins
3. Tool annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`) on all 15 tools
4. Share URL emitted by `create_share` tool must reference `/mcp` so shared connections work in ChatGPT

Existing `/sse` endpoint, token auth (`?token=`), OAuth 2.1 flow, and all existing clients (Claude.ai, Perplexity) MUST continue working unchanged.

**Locked decisions:**
- D-22: Direct Cloud API approach — no proxy layer
- Backward compatibility: `/sse` stays live, all existing auth paths unchanged
- `?token=` query auth continues alongside OAuth Bearer
- No new dependencies — changes are purely config/routing/annotation

**Files affected:**
- `src/index.ts` — add `/mcp` route alias, update CORS
- `src/routes/mcp-remote.ts` — add tool annotations, update `SSE_CORS_ORIGINS`, fix share URL

---

## Task 1: Add `/mcp` route alias

**Action:**

In `src/index.ts`, after line 256 (`app.route("/sse", mcpRemote)`), add:

```typescript
app.route("/mcp", mcpRemote)
```

The same `mcpRemote` Hono router handles both paths. No new handler needed — Hono's routing mounts the same router instance at a new prefix.

Note: line 255 currently reads `// P1-010: /mcp route removed (legacy CF Workers scaffold)` — this comment refers to the old CF Workers scaffold (`mcp.ts`), not the current `mcpRemote` handler. Remove that comment and add the new route.

**Exact diff in `src/index.ts`:**

```typescript
// REMOVE this comment:
// P1-010: /mcp route removed (legacy CF Workers scaffold)

// Line 256 — keep existing:
app.route("/sse", mcpRemote)

// ADD immediately after:
app.route("/mcp", mcpRemote)
```

**Verify:**
```bash
curl -s -X POST https://api.contexter.cc/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}},"id":1}' \
  | jq '.result.protocolVersion'
# Expected: "2025-03-26"
```

**Done when:**
- [ ] `POST https://api.contexter.cc/mcp` returns `{"protocolVersion":"2025-03-26"}` in result
- [ ] `POST https://api.contexter.cc/sse` still returns the same (backward compat)
- [ ] Both endpoints accept `?token=` auth and return tool list on `tools/list`

---

## Task 2: Update CORS — add ChatGPT origins

**Action:**

Two places must be updated:

### 2a. Main CORS middleware (`src/index.ts`, line 147-153)

Change `origin` array from:
```typescript
origin: ["https://contexter.cc", "https://www.contexter.cc"],
```
to:
```typescript
origin: [
  "https://contexter.cc",
  "https://www.contexter.cc",
  "https://chatgpt.com",
  "https://chat.openai.com",
],
```

Keep all other CORS options unchanged (`credentials: true`, `allowHeaders`, etc.).

**Important:** ChatGPT makes preflight OPTIONS requests and then POST requests from these origins. The `Authorization` header must remain in `allowHeaders`. Verify `allowHeaders` includes `"Authorization"` — it does (line 151). No change needed there.

### 2b. SSE-specific CORS origins (`src/routes/mcp-remote.ts`, line 1243)

Change:
```typescript
const SSE_CORS_ORIGINS = ["https://contexter.cc", "https://www.contexter.cc"]
```
to:
```typescript
const SSE_CORS_ORIGINS = [
  "https://contexter.cc",
  "https://www.contexter.cc",
  "https://chatgpt.com",
  "https://chat.openai.com",
]
```

This controls the `Access-Control-Allow-Origin` header emitted in SSE responses and plain JSON fallback responses (lines 251 and 1250 in mcp-remote.ts).

**Note on `cdn.oaistatic.com`:** ChatGPT's frontend assets load from this CDN domain but API calls to external MCP servers originate from `chatgpt.com` and `chat.openai.com` browser contexts. CDN assets do not make cross-origin fetch requests to external servers. Do NOT add `cdn.oaistatic.com` to the allowlist — it would be incorrect.

**Verify:**
```bash
curl -s -I -X OPTIONS https://api.contexter.cc/mcp \
  -H "Origin: https://chatgpt.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  | grep -i "access-control"
# Expected lines (exact header names, values may vary):
# access-control-allow-origin: https://chatgpt.com
# access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
# access-control-allow-headers: Content-Type, Authorization
```

```bash
curl -s -I -X OPTIONS https://api.contexter.cc/mcp \
  -H "Origin: https://chat.openai.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  | grep -i "access-control-allow-origin"
# Expected: access-control-allow-origin: https://chat.openai.com
```

```bash
# Verify /sse backward compat — existing origins still work
curl -s -I -X OPTIONS https://api.contexter.cc/sse \
  -H "Origin: https://contexter.cc" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i "access-control-allow-origin"
# Expected: access-control-allow-origin: https://contexter.cc
```

**Done when:**
- [ ] OPTIONS `/mcp` with `Origin: https://chatgpt.com` returns `Access-Control-Allow-Origin: https://chatgpt.com`
- [ ] OPTIONS `/mcp` with `Origin: https://chat.openai.com` returns `Access-Control-Allow-Origin: https://chat.openai.com`
- [ ] OPTIONS `/sse` with `Origin: https://contexter.cc` still returns `Access-Control-Allow-Origin: https://contexter.cc`

---

## Task 3: Add tool annotations to all 15 tools

**Action:**

In `src/routes/mcp-remote.ts`, add an `annotations` field to each tool object in the `TOOLS` array. The MCP spec 2025-03-26 defines tool annotations as:

```typescript
annotations?: {
  readOnlyHint?: boolean      // tool does not modify state
  destructiveHint?: boolean   // tool permanently removes data
  idempotentHint?: boolean    // repeated calls with same args = same effect
  openWorldHint?: boolean     // tool interacts with external world beyond the KB
}
```

**Classification for each tool:**

| Tool | readOnlyHint | destructiveHint | idempotentHint | openWorldHint |
|---|---|---|---|---|
| search_knowledge | true | false | false | false |
| list_documents | true | false | true | false |
| get_document | true | false | true | false |
| add_context | false | false | false | false |
| upload_document | false | false | false | false |
| delete_document | false | true | true | false |
| get_document_content | true | false | true | false |
| ask_about_document | true | false | false | false |
| get_stats | true | false | false | false |
| create_share | false | false | false | false |
| summarize_document | true | false | false | false |
| rename_document | false | false | true | false |
| create_room | false | false | false | false |
| list_rooms | true | false | true | false |
| get_room_stats | true | false | true | false |

All tools: `openWorldHint: false` — all operations stay within the user's Contexter knowledge base.

**Rationale for non-obvious classifications:**
- `search_knowledge`: `idempotentHint: false` — reranking scores may vary due to upstream model updates
- `ask_about_document`: `idempotentHint: false` — same as above, formatting instructions are context-dependent
- `add_context`/`upload_document`: `idempotentHint: false` — repeated calls create duplicate documents
- `create_share`/`create_room`: `idempotentHint: false` — repeated calls create duplicate entities
- `delete_document`: `idempotentHint: true` — deleting an already-deleted doc returns "not found", no state change

**Exact code replacement in `src/routes/mcp-remote.ts`:**

Replace the entire `TOOLS` array definition (lines 24-193) with the annotated version. The `inputSchema` objects are unchanged — only add `annotations` field to each tool. Example for the first two tools:

```typescript
const TOOLS = [
  {
    name: "search_knowledge",
    description: "Search the Contexter knowledge base using natural language. Returns relevant document chunks with sources and formatting instructions. Your LLM should synthesize the answer from the returned chunks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query in natural language" },
        topK: { type: "number", description: "Number of results to return (default 5, max 20)" },
        roomId: { type: "string", description: "Optional room ID to restrict search to a specific room" },
      },
      required: ["query"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  {
    name: "list_documents",
    description: "List all documents in the Contexter knowledge base with their processing status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        roomId: { type: "string", description: "Optional room ID to list documents from a specific room only" },
      },
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  // ... continue for all 15 tools
]
```

Apply the same pattern for all 15 tools using the classification table above.

**Verify:**
```bash
TOKEN=$(grep -r "api_token" /root/.env 2>/dev/null || echo "YOUR_TOKEN_HERE")
curl -s -X POST https://api.contexter.cc/mcp?token=$TOKEN \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | jq '[.result.tools[] | {name: .name, has_annotations: (.annotations != null)}]'
# Expected: array of 15 objects, all with has_annotations: true
```

```bash
curl -s -X POST https://api.contexter.cc/mcp?token=$TOKEN \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | jq '.result.tools | length'
# Expected: 15
```

```bash
# Verify delete_document has destructiveHint: true
curl -s -X POST https://api.contexter.cc/mcp?token=$TOKEN \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | jq '.result.tools[] | select(.name == "delete_document") | .annotations'
# Expected: {"readOnlyHint":false,"destructiveHint":true,"idempotentHint":true,"openWorldHint":false}
```

**Done when:**
- [ ] `tools/list` returns 15 tools, all with non-null `annotations` field
- [ ] `delete_document` has `destructiveHint: true`
- [ ] All read-only tools have `readOnlyHint: true`
- [ ] No tool has `openWorldHint: true`

---

## Task 4: Fix `create_share` tool — emit `/mcp` URL

**Action:**

In `src/routes/mcp-remote.ts`, the `create_share` case (around line 902) generates a share URL using the `/sse` path:

```typescript
const shareUrl = `${env.BASE_URL}/sse?share=${shareToken}`
```

Change to emit both `/mcp` and `/sse` URLs so users can connect from ChatGPT or any MCP client:

```typescript
const mcpUrl = `${env.BASE_URL}/mcp?share=${shareToken}`
const sseUrl = `${env.BASE_URL}/sse?share=${shareToken}`
```

Update the result text to show the primary `/mcp` URL with `/sse` as a fallback note:

```typescript
return makeResult(req.id, {
  content: [{ type: "text", text: `**Share link created**\n- MCP URL: ${mcpUrl}\n- Legacy SSE URL: ${sseUrl}\n- Permission: ${permission}\n- Expires: ${expiresAt ?? "never"}\n\nAnyone with this URL can connect via MCP and ${permission === "read_write" ? "search + upload" : "search only"}.` }],
})
```

**Verify:**
```bash
curl -s -X POST https://api.contexter.cc/mcp?token=$TOKEN \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"create_share","arguments":{"permission":"read"}},"id":1}' \
  | jq '.result.content[0].text'
# Expected: string containing "mcp?share=" and "sse?share="
```

**Done when:**
- [ ] `create_share` result text contains a URL with `/mcp?share=`
- [ ] `create_share` result text also contains the legacy `/sse?share=` URL
- [ ] Share token returned is valid — connecting via `/mcp?share=TOKEN` works for `search_knowledge`

---

## Task 5: Verify OAuth flow for ChatGPT

**Action:**

This is a verification-only task — no code changes unless gaps are found.

ChatGPT Developer Mode OAuth flow:
1. ChatGPT GET `https://api.contexter.cc/.well-known/oauth-authorization-server`
2. ChatGPT POST `https://api.contexter.cc/register` with `{"client_name":"ChatGPT","redirect_uris":["https://chatgpt.com/aip/g/XXXX/oauth_callback"]}`
3. ChatGPT redirects browser to `https://api.contexter.cc/authorize?client_id=...&redirect_uri=...&response_type=code&code_challenge=...&code_challenge_method=S256`
4. User enters their Contexter API token in the consent form
5. POST to `/authorize` stores code in Redis, redirects to ChatGPT callback
6. ChatGPT POST `/token` with PKCE verifier, receives `access_token`
7. ChatGPT calls `/mcp` with `Authorization: Bearer ACCESS_TOKEN`

**Known gap to verify:** The `/register` endpoint (index.ts line 210) defaults to Perplexity's redirect URI when none provided:
```typescript
const redirectUrisRaw = Array.isArray(body.redirect_uris) && body.redirect_uris.length > 0
  ? body.redirect_uris as string[]
  : ["https://www.perplexity.ai/rest/connections/oauth_callback"]
```
ChatGPT WILL provide `redirect_uris` in its registration call, so this default will not be used. No change needed.

**Known gap to verify:** The `/.well-known/oauth-authorization-server` response does NOT include `scopes_supported`. ChatGPT does not require this field — omitting it is valid per RFC 8414. No change needed.

**Verify all OAuth endpoints are reachable and return correct content types:**
```bash
# 1. OAuth metadata
curl -s https://api.contexter.cc/.well-known/oauth-authorization-server \
  | jq '{issuer,authorization_endpoint,token_endpoint,registration_endpoint}'
# Expected:
# {
#   "issuer": "https://api.contexter.cc",
#   "authorization_endpoint": "https://api.contexter.cc/authorize",
#   "token_endpoint": "https://api.contexter.cc/token",
#   "registration_endpoint": "https://api.contexter.cc/register"
# }
```

```bash
# 2. Dynamic client registration — simulate ChatGPT registration
curl -s -X POST https://api.contexter.cc/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"ChatGPT-Test","redirect_uris":["https://chatgpt.com/aip/g/test/oauth_callback"]}' \
  | jq '{client_id,client_name,redirect_uris}'
# Expected: object with client_id starting with "contexter-", client_name "ChatGPT-Test",
#           redirect_uris ["https://chatgpt.com/aip/g/test/oauth_callback"]
```

```bash
# 3. Authorization page loads (HTML response)
CLIENT_ID=$(curl -s -X POST https://api.contexter.cc/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","redirect_uris":["https://chatgpt.com/aip/g/test/oauth_callback"]}' \
  | jq -r '.client_id')

curl -s -o /dev/null -w "%{http_code}" \
  "https://api.contexter.cc/authorize?client_id=${CLIENT_ID}&redirect_uri=https://chatgpt.com/aip/g/test/oauth_callback&response_type=code&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256"
# Expected: 200
```

**Done when:**
- [ ] `/.well-known/oauth-authorization-server` returns JSON with all 4 required endpoint URLs
- [ ] `/register` accepts ChatGPT-style registration (with `redirect_uris`) and returns `client_id`
- [ ] `/authorize` page loads (HTTP 200) with valid `client_id` and ChatGPT redirect URI
- [ ] Bearer token auth works: `Authorization: Bearer TOKEN` on `/mcp` returns tool list

---

## Task 6: Deploy

**Action:**

From the project root (`C:\Users\noadmin\nospace\development\contexter`), run the deploy script:

```bash
bash ops/deploy.sh
```

Wait for deploy to complete. Then verify the deployed endpoint.

**Verify:**
```bash
# Health check
curl -s https://api.contexter.cc/health | jq '.status'
# Expected: "ok"
```

```bash
# /mcp initialize (no auth required for initialize)
curl -s -X POST https://api.contexter.cc/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}},"id":1}' \
  | jq '.result.protocolVersion'
# Expected: "2025-03-26"
```

```bash
# /sse backward compat still works
curl -s -X POST https://api.contexter.cc/sse \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}},"id":1}' \
  | jq '.result.protocolVersion'
# Expected: "2025-03-26"
```

**Done when:**
- [ ] `ops/deploy.sh` exits with code 0
- [ ] `/health` returns `{"status":"ok"}`
- [ ] `/mcp` responds to `initialize` with `protocolVersion: "2025-03-26"`
- [ ] `/sse` still responds correctly (no regression)

---

## Task 7: Smoke test — full ChatGPT flow simulation

**Action:**

This is a verification-only task. Simulate the exact flow ChatGPT uses.

**Verify:**
```bash
# Step 1: Fetch OAuth metadata
curl -s https://api.contexter.cc/.well-known/oauth-authorization-server | jq .
# Expected: JSON with issuer, authorization_endpoint, token_endpoint, registration_endpoint

# Step 2: Register a test client
REGISTRATION=$(curl -s -X POST https://api.contexter.cc/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"ChatGPT-SmokeTest","redirect_uris":["https://chatgpt.com/aip/g/smoke/oauth_callback"]}')
echo $REGISTRATION | jq .
# Expected: {client_id: "contexter-...", client_secret: "...", redirect_uris: [...]}

# Step 3: Verify /mcp with Bearer token (simulates post-OAuth call)
TOKEN=YOUR_ACTUAL_TOKEN
curl -s -X POST https://api.contexter.cc/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | jq '{tool_count: (.result.tools | length), first_tool_has_annotations: (.result.tools[0].annotations != null)}'
# Expected: {tool_count: 15, first_tool_has_annotations: true}

# Step 4: CORS preflight from chatgpt.com origin
curl -s -I -X OPTIONS https://api.contexter.cc/mcp \
  -H "Origin: https://chatgpt.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization, Content-Type" \
  | grep -i "access-control"
# Expected: access-control-allow-origin: https://chatgpt.com
#           access-control-allow-methods: (includes POST)
#           access-control-allow-headers: (includes Authorization)

# Step 5: Verify SSE Accept header path (ChatGPT may use SSE)
curl -s -X POST https://api.contexter.cc/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | head -5
# Expected: starts with "event: message" and "data: {"jsonrpc":"2.0"..."
```

**Done when:**
- [ ] All 5 verification steps above pass without errors
- [ ] `tools/list` returns exactly 15 tools with annotations
- [ ] CORS headers present for `chatgpt.com` origin on `/mcp`
- [ ] SSE response format works on `/mcp` with `Accept: text/event-stream`

---

## Acceptance Criteria Summary

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | `/mcp` route responds to `initialize` | `curl POST /mcp` → `{"protocolVersion":"2025-03-26"}` |
| AC-2 | `/sse` unchanged, still works | `curl POST /sse` → `{"protocolVersion":"2025-03-26"}` |
| AC-3 | CORS allows `chatgpt.com` on `/mcp` | OPTIONS `/mcp` with Origin: chatgpt.com → ACAO: chatgpt.com |
| AC-4 | CORS allows `chat.openai.com` on `/mcp` | OPTIONS `/mcp` with Origin: chat.openai.com → ACAO: chat.openai.com |
| AC-5 | CORS still allows `contexter.cc` | OPTIONS `/sse` with Origin: contexter.cc → ACAO: contexter.cc |
| AC-6 | All 15 tools have annotations | `tools/list` → every tool has `.annotations` non-null |
| AC-7 | `delete_document` is destructive | `.annotations.destructiveHint == true` |
| AC-8 | No tool touches external world | All tools `.annotations.openWorldHint == false` |
| AC-9 | OAuth metadata endpoint works | GET `/.well-known/oauth-authorization-server` → 200 JSON |
| AC-10 | Dynamic registration works | POST `/register` with ChatGPT redirect URI → `client_id` |
| AC-11 | `create_share` emits `/mcp` URL | `create_share` result contains `/mcp?share=` |
| AC-12 | Bearer token auth on `/mcp` | `Authorization: Bearer TOKEN` → `tools/list` 15 tools |
| AC-13 | `?token=` auth on `/mcp` | `POST /mcp?token=TOKEN` → `tools/list` 15 tools |

---

## Implementation Order

Tasks are sequential (each depends on prior) except Tasks 5 and 7 (verification-only, can run anytime after deploy):

```
Task 1 (route) → Task 2 (CORS) → Task 3 (annotations) → Task 4 (share URL) → Task 6 (deploy) → Task 5 (OAuth verify) → Task 7 (smoke test)
```

Tasks 1-4 are pure code changes, no external dependencies. All can be committed as a single atomic commit after Task 4 passes local verification:

```
feat(chatgpt-compat): add /mcp route, ChatGPT CORS, tool annotations
```

---

## Security Notes

- No new attack surface: `/mcp` is identical to `/sse` — same auth, same rate limits, same handlers
- CORS addition is additive: adding ChatGPT origins does not remove existing origin restrictions
- `credentials: true` in CORS config is intentional for browser cookie sessions — unchanged
- OAuth flow is unchanged: PKCE S256 required, one-time codes, Redis TTL 5min — all intact
- Tool annotations are metadata only — no change to authorization logic inside tool handlers
