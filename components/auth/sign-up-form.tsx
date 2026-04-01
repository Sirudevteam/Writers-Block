"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle, Eye, EyeOff, Mail } from "lucide-react"
import { useState } from "react"
import { signUpAction } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorMessage } from "@/components/ui/error-message"

interface SignUpFormProps {
  nextPath: string
}

export function SignUpForm({ nextPath }: SignUpFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passwordOk = Object.values(rules).every(Boolean)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await signUpAction(undefined, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.success) {
        if (result.maskedEmail) {
          setMaskedEmail(result.maskedEmail)
        } else {
          router.push(nextPath)
          router.refresh()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (maskedEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cinematic-orange/20 to-cinematic-blue/10">
          <Mail className="h-8 w-8 text-cinematic-orange" aria-hidden />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Check your inbox</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          We sent a confirmation link to{" "}
          <span className="font-medium text-white/90">{maskedEmail}</span>. Open it on this device to activate your
          account.
        </p>
        <Button asChild className="mt-8 h-12 rounded-xl bg-cinematic-orange px-8 font-semibold text-black hover:bg-cinematic-orange/90">
          <Link href={nextPath === "/dashboard" ? "/signin" : `/signin?next=${encodeURIComponent(nextPath)}`}>
            Back to sign in
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cinematic-orange/15 to-cinematic-blue/10">
          <span className="text-lg text-cinematic-orange" aria-hidden>
            ✦
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">Create your account</h2>
        <p className="mt-2 text-sm text-white/50">Email and password only. No social logins — fewer vectors, clearer trust.</p>
      </div>

      {error ? <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" /> : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-white/90">
            Display name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Your name"
            disabled={loading}
            className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 focus-visible:border-cinematic-orange/40 focus-visible:ring-cinematic-orange/20"
          />
        </div>

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
          <label htmlFor="password" className="text-sm font-medium text-white/90">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters, 1 uppercase, 1 number"
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
          {password ? (
            <ul className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
              {(
                [
                  ["length", "At least 8 characters"],
                  ["uppercase", "One uppercase letter"],
                  ["number", "One number"],
                ] as const
              ).map(([key, label]) => (
                <li key={key} className="flex items-center gap-2">
                  <CheckCircle
                    className={`h-3.5 w-3.5 flex-shrink-0 ${rules[key] ? "text-emerald-400" : "text-white/25"}`}
                    aria-hidden
                  />
                  <span className={rules[key] ? "text-emerald-400/90" : "text-white/40"}>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={loading}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.05] text-cinematic-orange focus-visible:ring-2 focus-visible:ring-cinematic-orange/50"
          />
          <label htmlFor="terms" className="text-left text-xs leading-relaxed text-white/55">
            I agree to the Terms of Service and Privacy Policy.
          </label>
        </div>

        <Button
          type="submit"
          disabled={!agreed || !passwordOk || loading}
          className="group relative h-12 w-full overflow-hidden rounded-xl bg-cinematic-orange font-semibold text-black hover:bg-cinematic-orange/90 disabled:opacity-50"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2">
            {loading ? (
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black"
                aria-hidden
              />
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </span>
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link
          href={nextPath === "/dashboard" ? "/signin" : `/signin?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-cinematic-orange hover:text-cinematic-orange/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-orange/50 rounded"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
