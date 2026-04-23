/**
 * Email helper using Resend REST API.
 * No SDK needed — a simple fetch is sufficient and keeps bundle size small.
 * Set RESEND_API_KEY and RESEND_FROM_EMAIL in your environment.
 */

import { getPublicSiteOrigin, writersBlockEmailDocument } from "@/lib/email-theme"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@writersblock.app"
const APP_NAME = "Writers Block"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function safePdfFilename(title: string): string {
  const base =
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "screenplay"
  return `${base}.pdf`
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: string }>
}

async function sendEmail({ to, subject, html, attachments }: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to)
    return false
  }

  try {
    const payload: Record<string, unknown> = {
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    }
    if (attachments?.length) {
      payload.attachments = attachments
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("[email] Resend error:", res.status, body)
      return false
    }
    return true
  } catch (err) {
    console.error("[email] Failed to send email:", err)
    return false
  }
}

// ── Email templates ──────────────────────────────────────────────────────────

export async function sendPaymentConfirmation(
  email: string,
  plan: string,
  amountPaise: number,
  expiryDate: Date,
  billingCycle: "monthly" | "annual"
): Promise<void> {
  const site = getPublicSiteOrigin()
  const amount = `₹${(amountPaise / 100).toLocaleString("en-IN")}`
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1)
  const cycleDisplay = billingCycle === "annual" ? "Annual" : "Monthly"
  const expiry = expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Thank you for subscribing! Your <strong style="color:#ffffff;">${escapeHtml(planDisplay)}</strong> plan is now active.</p>
    <table role="presentation" width="100%" style="border-collapse:collapse; margin:0; font-size:14px;">
      <tr>
        <td style="padding:10px 0; color:rgba(255,255,255,0.55); border-bottom:1px solid rgba(255,255,255,0.08);">Plan</td>
        <td style="padding:10px 0; text-align:right; font-weight:600; color:#ffffff; border-bottom:1px solid rgba(255,255,255,0.08);">${escapeHtml(planDisplay)} (${escapeHtml(cycleDisplay)})</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:rgba(255,255,255,0.55); border-bottom:1px solid rgba(255,255,255,0.08);">Amount paid</td>
        <td style="padding:10px 0; text-align:right; color:#e8e8e6; border-bottom:1px solid rgba(255,255,255,0.08);">${amount}</td>
      </tr>
      <tr>
        <td style="padding:10px 0; color:rgba(255,255,255,0.55);">Valid until</td>
        <td style="padding:10px 0; text-align:right; color:#e8e8e6;">${escapeHtml(expiry)}</td>
      </tr>
    </table>`

  await sendEmail({
    to: email,
    subject: `Payment Confirmed — ${planDisplay} Plan Activated`,
    html: writersBlockEmailDocument({
      preheader: `Your ${planDisplay} plan is active.`,
      title: "Payment confirmed",
      bodyHtml,
      primaryCta: { href: `${site}/dashboard`, label: "Go to dashboard" },
      footnote: "If you have billing questions, reply to this email.",
    }),
  })
}

export async function sendExpiryWarning(
  email: string,
  plan: string,
  daysLeft: number,
  expiryDate: Date
): Promise<void> {
  const site = getPublicSiteOrigin()
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1)
  const expiry = expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Your <strong style="color:#ffffff;">${escapeHtml(planDisplay)}</strong> plan will expire on <strong style="color:#00d4ff;">${escapeHtml(expiry)}</strong> (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left).</p>
    <p style="margin:0; color:rgba(255,255,255,0.7);">Renew to keep full access to your screenplays and AI tools.</p>`

  await sendEmail({
    to: email,
    subject: `Your ${planDisplay} Plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: writersBlockEmailDocument({
      preheader: `Your subscription ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`,
      title: "Subscription expiring soon",
      bodyHtml,
      primaryCta: { href: `${site}/dashboard/subscription`, label: "Renew subscription" },
      footnote: "After expiry, your account moves to the free plan (limited projects and AI).",
    }),
  })
}

/** Email screenplay PDF (Resend attachment) to the user's registered address. */
export async function sendScreenplayPdfEmail(
  email: string,
  screenplayTitle: string,
  pdfBuffer: Buffer
): Promise<boolean> {
  const displayTitle = screenplayTitle.trim().slice(0, 200) || "Your screenplay"
  const filename = safePdfFilename(displayTitle)
  const site = getPublicSiteOrigin()
  const host = site.replace(/^https?:\/\//, "")

  return sendEmail({
    to: email,
    subject: `Your screenplay: ${displayTitle}`,
    html: writersBlockEmailDocument({
      preheader: "Your PDF is attached.",
      title: "Your screenplay PDF is attached",
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Here is <strong style="color:#ffffff;">${escapeHtml(displayTitle)}</strong> in PDF — same template as the editor.</p>
        <p style="margin:0; font-size:14px; color:rgba(255,255,255,0.5);">If you don&apos;t see the attachment, check your spam folder.</p>`,
      primaryCta: { href: `${site}/editor`, label: "Open editor" },
      footnote: `Sent to your registered address · ${escapeHtml(host)}`,
    }),
    attachments: [{ filename, content: pdfBuffer.toString("base64") }],
  })
}
