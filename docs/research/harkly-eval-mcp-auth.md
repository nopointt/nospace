# Harkly Eval — MCP + Auth Repos
> Date: 2026-03-19
> Researcher: Lead/TechResearch
> Context: Harkly exposes user knowledge base as Remote MCP Server on CF Workers with OAuth 2.1. Clients: ChatGPT, Claude Desktop, Grok, Gemini CLI, Copilot Studio.

---

## 1. workers-mcp

**Repo:** `cloudflare/workers-mcp` — v0.0.13 — Apache-2.0
**Stars:** ~1K
**GitHub:** https://github.com/cloudflare/workers-mcp
**Evaluated:** 2026-03-19 (depth-1 clone, commit HEAD)

### 1.1 What it actually is

The README has a prominent warning at the top:

> You should start here instead — and build a remote MCP server. You can connect to remote MCP servers from Claude Desktop, Cursor, and other clients using mcp-remote.

This package is a **local stdio bridge**, not a remote MCP server. It runs a Node.js process on the user's machine that translates stdio MCP protocol into HTTP calls to a Cloudflare Worker. The Worker never speaks MCP at all — it speaks a proprietary `POST /rpc` JSON protocol protected by a shared secret.

**Architecture:**
```
Claude Desktop
  → stdio (local Node.js process = workers-mcp run)
  → HTTPS POST /rpc (Bearer: SHARED_SECRET, body: {method, args})
  → Cloudflare Worker (WorkerEntrypoint)
```

### 1.2 MCP transport

- **Not** Streamable HTTP. **Not** SSE. **Not** remote MCP at all.
- The Worker exposes a single `POST /rpc` endpoint — a proprietary JSON-RPC-like protocol (not standard MCP).
- The local Node.js proxy (`local-proxy.ts`) runs a real `@modelcontextprotocol/sdk` Server with `StdioServerTransport`.
- Tool list is read from a generated `dist/docs.json` file (build artifact).

### 1.3 Tool definitions

Tools are **not declared in code** using any builder API. Instead:
- Developer writes regular TypeScript class methods with JSDoc comments.
- A build step (`generate-docs.ts`) parses JSDoc using `jsdoc-api` + `ts-blank-space`, produces `dist/docs.json`.
- The local proxy reads that JSON and constructs MCP tool descriptors from it.

```typescript
// This is the entire tool definition pattern:
export class MyWorker extends WorkerEntrypoint<Env> {
  /**
   * Searches the user's notes.
   * @param query {string} The search query.
   * @return {string} JSON-encoded results.
   */
  searchNotes(query: string): string {
    // ... implementation ...
  }
}
```

JSDoc `@param` type annotations become the MCP `inputSchema` property types. This means types are strings (`"string"`, `"number"`) not full JSON Schema — limited expressiveness.

### 1.4 Auth flow

- **No OAuth**. Single shared secret (`SHARED_SECRET` env var, 64-char hex).
- Auth check: `authorization === secret && secret.length === 64` — constant-time not guaranteed.
- Token stored in `.dev.vars` for local dev, Worker secret for production.
- No per-user identity. No multi-tenant. One Worker = one user.

### 1.5 Multi-tenant

**Impossible with this design.** One Worker serves one consumer (the local proxy that has the secret). To serve multiple users, you'd need multiple Worker deployments or a complete architectural change.

### 1.6 CF bindings

The examples show commented-out wrangler.toml with optional D1/KV/R2/Vectorize bindings, but the library itself uses none of them. Developers add bindings as needed for their own Worker logic.

### 1.7 Deployment

```
npx workers-mcp setup   # generates SHARED_SECRET, updates Claude config
npm run deploy          # wrangler deploy + regenerates docs.json
```

Standard `wrangler.toml` config. No custom Durable Objects needed.

### 1.8 What to steal

- **Nothing** for Harkly's use case. The entire architecture is incompatible with a remote multi-tenant MCP server.
- Conceptually: the JSDoc-to-tool-schema generation pattern is clever but limited. Harkly needs proper Zod schemas.

### 1.9 What to skip

Everything. This repo is designed for personal developer tooling (expose your own Worker to your own Claude Desktop). It is not designed for serving external MCP clients over the internet.

### 1.10 Integration with better-auth

