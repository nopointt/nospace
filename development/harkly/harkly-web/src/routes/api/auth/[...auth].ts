import { toSolidStartHandler } from "better-auth/solid-start";
import { getAuth } from "~/lib/auth";

const getAuthHandler = async (event: any) => {
  const ctx = event.context as any;
  const env = ctx.bindings ?? ctx.cloudflare?.env;
  if (!env?.AUTH_DB) {
    throw new Error("AUTH_DB binding not available. Run with wrangler pages dev.");
  }
  const auth = getAuth(env.AUTH_DB);
  return auth.handler(event.request);
};

export const { GET, POST } = toSolidStartHandler(getAuthHandler as any);
