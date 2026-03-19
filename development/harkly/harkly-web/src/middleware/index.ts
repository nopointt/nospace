import { createMiddleware } from "@solidjs/start/middleware";
import { getAuth } from "~/lib/auth";

// CF binding injection middleware
// SolidStart wraps Nitro event — bindings are on event.nativeEvent.context.cloudflare.env
export default createMiddleware({
  onRequest: [
    async (event) => {
      const ctx = event?.context as any;
      if (!ctx) return;

      // SolidStart: CF bindings on nativeEvent.context.cloudflare.env
      const nativeCtx = (event as any).nativeEvent?.context;
      const cf = ctx.cloudflare ?? nativeCtx?.cloudflare;
      if (cf?.env) {
        ctx.bindings = cf.env;
      }

      // Extract userId from better-auth session
      const env = ctx.bindings;
      if (env?.AUTH_DB) {
        try {
          const auth = getAuth(env.AUTH_DB, env.BETTER_AUTH_SECRET);
          const session = await auth.api.getSession({ headers: event.request.headers });
          ctx.userId = session?.user?.id ?? null;
        } catch {
          ctx.userId = null;
        }
      }
    },
  ],
});
