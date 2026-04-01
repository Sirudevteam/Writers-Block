// Centralized Framer Motion exports for better tree-shaking
// Use these imports instead of direct framer-motion imports

export {
  motion,
  AnimatePresence,
  LazyMotion,
  domAnimation,
  domMax,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useInView,
} from "framer-motion"

// Re-export m for lazy-loaded motion components
export { m } from "framer-motion"

// Common animation variants for reuse
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

// Stagger container for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Spring configuration for smooth animations
export const smoothSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
}

// Gentle spring for subtle effects
export const gentleSpring = {
  type: "spring",
  stiffness: 200,
  damping: 25,
}
