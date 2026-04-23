/**
 * Razorpay Webhook Handler
 *
 * Handles server-side payment confirmation from Razorpay.
 * Fetches the order for authoritative notes + amount; applies payment via atomic RPC.
 *
 * Setup in Razorpay Dashboard → Settings → Webhooks:
 *   URL: https://yourdomain.com/api/razorpay/webhook
 *   Events: payment.captured
 *   Secret: set RAZORPAY_WEBHOOK_SECRET in your environment
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import Razorpay from "razorpay"
import { createClient } from "@supabase/supabase-js"
import { applyRazorpayPayment } from "@/lib/apply-razorpay-payment"
import { invalidateSubscriptionPlanCache } from "@/lib/subscription-plan-cache"
import { getRazorpayOrderAmountPaise, isPaidPlan } from "@/lib/razorpay-pricing"
import { sendPaymentConfirmation } from "@/lib/email"
import { PLAN_LIMITS } from "@/types/project"
import type { BillingCycle, SubscriptionPlan } from "@/types/project"
import type { Database } from "@/types/database"

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function notesFromOrder(order: { notes?: Record<string, string> | null }): Record<string, string> {
  return order.notes ?? {}
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getAdminClient()
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-razorpay-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")

  if (expectedSignature !== signature) {
    console.error("[webhook] Signature mismatch")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true, skipped: true })
  }

  const payment = (event.payload as { payment?: { entity?: Record<string, unknown> } })?.payment?.entity
  if (!payment || typeof payment.id !== "string" || typeof payment.order_id !== "string") {
    return NextResponse.json({ error: "Missing payment entity" }, { status: 400 })
  }

  const razorpay_payment_id = payment.id
  const razorpay_order_id = payment.order_id
  const paymentAmount =
    typeof payment.amount === "number" ? payment.amount : Number(payment.amount)

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    console.error("[webhook] Razorpay keys not configured")
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  let order: { notes?: Record<string, string> | null; amount?: number }
  try {
    order = (await razorpay.orders.fetch(razorpay_order_id)) as typeof order
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "order fetch failed"
    console.error("[webhook] Razorpay order fetch error:", msg)
    return NextResponse.json({ error: "Order fetch failed" }, { status: 500 })
  }

  const notes = notesFromOrder(order)
  const user_id = notes.user_id
  const planRaw = notes.plan
  const billingRaw = notes.billing_cycle

  if (!user_id || !planRaw || !isPaidPlan(planRaw) || !PLAN_LIMITS[planRaw]) {
    console.error("[webhook] Missing user_id or invalid plan in order notes:", notes)
    return NextResponse.json({ received: true, error: "Missing metadata" })
  }

  if (billingRaw !== "monthly" && billingRaw !== "annual") {
    console.error("[webhook] Invalid billing_cycle in order notes:", billingRaw)
    return NextResponse.json({ received: true, error: "Missing billing_cycle" })
  }

  const plan = planRaw as Exclude<SubscriptionPlan, "free">
  const billing_cycle = billingRaw as BillingCycle

  if (typeof order.amount !== "number" || order.amount !== getRazorpayOrderAmountPaise(plan, billing_cycle)) {
    console.error("[webhook] Order amount mismatch for plan", { plan, billing_cycle, amount: order.amount })
    return NextResponse.json({ received: true, error: "Amount mismatch" })
  }

  if (!Number.isFinite(paymentAmount) || paymentAmount !== order.amount) {
    console.error("[webhook] Payment amount does not match order")
    return NextResponse.json({ received: true, error: "Payment amount mismatch" })
  }

  const applied = await applyRazorpayPayment(supabaseAdmin, {
    userId: user_id,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    plan,
    billingCycle: billing_cycle,
    amountPaise: paymentAmount,
  })

  if (applied.status === "error") {
    console.error("[webhook] apply_subscription_payment failed:", applied.message)
    return NextResponse.json({ error: "Database apply failed" }, { status: 500 })
  }

  if (applied.status === "duplicate") {
    console.log("[webhook] Payment already processed:", razorpay_payment_id)
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }

  await invalidateSubscriptionPlanCache(String(user_id))

  const periodEnd = new Date(applied.currentPeriodEnd)

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", user_id)
    .maybeSingle()

  if (profile?.email) {
    sendPaymentConfirmation(
      profile.email,
      applied.plan as SubscriptionPlan,
      paymentAmount,
      periodEnd,
      applied.billingCycle as BillingCycle
    ).catch((err) => console.error("[webhook] Email send failed:", err))
  }

  console.log(`[webhook] Subscription activated: user=${user_id} plan=${plan} cycle=${billing_cycle}`)
  return NextResponse.json({ received: true, success: true })
}