Impossible to integrate. workers-mcp has no concept of OAuth, user sessions, or multi-tenancy. It would need to be completely rewritten to support Harkly's requirements.

### 1.11 Key gotcha

The README itself says "you should start here instead" (pointing to the official CF remote MCP guide). This package is in maintenance/legacy status. The architecture cannot be adapted for a public MCP server. The JSDoc-based type system produces only primitive type strings, not full JSON Schema — incompatible with complex tool inputs.

**Verdict: Do not use for Harkly.**

---

## 2. mcp-ts-template (cyanheads/mcp-ts-core)

**Repo:** `cyanheads/mcp-ts-template` — v0.1.6 — Apache-2.0
**npm:** `@cyanheads/mcp-ts-core`
**Stars:** 119
**GitHub:** https://github.com/cyanheads/mcp-ts-template
**Evaluated:** 2026-03-19 (depth-1 clone)

### 2.1 What it actually is

A full-featured TypeScript framework for building MCP servers that run on both Node.js and Cloudflare Workers. Not just a template — it ships as a published npm package (`@cyanheads/mcp-ts-core`). The repo is the package source.

Key capabilities:
- Streamable HTTP transport (MCP spec 2025-06-18 compliant)
- Declarative `tool()` builder with Zod schemas
- Pluggable auth: JWT strategy or OAuth 2.1 JWKS strategy
- Storage abstractions: D1, KV, R2, Supabase, in-memory, filesystem
- CF Worker entry point via `createWorkerHandler()`
- Per-request McpServer factory (prevents cross-session data leak)
- Session store with identity binding (anti-hijacking)
- OTel metrics and tracing

### 2.2 MCP transport

**Streamable HTTP** — implements MCP spec 2025-06-18.

Endpoint: `POST /mcp` (configurable via `MCP_HTTP_ENDPOINT_PATH`)
Discovery: `GET /.well-known/oauth-protected-resource` (RFC 9728)
Health: `GET /healthz`
Session termination: `DELETE /mcp`

Key implementation details from `httpTransport.ts`:
- Uses `@hono/mcp` package (`StreamableHTTPTransport` class)
- SSE stream: `GET /mcp` with `Accept: text/event-stream`
- Session tracking: `Mcp-Session-Id` request/response header
- Per-request McpServer to prevent GHSA-345p-7cg4-v4c7 (cross-client data leak)
- Protocol version validation: rejects unsupported `MCP-Protocol-Version` headers
- DNS rebinding protection: validates Origin header against allowed list

### 2.3 Tool definitions

Declarative `tool()` builder with Zod v4 schemas:

```typescript
export const searchKnowledgeTool = tool('search_knowledge', {
  title: 'Search Knowledge Base',
  description: 'Searches the user knowledge base.',
  input: z.object({
    query: z.string().min(1).describe('Search query'),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  output: z.object({
    results: z.array(z.object({ id: z.string(), content: z.string() })),
    total: z.number(),
  }),
  auth: ['knowledge:read'],   // scope check — handler not called if scope missing
  annotations: { readOnlyHint: true },

  handler(input, ctx) {
    // ctx.log — structured logging
    // ctx.auth — authInfo from JWT/OAuth
    return { results: [], total: 0 };
  },

  format(result) {
    return [{ type: 'text', text: JSON.stringify(result) }];
  },
});
```

Tools are registered via `createWorkerHandler({ tools: [searchKnowledgeTool] })`.

### 2.4 Auth flow

Two strategies, selected via `MCP_AUTH_MODE` env var:

**JWT mode** (`MCP_AUTH_MODE=jwt`):
- Symmetric key: `MCP_AUTH_SECRET_KEY` → `jose.jwtVerify(token, secretKey)`
- Claims extracted: `cid`/`client_id` (clientId), `scp`/`scope` (scopes), `sub` (subject), `tid` (tenantId), `exp`
- Dev bypass: `DEV_MCP_AUTH_BYPASS=true` skips verification

**OAuth mode** (`MCP_AUTH_MODE=oauth`):
- JWKS endpoint: `OAUTH_ISSUER_URL` + `/.well-known/jwks.json` (or explicit `OAUTH_JWKS_URI`)
- `jose.createRemoteJWKSet` + `jose.jwtVerify` with issuer + audience validation
- RFC 8707 resource indicator validation (checks `resource` claim)
- Cooldown + timeout on JWKS fetch (configurable)

