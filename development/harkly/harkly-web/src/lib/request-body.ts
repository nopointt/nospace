import type { APIEvent } from "@solidjs/start/server";

/**
 * Read JSON body from API event on Cloudflare Pages.
 *
 * Problem: Nitro on CF Pages may consume the Request body stream before route handlers.
 * Solution: try nativeEvent._body (Nitro's internal body cache), then request.text().
 *
 * NOTE: Do NOT import h3 — it may use Node.js APIs unavailable on workerd.
 */
export async function readJsonBody<T = unknown>(event: APIEvent): Promise<T | null> {
  // 1. Try Nitro's internal body cache (nativeEvent._body or _requestBody)
  try {
    const ne = (event as any).nativeEvent;
    if (ne) {
      // Nitro caches parsed body on the event object
      const cached = ne._body ?? ne.body ?? ne._requestBody;
      if (cached && typeof cached === "object") return cached as T;
      if (typeof cached === "string" && cached) return JSON.parse(cached) as T;

      // Try Nitro's readBody via the event's internal node req
      const nodeReq = ne.node?.req ?? ne.req;
      if (nodeReq) {
        // On workerd, node.req might have _body set by Nitro
        const reqBody = nodeReq._body ?? nodeReq.body;
        if (reqBody && typeof reqBody === "object") return reqBody as T;
        if (typeof reqBody === "string" && reqBody) return JSON.parse(reqBody) as T;
      }
    }
  } catch {
    // Internal cache miss
  }

  // 2. Try request.text() directly (works if body not yet consumed)
  try {
    const text = await event.request.text();
    if (text) return JSON.parse(text) as T;
  } catch {
    // Body already consumed
  }

  // 3. Try request.clone().text()
  try {
    const clone = event.request.clone();
    const text = await clone.text();
    if (text) return JSON.parse(text) as T;
  } catch {
    // Clone failed
  }

  return null;
}
