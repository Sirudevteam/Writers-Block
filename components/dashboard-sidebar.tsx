"use client"

import { useState } from "react"
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
  Shield,
} from "lucide-react"
import { useDashboardAdminLink } from "@/components/dashboard-admin-context"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

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
  const showAdminLink = useDashboardAdminLink()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/signin")
    router.refresh()
  }

  return (
    <>
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
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 max-w-[min(100vw-2rem,16rem)] bg-[#0a0a0a]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col
          transform transition-transform duration-300 lg:transform-none
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-cinematic-orange/5 via-transparent to-cinematic-blue/5 pointer-events-none" />

        {/* Logo */}
        <div className="p-6 border-b border-white/10 relative">
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
        <nav className="flex-1 p-4 space-y-1 relative">
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
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-8 bg-cinematic-orange rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
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
          {showAdminLink && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: navItems.length * 0.1 }}
            >
              <Link
                href="/dashboard/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${pathname === "/dashboard/admin"
                    ? "bg-cinematic-orange/10 text-cinematic-orange border border-cinematic-orange/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {pathname === "/dashboard/admin" && (
                  <div className="absolute left-0 w-1 h-8 bg-cinematic-orange rounded-r-full" />
                )}
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </Link>
            </motion.div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10 relative">
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
    </>
  )
}
