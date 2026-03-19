import type { Env, OAuthProps } from "../lib/types";
import { handleMcpRequest } from "../lib/mcp-protocol";

/**
 * apiHandler for workers-oauth-provider.
 * Handles POST /mcp — MCP JSON-RPC over Streamable HTTP.
 * workers-oauth-provider validates the OAuth token before routing here.
 * User identity available via ctx.props.userId.
 */
export const mcpHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Extract user props injected by workers-oauth-provider
    const props = (ctx as any).props as OAuthProps | undefined;
    const userId = props?.userId;

    if (!userId) {
      return Response.json(
        { jsonrpc: "2.0", error: { code: -32000, message: "Missing user identity" } },
        { status: 401 },
      );
    }

    // Only accept POST
    if (request.method !== "POST") {
      return Response.json(
        { jsonrpc: "2.0", error: { code: -32600, message: "Method not allowed" } },
        { status: 405 },
      );
    }

    return handleMcpRequest(request, env, userId);
  },
};