**Middleware chain** (`authMiddleware.ts`):
1. Extract `Bearer` token from `Authorization` header
2. Call `strategy.verify(token)` → `AuthInfo` (clientId, scopes, subject, tenantId, expiresAt)
3. Populate async local storage (ALS) `authContext` for downstream handlers
4. Auth context propagates through all async continuations in the request

**Scope enforcement** on tools: `auth: ['knowledge:read']` field in tool definition. Framework checks scope before calling handler.

### 2.5 Multi-tenant

**Supported via JWT claims.**

- `tenantId` extracted from `tid` claim in token
- Session store binds sessions to `{tenantId, clientId, subject}` — prevents cross-tenant session hijacking
- `D1Provider` and `KvProvider` both take `tenantId` as first argument to all operations
- Key pattern: `{tenantId}:{key}` in KV, `WHERE tenant_id = ?` in D1 SQL

Harkly can derive `tenantId` from the user's auth identity. Each API call can then be scoped to the correct user's knowledge base.

### 2.6 CF bindings

`worker.ts` defines `CloudflareBindings` interface:
- `DB?: D1Database` — stored on `globalThis.DB` per request
- `KV_NAMESPACE?: KVNamespace` — stored on `globalThis.KV_NAMESPACE`
- `R2_BUCKET?: R2Bucket`
- `AI?: Ai`
- Auth config: `MCP_AUTH_MODE`, `MCP_AUTH_SECRET_KEY`, `OAUTH_ISSUER_URL`, `OAUTH_AUDIENCE`, `OAUTH_JWKS_URI`

CF bindings are injected into `process.env` or `globalThis` at request start by `injectEnvVars()` / `storeBindings()`. Storage providers access globals directly.

**Gotcha:** CF Workers don't have persistent `process.env` — bindings must be re-injected per request. This framework handles that correctly.

### 2.7 Deployment

```typescript
// src/index.ts (Harkly's entry point)
export default createWorkerHandler({
  name: 'harkly-mcp',
  version: '1.0.0',
  tools: [searchKnowledgeTool, addNoteTool],
});
```

```toml
# wrangler.toml
name = "harkly-mcp"
main = "src/index.ts"
compatibility_date = "2025-03-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "harkly-kb"
database_id = "xxx"

[[kv_namespaces]]
binding = "KV_NAMESPACE"
id = "xxx"

[vars]
MCP_AUTH_MODE = "oauth"
OAUTH_ISSUER_URL = "https://auth.harkly.app"
OAUTH_AUDIENCE = "harkly-mcp"
```

### 2.8 What to steal

**High value:**
- `src/mcp-server/transports/auth/` — entire auth directory (strategies, middleware, types, claim parser). Production-quality OAuth 2.1 + JWKS implementation with OTel.
- `src/mcp-server/transports/http/httpTransport.ts` — complete Streamable HTTP setup with session management, CORS, DNS rebinding protection.
- `src/mcp-server/transports/http/sessionStore.ts` — identity-bound session store with anti-hijacking checks.
- `src/storage/providers/cloudflare/d1Provider.ts` — multi-tenant D1 with TTL, batch ops, cursor pagination. Ready to use.
- `src/storage/providers/cloudflare/kvProvider.ts` — multi-tenant KV provider.
- `src/core/worker.ts` — `createWorkerHandler()` factory. Use this directly.
- `src/mcp-server/tools/utils/toolDefinition.ts` — `tool()` builder API pattern with Zod + scope checks.

**Usable patterns:**
- `CloudflareBindings` interface — extend this for Harkly-specific bindings.
- `claimParser.ts` — reuse `buildAuthInfoFromClaims()` for consistent JWT claim extraction.
- `protectedResourceMetadata.ts` — RFC 9728 `/.well-known/oauth-protected-resource` endpoint.

### 2.9 What to skip

- Speech services (`src/services/speech/`) — not needed.
- Graph service — not needed.
- OTel instrumentation — optional for MVP, add later.
- In-memory and filesystem storage providers — irrelevant for CF Workers.
- `SessionStore` in-memory implementation — for stateless CF Workers, sessions should be stored in KV. The in-memory store is process-local and won't survive Worker restarts or scale-out.

