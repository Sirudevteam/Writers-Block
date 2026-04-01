import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { getSafeNextPath } from "@/lib/auth/next-path"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Writers Block account — email verification and secure sessions.",
}

type SignUpPageProps = {
  searchParams?: {
    next?: string
  }
}

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  const nextPath = getSafeNextPath(searchParams?.next)

  return (
    <AuthShell mode="signup">
      <SignUpForm nextPath={nextPath} />
    </AuthShell>
  )
}
