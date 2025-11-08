"use client"

import usePatientStore from '@/store/patientStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function SnapshotsPage() {
  const { patient } = usePatientStore()

  const snaps = patient?.snapshots ?? []

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link
                href="/patient"
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                ← Back to 3D Viewer
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-white">Brain Scan Snapshots</h1>
            <p className="text-sm text-slate-400 mt-1">
              {patient ? `Saved visualizations for ${patient.patientName}` : 'Loading...'}
            </p>
          </div>
          {patient && (
            <Badge variant="outline" className="text-xs text-slate-300 border-slate-700 w-fit">
              ID: {patient.patientId}
            </Badge>
          )}
        </div>

        {snaps.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">No snapshots yet</h3>
              <p className="text-sm text-slate-400 text-center max-w-md">
                Brain scan snapshots will appear here once they are created. Visit the 3D viewer to capture new snapshots.
              </p>
              <Link
                href="/patient"
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go to 3D Viewer
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snaps.map((s) => (
              <Card
                key={s.id}
                className="bg-slate-900/50 border-slate-800 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-xl"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-white flex items-start justify-between">
                    <span className="truncate">{s.description ?? s.id}</span>
                    <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">JSON</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    {new Date(s.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 font-mono truncate" title={s.path}>
                      {s.path}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" className="flex-1 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors">
                        View
                      </button>
                      <button type="button" className="flex-1 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors">
                        Compare
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
