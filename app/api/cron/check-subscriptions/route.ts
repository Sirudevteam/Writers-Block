/**
 * Subscription expiry cron job
 *
 * Called daily by Vercel Cron (configured in vercel.json):
 *   Schedule: "0 9 * * *" (9 AM UTC daily)
 *   URL: /api/cron/check-subscriptions
 *
 * What it does:
 * 1. Finds subscriptions expiring in 7 days → sends warning email
 * 2. Finds expired subscriptions → downgrades to free plan
 *
 * Protected by CRON_SECRET env var (set in Vercel project settings).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendExpiryWarning } from "@/lib/email"
import { PLAN_LIMITS } from "@/types/project"

// Never statically render — this route requires live DB access
export const dynamic = "force-dynamic"

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET?.trim()

  if (isProductionRuntime()) {
    if (!cronSecret) {
      return NextResponse.json(
        {
          error:
            "Cron is not configured: set CRON_SECRET in the deployment environment.",
        },
        { status: 503 }
      )
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing Supabase service credentials." },
      { status: 503 }
    )
  }

  const adminSupabase = createClient(url, serviceKey)

  const now = new Date()

  let warned = 0
  let expired = 0
  const errors: string[] = []

  // ── 1. Find subscriptions expiring in 6-8 days (send warning) ────────────
  const warningWindowStart = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
  const warningWindowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expiringSoon } = await adminSupabase
    .from("subscriptions")
    .select("user_id, plan, current_period_end, expiry_warning_sent_at")
    .eq("status", "active")
    .neq("plan", "free")
    .is("expiry_warning_sent_at", null)
    .gte("current_period_end", warningWindowStart)
    .lte("current_period_end", warningWindowEnd)

  for (const sub of expiringSoon ?? []) {
    try {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("email")
        .eq("id", sub.user_id)
        .single()

      if (profile?.email && sub.current_period_end) {
        const expiryDate = new Date(sub.current_period_end)
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        await sendExpiryWarning(profile.email, sub.plan, daysLeft, expiryDate)
        await adminSupabase
          .from("subscriptions")
          .update({ expiry_warning_sent_at: now.toISOString() })
          .eq("user_id", sub.user_id)
        warned++
      }
    } catch (err: any) {
      errors.push(`Warning email failed for user ${sub.user_id}: ${err.message}`)
    }
  }

  // ── 2. Find expired subscriptions and downgrade to free ───────────────────
  const { data: expiredSubs } = await adminSupabase
    .from("subscriptions")
    .select("user_id, plan")
    .eq("status", "active")
    .neq("plan", "free")
    .lt("current_period_end", now.toISOString())

  for (const sub of expiredSubs ?? []) {
    try {
      await adminSupabase
        .from("subscriptions")
        .update({
          status: "expired",
          plan: "free",
          projects_limit: PLAN_LIMITS.free,
          billing_cycle: "monthly",
          expiry_warning_sent_at: null,
        })
        .eq("user_id", sub.user_id)

      expired++
    } catch (err: any) {
      errors.push(`Expiry downgrade failed for user ${sub.user_id}: ${err.message}`)
    }
  }

  console.log(`[cron] check-subscriptions: warned=${warned} expired=${expired} errors=${errors.length}`)

  return NextResponse.json({
    success: true,
    warned,
    expired,
    errors: errors.length > 0 ? errors : undefined,
    runAt: now.toISOString(),
  })
}
