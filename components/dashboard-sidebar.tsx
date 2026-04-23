"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  Settings,
  Menu,
  X,
  Film,
  LogOut,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/auth/actions"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderOpen },
  { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOutAction()
    router.push("/signin")
    router.refresh()
  }

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileMenuOpen])

  return (
    <div className="relative z-40 w-0 shrink-0 self-stretch lg:w-64">
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#0f0f0f]/90 p-2.5 backdrop-blur-xl lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-controls="dashboard-sidebar-nav"
        aria-label="Toggle sidebar"
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
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        id="dashboard-sidebar-nav"
        role="navigation"
        aria-label="Dashboard"
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 z-40 flex min-h-0 w-full max-w-[min(100vw,20rem)] flex-col border-r border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl
          transform transition-transform duration-300 ease-out
          lg:relative lg:inset-auto lg:z-0 lg:min-h-screen lg:w-full lg:max-w-none lg:translate-x-0 lg:transform-none
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cinematic-orange/5 via-transparent to-cinematic-blue/5 pointer-events-none" />

        {/* Logo */}
        <div className="relative border-b border-white/10 p-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:p-6 sm:pt-6">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cinematic-orange to-cinematic-orange/70 flex items-center justify-center relative overflow-hidden"
            >
              <Film className="w-5 h-5 text-black relative z-10" />
              <div className="absolute inset-0 bg-cinematic-orange/50 blur-lg" />
            </motion.div>
            <div>
              <span className="font-bold text-white text-lg">Writers Block</span>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cinematic-orange" />
                Dashboard
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? "bg-cinematic-orange/10 text-cinematic-orange border border-cinematic-orange/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 h-8 w-1 rounded-r-full bg-cinematic-orange" aria-hidden />
                  )}
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-cinematic-orange" : "group-hover:text-white"}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 bg-cinematic-orange/5 rounded-xl -z-10"
                    />
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="relative border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {signingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </motion.aside>
    </div>
  )
}
