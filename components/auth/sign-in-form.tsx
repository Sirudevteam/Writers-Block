"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { signInAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorMessage } from "@/components/ui/error-message"

interface SignInFormProps {
  nextPath: string
  initialError?: string | null
}

export function SignInForm({ nextPath, initialError = null }: SignInFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await signInAction(undefined, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.success) {
        router.push(nextPath)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cinematic-orange/15 to-cinematic-blue/10">
          <span className="font-display text-xl font-bold text-cinematic-orange">WB</span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">Welcome back</h2>
        <p className="mt-2 text-sm text-white/50">Sign in with your email. Sessions stay in secure HTTP-only cookies.</p>
      </div>

      {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" /> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-white/90">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@studio.com"
            disabled={loading}
            className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 focus-visible:border-cinematic-orange/40 focus-visible:ring-cinematic-orange/20"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium text-white/90">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-cinematic-orange hover:text-cinematic-orange/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-orange/50 rounded"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={72}
              placeholder="••••••••"
              disabled={loading}
              className="h-12 rounded-xl border-white/10 bg-white/[0.04] pr-12 text-white placeholder:text-white/35 focus-visible:border-cinematic-orange/40 focus-visible:ring-cinematic-orange/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-orange/50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="group relative h-12 w-full overflow-hidden rounded-xl bg-cinematic-orange font-semibold text-black hover:bg-cinematic-orange/90 disabled:opacity-60"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2">
            {loading ? (
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black"
                aria-hidden
              />
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </span>
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-white/50">
        New here?{" "}
        <Link
          href={nextPath === "/dashboard" ? "/signup" : `/signup?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-cinematic-orange hover:text-cinematic-orange/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-orange/50 rounded"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}
