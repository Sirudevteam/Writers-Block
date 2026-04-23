import { redirect } from "next/navigation"
import { getServerAuthUser } from "@/lib/supabase/server-auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getServerAuthUser()

  if (!auth) {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen overflow-x-hidden bg-[#0a0a0a]">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
