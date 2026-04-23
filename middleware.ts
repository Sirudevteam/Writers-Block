import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSafeNextPath } from "@/lib/auth/next-path"
import { userHasAdminPrivileges } from "@/lib/admin-privileges"
import {
  isMasterAdminPath,
  isRequestHostAllowedForMasterAdmin,
} from "@/lib/admin-host"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST be called before checking user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl
  const hostHeader = request.headers.get("host")

  // Master Admin: host allowlist + auth + master_admin_users row (fail closed if host not allowed)
  if (isMasterAdminPath(pathname)) {
    if (!isRequestHostAllowedForMasterAdmin(hostHeader)) {
      return new NextResponse(null, { status: 404 })
    }
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      const signInUrl = new URL("/signin", request.url)
      signInUrl.searchParams.set("next", getSafeNextPath(`${pathname}${search}`))
      return NextResponse.redirect(signInUrl)
    }
    const allowed = await userHasAdminPrivileges(user.id)
    if (!allowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // In-app admin dashboard: hide route from all non-admin users (404, not a soft redirect to /dashboard)
  if (pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/")) {
    if (user && !(await userHasAdminPrivileges(user.id))) {
      return new NextResponse(null, { status: 404 })
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/editor"))) {
    const signInUrl = new URL("/signin", request.url)
    signInUrl.searchParams.set("next", getSafeNextPath(`${pathname}${search}`))
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages (honor safe ?next= like post-sign-in flow)
  if (user && (pathname === "/signin" || pathname === "/signup")) {
    const destination = getSafeNextPath(request.nextUrl.searchParams.get("next"))
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/",
    "/editor",
    "/dashboard/:path*",
    "/editor/:path*",
    "/signin",
    "/signup",
    "/master-admin",
    "/master-admin/:path*",
    "/api/master-admin",
    "/api/master-admin/:path*",
  ],
}
