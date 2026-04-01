"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SubscriptionPanel } from "@/components/subscription-panel"
import { useUser } from "@/hooks/useUser"
import { useProjects } from "@/hooks/useProjects"
import { useRazorpay } from "@/hooks/useRazorpay"
import type { Subscription } from "@/types/project"
import { toUISubscription } from "@/lib/subscription"

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    icon: Sparkles,
    color: "from-gray-500/20 to-gray-600/20",
    borderColor: "border-gray-500/30",
    features: [
      "Up to 5 projects",
      "Basic AI story generation",
      "Standard support",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹1999",
    period: "per month",
    icon: Zap,
    color: "from-cinematic-blue/20 to-blue-500/20",
    borderColor: "border-cinematic-blue/30",
    features: [
      "Up to 25 projects",
      "Advanced AI generation",
      "Priority support",
      "Shot suggestions",
      "Export to PDF",
      "Reference scenes",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹4999",
    period: "per month",
    icon: Crown,
    color: "from-cinematic-orange/20 to-orange-500/20",
    borderColor: "border-cinematic-orange/30",
    features: [
      "Up to 100 projects",
      "Premium AI models",
      "24/7 Priority support",
      "All Pro features",
      "Custom AI training",
      "API access",
      "Team collaboration",
    ],
  },
]

export default function SubscriptionPage() {
  const { subscription: dbSub, loading: userLoading } = useUser()
  const { projects } = useProjects()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay({
    onSuccess: () => {
      setSuccessMessage("Payment successful! Your plan has been upgraded.")
      setPaymentError(null)
      // Reload to reflect new subscription
      window.location.reload()
    },
    onError: (err) => {
      setPaymentError(err)
    },
  })

  const subscription: Subscription = toUISubscription(dbSub, projects.length)

  const handleUpgrade = (planId: string) => {
    if (planId === "pro" || planId === "premium") {
      setPaymentError(null)
      initiatePayment(planId)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <DashboardSidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
          <div className="pl-14 lg:pl-6 pr-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Subscription</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your plan and billing
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto">
          {/* Success / Error banners */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {successMessage}
            </div>
          )}
          {paymentError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {paymentError}
            </div>
          )}

          {/* Current Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
            {userLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <SubscriptionPanel subscription={subscription} />
            )}
          </motion.div>

          {/* Upgrade Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-white mb-6">Upgrade Your Plan</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const Icon = plan.icon
                const isCurrentPlan = subscription.plan === plan.id

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <Card className={`h-full bg-gradient-to-br ${plan.color} border ${plan.borderColor} ${
                      isCurrentPlan ? "ring-2 ring-cinematic-orange" : ""
                    }`}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {isCurrentPlan && (
                            <span className="px-2 py-1 text-xs rounded-full bg-cinematic-orange/20 text-cinematic-orange">
                              Current
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">{plan.price}</span>
                          <span className="text-muted-foreground">/{plan.period}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                              <span className="text-sm text-white/80">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full ${
                            isCurrentPlan
                              ? "bg-white/10 text-white cursor-default"
                              : plan.id === "premium"
                              ? "bg-cinematic-orange text-black hover:bg-cinematic-orange/90"
                              : "bg-white text-black hover:bg-white/90"
                          }`}
                          disabled={isCurrentPlan || plan.id === "free" || isPaymentLoading}
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          {isPaymentLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {isCurrentPlan ? "Current Plan" : plan.id === "free" ? "Free Plan" : "Upgrade"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  q: "Can I cancel my subscription anytime?",
                  a: "You can stop renewing by not purchasing again when your period ends. Access stays active until the end of the period you already paid for. For cancellations or refunds, contact support per our billing policy.",
                },
                {
                  q: "What happens when I reach my project limit?",
                  a: "You'll need to upgrade to a higher plan or delete existing projects to create new ones.",
                },
                {
                  q: "Can I change my plan later?",
                  a: "You can upgrade to Pro or Premium anytime from this page via checkout. Plan changes are applied through our payment provider; there is no self-serve downgrade button here—contact support if you need to change or cancel a paid plan.",
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes, you can start with our Free plan and upgrade when you're ready for more features.",
                },
              ].map((faq, index) => (
                <div key={index} className="bg-card/50 border border-white/10 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
