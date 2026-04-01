"use client"

import { useCallback, useEffect, useState } from "react"
import type { ProjectListRow } from "@/types/database"

export interface UseProjectsReturn {
  projects: ProjectListRow[]
  loading: boolean
  error: string | null
  createProject: (
    title: string,
    description?: string,
    genre?: string
  ) => Promise<ProjectListRow>
  deleteProject: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json()
    if (typeof j?.error === "string") return j.error
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed"
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/projects", {
        credentials: "same-origin",
      })
      if (!res.ok) {
        setError(await parseError(res))
        setProjects([])
        return
      }
      const data = (await res.json()) as ProjectListRow[]
      setProjects(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects")
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = useCallback(
    async (
      title: string,
      description?: string,
      genre?: string
    ): Promise<ProjectListRow> => {
      setError(null)
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description ?? null,
          genre: genre ?? "drama",
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof json?.error === "string" ? json.error : "Failed to create project"
        setError(msg)
        throw new Error(msg)
      }
      const data = json as ProjectListRow
      setProjects((prev) => [data, ...prev])
      return data
    },
    []
  )

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    setError(null)
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      const msg =
        typeof json?.error === "string" ? json.error : "Failed to delete project"
      setError(msg)
      throw new Error(msg)
    }
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return {
    projects,
    loading,
    error,
    createProject,
    deleteProject,
    refetch: fetchProjects,
  }
}
