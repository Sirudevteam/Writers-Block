"use client"

import { createContext, useContext } from "react"

const DashboardAdminContext = createContext(false)

export function DashboardAdminProvider({
  showAdminLink,
  children,
}: {
  showAdminLink: boolean
  children: React.ReactNode
}) {
  return (
    <DashboardAdminContext.Provider value={showAdminLink}>
      {children}
    </DashboardAdminContext.Provider>
  )
}

export function useDashboardAdminLink(): boolean {
  return useContext(DashboardAdminContext)
}
