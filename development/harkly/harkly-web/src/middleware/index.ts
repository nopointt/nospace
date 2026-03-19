import { createMiddleware } from "@solidjs/start/middleware";

// CF binding injection middleware
// Dev: uses wrangler.getPlatformProxy()
// Prod: bindings available natively on event.context.cloudflare.env
export default createMiddleware({
  onRequest: [
    async (event) => {
      // In production, CF bindings are on event.context.cloudflare.env
      // In dev with `wrangler pages dev`, they're also injected
      // We normalize access through event.context.bindings
      const cf = (event.context as any).cloudflare;
      if (cf?.env) {
        (event.context as any).bindings = cf.env;
      }
    },
  ],
});
