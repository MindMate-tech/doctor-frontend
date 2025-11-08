"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SideBarProps {
  open: boolean
  onClose: () => void
}

export default function SideBar({ open, onClose }: SideBarProps) {
  // lock body scroll while sidebar is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const pathname = usePathname() || '/'

  const items = [
    { href: '/', label: 'Dashboard' },
    { href: '/patient', label: '3D Viewer' },
    { href: '/patient/snapshots', label: 'Snapshots' },
    { href: '/chat', label: 'Doctor Chat' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    // container controls pointer-events so underlying page isn't interactive when sidebar open
    <div
      role="dialog"
  aria-modal="true"
  aria-hidden={open ? 'false' : 'true'}
      className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
      />

      {/* sliding panel */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 left-0 h-full w-80 max-w-full bg-slate-900/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-slate-700/40">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white font-semibold">MindMate</div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-md hover:bg-slate-800/60 text-slate-200"
              >
                ✕
              </button>
            </div>
          </div>

          <nav className="p-4 overflow-auto flex-1" aria-label="Main">
            <ul className="space-y-2">
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + '/')
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      onClick={() => onClose()}
                      className={`block px-3 py-2 rounded-md ${active ? 'bg-slate-800/70 text-white' : 'text-slate-100 hover:bg-slate-800/60'}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {it.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="px-4 py-4 border-t border-slate-700/40">
            <div className="text-xs text-slate-400">Version 0.1 — Demo</div>
          </div>
        </div>
      </aside>
    </div>
  )
}
