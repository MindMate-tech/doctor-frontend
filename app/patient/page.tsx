"use client"

import usePatientStore from '@/store/patientStore'
import { PointCloudCanvas } from '@/components/brain/PointCloudCanvas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function PatientPage() {
  const { patient } = usePatientStore()

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-300 text-lg">No patient loaded</div>
          <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Patient Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{patient.patientName}</h1>
            <p className="text-sm text-slate-400">Brain Segment Condition by Score</p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-300 border-slate-700 w-fit">
            ID: {patient.patientId}
          </Badge>
        </div>

        {/* 3D Visualization Card */}
        <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Brain Segment Condition by Score</CardTitle>
          </CardHeader>
          <CardContent>
            <PointCloudCanvas regionScores={patient.brainRegions} pointDensity={6000} />

            {/* Region Scores */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(patient.brainRegions).map(([region, score]) => {
                const percentage = Math.round(score * 100)
                const colorClass = score <= 0.3 ? 'text-red-400' : score <= 0.5 ? 'text-orange-400' : score <= 0.7 ? 'text-yellow-400' : score <= 0.9 ? 'text-green-400' : 'text-cyan-400'

                return (
                  <div key={region} className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1 capitalize">
                      {region.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className={`text-lg font-semibold ${colorClass}`}>
                      {percentage}%
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
