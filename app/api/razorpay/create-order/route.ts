import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createClient } from "@/lib/supabase/server"
import { apiIpLimitOr429 } from "@/lib/api-ip-limit"
import { getRazorpayOrderAmountPaise } from "@/lib/razorpay-pricing"
import type { BillingCycle, SubscriptionPlan } from "@/types/project"

const PLAN_NAMES: Record<Exclude<SubscriptionPlan, "free">, Record<BillingCycle, string>> = {
  pro: {
    monthly: "Pro Plan (Monthly)",
    annual: "Pro Plan (Annual)",
  },
  premium: {
    monthly: "Premium Plan (Monthly)",
    annual: "Premium Plan (Annual)",
  },
}

export async function POST(req: NextRequest) {
  const tooMany = await apiIpLimitOr429(req)
  if (tooMany) return tooMany

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const plan: string = body.plan
  const billingCycle: BillingCycle = body.billingCycle === "annual" ? "annual" : "monthly"

  if (plan !== "pro" && plan !== "premium") {
    return NextResponse.json({ error: "Invalid plan. Choose pro or premium." }, { status: 400 })
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
  }

  const paidPlan = plan as Exclude<SubscriptionPlan, "free">
  const amount = getRazorpayOrderAmountPaise(paidPlan, billingCycle)

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `plan_${plan}_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: {
      user_id: user.id,
      plan,
      billing_cycle: billingCycle,
    },
  })

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    plan,
    billingCycle,
    planName: PLAN_NAMES[paidPlan][billingCycle],
  })
}
