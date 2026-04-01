"use client"

import dynamic from "next/dynamic"

// Lazy load DotLottieReact to prevent LCP blocking
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  {
    ssr: false,
    loading: () => (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cinematic-orange/20 animate-pulse" />
    ),
  }
)

interface LottieAnimationProps {
  src: string
  className?: string
  loop?: boolean
  autoplay?: boolean
}

export function LottieAnimation({ 
  src, 
  className = "", 
  loop = true, 
  autoplay = true 
}: LottieAnimationProps) {
  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      className={className}
    />
  )
}
