import { headers } from "next/headers"

/**
 * Defense-in-depth for auth server actions: reject cross-origin posts when Origin is present.
 * Next.js Server Actions already enforce same-origin; this adds explicit validation.
 */
export function isAuthRequestOriginAllowed(): boolean {
  const h = headers()
  const origin = h.get("origin")
  if (!origin) {
    const site = h.get("sec-fetch-site")
    if (site === "cross-site") return false
    return true
  }

  const hostHeader = h.get("x-forwarded-host") ?? h.get("host")
  if (!hostHeader) return false

  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return false
  }

  const host = hostHeader.split(",")[0].trim()
  const hostname = host.split(":")[0]

  if (originUrl.host === host || originUrl.hostname === hostname) {
    return true
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    try {
      if (new URL(siteUrl).origin === originUrl.origin) return true
    } catch {
      /* ignore */
    }
  }

  return false
}
