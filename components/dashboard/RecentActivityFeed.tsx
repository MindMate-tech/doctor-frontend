"use client"

import React from 'react'
import usePatientStore from '@/store/patientStore'
import type { RecentSession } from '@/types/patient'

type Props = {
  maxItems?: number
}

function timeAgo(iso?: string) {
  if (!iso) return 'Unknown'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function severityFromScore(score?: number) {
  if (score === undefined || score === null) return 'neutral'
  const v = score > 1 ? score / 100 : score
  if (v < 0.4) return 'critical'
  if (v < 0.6) return 'warning'
  return 'ok'
}

export default function RecentActivityFeed({ maxItems = 6 }: Props) {
  const sessions = usePatientStore((s) => s.patient?.recentSessions ?? [])

  if (!sessions || sessions.length === 0) {
    return <div className="p-4 text-sm text-slate-400">No recent activity.</div>
  }

  const items: RecentSession[] = sessions
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.timestamp ?? a.date ?? '').getTime() || 0
      const tb = new Date(b.timestamp ?? b.date ?? '').getTime() || 0
      return tb - ta
    })
    .slice(0, maxItems)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-3">
      <h3 className="text-sm font-medium text-white mb-2">Recent Activity</h3>
      <ul className="space-y-3">
        {items.map((it, idx) => {
          const sev = severityFromScore(it.score)
          const color = sev === 'critical' ? 'text-red-400' : sev === 'warning' ? 'text-orange-400' : 'text-green-400'
          const eventText = it.notableEvents && it.notableEvents.length ? it.notableEvents[0] : `${it.exerciseType} session`
          const time = it.timestamp ?? it.date
          const pct = it.score > 1 ? Math.round(it.score) : Math.round((it.score ?? 0) * 100)

          return (
            <li key={idx} className="flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-full mt-1 ${sev === 'critical' ? 'bg-red-500' : sev === 'warning' ? 'bg-orange-400' : 'bg-green-500'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white font-medium">{eventText}</div>
                  <div className={`text-xs font-mono ${color}`}>{pct}%</div>
                </div>
                <div className="text-xs text-slate-400">{timeAgo(time)}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
