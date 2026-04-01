"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ProjectCard } from "@/components/project-card"
import { CreateProjectModal } from "@/components/create-project-modal"
import { EmptyProjects } from "@/components/empty-projects"
import { CardSkeleton } from "@/components/loading-skeleton"
import { useUser } from "@/hooks/useUser"
import { useProjects } from "@/hooks/useProjects"
import type { Project } from "@/types/project"
import { mapDbProjectToUI } from "@/lib/map-db-project"
import { toUISubscription } from "@/lib/subscription"
import { SubscriptionPanel } from "@/components/subscription-panel"
import { useRouter } from "next/navigation"

export default function ProjectsPage() {
  const router = useRouter()
  const { subscription: dbSub, loading: userLoading } = useUser()
  const {
    projects: dbProjects,
    loading: projectsLoading,
    error: projectsError,
    createProject,
    deleteProject,
    refetch: refetchProjects,
  } = useProjects()

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const projects = dbProjects.map(mapDbProjectToUI)
  const isLoading = userLoading || projectsLoading

  const subscription = toUISubscription(dbSub, projects.length)
  const canCreateProject = projects.length < subscription.projectsLimit

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = useCallback(
    async (title: string, description: string) => {
      if (!canCreateProject) {
        alert("You have reached your project limit. Please upgrade your plan.")
        return
      }
      try {
        await createProject(title, description)
      } catch {
        /* projectsError set in hook */
      }
    },
    [canCreateProject, createProject]
  )

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id)
      } catch {
        /* projectsError set in hook */
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <DashboardSidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
          <div className="pl-14 lg:pl-6 pr-6 py-4">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">My Projects</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all your screenplay projects
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!canCreateProject || isLoading}
                className="bg-cinematic-orange text-black hover:bg-cinematic-orange/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {projectsError && (
            <div
              className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              role="alert"
            >
              <span>{projectsError}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-500/40 text-red-100 hover:bg-red-500/20 shrink-0"
                onClick={() => refetchProjects()}
              >
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                {filteredProjects.length === 0 ? (
                  <EmptyProjects onCreateClick={() => setIsCreateModalOpen(true)} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProjects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDelete={handleDeleteProject}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <SubscriptionPanel
                    subscription={subscription}
                    onUpgrade={() => router.push("/dashboard/subscription")}
                  />
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}