### 2.10 Integration with better-auth

The `OauthStrategy` in this template validates incoming JWTs from any JWKS-compatible OAuth server. If Harkly's OAuth server (whether better-auth or workers-oauth-provider) issues proper JWTs with a JWKS endpoint, the `OauthStrategy` will work as-is. The integration point is:

```
OAUTH_ISSUER_URL=https://auth.harkly.app
OAUTH_AUDIENCE=harkly-mcp
```

The MCP server does not need to know who issued the token — it only validates the signature against JWKS and checks issuer + audience. This is the correct separation: auth server issues tokens, MCP server validates them.

### 2.11 Key gotcha

**Session store is in-memory** (`Map<string, Session>`). On Cloudflare Workers, this means:
- No persistence across Worker restarts
- No sharing across Worker instances (if CF scales to multiple)
- Stale sessions cannot be cleaned up globally

For Harkly's multi-client remote MCP server, session state needs to move to KV. The framework provides all the right interfaces — only the `SessionStore` class needs to be replaced with a KV-backed implementation.

**Secondary gotcha:** The framework uses `process.env` which is not natively available in CF Workers. The `injectEnvVars()` function patches this per-request, which works but is unusual. If CF Workers' `nodejs_compat` changes this behavior, it could break.

**Version currency:** Package is v0.1.6, published early 2026 based on deps (`@cloudflare/workers-types` ^4.20260317.1). Active development. MCP spec version targeted: 2025-06-18. This is the most recent published MCP spec as of March 2026.

---

## 3. workers-oauth-provider

**Repo:** `cloudflare/workers-oauth-provider` — v0.3.0 — MIT
**npm:** `@cloudflare/workers-oauth-provider`
**GitHub:** https://github.com/cloudflare/workers-oauth-provider
**Evaluated:** 2026-03-19 (depth-1 clone)

### 3.1 What it actually is

An **OAuth 2.1 Authorization Server** that runs entirely on Cloudflare Workers + KV. It handles the provider side — issuing tokens, managing grants, PKCE, dynamic client registration. It does **not** run an MCP server itself; it wraps your Worker handler and adds auth.

### 3.2 MCP transport

This is an OAuth server, not an MCP transport. It wraps any Worker handler:

```typescript
export default new OAuthProvider({
  apiRoute: '/mcp',         // protected by OAuth
  apiHandler: McpHandler,   // your MCP server
  defaultHandler: UIHandler, // authorize UI, etc.
  tokenEndpoint: '/oauth/token',
  authorizeEndpoint: '/authorize',
  clientRegistrationEndpoint: '/oauth/register',
});
```

The `apiHandler` receives requests with valid access tokens. You put your MCP server inside `apiHandler`.

### 3.3 Tool definitions

Not applicable — this is the auth layer, not the MCP layer.

### 3.4 Auth flow

Full OAuth 2.1 with PKCE:

**Standards implemented:**
- OAuth 2.1 (draft-ietf-oauth-v2-1-13) with PKCE required
- RFC 8414 — `/.well-known/oauth-authorization-server` metadata
- RFC 9728 — `/.well-known/oauth-protected-resource` metadata
- RFC 7591 — Dynamic Client Registration
- draft-ietf-oauth-client-id-metadata-document (CIMD) — optional

**Token lifecycle:**
1. Client registers (dynamic) or uses pre-registered client ID
2. `GET /authorize` → shows consent UI (app implements this)
3. App calls `env.OAUTH_PROVIDER.completeAuthorization({userId, scope, props})`
4. Provider issues auth code, client exchanges for access + refresh tokens
5. Provider validates tokens on API requests, injects `ctx.props` into handler

**Security highlights:**
- Access tokens stored as SHA-256 hashes (never plaintext)
- `props` (user data passed to API handler) encrypted with AES-GCM
- Each grant has unique AES-256 key, key is wrapped using the token itself
- Refresh token rotation with grace period (current + previous token valid)
- `props` end-to-end encrypted: even KV dump cannot reveal user data without token

**KV storage schema** (`storage-schema.md`):
```
client:{clientId}           → client registration
grant:{userId}:{grantId}    → grant + encrypted props
token:{userId}:{grantId}:{tokenId} → access token metadata
```

