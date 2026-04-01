"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const plans = [
  {
    id: "free",
    icon: Sparkles,
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "forever",
    description: "Perfect for getting started and exploring AI screenplay writing.",
    cta: "Start for Free",
    ctaHref: "/signup",
    highlight: false,
    features: [
      "Up to 5 projects",
      "Basic AI scene generation",
      "Tamil & English support",
      "Movie scene references",
      "Community support",
    ],
  },
  {
    id: "pro",
    icon: Zap,
    name: "Pro",
    monthlyPrice: 1999,
    yearlyPrice: 1599,
    period: "per month",
    description: "For working screenwriters who need more power and faster output.",
    cta: "Upgrade to Pro",
    ctaHref: "/signup",
    highlight: true,
    badge: "Most Popular",
    savings: "Save ₹4,800/year",
    features: [
      "Up to 25 projects",
      "Advanced AI generation",
      "AI Dialogue Improver",
      "Shot suggestions",
      "Export to PDF",
      "Priority support",
    ],
  },
  {
    id: "premium",
    icon: Crown,
    name: "Premium",
    monthlyPrice: 4999,
    yearlyPrice: 3999,
    period: "per month",
    description: "For production houses and teams building at scale.",
    cta: "Go Premium",
    ctaHref: "/signup",
    highlight: false,
    savings: "Save ₹12,000/year",
    features: [
      "Up to 100 projects",
      "Premium AI models",
      "All Pro features",
      "Team collaboration",
      "API access",
      "24/7 priority support",
      "Custom AI training",
    ],
  },
]

export function HomePricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cinematic-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-cinematic-orange mb-3 px-4 py-1.5 rounded-full bg-cinematic-orange/10 border border-cinematic-orange/20"
          >
            Pricing
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-4">
            Simple,{" "}
            <span className="bg-gradient-to-r from-cinematic-orange to-amber-500 bg-clip-text text-transparent">
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg mb-8">
            Start free. Upgrade when you&apos;re ready. No hidden fees, no long-term contracts.
          </p>

          {/* Toggle — full-width on narrow screens so badge never clips */}
          <div className="mx-auto flex w-full max-w-md flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 sm:mx-0 sm:inline-flex sm:w-auto sm:flex-row sm:rounded-full sm:gap-0">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`relative min-h-[44px] flex-1 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 sm:min-h-0 sm:flex-none sm:rounded-full sm:px-6 ${
                !isYearly
                  ? "bg-cinematic-orange text-black shadow-lg shadow-cinematic-orange/25"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`relative min-h-[44px] flex-1 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 sm:min-h-0 sm:flex-none sm:rounded-full sm:px-6 ${
                isYearly
                  ? "bg-cinematic-orange text-black shadow-lg shadow-cinematic-orange/25"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <span className="inline-flex w-full items-center justify-center gap-2">
                Yearly
                {!isYearly && (
                  <span className="shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    -20%
                  </span>
                )}
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const displayPrice = price === 0 ? "₹0" : `₹${price.toLocaleString()}`

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border transition-all duration-500 ${
                  plan.highlight
                    ? "border-cinematic-orange/50 bg-gradient-to-b from-cinematic-orange/10 via-cinematic-orange/5 to-transparent shadow-2xl shadow-cinematic-orange/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                {/* Most Popular Badge - Inside card, not overlapping */}
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="px-4 py-1.5 rounded-b-xl bg-cinematic-orange text-black text-xs font-bold shadow-lg shadow-cinematic-orange/25"
                    >
                      {plan.badge}
                    </motion.div>
                  </div>
                )}

                {/* Glow effect for highlighted */}
                {plan.highlight && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cinematic-orange/20 via-transparent to-transparent opacity-50 blur-sm" />
                )}

                <div className={`relative p-8 ${plan.badge ? "pt-10" : ""}`}>
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.highlight 
                        ? "bg-cinematic-orange/20 border border-cinematic-orange/30" 
                        : "bg-white/10 border border-white/10"
                    }`}>
                      <Icon className={`w-6 h-6 ${plan.highlight ? "text-cinematic-orange" : "text-white"}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      {plan.savings && isYearly && (
                        <span className="text-xs text-green-400 font-medium">
                          {plan.savings}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isYearly ? "yearly" : "monthly"}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="text-4xl font-bold text-white"
                        >
                          {displayPrice}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-muted-foreground text-sm">
                        / {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Link href={plan.ctaHref} className="block mb-8">
                    <Button
                      className={`w-full h-12 font-semibold rounded-xl transition-all duration-300 group ${
                        plan.highlight
                          ? "bg-cinematic-orange text-black hover:bg-cinematic-orange/90 hover:shadow-lg hover:shadow-cinematic-orange/25 hover:-translate-y-0.5"
                          : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.highlight ? "bg-cinematic-orange/20" : "bg-white/10"
                        }`}>
                          <Check className={`w-3 h-3 ${plan.highlight ? "text-cinematic-orange" : "text-white/70"}`} />
                        </div>
                        <span className="text-sm text-white/80">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              All plans include Tamil &amp; English screenplay support
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
