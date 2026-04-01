"use client"

import { Film, ArrowUp, Heart, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const SIRU_AI_LABS_URL = "https://www.siruailabs.com/"

const footerLinks = {
  product: [
    { href: "/#features", label: "Features" },
    { href: "/editor", label: "AI Scene Generator" },
    { href: "/editor", label: "Dialogue Improver" },
    { href: "/#pricing", label: "Pricing" },
  ],
  company: [
    { href: "#", label: "About Us" },
    { href: "#", label: "Blog" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Contact" },
  ],
  support: [
    { href: "#", label: "Help Center" },
    { href: "#", label: "Documentation" },
    { href: "#", label: "Community" },
    { href: "#", label: "Status" },
  ],
  legal: [
    { href: "#", label: "Cookie Policy" },
    { href: "#", label: "Refund Policy" },
  ],
}

const socialLinks = [
  {
    href: "https://twitter.com", label: "Twitter",
    svg: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  },
  {
    href: "https://github.com", label: "GitHub",
    svg: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
  },
  {
    href: "https://linkedin.com", label: "LinkedIn",
    svg: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  },
  {
    href: "https://instagram.com", label: "Instagram",
    svg: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  },
]

function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setIsSubscribed(true)
    setEmail("")
  }

  return (
    <div className="bg-white/[0.03] rounded-xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-cinematic-orange/15 flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-cinematic-orange" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Stay Updated</p>
          <p className="text-xs text-muted-foreground">Weekly tips & insights</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        AI writing tips, new features, and Tamil cinema storytelling insights — straight to your inbox.
      </p>

      {isSubscribed ? (
        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 rounded-lg p-3">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>Thanks for subscribing!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex flex-col gap-2 xs:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="writer@example.com"
              className="min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white placeholder:text-muted-foreground transition-colors focus:border-cinematic-orange/50 focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm"
              required
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 shrink-0 rounded-lg bg-cinematic-orange px-4 font-semibold text-black hover:bg-cinematic-orange/90 disabled:opacity-50 xs:h-auto xs:min-h-[44px]"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                "Join"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Join 2,000+ screenwriters. No spam.</p>
        </form>
      )}
    </div>
  )
}

export function HomeFooter() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  const siruLinkClass =
    "text-cinematic-orange hover:text-cinematic-orange/90 underline-offset-2 hover:underline font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cinematic-orange/50 focus-visible:rounded-sm"

  return (
    <footer role="contentinfo" className="bg-[#0a0a0a] border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">

        {/* Brand + nav + newsletter: aligned row on xl, stacked below */}
        <div className="flex flex-col gap-12 xl:flex-row xl:items-start xl:justify-between xl:gap-10">

          {/* Brand */}
          <div className="shrink-0 space-y-5 xl:w-[min(100%,17.5rem)]">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cinematic-orange to-cinematic-orange/70 transition-opacity hover:opacity-90">
                <Film className="h-5 w-5 text-black" />
              </Link>
              <div className="min-w-0">
                <Link href="/" className="block text-lg font-bold leading-tight text-white transition-colors hover:text-white/90">
                  Writers Block
                </Link>
                <a
                  href={SIRU_AI_LABS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs ${siruLinkClass}`}
                >
                  by Siru AI Labs
                </a>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              AI-powered screenplay writing for Tamil & English cinema. From first idea to professionally formatted script in minutes.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:border-cinematic-orange/40 hover:bg-cinematic-orange/10 hover:text-white"
                >
                  {social.svg}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-cinematic-orange" aria-hidden />
              <span>Chennai, India</span>
            </div>
          </div>

          {/* Four equal link columns */}
          <div className="min-w-0 flex-1 xl:px-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
              {(["product", "company", "support", "legal"] as const).map((section) => (
                <div key={section} className="min-w-0">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </h3>
                  <nav aria-label={`${section} links`} className="flex flex-col gap-2.5">
                    {footerLinks[section].map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="shrink-0 xl:w-[min(100%,20rem)] xl:max-w-xs">
            <NewsletterSignup />
          </div>
        </div>

        {/* Stats: equal columns, consistent rhythm */}
        <div className="mt-14 border-t border-white/[0.08] pt-10">
          <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:max-w-none md:grid-cols-4 md:gap-6 lg:gap-8">
            {[
              { value: "5,000+", label: "Screenplays Created" },
              { value: "50+", label: "Tamil Films" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "AI Available" },
            ].map((stat) => (
              <li key={stat.label} className="text-center md:border-l md:border-white/[0.06] md:pl-6 md:first:border-l-0 md:first:pl-0 lg:pl-8 lg:first:pl-0">
                <div className="text-2xl font-bold tabular-nums text-white">{stat.value}</div>
                <div className="mt-1.5 text-xs text-muted-foreground">{stat.label}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="text-center text-sm leading-relaxed text-muted-foreground sm:text-left text-balance">
            <span className="inline sm:block sm:inline">
              © {new Date().getFullYear()} Writers Block by{" "}
              <a
                href={SIRU_AI_LABS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={siruLinkClass}
              >
                Siru AI Labs
              </a>
            </span>
            <span className="mx-1.5 hidden text-white/25 sm:inline" aria-hidden>
              ·
            </span>
            <span className="mt-1 block sm:mt-0 sm:inline">
              Made with{" "}
              <Heart className="mx-0.5 inline h-3 w-3 fill-red-500 text-red-500 align-middle" aria-hidden />{" "}
              in India for Tamil &amp; English cinema
            </span>
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="mx-auto flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-white/20 hover:text-white sm:mx-0"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  )
}
