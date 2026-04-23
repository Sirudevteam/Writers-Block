import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiIpLimitOr429 } from "@/lib/api-ip-limit"
import {
  projectIdParamSchema,
  projectUpdateBodySchema,
} from "@/lib/api-schemas/project"
import { zodErrorJsonResponse } from "@/lib/api-schemas/zod-response"

const noStore = { "Cache-Control": "no-store, max-age=0" as const }

// GET /api/projects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tooMany = await apiIpLimitOr429(request)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore })
  }

  const idCheck = projectIdParamSchema.safeParse(params)
  if (!idCheck.success) {
    return zodErrorJsonResponse(idCheck.error, noStore)
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", idCheck.data.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404, headers: noStore })
  }

  return NextResponse.json(data, { headers: noStore })
}

// PUT /api/projects/[id] — update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tooMany = await apiIpLimitOr429(request)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore })
  }

  const idCheck = projectIdParamSchema.safeParse(params)
  if (!idCheck.success) {
    return zodErrorJsonResponse(idCheck.error, noStore)
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: noStore })
  }

  const parsed = projectUpdateBodySchema.safeParse(raw)
  if (!parsed.success) {
    return zodErrorJsonResponse(parsed.error, noStore)
  }

  const b = parsed.data
  const updateData: Record<string, unknown> = {}
  if (b.title !== undefined) updateData.title = b.title
  if (b.description !== undefined) updateData.description = b.description
  if (b.genre !== undefined) updateData.genre = b.genre
  if (b.characters !== undefined) updateData.characters = b.characters
  if (b.location !== undefined) updateData.location = b.location
  if (b.mood !== undefined) updateData.mood = b.mood
  if (b.content !== undefined) updateData.content = b.content
  if (b.status !== undefined) updateData.status = b.status
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await (supabase
    .from("projects") as any)
    .update(updateData)
    .eq("id", idCheck.data.id)
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tooMany = await apiIpLimitOr429(request)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore })
  }

  const idCheck = projectIdParamSchema.safeParse(params)
  if (!idCheck.success) {
    return zodErrorJsonResponse(idCheck.error, noStore)
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", idCheck.data.id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore })
  }

  return NextResponse.json({ success: true }, { headers: noStore })
}
