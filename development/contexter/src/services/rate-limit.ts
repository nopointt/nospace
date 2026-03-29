/**
 * Shared rate limiting with IP whitelist support.
 * Whitelisted IPs bypass all rate limits (for E2E tests, monitoring, internal services).
 */
import type Redis from "ioredis"
import type { Context } from "hono"

let _whitelistSet: Set<string> | null = null

/**
 * Parse whitelist from comma-separated env var. Cached after first call.
 */
function getWhitelist(envValue?: string): Set<string> {
  if (_whitelistSet) return _whitelistSet
  _whitelistSet = new Set(
    (envValue ?? "")
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)
  )
  return _whitelistSet
}

/**
 * Extract client IP from request headers.
 * Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > "unknown"
 */
export function getClientIp(c: Context): string {
  return (
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Real-IP") ??
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

/**
 * Check if an IP is whitelisted for rate limit bypass.
 */
export function isWhitelisted(ip: string, whitelistEnv?: string): boolean {
  return getWhitelist(whitelistEnv).has(ip)
}

/**
 * Check rate limit for a key. Returns true if request should be allowed.
 * Whitelisted IPs always return true without incrementing the counter.
 *
 * @param redis - Redis client
 * @param key - Rate limit key (e.g., "reg:1.2.3.4", "query:userId")
 * @param limit - Max requests in window
 * @param windowSeconds - Window duration
 * @param ip - Client IP for whitelist check
 * @param whitelistEnv - RATE_LIMIT_WHITELIST_IPS env value
 */
export async function checkRateLimit(
  redis: Redis,
  key: string,
  limit: number,
  windowSeconds: number,
  ip: string,
  whitelistEnv?: string,
): Promise<{ allowed: boolean; current: number }> {
  if (isWhitelisted(ip, whitelistEnv)) {
    return { allowed: true, current: 0 }
  }

  try {
    const count = await redis.get(key)
    const current = parseInt(count ?? "0")
    if (current >= limit) {
      return { allowed: false, current }
    }
    await redis.set(key, String(current + 1), "EX", windowSeconds)
    return { allowed: true, current: current + 1 }
  } catch (e) {
    // Fail-open: if Redis is down, allow the request
    console.error("Rate limit check failed, allowing request:", e instanceof Error ? e.message : String(e))
    return { allowed: true, current: 0 }
  }
}
