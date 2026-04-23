import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { getServerAuthUser } from "@/lib/supabase/server-auth"

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getServerAuthUser()
  if (!auth) {
    redirect("/signin?next=/editor")
  }

  return (
    <>
      <Navbar initialIsAuthenticated />
      {children}
    </>
  )
}
