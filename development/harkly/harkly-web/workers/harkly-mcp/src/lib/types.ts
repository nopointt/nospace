import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";

// CF Worker bindings for harkly-mcp
export interface Env {
  // D1 databases (shared with harkly-web)
  KB_DB: D1Database;
  AUTH_DB: D1Database;

  // KV namespaces
  OAUTH_KV: KVNamespace;
  MCP_SESSION_KV: KVNamespace;
  AUTH_KV: KVNamespace;

  // Vectorize
  VECTORIZE_INDEX: VectorizeIndex;

  // Workers AI
  AI: Ai;

  // Injected by workers-oauth-provider at request time
  OAUTH_PROVIDER: OAuthHelpers;
}

// Re-export for convenience
export type { AuthRequest };

// Props passed by workers-oauth-provider to apiHandler via ctx.props
export interface OAuthProps {
  userId: string;
  email?: string;
}
