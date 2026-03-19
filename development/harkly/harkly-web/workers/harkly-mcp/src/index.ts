import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { defaultHandler } from "./handlers/default";
import { mcpHandler } from "./handlers/mcp";

/**
 * Harkly MCP Server — Remote MCP with OAuth 2.1
 *
 * Three-layer architecture:
 * 1. workers-oauth-provider (outermost) — OAuth 2.1 server, PKCE, dynamic client registration
 * 2. defaultHandler — better-auth user identity + consent UI
 * 3. apiHandler (mcpHandler) — MCP server with 6 tools, scoped to userId
 */
export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: mcpHandler,
  defaultHandler: defaultHandler,
  tokenEndpoint: "/oauth/token",
  authorizeEndpoint: "/authorize",
  clientRegistrationEndpoint: "/oauth/register",
  scopesSupported: ["knowledge:read", "knowledge:write"],
  // Token TTLs
  accessTokenTTL: 3600,           // 1 hour
  refreshTokenTTL: 30 * 24 * 3600, // 30 days
});
