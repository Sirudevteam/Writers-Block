import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/components/auth/sign-in-form"
import { getSafeNextPath } from "@/lib/auth/next-path"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Writers Block — secure email and password authentication.",
}

type SignInPageProps = {
  searchParams?: {
    next?: string
    error?: string
  }
}

function getInitialSignInError(rawError: string | undefined): string | null {
  if (rawError === "auth_callback_failed") {
    return "We could not complete sign-in from the email link. Please try again."
  }

  return null
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const nextPath = getSafeNextPath(searchParams?.next)
  const initialError = getInitialSignInError(searchParams?.error)

  return (
    <AuthShell mode="signin">
      <SignInForm nextPath={nextPath} initialError={initialError} />
    </AuthShell>
  )
}