### 3.5 Multi-tenant

**Yes — by design.** Each user gets their own grant space (`grant:{userId}:*`). `ctx.props` carries user identity to the API handler on every request. The app decides what `userId` means and what goes in `props`.

### 3.6 CF bindings

Requires exactly one binding: `OAUTH_KV` (KVNamespace). All state (clients, grants, tokens) stored in KV.

```toml
[[kv_namespaces]]
binding = "OAUTH_KV"
id = "xxx"
```

### 3.7 Deployment

```typescript
export default new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: HarklymcpHandler,
  defaultHandler: harklyUiHandler,
  tokenEndpoint: '/oauth/token',
  authorizeEndpoint: '/authorize',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['knowledge:read', 'knowledge:write'],
  refreshTokenTTL: 30 * 24 * 3600,
  accessTokenTTL: 3600,
});
```

### 3.8 What to steal

**High value:**
- The entire `OAuthProvider` class — use it directly as the Worker entrypoint wrapper.
- The `tokenExchangeCallback` pattern — useful for chaining Harkly's user identity into `props`.
- The KV storage schema design — all sensitive data hashed/encrypted, well-documented.
- PKCE enforcement — required for MCP clients (ChatGPT, Claude Desktop connect via public clients).
- Dynamic Client Registration (`/oauth/register`) — needed for MCP clients that auto-register.
- `env.OAUTH_PROVIDER.parseAuthRequest()` / `completeAuthorization()` — clean API for consent UI.

**Architecture pattern:**
```typescript
// Harkly's Worker:
export default new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: HarklyMcpWorker,  // your MCP server (mcp-ts-template pattern)
  defaultHandler: consentUiHandler,
  ...
});
```

The MCP server inside `apiHandler` receives `ctx.props.userId` — use this as `tenantId` for D1 queries.

### 3.9 What to skip

- The authorization UI (`/authorize` handler) — implement your own using Harkly's design system.
- The `onError` hook example — use it, but implement Harkly-specific error formatting.

### 3.10 Integration with better-auth

**Mutually exclusive with better-auth for auth server.** Both workers-oauth-provider and better-auth want to be the OAuth server. Options:

**Option A — Use workers-oauth-provider as auth server:**
- workers-oauth-provider issues tokens
- Harkly's users authenticate via workers-oauth-provider's custom `defaultHandler`
- `defaultHandler` calls better-auth for user session management (login, signup)
- On consent, passes Harkly's user ID from better-auth session into `completeAuthorization()`
- Clean separation: better-auth = user identity, workers-oauth-provider = OAuth token lifecycle

**Option B — Use better-auth as auth server + mcp-ts-template OAuth validation:**
- better-auth exposes JWKS endpoint (if it supports that — needs verification)
- mcp-ts-template `OauthStrategy` validates tokens against better-auth JWKS
- workers-oauth-provider not used at all
- Risk: better-auth's OAuth server feature maturity is unclear vs workers-oauth-provider

**Option A is more reliable.** workers-oauth-provider is maintained by Cloudflare, security-reviewed, and specifically designed for this use case.

### 3.11 Key gotcha

**KV is eventually consistent.** Token validation reads from KV — in theory a token could briefly pass validation after revocation. For most use cases this is acceptable (1-60 second window). If Harkly needs immediate revocation, this needs a workaround.

**Refresh token implementation deviates from OAuth 2.1:** The spec says refresh tokens must be single-use or cryptographically bound. workers-oauth-provider uses a "grace period" approach (two valid refresh tokens at any time). This is pragmatic but technically non-compliant. The README acknowledges this.

**CIMD requires `global_fetch_strictly_public` compatibility flag** — important if ChatGPT or other clients use HTTPS URLs as `client_id`. Add this flag when enabling CIMD.

---

## 4. better-auth-cloudflare

**Repo:** `zpg6/better-auth-cloudflare` — v0.2.9 — MIT
**npm:** `better-auth-cloudflare`
**GitHub:** https://github.com/zpg6/better-auth-cloudflare
**Evaluated:** 2026-03-19 (depth-1 clone)

### 4.1 What it actually is

A bridge library that makes `better-auth` work on Cloudflare Workers. It is **not** an OAuth server — it handles user authentication (signup/signin/session) using better-auth, with CF-specific adapters for D1, KV, R2, and geolocation.

