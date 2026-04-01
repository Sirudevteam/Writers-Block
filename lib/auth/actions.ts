"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import type { AuthActionState } from "@/lib/auth/auth-action-state"
import { maskEmail } from "@/lib/auth/mask-email"
import { getSafeNextPath } from "@/lib/auth/next-path"
import { isAuthRequestOriginAllowed } from "@/lib/auth/origin-guard"
import { mapSupabaseAuthError } from "@/lib/auth/safe-errors"
import {
  validateDisplayName,
  validateEmail,
  validatePasswordSignIn,
  validatePasswordSignUp,
} from "@/lib/auth/validation"

export type { AuthActionState } from "@/lib/auth/auth-action-state"

function appOriginFromHeaders(): string {
  const h = headers()
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim()
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export async function signInAction(
  _prev: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthRequestOriginAllowed()) {
    return { error: "Request could not be verified. Refresh the page and try again." }
  }

  const email = validateEmail(formData.get("email"))
  const password = validatePasswordSignIn(formData.get("password"))
  if (!email) return { error: "Enter a valid email address." }
  if (!password) return { error: "Enter a valid password." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: mapSupabaseAuthError(error.message) }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function signUpAction(
  _prev: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthRequestOriginAllowed()) {
    return { error: "Request could not be verified. Refresh the page and try again." }
  }

  const agreed = formData.get("terms")
  if (agreed !== "on") {
    return { error: "Please accept the Terms of Service and Privacy Policy to continue." }
  }

  const name = validateDisplayName(formData.get("name"))
  const email = validateEmail(formData.get("email"))
  const password = validatePasswordSignUp(formData.get("password"))
  const next = getSafeNextPath(
    typeof formData.get("next") === "string" ? (formData.get("next") as string) : null
  )
  if (!name) {
    return {
      error: "Enter a display name (1–100 characters). Angle brackets are not allowed.",
    }
  }
  if (!email) return { error: "Enter a valid email address." }
  if (!password) {
    return {
      error: "Password must be 8–72 characters and include at least one uppercase letter and one number.",
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${appOriginFromHeaders()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) {
    return { error: mapSupabaseAuthError(error.message) }
  }

  if (data.session) {
    revalidatePath("/", "layout")
    return { success: true }
  }

  return { success: true, maskedEmail: maskEmail(email) }
}
