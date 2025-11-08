"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import TopBar from './TopBar'
import SideBar from './SideBar'

export default function GlobalNav({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const pathname = usePathname()

  // Hide navigation on landing page
  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    return <>{children}</>
  }

  return (
    <>
      <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((s) => !s)} />
      <SideBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/*
        Instead of a separate spacer element, apply padding-top to the main
        content using the same --topbar-offset CSS variable. This ensures all
        pages are shifted down consistently and automatically when the topbar
        changes size (shrinks/expands).
      */}
      <main style={{ paddingTop: 'var(--topbar-offset, 80px)' }}>
        {children}
      </main>
    </>
  )
}
