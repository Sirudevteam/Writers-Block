"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { PROFILE_UPDATED_EVENT } from "@/lib/profile-events"
import type { Profile, Subscription } from "@/types/database"

export interface UserState {
  user: User | null
  profile: Profile | null
  subscription: Subscription | null
  loading: boolean
  /** Refetch profile + subscription for the signed-in user (e.g. after settings save). */
  refetch: () => Promise<void>
}

export function useUser(): UserState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    setUser(currentUser)
    if (!currentUser) {
      setProfile(null)
      setSubscription(null)
      return
    }
    const [{ data: profileData }, { data: subscriptionData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", currentUser.id).single(),
      supabase.from("subscriptions").select("*").eq("user_id", currentUser.id).maybeSingle(),
    ])
    setProfile(profileData)
    setSubscription(subscriptionData)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function loadUser(userId: string) {
      const [{ data: profileData }, { data: subscriptionData }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
        ])
      setProfile(profileData)
      setSubscription(subscriptionData)
    }

    async function init() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      setUser(currentUser)
      if (currentUser) await loadUser(currentUser.id)
      setLoading(false)
    }

    void init()

    const onProfileUpdated = () => {
      void (async () => {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        if (currentUser) await loadUser(currentUser.id)
      })()
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated)

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        await loadUser(sessionUser.id)
      } else {
        setProfile(null)
        setSubscription(null)
      }
    })

    return () => {
      authListener.unsubscribe()
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated)
    }
  }, [])

  return { user, profile, subscription, loading, refetch }
}
