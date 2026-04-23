import { NextRequest, NextResponse } from "next/server"
import { getApiRatelimit, getClientIP } from "@/lib/ratelimit"

let loggedDevRedisHint = false

/**
 * 100 req/min per IP (when Redis is configured). First line of defense on hot API routes.
 * Returns 429 or null if OK.
 * On Upstash/Redis network errors, fails open (allows the request) so a bad or unreachable Redis does not 500 the whole API.
 */
export async function apiIpLimitOr429(req: NextRequest): Promise<NextResponse | null> {
  try {
    const r = await getApiRatelimit().limit(getClientIP(req))
    if (r.success) return null
    const resetSec =
      typeof r.reset === "number" && !Number.isNaN(r.reset)
        ? Math.ceil(r.reset / 1000)
        : Math.ceil(Date.now() / 1000) + 60
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Limit": String(r.limit ?? 0),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetSec),
          "Retry-After": String(
            Math.max(1, Math.ceil(((typeof r.reset === "number" ? r.reset : Date.now() + 60000) - Date.now()) / 1000))
          ),
        },
      }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Do not mask Next.js static/dynamic analysis errors; re-throw for correct route behavior
    if (msg.includes("Dynamic server usage") || msg.includes("Could not read")) {
      throw e
    }
    // Fail-open: not an app bug. Common locally: wrong token, VPN/firewall, or placeholder Upstash URL.
    console.warn("[api-ip-limit] Upstash Redis unreachable — allowing request (fail-open):", msg)
    if (process.env.NODE_ENV !== "production" && !loggedDevRedisHint) {
      loggedDevRedisHint = true
      console.warn(
        "[api-ip-limit] Local dev: remove UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env.local to use the in-memory limiter (no HTTP). Or fix Upstash URL/token/network."
      )
    }
    return null
  }
}
