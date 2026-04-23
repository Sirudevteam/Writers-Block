import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiIpLimitOr429 } from "@/lib/api-ip-limit"

function noStoreJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Cache-Control": "no-store, max-age=0",
    },
  })
}

// GET /api/user/profile
export async function GET(request: NextRequest) {
  const tooMany = await apiIpLimitOr429(request)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return noStoreJson({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    // If legacy users exist without a `profiles` row (or trigger wasn't installed),
    // create it idempotently so the app can proceed.
    const shouldAttemptBootstrap =
      error.code === "PGRST116" ||
      /0 rows/i.test(error.details ?? "") ||
      /no rows/i.test(error.message ?? "")

    if (shouldAttemptBootstrap) {
      const bootstrap = {
        id: user.id,
        email: user.email ?? "",
        full_name:
          (user.user_metadata as any)?.full_name ??
          (user.user_metadata as any)?.name ??
          null,
        avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
        bio: null,
      }

      const { data: upserted, error: upsertError } = await (supabase
        .from("profiles") as any)
        .upsert(bootstrap, { onConflict: "id" })
        .select("*")
        .single()

      if (!upsertError && upserted) {
        return noStoreJson(upserted)
      }
    }

    return noStoreJson({ error: error.message }, { status: 500 })
  }

  return noStoreJson(data)
}

// PUT /api/user/profile — update display name, bio
export async function PUT(request: NextRequest) {
  const tooMany = await apiIpLimitOr429(request)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return noStoreJson({ error: "Unauthorized" }, { status: 401 })
  }

  const { full_name, bio, avatar_url } = await request.json()

  const updateData: Record<string, any> = {}
  if (full_name !== undefined) updateData.full_name = full_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url

  const { data, error } = await (supabase
    .from("profiles") as any)
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return noStoreJson({ error: error.message }, { status: 500 })
  }

  return noStoreJson(data)
}
