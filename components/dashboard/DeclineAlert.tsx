"use client"

import React from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import usePatientStore from '@/store/patientStore'

type Props = {
  threshold?: number
}

export default function DeclineAlert({ threshold = 0.4 }: Props) {
  const patient = usePatientStore((s) => s.patient)
  if (!patient) return null

  const overall = patient.overallCognitiveScore ?? 0
  // defensive: if overall appears scaled to 0..100, normalize
  const normOverall = overall > 1 ? overall / 100 : overall

  if (normOverall >= threshold) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" />
      </svg>
      <AlertTitle>Significant cognitive decline detected</AlertTitle>
      <AlertDescription>
        <p>
          The patient&apos;s overall cognitive score is {(normOverall * 100).toFixed(0)}% — below the threshold of {(threshold * 100).toFixed(0)}%.
        </p>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            View History
          </Button>
          <Button variant="destructive" size="sm" onClick={() => alert('Schedule follow-up (placeholder)')}>
            Schedule Follow-up
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
