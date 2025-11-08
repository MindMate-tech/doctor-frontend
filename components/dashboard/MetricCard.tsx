"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TimeSeriesDataPoint } from '../../types/patient'

type TrendData = number[] | TimeSeriesDataPoint[]

type MetricCardProps = {
  title: string
  value: number
  unit?: string
  percent?: boolean
  baseline?: number
  trend?: TrendData
  className?: string
}

function formatValue(v: number, percent?: boolean) {
  if (percent) return `${Math.round(v * 100)}%`
  if (v <= 1) return v.toFixed(2)
  return String(v)
}

function computeDeltaString(current: number, baseline?: number) {
  if (baseline === undefined || baseline === null) return null
  if (baseline === 0) return null
  const delta = ((current - baseline) / baseline) * 100
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

function Arrow({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground">—</span>
  if (delta > 0) return <span className="text-green-500">▲</span>
  if (delta < 0) return <span className="text-red-500">▼</span>
  return <span className="text-muted-foreground">—</span>
}

function Sparkline({ data }: { data?: TrendData }) {
  if (!data || data.length === 0) return <div className="w-24 h-6" />
  const nums: number[] = (data as TrendData).map((d) => (typeof d === 'number' ? d : (d as TimeSeriesDataPoint).score))
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  const points = nums
    .map((n, i) => {
      const x = (i / (nums.length - 1)) * 100
      const y = max === min ? 50 : 100 - ((n - min) / (max - min)) * 100
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg className="w-24 h-6" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke="#60a5fa" strokeWidth={2} points={points} />
    </svg>
  )
}

export default function MetricCard({ title, value, unit, percent, baseline, trend, className = '' }: MetricCardProps) {
  const deltaString = baseline !== undefined && baseline !== null ? computeDeltaString(value, baseline) : null
  const deltaNumeric = deltaString ? parseFloat(deltaString.replace('%', '')) : null

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              <div className="text-2xl font-semibold text-foreground">
                {formatValue(value, percent)} {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
              </div>
            </CardDescription>
          </div>

          <div className="text-right">
            <div className="text-sm text-muted-foreground">Change</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <Arrow delta={deltaNumeric} />
              <div className={`text-sm ${deltaNumeric && deltaNumeric > 0 ? 'text-green-600' : deltaNumeric && deltaNumeric < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {deltaString ?? 'N/A'}
              </div>
            </div>
            {percent ? <Badge className="mt-2">Percent</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {trend && trend.length ? <Sparkline data={trend} /> : <Skeleton className="w-24 h-6" />}
      </CardContent>
    </Card>
  )
}
