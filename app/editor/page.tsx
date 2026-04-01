"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Camera,
  CheckCircle,
  Loader2,
  Sparkles,
  Film,
  Save,
  Clapperboard,
  BookOpen,
  X,
  Menu,
  ChevronLeft,
  Download,
  Share2,
  Copy,
  Settings,
  FolderOpen,
  FileText,
  RefreshCw,
} from "lucide-react"
import { useState, useRef, useCallback, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { SceneInputForm } from "@/components/scene-input-form"
import { ScreenplayEditor } from "@/components/screenplay-editor"
import { ReferenceSceneCard } from "@/components/reference-scene-card"
import { useScreenplayStream, type SceneConfig } from "@/hooks/useScreenplayStream"
import { useShotSuggestions } from "@/hooks/useShotSuggestions"
import { useMovieReferences } from "@/hooks/useMovieReferences"
import { ShotSuggestions } from "@/components/shot-suggestions"
import { AutoSaveStatus, AutoSaveStatusCompact } from "@/components/auto-save-status"
import { getAutoSavedContent, clearAutoSavedContent } from "@/hooks/useAutoSave"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/database"

// Wrapper component for Suspense
function EditorPageWrapper() {
  return (
    <Suspense fallback={<EditorPageSkeleton />}>
      <EditorPage />
    </Suspense>
  )
}

// Loading skeleton for the editor
function EditorPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-cinematic-orange/10 flex items-center justify-center animate-pulse">
          <Clapperboard className="w-6 h-6 text-cinematic-orange/50" />
        </div>
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </main>
  )
}

function EditorPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("project")

  const {
    generatedText,
    isGenerating,
    savedProjectId,
    error,
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    generateScreenplay,
    clearGeneratedText,
    setGeneratedText,
    triggerSave,
  } = useScreenplayStream(projectId)
  const { shots, isLoading: isLoadingShots, error: shotsError, generateShots, clearShots } = useShotSuggestions()
  const { references, isLoading: isLoadingReferences, error: referencesError, generateReferences, clearReferences } = useMovieReferences()
  const [showShots, setShowShots] = useState(false)
  const [showReferences, setShowReferences] = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [isImproving, setIsImproving] = useState(false)
  const [isContinuing, setIsContinuing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const [autoSavedData, setAutoSavedData] = useState<{ content: string; timestamp: string } | null>(null)
  const [hasGeneratedReferences, setHasGeneratedReferences] = useState(false)
  const lastConfigRef = useRef<SceneConfig | null>(null)

  // Load existing project on mount
  useEffect(() => {
    if (projectId) {
      setIsLoadingProject(true)
      fetch(`/api/projects/${projectId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setProject(data)
            // Load project content if available
            if (data.content) {
              setGeneratedText(data.content)
              // Generate references for loaded content
              generateReferences({
                screenplay: data.content,
                genre: data.genre,
                mood: data.mood,
                location: data.location,
              })
              setHasGeneratedReferences(true)
            }
            
            // Check for auto-saved content
            const autoSaved = getAutoSavedContent(projectId)
            if (autoSaved && autoSaved.content !== data.content) {
              setAutoSavedData(autoSaved)
              setShowRestorePrompt(true)
            }
          }
        })
        .catch(() => {
          // Ignore errors, user can still create new content
        })
        .finally(() => {
          setIsLoadingProject(false)
        })
    }
  }, [projectId, setGeneratedText, generateReferences])

  // Generate movie references when screenplay generation completes
  useEffect(() => {
    if (generatedText && !isGenerating && !hasGeneratedReferences) {
      const config = lastConfigRef.current
      generateReferences({
        screenplay: generatedText,
        genre: config?.genre,
        mood: config?.mood,
        characters: config?.characters,
        location: config?.location,
      })
      setHasGeneratedReferences(true)
    }
  }, [generatedText, isGenerating, hasGeneratedReferences, generateReferences])

  // Reset references when clearing screenplay
  const handleClearGeneratedText = useCallback(() => {
    clearGeneratedText()
    clearReferences()
    setHasGeneratedReferences(false)
  }, [clearGeneratedText, clearReferences])

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setShowLeftPanel(false)
        setShowReferences(false)
      } else {
        setShowLeftPanel(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleGenerate = (config: SceneConfig) => {
    clearReferences()
    setHasGeneratedReferences(false)
    clearGeneratedText()
    lastConfigRef.current = config
    generateScreenplay(config)
    if (isMobile) setShowLeftPanel(false)
  }

  const handleImproveDialogue = useCallback(async () => {
    if (!generatedText || isImproving) return
    setIsImproving(true)
    let improved = ""
    try {
      const res = await fetch("/api/improve-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenplay: generatedText }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let buffer = ""
      let streamDone = false
      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) { streamDone = true; break }
              if (data.content) improved += data.content
            } catch {}
          }
        }
      }
      if (improved.trim()) setGeneratedText(improved)
    } catch {}
    setIsImproving(false)
  }, [generatedText, isImproving, setGeneratedText])

  const handleGenerateNextScene = useCallback(async () => {
    if (!generatedText || isContinuing) return
    setIsContinuing(true)
    let continuation = ""
    try {
      const config = lastConfigRef.current
      const res = await fetch("/api/generate-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenplay: generatedText,
          genre: config?.genre,
          characters: config?.characters,
          mood: config?.mood,
        }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      let buffer = ""
      let streamDone = false
      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) { streamDone = true; break }
              if (data.content) continuation += data.content
            } catch {}
          }
        }
      }
      if (continuation.trim()) setGeneratedText(generatedText + "\n\n" + continuation)
    } catch {}
    setIsContinuing(false)
  }, [generatedText, isContinuing, setGeneratedText])

  const handleGenerateShots = async () => {
    if (!generatedText) return
    setShowShots(true)
    await generateShots(generatedText)
  }

  const handleCloseShots = () => {
    setShowShots(false)
    clearShots()
  }

  // Handle regenerating references
  const handleRegenerateReferences = useCallback(() => {
    if (generatedText) {
      const config = lastConfigRef.current
      generateReferences({
        screenplay: generatedText,
        genre: config?.genre,
        mood: config?.mood,
        characters: config?.characters,
        location: config?.location,
      })
    }
  }, [generatedText, generateReferences])

  return (
    <main className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cinematic-orange/[0.02] via-transparent to-cinematic-blue/[0.02]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Navbar initialIsAuthenticated />

      {/* Main Editor Area */}
      <div className="pt-16 h-screen relative z-10 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="lg:hidden h-9 w-9 p-0 text-white/70 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="w-9 h-9 rounded-lg bg-cinematic-orange/10 flex items-center justify-center border border-cinematic-orange/20">
              <Clapperboard className="w-4 h-4 text-cinematic-orange" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">
                {project?.title || "Untitled Screenplay"}
              </h1>
              <span className="text-[10px] text-muted-foreground">
                {isLoadingProject ? "Loading..." : project ? "Draft v1.0" : "New Project"}
              </span>
            </div>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            {/* References Toggle - Desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReferences(!showReferences)}
              className={cn(
                "hidden lg:flex text-xs gap-2 h-9",
                showReferences ? 'text-cinematic-orange bg-cinematic-orange/10' : 'text-muted-foreground hover:text-white'
              )}
            >
              <BookOpen className="w-4 h-4" />
              References
            </Button>

            <div className="hidden lg:block w-px h-4 bg-white/10 mx-1" />

            {/* Status Indicator */}
            {isGenerating ? (
              <span className="text-xs text-cinematic-orange flex items-center gap-2 bg-cinematic-orange/10 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cinematic-orange animate-pulse" />
                <span className="hidden sm:inline">Writing...</span>
              </span>
            ) : (
              <AutoSaveStatus
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            )}
          </div>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel - Scene Configuration */}
          <AnimatePresence mode="wait">
            {(showLeftPanel || !isMobile) && (
              <motion.div
                initial={isMobile ? { x: -320, opacity: 0 } : { opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={isMobile ? { x: -320, opacity: 0 } : { opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex-shrink-0 border-r border-white/10 bg-[#0a0a0a]/50 backdrop-blur flex flex-col z-20",
                  isMobile ? "absolute inset-y-0 left-0 w-[300px]" : "w-[280px] xl:w-[320px]"
                )}
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-cinematic-orange/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-cinematic-orange">01</span>
                    </div>
                    <h2 className="text-sm font-semibold text-white">Scene Config</h2>
                  </div>
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLeftPanel(false)}
                      className="h-8 w-8 p-0 text-white/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                
                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <SceneInputForm
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Overlay */}
          {isMobile && showLeftPanel && (
            <div 
              className="absolute inset-0 bg-black/50 z-10"
              onClick={() => setShowLeftPanel(false)}
            />
          )}

          {/* Center Panel - Editor */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]/30">
            {/* Editor Toolbar */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-3 lg:px-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cinematic-blue/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cinematic-blue">02</span>
                </div>
                <span className="text-sm font-medium text-white hidden sm:inline">Screenplay</span>
              </div>
              
              {generatedText && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isImproving}
                    onClick={handleImproveDialogue}
                    className="h-8 text-xs gap-1.5 text-cinematic-blue hover:text-cinematic-blue hover:bg-cinematic-blue/10 px-2 lg:px-3"
                  >
                    {isImproving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">Improve</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isContinuing}
                    onClick={handleGenerateNextScene}
                    className="h-8 text-xs gap-1.5 text-white/70 hover:text-white hover:bg-white/10 px-2 lg:px-3"
                  >
                    {isContinuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">Continue</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateShots}
                    disabled={isLoadingShots}
                    className="h-8 text-xs gap-1.5 text-cinematic-orange hover:text-cinematic-orange hover:bg-cinematic-orange/10 px-2 lg:px-3"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Shots</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-2 sm:p-4 overflow-hidden">
              <div className="h-full bg-[#0f0f0f] rounded-xl border border-white/10 overflow-hidden">
                <ScreenplayEditor
                  content={generatedText}
                  isGenerating={isGenerating}
                  onClear={handleClearGeneratedText}
                  onContentChange={setGeneratedText}
                  title={project?.title || "Untitled Screenplay"}
                  projectId={savedProjectId ?? project?.id ?? null}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Reference Scenes */}
          <AnimatePresence>
            {showReferences && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 340 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:flex flex-shrink-0 border-l border-white/10 bg-[#0a0a0a]/50 backdrop-blur flex-col overflow-hidden"
              >
                {/* Panel Header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-cinematic-orange/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-cinematic-orange">03</span>
                    </div>
                    <h2 className="text-sm font-semibold text-white">Movie References</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    {generatedText && !isLoadingReferences && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerateReferences}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
                        title="Regenerate references"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReferences(false)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Scenes List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* Loading State */}
                  {isLoadingReferences && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="w-10 h-10 rounded-full bg-cinematic-orange/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-cinematic-orange animate-spin" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Analyzing screenplay...<br />
                        Finding matching scenes
                      </p>
                    </div>
                  )}

                  {/* Error State */}
                  {referencesError && !isLoadingReferences && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <p className="text-xs text-red-400 text-center">
                        {referencesError}
                      </p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingReferences && !referencesError && references.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Film className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                        Generate a screenplay to see AI-powered movie references based on emotion, situation, and location
                      </p>
                    </div>
                  )}

                  {/* References List */}
                  {!isLoadingReferences && references.map((scene, index) => (
                    <ReferenceSceneCard
                      key={`${scene.movie}-${index}`}
                      movie={scene.movie}
                      scene={scene.scene}
                      youtubeId={scene.youtubeId}
                      thumbnail={scene.thumbnail}
                      description={scene.description}
                      matchReason={scene.matchReason}
                      index={index}
                    />
                  ))}
                </div>

                {/* Footer Info */}
                {references.length > 0 && !isLoadingReferences && (
                  <div className="px-4 py-2 border-t border-white/10 bg-white/[0.02]">
                    <p className="text-[10px] text-muted-foreground text-center">
                      Based on screenplay analysis • {references.length} matches found
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Menu */}
        <footer className="h-12 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur flex items-center justify-between px-3 lg:px-6 flex-shrink-0">
          {/* Left: Project Info */}
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/projects" 
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <div className="w-px h-4 bg-white/10 hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden md:inline">
              {generatedText ? `${generatedText.split(/\s+/).filter(Boolean).length} words` : "0 words"}
            </span>
            <span className="text-xs text-muted-foreground hidden lg:inline">
              · {Math.max(1, Math.ceil(generatedText.split(/\s+/).filter(Boolean).length / 250))} pages
            </span>
          </div>

          {/* Center: Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!generatedText}
              className="h-8 px-2 sm:px-3 text-xs text-muted-foreground hover:text-white disabled:opacity-30"
            >
              <Copy className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!generatedText}
              className="h-8 px-2 sm:px-3 text-xs text-muted-foreground hover:text-white disabled:opacity-30"
            >
              <Download className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!generatedText}
              className="h-8 px-2 sm:px-3 text-xs text-muted-foreground hover:text-white disabled:opacity-30"
            >
              <Share2 className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>

          {/* Right: Status & Settings */}
          <div className="flex items-center gap-2">
            {isGenerating && (
              <span className="text-xs text-cinematic-orange flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </span>
            )}
            {!isGenerating && (
              <AutoSaveStatusCompact
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            )}
            <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </footer>
      </div>

      {/* Shot Suggestions Modal */}
      {showShots && (
        <ShotSuggestions
          shots={shots}
          isLoading={isLoadingShots}
          error={shotsError}
          onClose={handleCloseShots}
          sceneTitle="Generated Scene"
        />
      )}

      {/* Auto-save Restore Prompt */}
      <AnimatePresence>
        {showRestorePrompt && autoSavedData && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-[#0f0f0f] border border-cinematic-orange/30 rounded-xl px-5 py-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cinematic-orange/10 flex items-center justify-center">
                  <Save className="w-5 h-5 text-cinematic-orange" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Unsaved changes found</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Auto-saved from {new Date(autoSavedData.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (projectId) {
                        clearAutoSavedContent(projectId)
                      }
                      setShowRestorePrompt(false)
                    }}
                    className="text-muted-foreground hover:text-white"
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setGeneratedText(autoSavedData.content)
                      if (projectId) {
                        clearAutoSavedContent(projectId)
                      }
                      setShowRestorePrompt(false)
                    }}
                    className="bg-cinematic-orange text-black hover:bg-cinematic-orange/90"
                  >
                    Restore
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default EditorPageWrapper
