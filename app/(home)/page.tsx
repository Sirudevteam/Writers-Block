import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/navbar"
import { ScrollProgress } from "@/components/scroll-progress"
import { FilmGrain } from "@/components/film-grain"
import { HomeHero } from "@/components/home-hero"
import { HomeStats } from "@/components/home-stats"
import { faqItems } from "@/components/home-faq-data"

export const revalidate = 3600

const HomeFeaturesSection = dynamic(
  () => import("@/components/home-features").then((m) => m.HomeFeaturesSection),
  { loading: () => <div className="min-h-48 bg-[#0a0a0a]" aria-hidden /> }
)
const HomeForWhoSection = dynamic(
  () => import("@/components/home-for-who").then((m) => m.HomeForWhoSection),
  { loading: () => <div className="min-h-48 bg-[#0a0a0a]" aria-hidden /> }
)
const HomeStepsSection = dynamic(
  () => import("@/components/home-steps").then((m) => m.HomeStepsSection),
  { loading: () => <div className="min-h-48 bg-[#0a0a0a]" aria-hidden /> }
)
const HomePricingSection = dynamic(
  () => import("@/components/home-pricing").then((m) => m.HomePricingSection),
  { loading: () => <div className="min-h-64 bg-[#0a0a0a]" aria-hidden /> }
)
const HomeTestimonialsSection = dynamic(
  () => import("@/components/home-testimonials").then((m) => m.HomeTestimonialsSection),
  { loading: () => <div className="min-h-48 bg-[#0a0a0a]" aria-hidden /> }
)
const HomeFAQSection = dynamic(
  () => import("@/components/home-faq").then((m) => m.HomeFAQSection),
  { loading: () => <div className="min-h-48 bg-[#0a0a0a]" aria-hidden /> }
)
const HomeFooter = dynamic(
  () => import("@/components/home-footer").then((m) => m.HomeFooter),
  { loading: () => <div className="min-h-32 bg-[#050505]" aria-hidden /> }
)

export const metadata: Metadata = {
  title: "Writers Block - AI Screenplay Writing Tool for Tamil & English Films",
  description:
    "Write professional Tamil and English screenplays with AI. Generate cinematic scenes, improve dialogue, get shot suggestions, and reference iconic film moments. Free to start.",
  keywords: [
    "AI screenplay writer",
    "Tamil screenplay writing",
    "Tamil cinema script",
    "AI script generator",
    "screenplay formatter",
    "dialogue improver AI",
    "screenplay writing tool India",
    "Tamil film script writing",
    "AI screenwriting tool",
    "online screenplay writer",
  ],
  openGraph: {
    title: "Writers Block - AI Screenplay Writing Tool for Tamil & English Films",
    description:
      "Write professional Tamil and English screenplays with AI. Generate cinematic scenes, improve dialogue, and reference iconic film moments. Free to start.",
    siteName: "Writers Block",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Writers Block - AI Screenplay Writing Tool for Tamil & English Films",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writers Block - AI Screenplay Writing Tool",
    description:
      "Write professional Tamil and English screenplays with AI. Free to start.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://writersblock.siru.ai"
).replace(/\/$/, "")

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Writers Block",
      description:
        "AI-powered screenplay writing tool for Tamil and English cinema. Generate cinematic scenes, improve dialogue, get shot suggestions, and reference iconic film moments.",
      applicationCategory: "ProductivityApplication",
      applicationSubCategory: "ScreenwritingApplication",
      operatingSystem: "Web",
      inLanguage: ["en", "ta"],
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "INR",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "1999",
          priceCurrency: "INR",
          billingIncrement: "P1M",
        },
        {
          "@type": "Offer",
          name: "Premium",
          price: "4999",
          priceCurrency: "INR",
          billingIncrement: "P1M",
        },
      ],
      featureList: [
        "AI Scene Generator for Tamil and English films",
        "Movie Scene Reference Library",
        "AI Dialogue Improver",
        "Shot Suggestions and Storyboard",
        "Professional Screenplay Formatting",
        "PDF Export",
      ],
    },
    {
      "@type": "WebSite",
      name: "Writers Block",
      url: siteUrl,
      description: "AI Screenplay Writing Tool for Tamil & English Cinema",
      inLanguage: ["en", "ta"],
    },
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${siteUrl}/#faq`,
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen">
        <ScrollProgress />
        <FilmGrain />
        <Navbar />
        <HomeHero />
        <HomeStats />
        <HomeFeaturesSection />
        <HomeForWhoSection />
        <HomeStepsSection />
        <HomePricingSection />
        <HomeTestimonialsSection />
        <HomeFAQSection />
        <HomeFooter />
      </main>
    </>
  )
}
