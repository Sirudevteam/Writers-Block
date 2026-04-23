import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import Razorpay from "razorpay"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { apiIpLimitOr429 } from "@/lib/api-ip-limit"
import { invalidateSubscriptionPlanCache } from "@/lib/subscription-plan-cache"
import { applyRazorpayPayment } from "@/lib/apply-razorpay-payment"
import { getRazorpayOrderAmountPaise, isPaidPlan } from "@/lib/razorpay-pricing"
import { sendPaymentConfirmation } from "@/lib/email"
import { PLAN_LIMITS } from "@/types/project"
import type { BillingCycle, SubscriptionPlan } from "@/types/project"
import type { Database } from "@/types/database"

function notesFromOrder(order: { notes?: Record<string, string> | null }): Record<string, string> {
  return order.notes ?? {}
}

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient<Database>(url, key)
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

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount: clientAmount,
  } = await req.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 })
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keySecret || !keyId) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 })
  }

  const admin = getAdminSupabase()
  if (!admin) {
    console.error("[verify] SUPABASE_SERVICE_ROLE_KEY not configured")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed — invalid signature" }, { status: 400 })
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  let order: { notes?: Record<string, string> | null; amount?: number }
  let payment: { order_id?: string; status?: string; amount?: number }
  try {
    order = (await razorpay.orders.fetch(razorpay_order_id)) as typeof order
    payment = (await razorpay.payments.fetch(razorpay_payment_id)) as typeof payment
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Razorpay fetch failed"
    console.error("[verify] Razorpay fetch error:", msg)
    return NextResponse.json({ error: "Could not verify order with Razorpay" }, { status: 502 })
  }

  const notes = notesFromOrder(order)
  if (notes.user_id !== user.id) {
    return NextResponse.json({ error: "Order does not belong to this account" }, { status: 403 })
  }

  const resolvedPlan = notes.plan as SubscriptionPlan | undefined
  if (!resolvedPlan || !isPaidPlan(resolvedPlan) || !PLAN_LIMITS[resolvedPlan]) {
    return NextResponse.json({ error: "Invalid or missing plan on order" }, { status: 400 })
  }

  if (notes.billing_cycle !== "monthly" && notes.billing_cycle !== "annual") {
    return NextResponse.json({ error: "Invalid or missing billing_cycle on order" }, { status: 400 })
  }

  const cycle: BillingCycle = notes.billing_cycle === "annual" ? "annual" : "monthly"

  if (payment.order_id !== razorpay_order_id) {
    return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 })
  }

  if (payment.status !== "captured") {
    return NextResponse.json(
      { error: `Payment must be captured (status: ${payment.status ?? "unknown"})` },
      { status: 400 }
    )
  }

  if (
    typeof order.amount !== "number" ||
    typeof payment.amount !== "number" ||
    payment.amount !== order.amount
  ) {
    return NextResponse.json({ error: "Payment amount does not match order" }, { status: 400 })
  }

  const expectedPaise = getRazorpayOrderAmountPaise(resolvedPlan, cycle)
  if (order.amount !== expectedPaise) {
    return NextResponse.json({ error: "Order amount does not match current plan pricing" }, { status: 400 })
  }

  const amountPaise =
    typeof payment.amount === "number" ? payment.amount : typeof clientAmount === "number" ? clientAmount : 0

  const applied = await applyRazorpayPayment(admin, {
    userId: user.id,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    plan: resolvedPlan,
    billingCycle: cycle,
    amountPaise,
  })

  if (applied.status === "error") {
    return NextResponse.json({ error: applied.message }, { status: 500 })
  }

  if (applied.status === "duplicate") {
    return NextResponse.json({ success: true, alreadyProcessed: true })
  }

  await invalidateSubscriptionPlanCache(user.id)

  const periodEnd = new Date(applied.currentPeriodEnd)

  const notifyEmail = user.email
  if (notifyEmail) {
    sendPaymentConfirmation(
      notifyEmail,
      applied.plan as SubscriptionPlan,
      amountPaise,
      periodEnd,
      applied.billingCycle as BillingCycle
    ).catch((err) => console.error("[verify] Email send failed:", err))
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({ success: true, subscription })
}
