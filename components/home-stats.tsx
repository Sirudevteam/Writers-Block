"use client"

import { motion, useInView, useSpring, useTransform } from "framer-motion"
import { useRef, useEffect, useState } from "react"

const stats = [
  { value: 5000, suffix: "+", label: "Screenwriters" },
  { value: 50000, suffix: "+", label: "Scenes Generated" },
  { value: 2, suffix: "", label: "Languages — Tamil & English" },
  { value: 4.9, suffix: " ★", label: "Average Rating", isDecimal: true },
]

function AnimatedNumber({ value, suffix, isDecimal = false }: { value: number; suffix: string; isDecimal?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hasAnimated, setHasAnimated] = useState(false)

  const springValue = useSpring(0, {
    duration: 2000,
    bounce: 0,
  })

  const displayValue = useTransform(springValue, (latest) => {
    if (isDecimal) {
      return latest.toFixed(1)
    }
    return Math.floor(latest).toLocaleString()
  })

  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value)
      setHasAnimated(true)
    }
  }, [isInView, hasAnimated, springValue, value])

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      setDisplay(latest)
    })
    return unsubscribe
  }, [displayValue])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

export function HomeStats() {
  return (
    <section aria-label="Platform statistics" className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="text-center cursor-default"
            >
              <p className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-cinematic-orange to-cinematic-orange/70 bg-clip-text text-transparent mb-1">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} isDecimal={stat.isDecimal} />
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
