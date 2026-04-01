"use client"

import { motion } from "framer-motion"
import { AlertCircle, X } from "lucide-react"
import { Button } from "./button"

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  className?: string
}

export function ErrorMessage({ message, onDismiss, className = "" }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)] ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-400">Error</p>
        <p className="text-sm text-red-300/90 mt-0.5">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
          onClick={onDismiss}
          aria-label="Dismiss error message"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </motion.div>
  )
}

interface FormErrorProps {
  message?: string
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="text-sm text-red-400 flex items-center gap-1.5 mt-1.5"
      role="alert"
    >
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {message}
    </motion.p>
  )
}
