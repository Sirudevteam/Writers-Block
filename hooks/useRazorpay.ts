"use client"

import { useState, useCallback, useRef } from "react"
import type { BillingCycle } from "@/types/project"

interface RazorpayOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="razorpay"]')) {
      resolve(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function useRazorpay({ onSuccess, onError }: RazorpayOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkoutLock = useRef(false)

  const initiatePayment = useCallback(
    async (plan: "pro" | "premium", billingCycle: BillingCycle = "monthly") => {
      if (checkoutLock.current) {
        return
      }
      checkoutLock.current = true
      setIsLoading(true)
      setError(null)

      // 1. Load Razorpay checkout script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        const msg = "Failed to load payment gateway. Please check your connection."
        setError(msg)
        onError?.(msg)
        setIsLoading(false)
        checkoutLock.current = false
        return
      }

      // 2. Create order on backend
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle }),
      })

      if (!orderRes.ok) {
        const data = await orderRes.json()
        const msg = data.error || "Failed to create payment order"
        setError(msg)
        onError?.(msg)
        setIsLoading(false)
        checkoutLock.current = false
        return
      }

      const { orderId, amount, currency, keyId, planName } = await orderRes.json()

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Writers Block",
        description: planName,
        order_id: orderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          // 4. Verify payment on backend
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
            }),
          })

          if (verifyRes.ok) {
            onSuccess?.()
          } else {
            const data = await verifyRes.json()
            const msg = data.error || "Payment verification failed"
            setError(msg)
            onError?.(msg)
          }
          setIsLoading(false)
          checkoutLock.current = false
        },
        prefill: {},
        theme: { color: "#F97316" }, // cinematic-orange
        modal: {
          ondismiss: () => {
            setIsLoading(false)
            checkoutLock.current = false
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    },
    [onSuccess, onError]
  )

  return { initiatePayment, isLoading, error }
}
