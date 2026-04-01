import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

/**
 * Browser Supabase client: PKCE + cookie-backed session (via @supabase/ssr), not manual localStorage tokens.
 * Email/password sign-in is performed in server actions so the session is issued with server Set-Cookie semantics.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
