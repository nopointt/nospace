import { getAuth } from "../lib/auth";
import type { Env } from "../lib/types";
import { renderConsentPage } from "./consent-ui";
import { renderLoginPage } from "./login-ui";

/**
 * defaultHandler for workers-oauth-provider.
 * Routes:
 *   /authorize → OAuth consent flow (check session → consent UI → approve/deny)
 *   /authorize/confirm → POST: complete authorization
 *   /login → Login/signup UI
 *   /api/auth/* → better-auth handler
 */
export const defaultHandler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ── /authorize — OAuth consent entry ──────────────────────
    if (url.pathname === "/authorize" && request.method === "GET") {
      return handleAuthorize(request, env);
    }

    // ── /authorize/confirm — POST: approve or deny ───────────
    if (url.pathname === "/authorize/confirm" && request.method === "POST") {
      return handleAuthorizeConfirm(request, env);
    }

    // ── /login — Login page ──────────────────────────────────
    if (url.pathname === "/login") {
      if (request.method === "GET") {
        const next = url.searchParams.get("next") ?? "/authorize";
        return new Response(renderLoginPage(next), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    // ── /api/auth/* — better-auth handler ────────────────────
    if (url.pathname.startsWith("/api/auth/")) {
      const auth = getAuth(env.AUTH_DB);
      return auth.handler(request);
    }

    // ── Fallback ─────────────────────────────────────────────
    return new Response("Not Found", { status: 404 });
  },
};

async function handleAuthorize(request: Request, env: Env): Promise<Response> {
  try {
    // Parse OAuth request from workers-oauth-provider
    const oauthReq = await env.OAUTH_PROVIDER.parseAuthRequest(request);

    // Check if user has an active better-auth session
    let session: any = null;
    try {
      const auth = getAuth(env.AUTH_DB);
      session = await auth.api.getSession({ headers: request.headers });
    } catch {
      // No session or AUTH_DB not ready — treat as not logged in
    }

    if (!session) {
      // Not logged in → redirect to login, preserve OAuth state
      const origin = new URL(request.url).origin;
      const currentUrl = request.url;
      return Response.redirect(
        `${origin}/login?next=${encodeURIComponent(currentUrl)}`,
        302,
      );
    }

    // Logged in → show consent UI
    return new Response(
      renderConsentPage({
        clientId: oauthReq.clientId,
        scopes: oauthReq.scope,
        userEmail: session.user.email,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: "authorize_error", detail: message }, { status: 500 });
  }
}

async function handleAuthorizeConfirm(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  // Re-parse OAuth request
  const oauthReq = await env.OAUTH_PROVIDER.parseAuthRequest(request);

  // Check session again
  const auth = getAuth(env.AUTH_DB);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json({ error: "Сессия истекла" }, { status: 401 });
  }

  if (action === "deny") {
    // Redirect with error=access_denied
    const redirectUri = new URL(oauthReq.redirectUri);
    redirectUri.searchParams.set("error", "access_denied");
    return Response.redirect(redirectUri.toString(), 302);
  }

  // Approve → complete authorization
  const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReq,
    userId: session.user.id,
    scope: oauthReq.scope,
    metadata: {
      approvedAt: new Date().toISOString(),
    },
    props: {
      userId: session.user.id,
      email: session.user.email,
    },
  });

  return Response.redirect(redirectTo, 302);
}
