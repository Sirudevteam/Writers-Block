"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { Sparkles, ArrowRight, CheckCircle2, Play } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LottieAnimation } from "@/components/lottie-animation"
import { useAccessibility } from "@/components/accessibility-provider"
import { useEffect, useState, useRef } from "react"

const trustBadges = [
  "No credit card required",
  "Tamil & English support",
  "Free to start",
]

// Bilingual cycling component - shows Tamil + English side by side
function BilingualTypewriter({ reducedMotion }: { reducedMotion: boolean }) {
  const terms = [
    { tamil: "கதை", english: "Story" },
    { tamil: "திரைக்கதை", english: "Screenplay" },
    { tamil: "வசனம்", english: "Dialogue" },
  ]

  if (reducedMotion) {
    const t = terms[0]
    return (
      <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-6 sm:items-center sm:gap-6">
        <div className="relative pb-5 sm:pb-0">
          <span className="text-xl font-bold bg-gradient-to-r from-cinematic-orange via-amber-400 to-cinematic-orange bg-[length:200%_auto] bg-clip-text text-transparent xs:text-2xl sm:text-3xl lg:text-4xl">
            {t.tamil}
          </span>
          <span className="absolute -bottom-4 left-0 text-[10px] text-cinematic-orange/60 uppercase tracking-wider">தமிழ்</span>
        </div>
        <div className="hidden h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block sm:h-10" aria-hidden />
        <div className="relative pb-5 sm:pb-0">
          <span className="text-xl font-bold bg-gradient-to-r from-cinematic-blue via-cyan-400 to-cinematic-blue bg-[length:200%_auto] bg-clip-text text-transparent xs:text-2xl sm:text-3xl lg:text-4xl">
            {t.english}
          </span>
          <span className="absolute -bottom-4 left-0 text-[10px] text-cinematic-blue/60 uppercase tracking-wider">English</span>
        </div>
      </div>
    )
  }

  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayTamil, setDisplayTamil] = useState("")
  const [displayEnglish, setDisplayEnglish] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const currentTerm = terms[currentIndex]

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing phase
        const tamilDone = displayTamil.length >= currentTerm.tamil.length
        const englishDone = displayEnglish.length >= currentTerm.english.length

        if (!tamilDone) {
          setDisplayTamil(currentTerm.tamil.slice(0, displayTamil.length + 1))
        } else if (!englishDone) {
          setDisplayEnglish(currentTerm.english.slice(0, displayEnglish.length + 1))
        } else {
          // Both done, wait then delete
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        // Deleting phase
        if (displayEnglish.length > 0) {
          setDisplayEnglish(displayEnglish.slice(0, -1))
        } else if (displayTamil.length > 0) {
          setDisplayTamil(displayTamil.slice(0, -1))
        } else {
          // Both deleted, move to next
          setIsDeleting(false)
          setCurrentIndex((prev) => (prev + 1) % terms.length)
        }
      }
    }, isDeleting ? 40 : 80)

    return () => clearTimeout(timeout)
  }, [displayTamil, displayEnglish, isDeleting, currentIndex, currentTerm])

  return (
    <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-6 sm:items-center sm:gap-6">
      {/* Tamil */}
      <div className="relative pb-5 sm:pb-0">
        <span className="text-xl font-bold bg-gradient-to-r from-cinematic-orange via-amber-400 to-cinematic-orange bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x xs:text-2xl sm:text-3xl lg:text-4xl">
          {displayTamil}
        </span>
        <span className="absolute -right-1 top-0 w-0.5 h-full bg-cinematic-orange animate-pulse" aria-hidden />
        <span className="absolute -bottom-4 left-0 text-[10px] text-cinematic-orange/60 uppercase tracking-wider">தமிழ்</span>
      </div>

      {/* Divider */}
      <div className="hidden h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block sm:h-10" aria-hidden />

      {/* English */}
      <div className="relative pb-5 sm:pb-0">
        <span className="text-xl font-bold bg-gradient-to-r from-cinematic-blue via-cyan-400 to-cinematic-blue bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x xs:text-2xl sm:text-3xl lg:text-4xl">
          {displayEnglish}
        </span>
        <span className="absolute -right-1 top-0 w-0.5 h-full bg-cinematic-blue animate-pulse" />
        <span className="absolute -bottom-4 left-0 text-[10px] text-cinematic-blue/60 uppercase tracking-wider">English</span>
      </div>
    </div>
  )
}

