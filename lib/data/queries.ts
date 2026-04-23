import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { PROJECT_LIST_COLUMNS } from "@/lib/project-list-select"

// Cache user data to prevent duplicate requests in the same render
export const getUserData = cache(async () => {
  const supabase = await createClient()
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()

  if (authError || !session?.user) {
    return null
  }
  const user = session.user
  
  // Fetch profile and subscription in parallel
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ])
  
  return { user, profile, subscription }
})

// Cache projects for a specific user
export const getProjects = cache(async (userId: string) => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_LIST_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
  
  if (error && process.env.NODE_ENV === "development") {
    console.error("Error fetching projects:", error)
  }
  
  return data ?? []
})

// Get a single project by ID
export const getProjectById = cache(async (userId: string, projectId: string) => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single()
  
  if (error) {
    return null
  }
  
  return data
})
