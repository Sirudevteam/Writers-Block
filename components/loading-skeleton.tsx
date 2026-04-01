"use client"

import { motion } from "framer-motion"
import { useAccessibility } from "./accessibility-provider"
import { useMotionPreference } from "@/hooks/useMotionPreference"

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = "", count = 1 }: SkeletonProps) {
  const { prefersReducedMotion } = useAccessibility()
  const { shouldReduceMotion } = useMotionPreference()

  const disableAnimation = prefersReducedMotion || shouldReduceMotion

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-white/10 rounded-xl ${className}`}
          animate={disableAnimation ? {} : { opacity: [0.5, 0.8, 0.5] }}
          transition={{ 
            duration: disableAnimation ? 0 : 1.5, 
            repeat: disableAnimation ? 0 : Infinity, 
            delay: i * 0.1 
          }}
        />
      ))}
    </>
  )
}

export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// Optimized stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="bg-[#0f0f0f]/80 backdrop-blur border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

// Project card skeleton with reduced animation
export function ProjectCardSkeleton() {
  return (
    <div className="bg-[#0f0f0f]/80 backdrop-blur border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}
