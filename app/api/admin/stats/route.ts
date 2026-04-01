/**
 * Admin Stats API
 * Protected by ADMIN_EMAILS environment variable.
 * Returns platform metrics: users, subscriptions, revenue, usage.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { isAdminEmail } from "@/lib/admin"
import { computeAdminStats } from "@/lib/admin-stats"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isAdminEmail(user.email)) {
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
