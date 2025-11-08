import { useEffect, useRef, useState, useCallback } from 'react'
import usePatientStore from '../store/patientStore'
import type { PatientData, SnapshotRef } from '../types/patient'

type UsePatientPollingOptions = {
  enabled?: boolean
  intervalMs?: number
  patientId?: string
}

function clamp(n: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, n))
}

function avg(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * usePatientPolling
 * - Polls every `intervalMs` milliseconds (default 30s)
 * - Mutates a mock patient in-store to simulate live updates
 * - Adds a lightweight SnapshotRef occasionally to drive thumbnail comparisons
 *
 * This hook is intentionally backend-agnostic and easy to swap to a real API call later.
 */
export default function usePatientPolling(options: UsePatientPollingOptions = {}) {
  const { enabled = true, intervalMs = 30000, patientId } = options
  const intervalRef = useRef<number | null>(null)
  const pollCountRef = useRef(0)
  const [isPolling, setIsPolling] = useState(enabled)

  const patchPatient = usePatientStore((s) => s.patchPatient)
  const addSnapshot = usePatientStore((s) => s.addSnapshot)
  const getPatient = usePatientStore.getState

  const performMutation = useCallback(() => {
    const state = getPatient()
    const patient = state.patient
    if (!patient) return

    // Mutate brain region scores slightly
    const newRegions: Partial<PatientData['brainRegions']> = {}
    for (const key of Object.keys(patient.brainRegions) as Array<keyof typeof patient.brainRegions>) {
      const prev = patient.brainRegions[key] as number
      const delta = (Math.random() - 0.5) * 0.04 // +/- 2%
      newRegions[key] = clamp(prev + delta, 0, 1)
    }

    const overall = avg(Object.values(newRegions) as number[])

    // Prepare patch
    const patch: Partial<PatientData> = {
      brainRegions: { ...(patient.brainRegions as any), ...(newRegions as any) },
      overallCognitiveScore: overall,
      lastUpdated: new Date().toISOString(),
    }

    patchPatient(patch)

    // Occasionally add a snapshot ref (every 3 polls)
    pollCountRef.current += 1
    if (pollCountRef.current % 3 === 0) {
      const id = `mock-snap-${patientId ?? patient.patientId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const snap: SnapshotRef = {
        id,
        path: `/brain-data/${patientId ?? patient.patientId}/${id}.json`,
        timestamp: new Date().toISOString(),
        description: 'Auto-generated mock snapshot',
      }
      addSnapshot(snap)
    }
  }, [addSnapshot, patchPatient, patientId, getPatient])

  const start = useCallback(() => {
    if (intervalRef.current) return
    setIsPolling(true)
    // run immediately once
    performMutation()
    // then set interval
    // window.setInterval returns number in browser
    intervalRef.current = window.setInterval(() => {
      performMutation()
    }, intervalMs) as unknown as number
  }, [intervalMs, performMutation])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  useEffect(() => {
    if (enabled) start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { isPolling, start, stop }
}
