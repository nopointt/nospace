import type { APIEvent } from "@solidjs/start/server";

export async function GET(event: APIEvent) {
  const e = event as any;
  const ctx = e.context ?? {};
  const nCtx = e.nativeEvent?.context ?? {};
  const cf = nCtx.cloudflare;

  return Response.json({
    contextKeys: Object.keys(ctx),
    nativeContextKeys: Object.keys(nCtx),
    hasCloudflare: !!cf,
    cloudflareKeys: cf ? Object.keys(cf) : null,
    hasEnv: !!cf?.env,
    envKeys: cf?.env ? Object.keys(cf.env) : null,
    hasAuthDb: !!cf?.env?.AUTH_DB,
    hasKbDb: !!cf?.env?.KB_DB,
  });
}
