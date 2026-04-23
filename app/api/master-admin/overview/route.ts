import { NextResponse, type NextRequest } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { guardMasterAdminApi } from "@/lib/master-admin-api-guard"
import { computeAdminStats } from "@/lib/admin-stats"
import {
  fetchMrrDailyBuckets,
  fetchSignupDailyBuckets,
  fetchTopUsersByUsage,
  fetchUpcomingRenewals,
  fetchUsageDailyBuckets,
  fetchUsageEndpointBreakdown,
} from "@/lib/master-admin-queries"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const gate = await guardMasterAdminApi(req)
  if (!gate.ok) return gate.response

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const stats = await computeAdminStats(adminSupabase)
    const now = new Date()
    const toIso = now.toISOString()
    const from30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const fromPrev30d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const [signup30d, signupPrev30d, usage30d, endpoints, mrr30d, renewals7d, topUsers] = await Promise.all([
      fetchSignupDailyBuckets(adminSupabase, from30d, toIso),
      fetchSignupDailyBuckets(adminSupabase, fromPrev30d, from30d),
      fetchUsageDailyBuckets(adminSupabase, from30d, toIso),
      fetchUsageEndpointBreakdown(adminSupabase, from30d, toIso, 5000),
      fetchMrrDailyBuckets(adminSupabase, from30d, toIso),
      fetchUpcomingRenewals(adminSupabase, toIso, 7),
      fetchTopUsersByUsage(adminSupabase, from30d, toIso, 10),
    ])

    const body = {
      stats,
      range: { from30d, toIso, fromPrev30d },
      signup30d,
      signupPrev30d,
      usage30d,
      endpoints,
      mrr30d,
      renewals7d,
      topUsers,
    }
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load stats"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
