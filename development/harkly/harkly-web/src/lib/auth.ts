import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzle } from "drizzle-orm/d1";

export function getAuth(d1: D1Database, secret?: string, kv?: KVNamespace) {
  const db = drizzle(d1);
  return betterAuth(
    withCloudflare(
      {
        d1: { db },
        ...(kv ? { kv } : {}),
        autoDetectIpAddress: false,
        geolocationTracking: false,
      },
      {
        secret: secret || "harkly-dev-secret-change-in-production",
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
      },
    ),
  );
}

export type AuthInstance = ReturnType<typeof getAuth>;
