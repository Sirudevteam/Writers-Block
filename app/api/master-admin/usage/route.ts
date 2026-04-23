import { NextResponse, type NextRequest } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { guardMasterAdminApi } from "@/lib/master-admin-api-guard"
import { resolveMasterAdminDateRange } from "@/lib/master-admin-range"
import { fetchTopUsersByUsage, fetchUsageDailyBuckets, fetchUsageEndpointBreakdown } from "@/lib/master-admin-queries"

export const dynamic = "force-dynamic"

function searchRecord(url: URL): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {}
  url.searchParams.forEach((value, key) => {
    out[key] = value
  })
  return out
}

export async function GET(req: NextRequest) {
  const gate = await guardMasterAdminApi(req)
  if (!gate.ok) return gate.response

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const url = new URL(req.url)
  const sp = searchRecord(url)
  const range = resolveMasterAdminDateRange(sp)

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const [usage, endpoints, topUsers] = await Promise.all([
      fetchUsageDailyBuckets(adminSupabase, range.fromIso, range.toIso),
      fetchUsageEndpointBreakdown(adminSupabase, range.fromIso, range.toIso, 5000),
      fetchTopUsersByUsage(adminSupabase, range.fromIso, range.toIso, 15),
    ])
    return NextResponse.json(
      { range, ...usage, endpoints, topUsers },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load usage"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
