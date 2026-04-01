"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAutoSave, type SaveStatus } from "./useAutoSave"
import { createClient } from "@/lib/supabase/client"

export interface SceneConfig {
  genre: string
  characters: string
  location: string
  mood: string
  sceneDescription: string
}

interface UseScreenplayStreamReturn {
  generatedText: string
  isGenerating: boolean
  isSaving: boolean
  savedProjectId: string | null
  error: string | null
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  generateScreenplay: (config: SceneConfig) => Promise<void>
  stopGeneration: () => void
  clearGeneratedText: () => void
  setGeneratedText: (text: string) => void
  triggerSave: () => Promise<void>
  syncWithDatabase: () => Promise<void>
}

/**
 * @param loadedProjectId - When opening /editor?project=…, pass that id so auto-save updates the existing row instead of POSTing a duplicate.
 */
export function useScreenplayStream(loadedProjectId: string | null = null): UseScreenplayStreamReturn {
  const [generatedText, setGeneratedText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fullTextRef = useRef("")
  const lastConfigRef = useRef<SceneConfig | null>(null)
  /** Synced immediately on create / load so the next autosave cannot POST again before React re-renders (stale closure race). */
  const savedProjectIdRef = useRef<string | null>(null)
  const supabase = createClient()

  // Keep save target in sync when navigating between /editor and /editor?project=…
  useEffect(() => {
    savedProjectIdRef.current = loadedProjectId
    setSavedProjectId(loadedProjectId)
  }, [loadedProjectId])

  // Direct Supabase save handler for auto-save
  const handleSave = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text.trim()) return false

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error("Auto-save failed: User not authenticated")
          return false
        }

        const config = lastConfigRef.current
        const title = config
          ? `${config.genre} — ${config.location} (${new Date().toLocaleDateString("en-IN")})`
          : `Screenplay (${new Date().toLocaleDateString("en-IN")})`

        const targetId = savedProjectIdRef.current

        // If we already have a saved project ID, update it via API
        if (targetId) {
          const res = await fetch(`/api/projects/${targetId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: text,
              status: "in_progress",
            }),
          })
          
          if (!res.ok) {
            const errorData = await res.json()
            console.error("Auto-save update failed:", errorData)
            return false
          }
          return true
        } else {
          // Create a new project via API
          const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              genre: config?.genre,
              characters: config?.characters,
              location: config?.location,
              mood: config?.mood,
              description: config?.sceneDescription,
              content: text,
              status: "in_progress",
            }),
          })
          
          if (res.ok) {
            const project = await res.json()
            savedProjectIdRef.current = project.id
            setSavedProjectId(project.id)
            console.log("New project created with auto-save:", project.id)
            return true
          } else {
            const errorData = await res.json()
            console.error("Auto-save create failed:", errorData)
            return false
          }
        }
      } catch (err) {
        console.error("Auto-save error:", err)
        return false
      }
    },
    [supabase]
  )

  // Use the auto-save hook with Supabase connection
  const {
    status: saveStatus,
    lastSavedAt,
    triggerSave,
    hasUnsavedChanges,
    syncWithDatabase,
  } = useAutoSave({
    projectId: savedProjectId,
    content: generatedText,
    onSave: handleSave,
    debounceMs: 2000,
    intervalMs: 30000,
  })

  const generateScreenplay = useCallback(
    async (config: SceneConfig) => {
      setGeneratedText("")
      setError(null)
      setIsGenerating(true)
      savedProjectIdRef.current = null
      setSavedProjectId(null)
      fullTextRef.current = ""
      lastConfigRef.current = config

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate screenplay")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error("Failed to get response reader")

        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.done) {
                  setIsGenerating(false)
                  return
                }
                if (data.content) {
                  fullTextRef.current += data.content
                  setGeneratedText((prev) => prev + data.content)
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }

        setIsGenerating(false)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setIsGenerating(false)
          return
        }
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        setIsGenerating(false)
      }
    },
    []
  )

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsGenerating(false)
  }, [])

  const clearGeneratedText = useCallback(() => {
    setGeneratedText("")
    setError(null)
    savedProjectIdRef.current = null
    setSavedProjectId(null)
    fullTextRef.current = ""
    lastConfigRef.current = null
  }, [])

  const setGeneratedTextWrapper = useCallback((text: string) => {
    setGeneratedText(text)
    fullTextRef.current = text
  }, [])

  return {
    generatedText,
    isGenerating,
    isSaving: saveStatus === "saving",
    savedProjectId,
    error,
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    generateScreenplay,
    stopGeneration,
    clearGeneratedText,
    setGeneratedText: setGeneratedTextWrapper,
    triggerSave,
    syncWithDatabase,
  }
}
