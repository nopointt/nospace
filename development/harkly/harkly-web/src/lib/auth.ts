import { betterAuth } from "better-auth";
import type { D1Database } from "@cloudflare/workers-types";

export function getAuth(d1: D1Database) {
  return betterAuth({
    database: d1,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof getAuth>;
