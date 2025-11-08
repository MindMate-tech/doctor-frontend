"use client"

import React from 'react'
import type { PatientData } from '@/types/patient'
import { getRecentSessions } from '@/store/selectors'

type Props = {
  patient: PatientData
}

function scoreToBadgeClass(score: number) {
  // map score 0..1 to a small set of Tailwind color classes (no inline styles)
  if (score <= 0.3) return 'bg-red-600'
  if (score <= 0.5) return 'bg-orange-500'
  if (score <= 0.7) return 'bg-yellow-400'
  if (score <= 0.9) return 'bg-green-400'
  return 'bg-cyan-400'
}

export default function MetricsList({ patient }: Props) {
  const sessions = getRecentSessions(patient, 3)
  const rawBaseline = sessions && sessions.length > 1 ? sessions[1].score : undefined
  const overallBaseline = rawBaseline && rawBaseline > 1 ? rawBaseline / 100 : rawBaseline

  const items = [
    {
      id: 'overall',
      label: 'Overall Cognitive',
      value: patient.overallCognitiveScore,
      percent: true,
      baseline: overallBaseline,
    },
    {
      id: 'memory',
      label: 'Memory Retention',
      value: patient.memoryRetentionRate / 100,
      percent: true,
      baseline: undefined,
    },
    {
      id: 'hippocampus',
      label: 'Hippocampus',
      value: patient.brainRegions.hippocampus,
      percent: true,
      baseline: undefined,
    },
  ]

  return (
    <div className="mb-6">
      <h2 className="text-sm text-slate-300 mb-2">Key Metrics</h2>
      <ul className="space-y-2">
        {items.map((it) => {
          const delta = it.baseline ? ((it.value - it.baseline) / (it.baseline || 1)) * 100 : null
          const arrow = delta === null ? '—' : delta > 0 ? '▲' : delta < 0 ? '▼' : '—'
          const badgeClass = scoreToBadgeClass(it.value)

          return (
            <li key={it.id} className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-md p-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-sm border border-slate-700 ${badgeClass}`} aria-hidden />
                <div>
                  <div className="text-sm text-slate-300">{it.label}</div>
                  <div className="text-white font-medium">
                    {it.percent ? Math.round(it.value * 100) + '%' : String(it.value)}
                  </div>
                </div>
              </div>

              <div className="text-right text-sm">
                <div className="text-slate-400">Change</div>
                <div className={`mt-1 ${delta && delta > 0 ? 'text-green-400' : delta && delta < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  <span className="mr-1">{arrow}</span>
                  {delta === null ? 'N/A' : `${delta.toFixed(1)}%`}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
