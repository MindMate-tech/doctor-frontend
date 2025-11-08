"use client"

import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-slate-900/90 border-t border-slate-700/40 text-slate-300">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm">© {new Date().getFullYear()} MindMate.tech — Cognitive Health Monitor</div>
        <div className="flex items-center gap-4 text-sm">
          <a href="/about" className="hover:underline">About</a>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </div>
      </div>
    </footer>
  )
}