// Screenplay preview mockup
function ScreenplayMockup({ reducedMotion }: { reducedMotion: boolean }) {
  const lines = [
    { text: "INT. CAFE - EVENING", type: "heading", lang: "en" },
    { text: "மழை பெய்துகொண்டிருக்கிறது. அருண் ஜன்னல் அருகே நிற்கிறான்.", type: "action", lang: "ta" },
    { text: "Rain falls gently. Arun stands by the window, lost in thought.", type: "action", lang: "en" },
    { text: "ARUN", type: "character", lang: "en" },
    { text: "(வருத்தத்துடன்)", type: "paren", lang: "ta" },
    { text: "எனக்கு இன்னும் நேரம் வேண்டும்...", type: "dialogue", lang: "ta" },
  ]

  const [currentLine, setCurrentLine] = useState(reducedMotion ? lines.length : 0)

  useEffect(() => {
    if (reducedMotion) return
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % (lines.length + 1))
    }, 1500)
    return () => clearInterval(interval)
  }, [reducedMotion, lines.length])

  return (
    <motion.div
      {...(reducedMotion
        ? { initial: false }
        : {
            initial: { opacity: 0, y: 20, rotateX: 10 },
            animate: { opacity: 1, y: 0, rotateX: 0 },
            transition: { duration: 0.8, delay: 0.4 },
          })}
      className="relative w-full max-w-md mx-auto perspective-1000"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cinematic-orange/20 to-cinematic-blue/20 rounded-xl blur-xl opacity-50" />
      
      {/* Card */}
      <div className="relative bg-[#0d0d0d] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="ml-3 text-xs text-muted-foreground font-mono">screenplay.scene</span>
        </div>

        {/* Content */}
        <div className="p-5 font-mono text-sm space-y-2 min-h-[160px]">
          {lines.map((line, index) => {
            const lineClass = `${
              line.type === "heading"
                ? "text-cinematic-orange font-bold uppercase"
                : line.type === "character"
                  ? "text-cinematic-blue text-center mt-3"
                  : line.type === "paren"
                    ? "text-white/50 text-center text-xs italic"
                    : line.type === "dialogue"
                      ? "text-white ml-8 border-l-2 border-cinematic-orange/30 pl-3"
                      : "text-white/70"
            }`
            if (reducedMotion) {
              return (
                <div key={index} className={lineClass}>
                  {line.text}
                </div>
              )
            }
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: index <= currentLine ? 1 : 0.1,
                  x: index <= currentLine ? 0 : -10,
                }}
                transition={{ duration: 0.3 }}
                className={lineClass}
              >
                {line.text}
              </motion.div>
            )
          })}

          {reducedMotion ? (
            <span className="inline-block w-2 h-4 bg-cinematic-orange ml-8" aria-hidden />
          ) : (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-cinematic-orange ml-8"
              aria-hidden
            />
          )}
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d0d0d] to-transparent" />
      </div>

      {/* Floating badge */}
      {reducedMotion ? (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cinematic-orange text-black text-xs font-bold">
          AI Generated
        </div>
      ) : (
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cinematic-orange text-black text-xs font-bold"
        >
          AI Generated
        </motion.div>
      )}
    </motion.div>
  )
}

