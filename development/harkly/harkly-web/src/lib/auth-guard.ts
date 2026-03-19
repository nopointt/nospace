import type { APIEvent } from "@solidjs/start/server";

/**
 * Extract authenticated userId from event context.
 * Returns userId string or throws 401 Response.
 */
export function requireAuth(event: APIEvent): string {
  const userId = (event.context as any).userId;
  if (!userId) {
    throw Response.json(
      { error: "Необходима авторизация" },
      { status: 401 }
    );
  }
  return userId;
}
