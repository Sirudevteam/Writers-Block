import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const noStore = { "Cache-Control": "no-store, max-age=0" as const }

// GET /api/projects/[id]
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore })
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404, headers: noStore })
  }

  return NextResponse.json(data, { headers: noStore })
}

// PUT /api/projects/[id] — update a project
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore })
  }

  const body = await request.json()
  const { title, description, genre, characters, location, mood, content, status } = body

  // Build update object with only defined fields
  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (genre !== undefined) updateData.genre = genre
  if (characters !== undefined) updateData.characters = characters
  if (location !== undefined) updateData.location = location
  if (mood !== undefined) updateData.mood = mood
  if (content !== undefined) updateData.content = content
  if (status !== undefined) updateData.status = status
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await (supabase
    .from("projects") as any)
    .update(updateData)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore })
  }

  return NextResponse.json(data, { headers: noStore })
}

// DELETE /api/projects/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore })
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore })
  }

  return NextResponse.json({ success: true }, { headers: noStore })
}
