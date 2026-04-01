import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import type { SubscriptionPlan } from "@/types/project"

// Create Redis client only if credentials are available
const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  return new Redis({ url, token })
}

const redis = createRedisClient()

export function isRedisConfigured(): boolean {
  return redis !== null
}

/**
 * In production, AI rate limits require Upstash Redis. Without it, fail closed (503).
 * Set ALLOW_AI_WITHOUT_REDIS=1 only for emergencies / self-hosted without Redis (not recommended).
 */
export function rateLimitInfrastructureResponse(): NextResponse | null {
  if (isRedisConfigured()) return null
  if (process.env.ALLOW_AI_WITHOUT_REDIS === "1") {
    console.warn("[ratelimit] ALLOW_AI_WITHOUT_REDIS: AI routes running without Redis")
    return null
  }
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"
  if (!isProd) return null
  return NextResponse.json(
    {
      error:
        "Service temporarily unavailable: rate limiting is not configured. Set Upstash Redis env vars or contact support.",
    },
    { status: 503 }
  )
}

// ── IP-based rate limiters ──────────────────────────────────────────────────

// AI generation endpoints: 10 requests/hour per IP (global guard)
export const generationRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:generation:ip",
    })
  : null

// General API endpoints: 100 requests/minute per IP
export const apiRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:api:ip",
    })
  : null

// ── Per-user plan-based daily rate limiters ─────────────────────────────────

// Free plan: 5 AI generations/day per user
const freeUserRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 d"),
      analytics: true,
      prefix: "ratelimit:user:free",
    })
  : null

// Pro plan: 50 AI generations/day per user
const proUserRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
      analytics: true,
      prefix: "ratelimit:user:pro",
    })
  : null

// Premium plan: 200 AI generations/day per user
const premiumUserRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "1 d"),
      analytics: true,
      prefix: "ratelimit:user:premium",
    })
  : null

// ── Fallback for development without Redis ──────────────────────────────────

const devRatelimit = {
  limit: async (_identifier: string) => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now() + 3600000,
    pending: Promise.resolve(),
  }),
}

// ── Public accessors ────────────────────────────────────────────────────────

export function getGenerationRatelimit() {
  if (!generationRatelimit) {
    console.warn("Redis not configured — using dev rate limiter (no limits enforced)")
    return devRatelimit as unknown as Ratelimit
  }
  return generationRatelimit
}

export function getApiRatelimit() {
  if (!apiRatelimit) {
    return devRatelimit as unknown as Ratelimit
  }
  return apiRatelimit
}

/**
 * Returns the per-user daily rate limiter for the given subscription plan.
 * Key should be the user ID. Expired/cancelled subscriptions should pass 'free'.
 */
export function getPlanRatelimit(plan: SubscriptionPlan) {
  if (!redis) {
    return devRatelimit as unknown as Ratelimit
  }
  switch (plan) {
    case "premium":
      return premiumUserRatelimit ?? (devRatelimit as unknown as Ratelimit)
    case "pro":
      return proUserRatelimit ?? (devRatelimit as unknown as Ratelimit)
    default:
      return freeUserRatelimit ?? (devRatelimit as unknown as Ratelimit)
  }
}

// ── Helper to extract client IP ─────────────────────────────────────────────

export function getClientIP(request: Request): string {
  const headers = request.headers
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") || // Cloudflare
    "anonymous"
  )
}