Provides:
- `withCloudflare()` config wrapper that injects CF-specific adapters
- D1 adapter (via Drizzle ORM)
- KV adapter for session caching / rate limiting
- R2 adapter for file uploads
- Geolocation enrichment from CF request properties
- IP detection from CF headers

### 4.2 MCP transport

Not applicable. This is user authentication, not MCP protocol.

### 4.3 Tool definitions

Not applicable.

### 4.4 Auth flow

```typescript
// Per-request auth instance (required because CF Workers don't have persistent globals):
app.use("*", async (c, next) => {
  const auth = createAuth(c.env, c.req.raw.cf || {});
  c.set("auth", auth);
  await next();
});

// All better-auth endpoints under /api/auth/*:
app.all("/api/auth/*", async c => {
  return c.get("auth").handler(c.req.raw);
});

// Session check:
const session = await auth.api.getSession({ headers: c.req.raw.headers });
```

**Critical pattern:** Auth instance is created per-request, not at module load time, because D1 and KV bindings are only available in the `fetch()` handler scope.

### 4.5 Multi-tenant

better-auth itself is single-tenant (one auth server, all users share the same D1 database). It is **not** a multi-tenant OAuth server — it authenticates users into one system. Multi-tenancy in Harkly's sense (isolating user A's knowledge from user B's) would be handled by the MCP server layer using the user ID from the auth session.

### 4.6 CF bindings

From `wrangler.toml` (hono example):
```toml
[[d1_databases]]
binding = "DATABASE"
database_name = "your-d1-database-name"

[[kv_namespaces]]
binding = "KV"
id = "xxx"
```

`withCloudflare()` takes `{ d1: { db, options }, kv: env.KV }`.

D1 via Drizzle ORM — better-auth generates migrations, drizzle-kit applies them.

### 4.7 Deployment

```bash
npx @better-auth-cloudflare/cli@latest generate \
  --app-name=harkly-auth \
  --template=hono \
  --database=d1 \
  --kv=true

npx @better-auth-cloudflare/cli@latest migrate --migrate-target=prod
```

CLI generates wrangler.toml, auth config, DB schema, and runs migrations.

### 4.8 What to steal

**High value:**
- `createAuth()` per-request pattern — the correct way to use better-auth on CF Workers.
- `withCloudflare()` wrapper — handles D1 adapter injection, KV rate limiting, geolocation.
- Drizzle + D1 + auth schema — if Harkly uses better-auth for user management.
- `createAuth(env, cf)` signature — `cf` carries geolocation from the incoming request.
- `rateLimit` config inside `withCloudflare()` — KV-based rate limiting, 60s minimum window.

**Pattern for Harkly:**
If Harkly uses workers-oauth-provider as the OAuth server, better-auth can be the user identity layer inside the `defaultHandler`:
```typescript
// In /authorize handler:
const session = await createAuth(env, cf).api.getSession({ headers: request.headers });
// If session exists, show consent UI
// If not, redirect to login
```

### 4.9 What to skip

- R2 file storage — not needed for knowledge base (Supabase already used).
- OpenNextJS example — Harkly uses Hono on CF Workers.
- Geolocation tracking — optional feature, not core to MCP.
- CLI tool — useful for greenfield setup, less useful for integrating into existing project.

### 4.10 Integration with workers-oauth-provider

This is the key integration question. The pattern:

```typescript
// workers-oauth-provider defaultHandler
const defaultHandler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/authorize') {
      // Parse OAuth request
      const oauthReq = await env.OAUTH_PROVIDER.parseAuthRequest(request);

      // Check if user is logged in via better-auth
      const auth = createAuth(env, request.cf);
      const session = await auth.api.getSession({ headers: request.headers });

      if (!session) {
        // Redirect to login, with oauth state preserved
        return Response.redirect(`/login?next=/authorize?...`, 302);
      }

      // User is authenticated — show consent UI
      // After consent:
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: oauthReq,
        userId: session.user.id,       // better-auth user ID
        scope: oauthReq.scope,
        props: {
          userId: session.user.id,
          email: session.user.email,
        },
      });
      return Response.redirect(redirectTo, 302);
    }

    // Login/signup routes → better-auth handles
    if (url.pathname.startsWith('/api/auth/')) {
      return createAuth(env, request.cf).handler(request);
    }
  }
};
```

