"use client"

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

interface TopBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TopBar({ sidebarOpen, onToggleSidebar }: TopBarProps) {
  const [shrunk, setShrunk] = useState(false)

  const headerRef = useRef<HTMLElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Use a small hysteresis to avoid flicker around the threshold
    const onScroll = () => {
      const y = window.scrollY
      if (!shrunk && y > 48) setShrunk(true)
      else if (shrunk && y < 24) setShrunk(false)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [shrunk])

  // update CSS variable to match the visual height of the topbar (header or inner floating card)
  useEffect(() => {
    const updateOffset = () => {
      const headerRect = headerRef.current?.getBoundingClientRect()
      const innerRect = innerRef.current?.getBoundingClientRect()
      const top = headerRect ? headerRect.top : 0
      const bottom = Math.max(headerRect?.bottom ?? 0, innerRect?.bottom ?? 0)
      const height = Math.max(0, Math.ceil(bottom - top))
      try {
        // fallback to 80px if nothing measured
        document.documentElement.style.setProperty('--topbar-offset', height ? `${height}px` : '80px')
      } catch {
        // ignore in non-browser
      }
    }

    // run on next paint and on resize to handle layout changes
    updateOffset()
    const ro = new ResizeObserver(updateOffset)
    if (headerRef.current) ro.observe(headerRef.current)
    if (innerRef.current) ro.observe(innerRef.current)
    window.addEventListener('resize', updateOffset)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateOffset)
    }
  }, [shrunk])

  return (
    <header
      ref={(el) => { headerRef.current = el ?? null }}
      className={`fixed top-0 left-0 right-0 z-60 transition-all duration-300 flex items-center ${shrunk ? 'bg-transparent border-0 backdrop-blur-none' : 'backdrop-blur-md border-b border-slate-700/40 bg-slate-900/80'}`}
    >
      {/* inner wrapper changes shape when shrunk: full-width bar vs centered small rectangle */}
      <div ref={innerRef} className={`container mx-auto px-4 flex items-center gap-4 transition-all duration-300 ${shrunk ? 'absolute left-1/2 -translate-x-1/2 top-3 z-[70] w-full max-w-2xl rounded-xl p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/40 shadow-xl pointer-events-auto' : ''}`}> 
        <div className={`flex items-center gap-3 transition-all duration-300 ${shrunk ? 'w-full' : ''}`}>
          {/* Hamburger - always visible and accessible */}
          <button
            type="button"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-200 hover:bg-slate-800/60 active:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-100 transition-transform hover:scale-110">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className={`rounded-lg overflow-hidden shadow-md transition-all duration-300 ${shrunk ? 'w-10 h-10' : 'w-14 h-14'}`}>
            <Image src="/logo-mindmate.png" alt="MindMate" width={56} height={56} className="object-cover" loading="eager" style={{ width: 'auto', height: 'auto' }} />
          </div>

          {/* Title is visible only when not shrunk */}
          {!shrunk && (
            <div className="transition-all duration-300 animate-in fade-in slide-in-from-left-2">
              <div className="text-lg font-bold text-white leading-tight">MindMate.tech</div>
              <div className="text-xs text-slate-400">Cognitive Health Monitor</div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
