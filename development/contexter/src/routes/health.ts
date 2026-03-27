import { Hono } from "hono"
import type { Sql } from "postgres"
import type { Env } from "../types/env"
import type Redis from "ioredis"
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

type AppEnv = { Variables: { sql: Sql; env: Env; redis: Redis } }

export const health = new Hono<AppEnv>()

health.get("/", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")

  const checks: Record<string, string> = {
    api: "ok",
    postgres: "unknown",
    s3: "unknown",
    redis: "unknown",
    groq: "unknown",
  }

  try {
    await sql`SELECT 1`
    checks.postgres = "ok"
  } catch {
    checks.postgres = "error"
  }

  // P0-002: Test write permission, not just head (which succeeds with read-only token)
  try {
    const testKey = "__health_write_test__"
    await env.storage.send(new PutObjectCommand({
      Bucket: env.storageBucket,
      Key: testKey,
      Body: Buffer.from("health-check"),
      ContentType: "text/plain",
    }))
    await env.storage.send(new DeleteObjectCommand({ Bucket: env.storageBucket, Key: testKey }))
    checks.s3 = "ok"
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    checks.s3 = msg.includes("AccessDenied") || msg.includes("403") ? "write-failed" : "error"
  }

  try {
    await redis.ping()
    checks.redis = "ok"
  } catch {
    checks.redis = "error"
  }

  try {
    checks.groq = env.GROQ_API_KEY ? "ok" : "missing"
  } catch {
    checks.groq = "error"
  }

  const allOk = Object.values(checks).every((v) => v === "ok")

  return c.json({ status: allOk ? "healthy" : "degraded", checks }, allOk ? 200 : 503)
})
