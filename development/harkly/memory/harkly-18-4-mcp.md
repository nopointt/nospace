---
# HARKLY-18.4 — MCP + OAuth
> Parent: HARKLY-18 | Status: ⬜ BLOCKED by 18.1 | Parallel with: 18.2
> Spec: `docs/research/harkly-mvp-api-spec.md` Sections 2, 5
> Copy Map: `docs/research/harkly-mvp-copy-map.md`
---

## Required Reading (before any code)

1. `nospace/docs/research/harkly-eval-mcp-auth.md` — FULL (workers-mcp rejected, mcp-ts-template steal list, workers-oauth-provider architecture, better-auth integration, MCP Server Architecture)
2. `nospace/docs/research/harkly-mvp-api-spec.md` — sections 2 (OAuth endpoints), 5 (MCP Tools with Zod schemas)
3. `nospace/docs/research/harkly-research-mcp-access.md` — sections: MCP Ecosystem State, Recommendation for Harkly
4. `nospace/docs/research/harkly-mvp-copy-map.md` — section 2 (Clone & Adapt: MCP/auth subsection)
5. `nospace/docs/research/harkly-mvp-architecture.md` — section 5 (Auth Architecture)

## Goal

Remote MCP Server on CF Worker. Claude Desktop, ChatGPT, Grok can connect via OAuth 2.1 and query user's knowledge base.

## Architecture

```
OAuthProvider (outermost)
  ├── /oauth/token, /authorize, /oauth/register
  ├── /.well-known/oauth-authorization-server
  ├── /.well-known/oauth-protected-resource
  │
  ├── defaultHandler (consent UI + better-auth login)
  │     /authorize → check session → show consent → completeAuthorization()
  │     /api/auth/* → better-auth.handler()
  │
  └── apiHandler (MCP server, protected by OAuth)
        POST /mcp → mcp-ts-template createWorkerHandler()
                     → tools scoped to ctx.props.userId
```

## MCP Tools (6)

| Tool | Input | Output | Scope |
|---|---|---|---|
| `search_knowledge` | query, kbId?, limit? | chunks[] with sources | knowledge:read |
| `get_document` | id | document with chunks | knowledge:read |
| `list_projects` | — | projects[] | knowledge:read |
| `list_sources` | kbId | sources[] | knowledge:read |
| `get_schema` | kbId | SchemaField[] | knowledge:read |
| `list_extractions` | kbId, schemaId? | extracted rows[] | knowledge:read |

## Tasks

- [ ] CF Worker: `harkly-mcp` with separate wrangler.toml
- [ ] Install @cloudflare/workers-oauth-provider, configure as entrypoint
- [ ] OAUTH_KV namespace for token storage
- [ ] Dynamic client registration (/oauth/register)
- [ ] Consent UI: "Harkly wants to access your knowledge base" → approve/deny
- [ ] better-auth session check in consent handler
- [ ] completeAuthorization() passes userId into props
- [ ] Install @cyanheads/mcp-ts-core
- [ ] createWorkerHandler() with 6 tool definitions (Zod schemas)
- [ ] Replace in-memory SessionStore with KV-backed (SESSION_KV)
- [ ] Hybrid search in search_knowledge tool (FTS5 + Vectorize + RRF)
- [ ] Query rewrite (3-5 variants) for better recall
- [ ] Multi-tenant: all D1 queries filtered by ctx.props.userId

## Clone From

| Source | What |
|---|---|
| workers-oauth-provider | OAuthProvider class, tokenExchangeCallback |
| mcp-ts-template | createWorkerHandler(), tool builder, auth middleware, D1Provider |
| better-auth-cloudflare | createAuth(env, cf) per-request in consent handler |
| cloudflare-rag | RRF function, query rewrite prompt, FTS5 search |

## Acceptance

- [ ] Claude Desktop connects via OAuth → search_knowledge returns data
- [ ] ChatGPT connects (Apps SDK / Developer Mode) → same
- [ ] Dynamic client registration works
- [ ] /.well-known/oauth-authorization-server returns correct metadata
- [ ] list_projects returns only authenticated user's projects
- [ ] Multi-tenant: user A cannot access user B's data
