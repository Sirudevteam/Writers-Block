"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface AuthStatus {
  isAuthenticated: boolean
  loading: boolean
}

export function useAuthStatus(
  initialIsAuthenticated?: boolean
): AuthStatus {
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialIsAuthenticated ?? false
  )
  const [loading, setLoading] = useState(initialIsAuthenticated === undefined)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) return

      setIsAuthenticated(Boolean(user))
      setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!isMounted) return

      setIsAuthenticated(Boolean(session?.user))
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { isAuthenticated, loading }
}
