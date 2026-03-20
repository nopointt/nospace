import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// D1 only accepts string | number | null | ArrayBuffer.
// better-auth sends Date objects and booleans via Drizzle — wrap D1 to auto-convert.
function wrapD1(db: D1Database): D1Database {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "prepare") {
        return (query: string) => {
          const stmt = target.prepare(query);
          return new Proxy(stmt, {
            get(stmtTarget, stmtProp) {
              if (stmtProp === "bind") {
                return (...args: unknown[]) => {
                  const sanitized = args.map((v) => {
                    if (v instanceof Date) return v.toISOString();
                    if (typeof v === "boolean") return v ? 1 : 0;
                    return v;
                  });
                  return stmtTarget.bind(...sanitized);
                };
              }
              const val = (stmtTarget as any)[stmtProp];
              return typeof val === "function" ? val.bind(stmtTarget) : val;
            },
          });
        };
      }
      const val = (target as any)[prop];
      return typeof val === "function" ? val.bind(target) : val;
    },
  });
}

// Auth tables schema — mirrors drizzle/migrations/auth/0001_auth_init.sql
const user = sqliteTable("user", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified").notNull().default(0),
  image: text("image"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const session = sqliteTable("session", {
  id: text("id").primaryKey().notNull(),
  expiresAt: text("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const account = sqliteTable("account", {
  id: text("id").primaryKey().notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: text("access_token_expires_at"),
  refreshTokenExpiresAt: text("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const verification = sqliteTable("verification", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

const authSchema = { user, session, account, verification };

export function getAuth(d1: D1Database, secret?: string) {
  const db = drizzle(wrapD1(d1), { schema: authSchema });
  return betterAuth({
    secret: secret ?? (() => { throw new Error("BETTER_AUTH_SECRET is required"); })(),
    database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
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
    trustedOrigins: [
      "https://harkly-web.pages.dev",
      "https://*.harkly-web.pages.dev",
    ],
  });
}

export type AuthInstance = ReturnType<typeof getAuth>;
