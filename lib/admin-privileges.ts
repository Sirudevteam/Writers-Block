import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

export function createServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient<Database>(url, key)
}

/**
 * Master Admin routes and /dashboard/admin: allowed only when `public.master_admin_users`
 * contains this auth user id (checked with service role). Not derived from `profiles`.
 * See docs/admin-operators.md.
 */
export async function userHasAdminPrivileges(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false
  const admin = createServiceRoleSupabase()
  if (!admin) return false
  const { data, error } = await admin
    .from("master_admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}
