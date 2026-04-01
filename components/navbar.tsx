"use client"

import { motion, AnimatePresence, useScroll, useMotionValueEvent, useMotionValue, useTransform } from "framer-motion"
import { Film, Menu, X, Sparkles, Pen, LayoutDashboard, FolderOpen, CreditCard } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStatus } from "@/hooks/useAuthStatus"
import { createClient } from "@/lib/supabase/client"

// Type definitions for nav links
type NavLink = {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  highlight?: boolean
}

// Nav links for unauthenticated visitors (conversion-focused)
const guestNavLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/editor", label: "Try Editor", highlight: true }, // Free to try
]

// Nav links for authenticated users (usage-focused)
const authNavLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/editor", label: "Editor", icon: Pen, highlight: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
]

// Magnetic link component
function MagneticLink({ 
  href, 
  children, 
  active,
  highlight = false,
}: { 
  href: string; 
  children: React.ReactNode; 
  active: boolean;
  highlight?: boolean;
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.2)
    y.set((e.clientY - centerY) * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  if (highlight) {
    return (
      <motion.div style={{ x, y }}>
        <Link
          href={href}
          className={`relative text-sm font-semibold transition-colors group touch-target inline-flex items-center px-4 py-2 rounded-full bg-cinematic-orange/10 border border-cinematic-orange/30 text-cinematic-orange hover:bg-cinematic-orange/20 ${
            active ? "bg-cinematic-orange/20" : ""
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-current={active ? "page" : undefined}
        >
          <span className="relative z-10">{children}</span>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div style={{ x, y }}>
      <Link
        href={href}
        className={`relative text-sm font-medium transition-colors group touch-target inline-flex items-center ${
          active ? "text-white" : "text-muted-foreground hover:text-white"
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-current={active ? "page" : undefined}
      >
        <span className="relative z-10">{children}</span>
        
        {/* Active indicator */}
        {active && (
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-cinematic-orange rounded-full" aria-hidden="true" />
        )}
        
        {/* Hover underline */}
        {!active && (
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cinematic-orange to-cinematic-blue rounded-full group-hover:w-full transition-all duration-300" aria-hidden="true" />
        )}
      </Link>
    </motion.div>
  )
}

export function Navbar({
  initialIsAuthenticated,
}: {
  initialIsAuthenticated?: boolean
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuthStatus(initialIsAuthenticated)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20)
  })

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navLinks = isAuthenticated ? authNavLinks : guestNavLinks

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    if (href.startsWith("/#")) return pathname === "/"
    if (href === "/editor") return pathname === "/editor"
    return pathname.startsWith(href)
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/30"
            : "bg-transparent"
        }`}
      >
        {/* Film strip decoration top */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <motion.div 
            className="h-full w-[200%] bg-gradient-to-r from-transparent via-cinematic-orange/50 to-transparent"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────────── */}
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group shrink-0">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-cinematic-orange to-cinematic-orange/70 flex items-center justify-center overflow-hidden"
              >
                {/* Animated film perforations */}
                <div className="absolute inset-0 flex flex-col justify-between py-0.5 px-0.5 opacity-30">
                  <div className="flex justify-between">
                    <div className="w-1 h-1 bg-black rounded-full" />
                    <div className="w-1 h-1 bg-black rounded-full" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-1 h-1 bg-black rounded-full" />
                    <div className="w-1 h-1 bg-black rounded-full" />
                  </div>
                </div>
                <Film className="w-5 h-5 text-black relative z-10" aria-hidden="true" />
                {/* Glow effect on scroll */}
                <motion.div
                  className="absolute inset-0 rounded-lg bg-cinematic-orange"
                  animate={scrolled ? { 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.3, 1]
                  } : { 
                    opacity: 0, 
                    scale: 1 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <motion.span 
                className="text-lg font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent"
                whileHover={{ x: 2 }}
              >
                Writers Block
              </motion.span>
            </Link>

            {/* ── Desktop Navigation ───────────────────────── */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <MagneticLink 
                  key={link.href} 
                  href={link.href} 
                  active={isActive(link.href)}
                  highlight={link.highlight}
                >
                  {link.label}
                </MagneticLink>
              ))}
            </nav>

            {/* ── Desktop CTA ──────────────────────────────── */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {loading ? (
                <div className="flex items-center gap-3" aria-hidden="true">
                  <div className="h-8 w-16 bg-white/10 rounded-md animate-pulse" />
                  <div className="h-8 w-32 bg-gradient-to-r from-white/10 to-white/5 rounded-md animate-pulse" />
                </div>
              ) : isAuthenticated ? (
                <>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-white hover:bg-white/5 touch-target gap-2"
                      onClick={() => router.push("/dashboard/subscription")}
                    >
                      <CreditCard className="w-4 h-4" />
                      Plan
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-white hover:bg-white/5 touch-target"
                      onClick={handleSignOut}
                      aria-label="Sign out of your account"
                    >
                      Sign Out
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-white hover:bg-white/5 touch-target"
                      onClick={() => router.push("/signin")}
                      aria-label="Sign in to your account"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    {/* Button glow */}
                    <div className="absolute inset-0 bg-cinematic-orange/50 blur-xl rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10" />
                    <Button
                      size="sm"
                      className="bg-cinematic-orange text-black font-semibold hover:bg-cinematic-orange/90 shadow-lg shadow-cinematic-orange/20 relative overflow-hidden group"
                      onClick={() => router.push("/signup")}
                    >
                      <motion.span
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      </motion.span>
                      Get Started Free
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                        animate={{ x: ["-200%", "200%"] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    </Button>
                  </motion.div>
                </>
              )}
            </div>

            {/* ── Mobile Toggle ────────────────────────────── */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/5 transition-colors relative touch-target min-h-[44px] min-w-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* ── Mobile Menu ──────────────────────────────────── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                id="mobile-menu"
                key="mobile-menu"
                initial={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                exit={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain border-t border-white/10"
              >
                <nav className="flex flex-col gap-1 py-4" aria-label="Mobile navigation">
                  {navLinks.map((link, index) => {
                    const active = isActive(link.href)
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          className={`flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                            active
                              ? "text-white bg-gradient-to-r from-cinematic-orange/20 to-transparent border-l-2 border-cinematic-orange"
                              : link.highlight
                              ? "text-cinematic-orange bg-cinematic-orange/10 border-l-2 border-cinematic-orange"
                              : "text-muted-foreground hover:text-white hover:bg-white/5"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.icon && <link.icon className="w-4 h-4" />}
                          {active && (
                            <motion.span
                              layoutId="activeIndicator"
                              className="w-1.5 h-1.5 rounded-full bg-cinematic-orange"
                            />
                          )}
                          {link.label}
                        </Link>
                      </motion.div>
                    )
                  })}

                  {/* Mobile Auth */}
                  <motion.div 
                    className="flex flex-col gap-2 mt-3 pt-3 px-2 border-t border-white/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {loading ? (
                      <div className="flex flex-col gap-2">
                        <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
                        <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
                      </div>
                    ) : isAuthenticated ? (
                      <>
                        <Button
                          variant="ghost"
                          className="justify-start text-muted-foreground hover:text-white gap-2"
                          onClick={() => { setMobileMenuOpen(false); router.push("/dashboard/subscription") }}
                        >
                          <CreditCard className="w-4 h-4" />
                          Subscription
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-muted-foreground hover:text-white"
                          onClick={() => { setMobileMenuOpen(false); handleSignOut() }}
                        >
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="justify-start text-muted-foreground hover:text-white"
                          onClick={() => { setMobileMenuOpen(false); router.push("/signin") }}
                        >
                          Sign In
                        </Button>
                        <Button
                          className="bg-cinematic-orange text-black font-semibold hover:bg-cinematic-orange/90"
                          onClick={() => { setMobileMenuOpen(false); router.push("/signup") }}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Get Started Free
                        </Button>
                      </>
                    )}
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  )
}
