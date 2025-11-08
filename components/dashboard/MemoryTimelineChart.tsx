"use client"

import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { MemoryMetrics, TimeSeriesDataPoint } from '@/types/patient'

type Props = {
  memoryMetrics?: MemoryMetrics | null
  series?: Array<keyof MemoryMetrics>
  // choose a Tailwind height class for layout (avoid inline styles)
  heightClass?: string
}

/**
 * MemoryTimelineChart
 * - lightweight Recharts LineChart showing one or more memory time-series
 * - expects `memoryMetrics` from `types/patient`
 * - Client component (Recharts depends on browser APIs)
 */
export default function MemoryTimelineChart({ memoryMetrics, series = ['shortTermRecall', 'longTermRecall'], heightClass = 'h-56' }: Props) {
  const data = useMemo(() => {
    if (!memoryMetrics) return []

    // Collect timestamps across selected series and merge into a single sorted list
    const timestamps = new Set<string>()
    for (const s of series) {
      const arr = memoryMetrics[s] as TimeSeriesDataPoint[] | undefined
      if (!arr) continue
      for (const pt of arr) timestamps.add(pt.timestamp)
    }

    const tsArray = Array.from(timestamps).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    // Build points: { timestamp: '2025-11-08', shortTermRecall: 0.8, longTermRecall: 0.7 }
    return tsArray.map((ts) => {
      const point: Record<string, number | null | string> = { timestamp: new Date(ts).toLocaleDateString() }
      for (const s of series) {
        const arr = memoryMetrics[s] as TimeSeriesDataPoint[] | undefined
        if (!arr) {
          point[s as string] = null
          continue
        }
        const found = arr.find((p) => p.timestamp === ts)
        if (!found) {
          point[s as string] = null
        } else {
          // Some generators produce scores in 0..1, others in 0..100. Handle both safely:
          const raw = Number(found.score)
          const display = raw <= 1 ? Number((raw * 100).toFixed(1)) : Number(raw.toFixed(1))
          point[s as string] = display
        }
      }
      return point
    })
  }, [memoryMetrics, series])

  if (!memoryMetrics || data.length === 0) {
    return <div className="p-4 text-sm text-slate-400">No memory timeline data available.</div>
  }

  // Predefine colors for the common series names
  const colorMap: Record<string, string> = {
    shortTermRecall: '#60a5fa',
    longTermRecall: '#34d399',
    semanticMemory: '#f59e0b',
    episodicMemory: '#f97316',
    workingMemory: '#a78bfa',
  }
  // compute dynamic y-domain: find numeric values across series and clamp to [0,100]
  const numericVals: number[] = []
  for (const row of data) {
    for (const s of series) {
      const v = row[s as string]
      if (typeof v === 'number' && !Number.isNaN(v)) numericVals.push(v)
    }
  }

  let yMin = 0
  let yMax = 100
  if (numericVals.length) {
    const minV = Math.min(...numericVals)
    const maxV = Math.max(...numericVals)
    const range = maxV - minV
    // dynamic padding: 10% of range (or at least 2), so axis hugs the data more tightly
    const pad = Math.max(2, Math.round(range * 0.1))
    yMin = Math.max(0, Math.floor(minV - pad))
    yMax = Math.min(100, Math.ceil(maxV + pad))
    // ensure there's at least some range (fallback)
    if (yMax <= yMin) {
      yMin = Math.max(0, Math.floor(minV - 2))
      yMax = Math.min(100, Math.ceil(maxV + 2))
    }
  }

  return (
    <div className={`w-full ${heightClass}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
          <XAxis dataKey="timestamp" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis domain={[yMin, yMax]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip />
          <Legend />

          {series.map((s) => (
            <Line
              key={s as string}
              type="monotone"
              dataKey={s as string}
              stroke={colorMap[s as string] ?? '#60a5fa'}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


