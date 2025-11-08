"use client"

import React from 'react'
import usePatientStore from '@/store/patientStore'
import { PointCloudCanvas } from '@/components/brain/PointCloudCanvas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PatientPage() {
  const { patient } = usePatientStore()

  if (!patient) return <div className="min-h-screen flex items-center justify-center text-white">No patient loaded</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-8">
        <Card className="mb-6 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">3D Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            <PointCloudCanvas regionScores={patient.brainRegions} pointDensity={6000} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
