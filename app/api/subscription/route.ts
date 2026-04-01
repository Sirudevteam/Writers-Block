import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Revalidate every 60 seconds
export const revalidate = 60

// GET /api/subscription — get user's subscription (null if no row yet)
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await (supabase
    .from("subscriptions") as any)
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      Vary: "Authorization",
    },
  })
}

/**
 * Plan changes must go through Razorpay (verify/webhook). This endpoint is intentionally disabled.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Subscription upgrades are only available through checkout after payment. Use the Subscription page.",
    },
    {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
