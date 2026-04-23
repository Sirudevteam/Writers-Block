import { NextResponse } from "next/server"
import { getSafeNextPath } from "@/lib/auth/next-path"
import { createClientForAuthCallback } from "@/lib/supabase/auth-callback"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeNextPath(searchParams.get("next"))

  if (code) {
    // Build redirect first; session cookies must be set on *this* response
    // (lib/supabase/server `cookies().set` does not apply here reliably).
    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = await createClientForAuthCallback(response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message)
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`)
}
