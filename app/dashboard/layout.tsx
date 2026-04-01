import { redirect } from "next/navigation"
import { DashboardAdminProvider } from "@/components/dashboard-admin-context"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const showAdminLink = !!(user.email && isAdminEmail(user.email))

  return (
    <DashboardAdminProvider showAdminLink={showAdminLink}>{children}</DashboardAdminProvider>
  )
}
