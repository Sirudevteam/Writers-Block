import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { userHasAdminPrivileges } from "@/lib/admin-privileges"

/**
 * Server-only guard for Master Admin pages. Middleware already enforces host + session;
 * this re-checks `master_admin_users` before any sensitive UI.
 */
export async function requireMasterAdminSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id || !(await userHasAdminPrivileges(user.id))) {
    redirect("/dashboard")
  }

  return { user, supabase }
}
