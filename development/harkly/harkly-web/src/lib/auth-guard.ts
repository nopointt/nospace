import type { APIEvent } from "@solidjs/start/server";
import { getAuth } from "~/lib/auth";

function getEnvFromEvent(event: APIEvent): any {
  const ctx = (event as any).context;
  const nativeCtx = (event as any).nativeEvent?.context;
  return (
    ctx?.bindings ??
    ctx?.cloudflare?.env ??
    nativeCtx?.cloudflare?.env ??
    nativeCtx?._platform?.env ??
    null
  );
}

export async function requireAuth(event: APIEvent): Promise<string | null> {
  // Try middleware-set userId first
  const ctx = (event as any).context;
  if (ctx?.userId) return ctx.userId;

  // Fallback: read session directly from request headers
  const env = getEnvFromEvent(event);
  if (env?.AUTH_DB && env?.BETTER_AUTH_SECRET) {
    try {
      const auth = getAuth(env.AUTH_DB, env.BETTER_AUTH_SECRET);
      const session = await auth.api.getSession({ headers: event.request.headers });
      if (session?.user?.id) return session.user.id;
    } catch {
      // Session check failed
    }
  }

  // No auth — return null (caller handles 401)
  return null;
}
