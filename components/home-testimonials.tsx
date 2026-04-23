"use client"

import { motion, PanInfo } from "framer-motion"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

const testimonials = [
  {
    quote:
      "Writers Block has completely transformed how I write Tamil scripts. I used to spend hours just formatting — now I spend that time on story. The AI actually understands Tamil cinema rhythm.",
    author: "Karthik Subramanian",
    role: "Tamil Screenwriter",
    location: "Chennai",
    rating: 5,
    avatar: "K",
    color: "from-cinematic-orange to-amber-500",
  },
  {
    quote:
      "As a director, I use Writers Block to quickly generate scene variations during pre-production. The shot suggestions are genuinely useful — it thinks like a cinematographer.",
    author: "Rajesh Mohan",
    role: "Independent Director",
    location: "Coimbatore",
    rating: 5,
    avatar: "R",
    color: "from-cinematic-blue to-cyan-400",
  },
  {
    quote:
      "I'm a film student and Writers Block taught me proper screenplay formatting faster than any textbook. The reference scenes from Tamil and international films are incredible for learning.",
    author: "Anitha Krishnamurthy",
    role: "Film Student, SAE Institute",
    location: "Bangalore",
    rating: 5,
    avatar: "A",
    color: "from-purple-500 to-pink-400",
  },
  {
    quote:
      "The Dialogue Improver alone is worth the subscription. It takes my raw dialogue and sharpens it without losing the character's voice. A genuine creative partner.",
    author: "Priya Venkatesh",
    role: "Indie Filmmaker & Writer",
    location: "Chennai",
    rating: 5,
    avatar: "P",
    color: "from-green-500 to-emerald-400",
  },
  {
    quote:
      "Finally, an AI tool that understands the nuances of Tamil dialogue! The scene generation captures the emotional beats perfectly. Highly recommended for any serious writer.",
    author: "Vignesh Ramesh",
    role: "Screenwriter & Lyricist",
    location: "Madurai",
    rating: 5,
    avatar: "V",
    color: "from-pink-500 to-rose-400",
  },
]

export function HomeTestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Auto-play
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isPaused, nextSlide])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      prevSlide()
    } else if (info.offset.x < -threshold) {
      nextSlide()
    }
  }

  // Get visible testimonials (circular)
  const getVisibleTestimonials = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length
      visible.push({ ...testimonials[index], position: i })
    }
    return visible
  }

  return (
    <section
      aria-label="Testimonials"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.015] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-cinematic-orange mb-3 px-4 py-1.5 rounded-full bg-cinematic-orange/10 border border-cinematic-orange/20"
          >
            Testimonials
          </motion.span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-4">
            Why writers choose{" "}
            <span className="bg-gradient-to-r from-cinematic-orange to-amber-500 bg-clip-text text-transparent">
              Writers Block
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Composite stories that reflect the kinds of outcomes writers tell us about—your mileage will vary, but the
            workflow is built for real drafts.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Cards Container */}
          <motion.div
            className="flex cursor-grab gap-6 active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
          >
            {getVisibleTestimonials().map((testimonial, index) => (
              <motion.div
                key={`${testimonial.author}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex-shrink-0 w-full md:w-[calc(33.333%-1rem)]"
              >
                <div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 h-full group relative overflow-hidden">
                  {/* Quote icon */}
                  <Quote
                    className="absolute top-6 right-6 w-10 h-10 text-cinematic-orange/10 group-hover:text-cinematic-orange/20 transition-colors"
                    aria-hidden="true"
                  />

                  {/* Stars with animation */}
                  <div className="flex gap-1 mb-5" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-cinematic-orange text-cinematic-orange" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote text */}
                  <p className="text-white/90 leading-relaxed mb-6 text-[15px] relative z-10">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{testimonial.author}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role} · {testimonial.location}
                      </p>
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cinematic-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-cinematic-orange"
                    : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Swipe hint */}
          <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
            Swipe to see more
          </p>
        </div>
      </div>
    </section>
  )
}
