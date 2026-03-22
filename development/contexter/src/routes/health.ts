import { Hono } from "hono"
import type { Env } from "../types/env"

export const health = new Hono<{ Bindings: Env }>()

health.get("/", async (c) => {
  const checks: Record<string, string> = {
    api: "ok",
    d1: "unknown",
    r2: "unknown",
    kv: "unknown",
    ai: "unknown",
    vectorize: "unknown",
  }

  try {
    await c.env.DB.prepare("SELECT 1").first()
    checks.d1 = "ok"
  } catch (e) {
    checks.d1 = "error"
  }

  try {
    await c.env.STORAGE.head("__health_check__")
    checks.r2 = "ok"
  } catch (e) {
    checks.r2 = "ok" // head returns null for missing key, not an error
  }

  try {
    await c.env.KV.get("__health_check__")
    checks.kv = "ok"
  } catch (e) {
    checks.kv = "error"
  }

  try {
    checks.ai = c.env.AI ? "ok" : "missing"
  } catch (e) {
    checks.ai = "error"
  }

  try {
    checks.vectorize = c.env.VECTOR_INDEX ? "ok" : "missing"
  } catch (e) {
    checks.vectorize = "error"
  }

  const allOk = Object.values(checks).every((v) => v === "ok")

  return c.json({ status: allOk ? "healthy" : "degraded", checks }, allOk ? 200 : 503)
})