// Live activity indicator
function LiveIndicator({ reducedMotion }: { reducedMotion: boolean }) {
  const [count, setCount] = useState(48)

  useEffect(() => {
    if (reducedMotion) return
    const interval = setInterval(() => {
      setCount((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1
        const newCount = prev + change
        return Math.max(42, Math.min(52, newCount))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [reducedMotion])

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
      <span className="relative flex h-1.5 w-1.5">
        {!reducedMotion && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      {count} writing now
    </span>
  )
}

// Film strip decoration
function FilmStrip({ position }: { position: "top" | "bottom" }) {
  return (
    <div className={`absolute left-0 right-0 h-3 flex ${position === "top" ? "top-0" : "bottom-0"}`}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="flex-1 flex justify-center">
          <div className="w-1.5 h-full bg-white/10 rounded-sm" />
        </div>
      ))}
    </div>
  )
}

export function HomeHero() {
  const { prefersReducedMotion } = useAccessibility()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set((e.clientX - centerX) / 50)
    mouseY.set((e.clientY - centerY) / 50)
  }

  const rotateX = useTransform(mouseY, [-10, 10], [3, -3])
  const rotateY = useTransform(mouseX, [-10, 10], [-3, 3])

  return (
    <section
      ref={containerRef}
      aria-label="Hero"
      className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Film strips */}
      <FilmStrip position="top" />
      <FilmStrip position="bottom" />

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {prefersReducedMotion ? (
          <>
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cinematic-orange/10 rounded-full blur-3xl opacity-[0.08]" />
            <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cinematic-blue/10 rounded-full blur-3xl opacity-[0.08]" />
          </>
        ) : (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cinematic-orange/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.12, 0.05] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cinematic-blue/10 rounded-full blur-3xl"
            />
          </>
        )}
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left">
            {/* Badges inline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-5"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cinematic-orange/10 border border-cinematic-orange/20 text-cinematic-orange text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                India&apos;s AI Screenplay Platform
              </span>
              <LiveIndicator reducedMotion={prefersReducedMotion} />
            </motion.div>

            {/* H1 Brand */}
            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 font-display text-3xl font-bold leading-[1.08] tracking-tight xs:text-4xl sm:text-5xl sm:leading-[1.05] lg:text-6xl"
              style={
                prefersReducedMotion
                  ? undefined
                  : { rotateX, rotateY, transformStyle: "preserve-3d" }
              }
            >
              <span className="inline-flex items-center gap-3">
                {prefersReducedMotion ? (
                  <span className="relative w-14 h-14 sm:w-16 sm:h-16">
                    <div className="absolute inset-0 bg-cinematic-orange/30 rounded-full blur-xl scale-150" />
                    <LottieAnimation
                      src="https://lottie.host/b393f41a-d923-4c50-8ebf-267e8838dc4c/WpxaKKvcIz.lottie"
                      loop={false}
                      autoplay={false}
                      className="w-full h-full"
                    />
                  </span>
                ) : (
                  <motion.span
                    className="relative w-14 h-14 sm:w-16 sm:h-16"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-cinematic-orange/30 rounded-full blur-xl scale-150" />
                    <LottieAnimation
                      src="https://lottie.host/b393f41a-d923-4c50-8ebf-267e8838dc4c/WpxaKKvcIz.lottie"
                      loop
                      autoplay
                      className="w-full h-full"
                    />
                  </motion.span>
                )}
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Writers
                </span>
                <span className="bg-gradient-to-r from-cinematic-orange to-cinematic-orange/70 bg-clip-text text-transparent">
                  Block
                </span>
              </span>
            </motion.h1>

            {/* Bilingual Typewriter - tighter spacing */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={prefersReducedMotion ? false : { opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-6 flex min-h-[5.5rem] items-center justify-center sm:min-h-16 lg:justify-start"
            >
              <BilingualTypewriter reducedMotion={prefersReducedMotion} />
            </motion.div>

            {/* Short punchy description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mx-auto mb-6 max-w-md text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-[17px] sm:leading-[1.65]"
            >
              AI writes your <span className="text-cinematic-orange">Tamil</span> & <span className="text-cinematic-blue">English</span> screenplays. 
              You focus on the story.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6"
            >
              <Link href="/editor">
                <Button
                  size="lg"
                  className="bg-cinematic-orange text-black font-bold hover:bg-cinematic-orange/90 hover:scale-105 transition-all duration-300 h-12 px-8 text-base group w-full sm:w-auto shadow-lg shadow-cinematic-orange/25 relative overflow-hidden"
                >
                  {!prefersReducedMotion && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                      animate={{ x: ["-200%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center">
                    Start Writing Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 hover:bg-white/5 hover:border-white/40 h-12 px-8 text-base text-white w-full sm:w-auto group"
                >
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2"
            >
              {trustBadges.map((badge, index) => (
                <span key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cinematic-orange/70" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right column - Screenplay mockup */}
          <div className="hidden lg:block">
            <ScreenplayMockup reducedMotion={prefersReducedMotion} />
          </div>
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% auto;
        }
      `}</style>
    </section>
  )
}
