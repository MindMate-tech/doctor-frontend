"use client"

import React from 'react'
import usePatientStore from '@/store/patientStore'

export default function SnapshotsPage() {
  const { patient } = usePatientStore()

  const snaps = patient?.snapshots ?? []

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-4">Snapshots</h1>
        {snaps.length === 0 ? (
          <div className="text-slate-300">No snapshots saved for this patient.</div>
        ) : (
          <ul className="space-y-3">
            {snaps.map((s) => (
              <li key={s.id} className="bg-slate-900 p-3 rounded border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{s.description ?? s.id}</div>
                    <div className="text-xs text-slate-400">{new Date(s.timestamp).toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{s.path}</div>
                  </div>
                  <div className="text-xs text-slate-300">JSON</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