This is the correct integration pattern: better-auth handles user authentication, workers-oauth-provider handles OAuth token lifecycle.

### 4.11 Key gotcha

**D1 multi-tenancy is on the roadmap, not yet implemented.** The README roadmap shows `[ ] D1 Multi-Tenancy`. This means the auth database schema is currently single-tenant. For Harkly, this is fine — the auth DB stores user accounts (one row per user), not user data. Knowledge base data lives in a separate D1 database (the MCP server's data layer).

**better-auth OAuth server feature:** better-auth has an OAuth provider plugin (`better-auth/plugins/oauth-provider`), but it is not part of better-auth-cloudflare. Using better-auth as the OAuth server (instead of workers-oauth-provider) would require additional integration work and its JWKS support has not been verified in this evaluation.

---

## Copy Map — What to Take

| Source repo | File/pattern | Use in Harkly |
|---|---|---|
| mcp-ts-template | `src/core/worker.ts` `createWorkerHandler()` | Worker entry point factory |
| mcp-ts-template | `src/mcp-server/transports/http/httpTransport.ts` | Full Streamable HTTP setup |
| mcp-ts-template | `src/mcp-server/transports/auth/strategies/oauthStrategy.ts` | JWKS-based token validation |
| mcp-ts-template | `src/mcp-server/transports/auth/authMiddleware.ts` | Hono auth middleware |
| mcp-ts-template | `src/mcp-server/transports/auth/lib/claimParser.ts` | JWT claim extraction |
| mcp-ts-template | `src/mcp-server/transports/auth/lib/authTypes.ts` | AuthInfo type with tenantId |
| mcp-ts-template | `src/mcp-server/transports/http/sessionStore.ts` | Identity-bound sessions (replace Map with KV) |
| mcp-ts-template | `src/mcp-server/transports/http/protectedResourceMetadata.ts` | RFC 9728 endpoint |
| mcp-ts-template | `src/storage/providers/cloudflare/d1Provider.ts` | Multi-tenant D1 storage |
| mcp-ts-template | `src/storage/providers/cloudflare/kvProvider.ts` | Multi-tenant KV storage |
| mcp-ts-template | tool `handler(input, ctx)` pattern | Tool implementation pattern |
| workers-oauth-provider | `new OAuthProvider({...})` as Worker entrypoint | OAuth 2.1 server layer |
| workers-oauth-provider | `env.OAUTH_PROVIDER.parseAuthRequest()` | Read OAuth params in consent UI |
| workers-oauth-provider | `env.OAUTH_PROVIDER.completeAuthorization({userId, props})` | Finalize user consent |
| workers-oauth-provider | KV storage schema (storage-schema.md) | Reference for token security design |
| workers-oauth-provider | `tokenExchangeCallback` | Inject user data into token props |
| better-auth-cloudflare | `createAuth(env, cf)` per-request pattern | User auth in consent/login handlers |
| better-auth-cloudflare | `withCloudflare({d1, kv})` | D1 + KV binding injection |
| better-auth-cloudflare | Drizzle + D1 auth schema | User accounts DB |

---

## MCP Server Architecture for Harkly

### Recommended design

Three-layer architecture on a single Cloudflare Worker:

```
[MCP Client: Claude Desktop, ChatGPT, Grok, Gemini]
          |
          | HTTPS (Streamable HTTP, MCP 2025-06-18)
          v
[CF Worker: harkly-mcp.workers.dev]
  |
  +-- workers-oauth-provider (outermost layer)
  |     /oauth/token          — token endpoint
  |     /authorize            — consent UI entry
  |     /oauth/register       — dynamic client registration
  |     /.well-known/oauth-authorization-server
  |     /.well-known/oauth-protected-resource
  |
  +-- defaultHandler (UI + user auth)
  |     /authorize  → check better-auth session → show consent → completeAuthorization()
  |     /api/auth/* → better-auth.handler()
  |     /login      → better-auth login page
  |
  +-- apiHandler (MCP server, protected by OAuth)
        POST /mcp   → mcp-ts-template createWorkerHandler()
                        → OauthStrategy validates Bearer token via JWKS
                        → tool calls scoped to ctx.props.userId (= tenantId)
                        → D1Provider: WHERE tenant_id = userId
```

### Data flow

1. **First-time client connect:** Claude Desktop opens `/.well-known/oauth-authorization-server` → discovers token/auth endpoints → registers via `/oauth/register`.

2. **Authorization:** Client redirects user browser to `/authorize?client_id=...&code_challenge=...` → workers-oauth-provider parses request → routes to `defaultHandler` → better-auth checks session → if logged in: show consent UI → user approves → `completeAuthorization({userId: session.user.id, scope: ['knowledge:read'], props: {userId}})` → workers-oauth-provider issues auth code → client exchanges for access + refresh tokens.

3. **MCP session:** Client sends `POST /mcp` with `Authorization: Bearer {access_token}` → workers-oauth-provider validates token → routes to `apiHandler` (MCP server) with `ctx.props = {userId}` → mcp-ts-template's `OauthStrategy` additionally validates the JWT signature → `tenantId = ctx.props.userId` → tool handler queries D1 with `WHERE tenant_id = ?`.

4. **Knowledge base access:** Tool handlers use `D1Provider` with `tenantId` — user A cannot read user B's data by construction.

### CF bindings required

```toml
# OAuth token storage (workers-oauth-provider)
[[kv_namespaces]]
binding = "OAUTH_KV"
id = "xxx"

# User accounts (better-auth via Drizzle)
[[d1_databases]]
binding = "AUTH_DB"
database_name = "harkly-users"
database_id = "xxx"

# Knowledge base (mcp-ts-template D1Provider)
[[d1_databases]]
binding = "KB_DB"
database_name = "harkly-kb"
database_id = "xxx"

# Session cache / rate limiting (better-auth KV)
[[kv_namespaces]]
binding = "AUTH_KV"
id = "xxx"
```

### SessionStore replacement

Replace the in-memory `SessionStore` from mcp-ts-template with a KV-backed version:

```typescript
// Replace sessions Map with KV reads/writes
// Key: `mcp:session:{sessionId}` → JSON({tenantId, clientId, subject, lastAccessed})
// TTL: staleTimeoutMs / 1000
```

This is the most important adaptation — without it, sessions don't survive Worker restarts or multi-instance scaling.

### Auth configuration

Since workers-oauth-provider issues access tokens (not standard JWTs with JWKS), there are two options:

**Option A — workers-oauth-provider as token validator (simpler):**
- workers-oauth-provider already validates tokens before routing to `apiHandler`
- Skip mcp-ts-template's `OauthStrategy` entirely
- Extract user identity from `ctx.props` (already verified by workers-oauth-provider)
- Set `MCP_AUTH_MODE=none` in mcp-ts-template config

**Option B — Dual validation (defense in depth):**
- workers-oauth-provider validates token → passes to apiHandler
- mcp-ts-template `OauthStrategy` re-validates JWT from JWKS (requires workers-oauth-provider to issue JWTs with a JWKS endpoint)
- workers-oauth-provider currently issues opaque tokens, not JWTs — this would require a fork or custom token format

**Recommendation: Option A for MVP.** Trust workers-oauth-provider's token validation. Use `ctx.props.userId` as the source of truth for user identity in tool handlers.

### What to build from scratch

- Consent UI (HTML/JS served from `defaultHandler`) — use Harkly design system
- Login/signup pages (wrap better-auth endpoints)
- MCP tools: `search_knowledge`, `add_note`, `list_notes`, `delete_note`
- KB_DB schema: `user_notes(id, tenant_id, title, content, created_at, updated_at)`

### Risk summary

| Risk | Severity | Mitigation |
|---|---|---|
| SessionStore is in-memory (mcp-ts-template) | High | Replace with KV-backed store |
| KV eventual consistency for token revocation | Medium | Acceptable for MVP; add grace period handling |
| workers-oauth-provider issues opaque tokens (not JWTs) | Low | Use Option A — trust workers-oauth-provider validation |
| better-auth per-request instantiation has cold-start cost | Low | CF Worker caches module-level singletons; per-request is auth config only |
| Refresh token grace period non-compliance | Low | Known issue, documented in repo, pragmatic approach |
| CF KV 60-second minimum TTL for rate limiting | Low | better-auth already configures window: 60 |
