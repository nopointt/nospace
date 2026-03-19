import { betterAuth } from "better-auth";

// Per-request better-auth instance (CF Workers require this pattern)
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
