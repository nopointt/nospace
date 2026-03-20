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

// Build a clean Request that bypasses Nitro's body interception.
// Nitro wraps the original Request and its getBody$1 corrupts JSON parsing
// on Cloudflare Pages. Reading the raw body and constructing a new Request fixes this.
async function buildCleanRequest(event: APIEvent): Promise<Request> {
  const original = event.request;
  const method = original.method;
  if (method === "GET" || method === "HEAD") {
    return new Request(original.url, {
      method,
      headers: original.headers,
    });
  }
  // Read body as text from the original request to avoid Nitro's getBody corruption
  let bodyText: string | null = null;
  try {
    bodyText = await original.text();
  } catch {
    // body may already be consumed — try nativeEvent
    try {
      const nativeReq = (event as any).nativeEvent?.node?.req;
      if (nativeReq) {
        const chunks: Buffer[] = [];
        for await (const chunk of nativeReq) {
          chunks.push(Buffer.from(chunk));
        }
        bodyText = Buffer.concat(chunks).toString("utf-8");
      }
    } catch {
      bodyText = null;
    }
  }
  return new Request(original.url, {
    method,
    headers: original.headers,
    body: bodyText,
  });
}

export async function GET(event: APIEvent) {
  const env = getEnv(event);
  const url = new URL(event.request.url);
  if (url.pathname === "/api/auth/debug-env") {
    const allKeys = env ? Object.keys(env) : [];
    const ctx = (event as any)?.context;
    const nativeCtx = (event as any)?.nativeEvent?.context;
    return Response.json({
      AUTH_DB: !!env?.AUTH_DB,
      SECRET_defined: !!env?.BETTER_AUTH_SECRET,
      envKeys: allKeys,
      SECRET_type: typeof env?.BETTER_AUTH_SECRET,
      SECRET_value_safe: String(env?.BETTER_AUTH_SECRET).slice(0, 6),
      ctxKeys: ctx ? Object.keys(ctx) : [],
      cfEnvKeys: ctx?.cloudflare?.env ? Object.keys(ctx.cloudflare.env) : [],
      nativeCfEnvKeys: nativeCtx?.cloudflare?.env ? Object.keys(nativeCtx.cloudflare.env) : [],
    });
  }
  if (!env?.AUTH_DB) {
    return Response.json({ error: "AUTH_DB not available" }, { status: 503 });
  }
  const auth = getAuth(env.AUTH_DB, env.BETTER_AUTH_SECRET);
  const cleanReq = await buildCleanRequest(event);
  return auth.handler(cleanReq);
}

export async function POST(event: APIEvent) {
  const env = getEnv(event);
  if (!env?.AUTH_DB) {
    return Response.json({ error: "AUTH_DB not available", envFound: !!env }, { status: 503 });
  }
  try {
    const auth = getAuth(env.AUTH_DB, env.BETTER_AUTH_SECRET);
    const cleanReq = await buildCleanRequest(event);
    return await auth.handler(cleanReq);
  } catch (e: any) {
    console.error("[auth] handler error:", e?.message, e?.stack?.slice(0, 300));
    return Response.json(
      { error: "Ошибка авторизации", detail: e?.message, stack: e?.stack?.slice(0, 500) },
      { status: 500 },
    );
  }
}
