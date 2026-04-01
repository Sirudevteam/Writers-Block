"use client"

import { motion } from "framer-motion"
import { Crown, Zap, Sparkles, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Subscription } from "@/types/project"
import { PLAN_NAMES } from "@/types/project"

interface SubscriptionPanelProps {
  subscription: Subscription
  onUpgrade?: () => void
}

export function SubscriptionPanel({ subscription, onUpgrade }: SubscriptionPanelProps) {
  const { plan, projectsUsed, projectsLimit } = subscription
  const isOverCapacity = projectsLimit > 0 && projectsUsed > projectsLimit
  const usagePct = projectsLimit > 0 ? (projectsUsed / projectsLimit) * 100 : 100
  const barPct = Math.min(usagePct, 100)
  const isNearLimit = !isOverCapacity && usagePct >= 80
  const isAtLimit = projectsUsed >= projectsLimit

  const getPlanIcon = () => {
    switch (plan) {
      case "premium":
        return <Crown className="w-6 h-6 text-yellow-400" />
      case "pro":
        return <Zap className="w-6 h-6 text-cinematic-blue" />
      default:
        return <Sparkles className="w-6 h-6 text-cinematic-orange" />
    }
  }

  const getPlanColor = () => {
    switch (plan) {
      case "premium":
        return "from-yellow-500/20 via-orange-500/10 to-transparent border-yellow-500/30"
      case "pro":
        return "from-cinematic-blue/20 via-blue-500/10 to-transparent border-cinematic-blue/30"
      default:
        return "from-cinematic-orange/20 via-cinematic-orange/10 to-transparent border-cinematic-orange/30"
    }
  }

  const getProgressColor = () => {
    if (isOverCapacity || isAtLimit) return "bg-red-500"
    if (isNearLimit) return "bg-yellow-500"
    return "bg-gradient-to-r from-cinematic-orange to-cinematic-blue"
  }

  return (
    <div className={`relative min-w-0 overflow-hidden rounded-2xl border bg-gradient-to-br ${getPlanColor()}`}>
      <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-white/5 blur-3xl sm:h-32 sm:w-32 -translate-y-1/2 translate-x-1/2" />

      <div className="relative p-4 sm:p-6">
        {/* Plan Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-12 sm:w-12">
              {getPlanIcon()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Current plan
              </p>
              <h3 className="truncate text-lg font-bold text-white sm:text-xl">
                {PLAN_NAMES[plan]}
              </h3>
            </div>
          </div>

          {plan !== "premium" && onUpgrade && (
            <Button
              size="sm"
              className="h-11 min-h-[44px] w-full shrink-0 rounded-xl bg-cinematic-orange text-black hover:bg-cinematic-orange/90 sm:h-9 sm:min-h-0 sm:w-auto"
              onClick={onUpgrade}
            >
              <span className="relative z-10 flex items-center">
                Upgrade
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          )}
        </div>

        {/* Usage Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Projects Used</span>
            <span
              className={`font-bold text-lg ${isNearLimit || isAtLimit || isOverCapacity ? "text-red-400" : "text-white"}`}
            >
              {projectsUsed} / {projectsLimit}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 rounded-full transition-colors duration-300 ${getProgressColor()}`}
              />
            </div>
            {/* Progress glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: barPct > 0 ? 1 : 0 }}
              className="absolute top-0 h-2.5 rounded-full blur-sm"
              style={{
                width: `${barPct}%`,
                background:
                  isOverCapacity || isAtLimit || isNearLimit
                    ? undefined
                    : "linear-gradient(90deg, #ff6b35, #00d4ff)",
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {isOverCapacity ? (
              <span className="text-red-400">
                You have {projectsUsed} projects but your current plan allows {projectsLimit}. Delete projects to
                create new ones, or upgrade when your plan renews.
              </span>
            ) : isAtLimit ? (
              <span className="text-red-400">No projects remaining</span>
            ) : (
              <>
                <span className="text-white font-medium">{projectsLimit - projectsUsed}</span> projects remaining
              </>
            )}
          </p>
        </div>

        {/* Limit Warning */}
        {(isOverCapacity || isAtLimit) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">
                {isOverCapacity ? "Over project limit for current plan" : "Project Limit Reached"}
              </p>
              <p className="text-xs text-red-400/80 mt-1">
                {isOverCapacity
                  ? "Your plan was downgraded but existing projects were kept. Remove projects to free slots, or upgrade to add more."
                  : "You have reached your project limit. Upgrade your plan to create more projects."}
              </p>
            </div>
          </motion.div>
        )}

        {isNearLimit && !isAtLimit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-400">
              You&apos;re nearing your project limit. Consider upgrading soon.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
