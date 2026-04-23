import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

/**
 * Reads the current session from cookies (refreshed in middleware).
 * Prefer this in Server Components and Route Handlers where middleware already
 * ran, to avoid an extra `getUser()` round-trip to the Auth service per request.
 * Do not use for security-critical decisions that require server-side revalidation
 * of every token — use {@link getServerAuthUser} instead.
 */
export async function getServerSessionUser(): Promise<{
  user: User
  supabase: ServerSupabase
} | null> {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error || !session?.user) {
    return null
  }
  return { user: session.user, supabase }
}

/**
 * Revalidates the JWT with Supabase Auth (`getUser()`). Use for protected shells
 * (e.g. dashboard layout) where policy requires a fresh server-side auth check.
 */
export async function getServerAuthUser(): Promise<{
  user: User
  supabase: ServerSupabase
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
  return { user, supabase }
}
