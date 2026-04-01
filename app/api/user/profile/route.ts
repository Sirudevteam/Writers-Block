import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/user/profile
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  })
}

// PUT /api/user/profile — update display name, bio
export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } }
    )
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
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  })
}
