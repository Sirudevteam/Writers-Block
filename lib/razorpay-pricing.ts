import type { BillingCycle, SubscriptionPlan } from "@/types/project"

/** Server-side Razorpay order amounts (paise). Must match create-order. */
export function getRazorpayOrderAmountPaise(
  plan: Exclude<SubscriptionPlan, "free">,
  billingCycle: BillingCycle
): number {
  const pricing: Record<Exclude<SubscriptionPlan, "free">, Record<BillingCycle, number>> = {
    pro: {
      monthly: parseInt(process.env.PRO_MONTHLY_PRICE_PAISE || "199900", 10),
      annual: parseInt(process.env.PRO_ANNUAL_PRICE_PAISE || "1918800", 10),
    },
    premium: {
      monthly: parseInt(process.env.PREMIUM_MONTHLY_PRICE_PAISE || "499900", 10),
      annual: parseInt(process.env.PREMIUM_ANNUAL_PRICE_PAISE || "4798800", 10),
    },
  }
  return pricing[plan][billingCycle]
}

export function isPaidPlan(plan: string): plan is Exclude<SubscriptionPlan, "free"> {
  return plan === "pro" || plan === "premium"
}
