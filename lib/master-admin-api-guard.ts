import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { userHasAdminPrivileges } from "@/lib/admin-privileges"
import { isRequestHostAllowedForMasterAdmin } from "@/lib/admin-host"

export async function guardMasterAdminApi(req: NextRequest): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  if (!isRequestHostAllowedForMasterAdmin(req.headers.get("host"))) {
    return { ok: false, response: NextResponse.json({ error: "Not Found" }, { status: 404 }) }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (!(await userHasAdminPrivileges(user.id))) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true }
}
