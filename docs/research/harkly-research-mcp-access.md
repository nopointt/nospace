# Harkly Research — LLM Access Patterns
> Date: 2026-03-19

## Can LLMs Make Arbitrary API Calls in 2026?

### ChatGPT (OpenAI)

**Short answer: Yes, but only through configured Actions or MCP — not arbitrary ad-hoc.**

- **GPT Actions** (legacy): Standard path in Custom GPTs. Uses OpenAPI spec; supports POST with user confirmation. Authentication: API Key or OAuth 2.0. Reports indicate decreasing standalone adoption in 2026 — behavior was unpredictable, setup complex.
- **Apps SDK (current primary)**: Builds on MCP. ChatGPT calls your service mid-chat, renders results inline. App submissions open.
- **Developer Mode (beta)**: Full MCP client for all read/write tools. Enable via Settings > Apps > Advanced settings.
- **Responses API**: Supports remote MCP servers with OAuth bearer token in `authorization` parameter (not stored — must be resent per request).
- **8 first-party Connectors**: Dropbox, Gmail, Google Calendar, Drive, MS Teams, Outlook Calendar, Outlook Email, SharePoint
- **Web browsing / ChatGPT Agent**: Cannot make authenticated REST API calls. The visual browser clicks/scrolls/fills forms. API calls require configured Actions or MCP tools.

### Claude (Anthropic)

- **Claude Desktop**: MCP via stdio. For remote servers: either (a) Connectors UI (Settings > Connectors) supports Streamable HTTP + OAuth, or (b) `npx mcp-remote <url>` bridge in config.
- **Claude.ai web app**: Does NOT support MCP. Desktop only.
- **Claude Code / API**: Full MCP client. OAuth bearer via `authorization` parameter.

### Gemini (Google)

- **Gemini CLI**: Full MCP via extensions. Feb 2026: extension settings allow API keys stored in system keychain.
- **Gemini SDK (Python/JS)**: Built-in MCP support with automatic tool calling. Only `list_tools` is supported; Resources/Prompts not yet in SDK.
- **Gemini Enterprise**: MCP server support confirmed Jan 2026.
- **Consumer Gemini app**: MCP support limited/evolving.

### Le Chat (Mistral)

- **Agents API SDK**: MCP-based tool integration. Developer-facing path. End-user MCP connection in Le Chat consumer app: not confirmed.

### Microsoft Copilot

- **M365 Copilot**: Declarative agents can interact with MCP servers or REST APIs with OpenAPI. OAuth 2.0 + PKCE.
- **Copilot Studio**: Add MCP servers via Tools > Add Tool > New Tool > MCP (URL only needed).
- **Consumer Copilot**: Restricted to Microsoft-sanctioned connectors.

### Grok (xAI)

Fully supports Remote MCP. Specify server URL + optional config; xAI manages the connection. Among the simplest end-user UX.

### Perplexity

**Moving AWAY from MCP** (announced March 11, 2026 at Ask 2026 conference). Reason: high context window consumption + clunky authentication. Alternative: Agent API (GA February 2026), single endpoint routing to OpenAI/Anthropic/Google/xAI/NVIDIA models with built-in web search.

---

## MCP Ecosystem State

| Metric | Value |
|---|---|
| Total MCP servers | 7,900+ |
| Growth in 2025 | 400%+ |
| Using OAuth | 8.5% |
| Using static API keys | 53% |

**Transport**: SSE deprecated April 1, 2026. Current standard: Streamable HTTP (spec 2025-03-26), single `/mcp` endpoint.

**Auth standard**: OAuth 2.1 mandatory for remote HTTP servers. MCP servers = OAuth Resource Servers. Publish metadata at `/.well-known/oauth-protected-resource`.

**Governance**: Donated to Agentic AI Foundation (AAIF) under Linux Foundation in December 2025. Co-founders: Anthropic, Block, OpenAI. Supporters: Google, Microsoft, AWS, Cloudflare, Bloomberg.

**Clients with remote MCP**: Claude Desktop (Connectors UI), ChatGPT (Apps SDK/Developer Mode), Cursor, VS Code, Grok, Gemini CLI, Copilot Studio, Docker MCP Toolkit, Windsurf.

**User UX for adding server (best case)**: Click "Add Server" > enter URL > browser OAuth flow > done. Real example: Docker MCP Toolkit, Cursor one-click deep links, Claude Desktop Connectors.

**2026 roadmap**: Multimodal (video/audio), agent-to-agent MCP, Tasks feature, CIMD + DCR for frictionless auth.

---

## ChatGPT-Specific Access

| Feature | Harkly viable? | Auth | Notes |
|---|---|---|---|
| GPT Actions (Custom GPT) | Yes (legacy) | API Key or OAuth | OpenAPI spec required |
| Apps SDK (MCP) | Yes (preferred) | OAuth | Current main developer path |
| Responses API + remote MCP | Yes | Bearer token | For API integrators |
| Developer Mode | Yes | OAuth | Beta; technical users |
| Built-in Connectors | No | N/A | Google/Microsoft only |
| Web browsing / Agent | No | N/A | No authenticated API calls |

---

## Other Access Patterns

