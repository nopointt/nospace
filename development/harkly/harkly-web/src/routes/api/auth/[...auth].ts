import type { APIEvent } from "@solidjs/start/server";
import { getAuth } from "~/lib/auth";

function getEnv(event: any): any {
  // Try all known paths to CF bindings in SolidStart + Nitro + CF Pages
  return (
    event?.context?.bindings ??
    event?.context?.cloudflare?.env ??
    event?.nativeEvent?.context?.cloudflare?.env ??
    event?.nativeEvent?.context?._platform?.env ??
    event?.context?._platform?.env ??
    null
  );
}

// Debug endpoint — GET /api/auth/debug-env
function isDebug(event: APIEvent) {
  return new URL(event.request.url).pathname === "/api/auth/debug-env";
}

export async function GET(event: APIEvent) {
  const env = getEnv(event);
  if (!env?.AUTH_DB) {
    return Response.json({ error: "AUTH_DB not available" }, { status: 503 });
  }
  const auth = getAuth(env.AUTH_DB, env.BETTER_AUTH_SECRET);
  return auth.handler(event.request);
}

export async function POST(event: APIEvent) {
  const env = getEnv(event);
  if (!env?.AUTH_DB) {
    return Response.json({ error: "AUTH_DB not available", envFound: !!env }, { status: 503 });
  }
  try {
    const auth = getAuth(env.AUTH_DB, env.BETTER_AUTH_SECRET);
    return await auth.handler(event.request);
  } catch (e: any) {
    return Response.json(
      { error: "auth_handler_error", message: e?.message, stack: e?.stack?.split("\n").slice(0, 5) },
      { status: 500 },
    );
  }
}
