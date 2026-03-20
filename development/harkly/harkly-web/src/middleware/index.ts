import { createMiddleware } from "@solidjs/start/middleware";

// CF binding injection middleware — BINDINGS ONLY
// Auth session is checked per-route via requireAuth() — NOT in middleware
// Reason: middleware getSession() may consume request body on POST, breaking body parsing
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
    },
  ],
});
