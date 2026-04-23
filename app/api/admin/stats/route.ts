/**
 * Admin Stats API
 * Protected by public.master_admin_users (service role check).
 * Returns platform metrics: users, subscriptions, revenue, usage.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiIpLimitOr429 } from "@/lib/api-ip-limit"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { userHasAdminPrivileges } from "@/lib/admin-privileges"
import { computeAdminStats } from "@/lib/admin-stats"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const tooMany = await apiIpLimitOr429(request)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 403 (not 404) for non-admins: explicit for API clients; page/middleware use 404 to avoid route discovery
  if (!(await userHasAdminPrivileges(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await computeAdminStats(adminSupabase)
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load stats"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
