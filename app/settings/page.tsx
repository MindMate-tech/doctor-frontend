"use client"

import React from 'react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>
        <div className="bg-slate-900 p-4 rounded border border-slate-800">
          <label className="block text-sm text-slate-300 mb-2">Demo options</label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input id="opt-poll" type="checkbox" className="h-4 w-4" defaultChecked />
              <label htmlFor="opt-poll" className="text-sm text-slate-200">Enable demo polling</label>
            </div>
            <div className="flex items-center gap-3">
              <input id="opt-highdensity" type="checkbox" className="h-4 w-4" />
              <label htmlFor="opt-highdensity" className="text-sm text-slate-200">High density point-cloud (for testing)</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
