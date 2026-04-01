import type { Metadata } from "next"
import { Inter, Courier_Prime, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { AccessibilityProvider } from "@/components/accessibility-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
})

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
  display: "swap",
  preload: false, // Secondary font, don't preload
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: "Writers Block – AI Screenplay Writing Tool",
    template: "%s | Writers Block",
  },
  description:
    "AI-powered screenplay writing tool for Tamil and English cinema. Generate cinematic scenes, improve dialogue, get shot suggestions, and reference iconic film moments.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://writersblock.siru.ai"
  ),
  openGraph: {
    siteName: "Writers Block",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    // Performance hints for crawlers
    "X-DNS-Prefetch-Control": "on",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${courier.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#0a0a0a] text-white`}>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
