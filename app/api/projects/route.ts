import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getEffectiveProjectsLimit } from "@/lib/subscription"
import { PROJECT_LIST_COLUMNS } from "@/lib/project-list-select"

export const dynamic = "force-dynamic"

// GET /api/projects — list all projects for the authenticated user
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_LIST_COLUMNS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add cache headers for browser and CDN caching
  return NextResponse.json(data, {
    headers: {
      // Cache for 30 seconds client-side, stale-while-revalidate for 60s
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      // Tag for cache invalidation
      "CDN-Cache-Control": "private, max-age=60",
      // Vary header to ensure proper caching per user
      "Vary": "Authorization",
    },
  })
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [{ data: subscription }, { count: projectCount }] = await Promise.all([
    (supabase.from("subscriptions") as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  const limit = getEffectiveProjectsLimit(subscription)
  if ((projectCount ?? 0) >= limit) {
    return NextResponse.json(
      { error: "Project limit reached. Please upgrade your plan." },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { title, description, genre, characters, location, mood, content, status } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const { data, error } = await (supabase
    .from("projects") as any)
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description ?? null,
      genre: genre ?? "drama",
      characters: characters ?? null,
      location: location ?? null,
      mood: mood ?? null,
      content: content ?? null,
      status: status ?? "draft",
    })
    .select(PROJECT_LIST_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // No caching for mutations
  return NextResponse.json(data, { 
    status: 201,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