- **ACI.dev**: 600+ pre-built tools, unified MCP server, Apache 2.0. Meta-platform, not end-user focused.
- **Token pasting**: Technically works but terrible UX, insecure, not scalable. Not a viable primary pattern.
- **OpenPlugin**: Standardized plugin manifest for LLM APIs. Low adoption. Not a 2026 standard.
- **OpenAPI-to-MCP converters**: Tools like `mcp-openapi-server` auto-convert OpenAPI specs to MCP tools. Enables "bring your own OpenAPI" pattern.
- **Cloudflare Workers MCP hosting**: Template available, edge deployment, OAuth built-in. Recommended hosting pattern.

**Real product examples exposing data to multiple LLMs:**
- **Notion**: Hosted remote MCP server, OAuth flow, works with ChatGPT/Claude/Cursor. Also open-source self-hosted option.
- **Atlassian**: Remote MCP on Cloudflare Agents SDK, enterprise OAuth, Jira + Confluence.
- **Airbyte**: Knowledge MCP at `https://airbyte.mcp.kapa.ai`, works with Windsurf/ChatGPT Desktop/Claude.
- **Guru**: Knowledge management SaaS, exposes via MCP/API to ChatGPT/Claude/Copilot.

---

## Recommendation for Harkly

**Primary strategy: Single Remote MCP Server + OpenAPI Spec (dual exposure)**

MCP solves the N×M problem (one server works across all MCP-compatible clients). Backed by Linux Foundation and every major vendor. This is the Notion/Atlassian/Airbyte playbook.

**Architecture:**

Harkly REST API (existing) → OpenAPI Spec (dual purpose: docs + GPT Actions fallback) → Harkly MCP Server (hosted on Cloudflare Workers) → /mcp endpoint — Streamable HTTP transport — OAuth 2.1 → All MCP clients: Claude, ChatGPT, Grok, Cursor, VS Code, Copilot Studio, Gemini CLI

**Minimum viable MCP tools for Harkly:**
1. `search_knowledge_base(query, limit?)` — semantic search
2. `get_document(id)` — full document retrieval
3. `list_collections()` — user's knowledge collections

**Implementation path:**
1. Build remote MCP server on Cloudflare Workers (template available, fast)
2. Implement OAuth 2.1 via `workers-oauth-provider` or Auth0/Stytch
3. Add `/.well-known/oauth-protected-resource` metadata endpoint
4. Publish MCP server URL in docs + provide one-click OAuth deep links on Harkly UI
5. Keep GPT Actions OpenAPI spec as secondary fallback for Custom GPT users

**Client coverage:**

| Client | Coverage | Path |
|---|---|---|
| Claude Desktop | Full | Connectors UI + OAuth |
| ChatGPT | Full | Apps SDK (MCP) |
| Grok | Full | Remote MCP URL |
| Gemini CLI | Full | Extension + MCP config |
| Cursor / VS Code | Full | MCP settings |
| Copilot Studio | Full (enterprise) | MCP URL |
| Le Chat | Partial (developer) | Agents API + MCP |
| Perplexity | N/A | Not pursuing MCP |

**Key trade-off**: OAuth 2.1 implementation adds backend complexity. If Harkly already has OAuth infrastructure (Supabase handles auth), the incremental cost is lower. The MCP spec's DCR (Dynamic Client Registration) feature on the 2026 roadmap may reduce friction further later. Worth discussing whether to launch with simple API key auth first and upgrade to full OAuth 2.1 in v2.

---

## Sources

- Custom GPT Actions in 2026 - Lindy: https://www.lindy.ai/blog/custom-gpt-actions
- MCP and Connectors - OpenAI API: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- Apps in ChatGPT - OpenAI: https://openai.com/index/introducing-apps-in-chatgpt/
- ChatGPT Developer mode: https://developers.openai.com/api/docs/guides/developer-mode
- Building custom connectors via remote MCP servers - Claude: https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers
- MCP OAuth 2.1 Implementation Guide: https://www.mcpserverspot.com/learn/architecture/mcp-oauth-implementation-guide
- Authorization - Model Context Protocol: https://modelcontextprotocol.io/specification/draft/basic/authorization
- Authorization - Cloudflare Agents docs: https://developers.cloudflare.com/agents/model-context-protocol/authorization/
- Build a Remote MCP server - Cloudflare: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- Donating MCP and establishing AAIF - Anthropic: https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation
- Gemini CLI MCP: https://geminicli.com/docs/tools/mcp-server/
- Gemini SDK x FastMCP: https://gofastmcp.com/integrations/gemini
- Mistral Agents API: https://mistral.ai/news/agents-api
- Build MCP plugins - Microsoft Learn: https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-mcp-plugins
- Copilot Studio MCP: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp
- Remote MCP Tools - xAI: https://docs.x.ai/docs/guides/tools/remote-mcp-tools
- Perplexity Moving Away from MCP: https://awesomeagents.ai/news/perplexity-agent-api-mcp-shift/
- Notion MCP docs: https://developers.notion.com/docs/mcp
- Atlassian Remote MCP Server: https://www.atlassian.com/blog/announcements/remote-mcp-server
- Airbyte Knowledge MCP Server: https://airbyte.com/blog/knowledge-mcp-server
- Docker MCP OAuth: https://www.docker.com/blog/connect-to-remote-mcp-servers-with-oauth/
- Why MCP Deprecated SSE: https://blog.fka.dev/blog/2025-06-06-why-mcp-deprecated-sse-and-go-with-streamable-http/
- The 2026 MCP Roadmap: http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
