"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Demo Settings */}
          <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Demo Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure demo and development options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-lg hover:bg-slate-800/60 transition-colors">
                <div className="flex-1">
                  <label htmlFor="opt-poll" className="text-sm font-medium text-slate-200 cursor-pointer">
                    Enable demo polling
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulates live patient data updates every 10 seconds
                  </p>
                </div>
                <input
                  id="opt-poll"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  defaultChecked
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-lg hover:bg-slate-800/60 transition-colors">
                <div className="flex-1">
                  <label htmlFor="opt-highdensity" className="text-sm font-medium text-slate-200 cursor-pointer">
                    High density point-cloud
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    Increases visualization quality with more particles (may impact performance)
                  </p>
                </div>
                <input
                  id="opt-highdensity"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">About</CardTitle>
              <CardDescription className="text-slate-400">
                Application information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Version</span>
                  <span className="text-slate-200 font-mono">0.1.0 (MVP)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Status</span>
                  <span className="text-green-400 font-medium">Demo Mode</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400">Platform</span>
                  <span className="text-slate-200">MindMate Cognitive Health Monitor</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
