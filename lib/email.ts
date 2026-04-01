/**
 * Email helper using Resend REST API.
 * No SDK needed — a simple fetch is sufficient and keeps bundle size small.
 * Set RESEND_API_KEY and RESEND_FROM_EMAIL in your environment.
 */

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
  const amount = `₹${(amountPaise / 100).toLocaleString("en-IN")}`
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1)
  const cycleDisplay = billingCycle === "annual" ? "Annual" : "Monthly"
  const expiry = expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  await sendEmail({
    to: email,
    subject: `Payment Confirmed — ${planDisplay} Plan Activated`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#0a0a0a;padding:24px;text-align:center;">
          <h1 style="color:#ff6b35;margin:0;font-size:24px;">Writers Block</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="margin-top:0;">Payment Confirmed ✓</h2>
          <p>Thank you for subscribing! Your <strong>${planDisplay} Plan</strong> is now active.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0;">
            <tr>
              <td style="padding:8px 0;color:#666;">Plan</td>
              <td style="padding:8px 0;text-align:right;font-weight:bold;">${planDisplay} (${cycleDisplay})</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#666;">Amount Paid</td>
              <td style="padding:8px 0;text-align:right;">${amount}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#666;">Valid Until</td>
              <td style="padding:8px 0;text-align:right;">${expiry}</td>
            </tr>
          </table>
          <a href="https://writersblock.app/dashboard"
             style="display:inline-block;background:#ff6b35;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Go to Dashboard
          </a>
        </div>
        <div style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888;">
          If you have questions, reply to this email.
        </div>
      </div>
    `,
  })
}

export async function sendExpiryWarning(
  email: string,
  plan: string,
  daysLeft: number,
  expiryDate: Date
): Promise<void> {
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1)
  const expiry = expiryDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  await sendEmail({
    to: email,
    subject: `Your ${planDisplay} Plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#0a0a0a;padding:24px;text-align:center;">
          <h1 style="color:#ff6b35;margin:0;font-size:24px;">Writers Block</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="margin-top:0;">Your subscription is expiring soon</h2>
          <p>Your <strong>${planDisplay} Plan</strong> will expire on <strong>${expiry}</strong> (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left).</p>
          <p>Renew now to keep full access to your screenplays and AI generation tools.</p>
          <a href="https://writersblock.app/dashboard/subscription"
             style="display:inline-block;background:#ff6b35;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Renew Subscription
          </a>
        </div>
        <div style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888;">
          After expiry, your account moves to the Free plan (5 projects).
        </div>
      </div>
    `,
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
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "writersblock.app"

  return sendEmail({
    to: email,
    subject: `Your screenplay: ${displayTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#0a0a0a;padding:24px;text-align:center;">
          <h1 style="color:#ff6b35;margin:0;font-size:24px;">Writers Block</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="margin-top:0;">Your screenplay PDF is attached</h2>
          <p>Here is <strong>${escapeHtml(displayTitle)}</strong> in PDF format, using the same Writers Block template as in the editor.</p>
          <p style="color:#666;font-size:14px;">If you don&apos;t see the attachment, check your spam folder.</p>
          <a href="https://${escapeHtml(site)}/editor"
             style="display:inline-block;background:#ff6b35;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Open Editor
          </a>
        </div>
        <div style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888;">
          Sent to your registered email · ${escapeHtml(site)}
        </div>
      </div>
    `,
    attachments: [{ filename, content: pdfBuffer.toString("base64") }],
  })
}
