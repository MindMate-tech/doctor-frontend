import type { PatientData, RecentSession, BrainRegionScores } from '../types/patient'
import usePatientStore from './patientStore'

// Pure helpers that operate on PatientData (or the store directly via convenience wrappers)

export function getBrainRegionScores(patient: PatientData | null): BrainRegionScores | null {
  if (!patient) return null
  return patient.brainRegions
}

export function computeOverallFromRegions(regions: BrainRegionScores | null): number {
  if (!regions) return 0
  const vals = Object.values(regions)
  if (!vals.length) return 0
  const sum = vals.reduce((a, b) => a + b, 0)
  return sum / vals.length
}

export function getTopRegions(patient: PatientData | null, count = 3) {
  if (!patient) return []
  return Object.entries(patient.brainRegions)
    .map(([k, v]) => ({ region: k, score: v }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

export function getBottomRegions(patient: PatientData | null, count = 3) {
  if (!patient) return []
  return Object.entries(patient.brainRegions)
    .map(([k, v]) => ({ region: k, score: v }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
}

export function getRecentSessions(patient: PatientData | null, count = 5): RecentSession[] {
  if (!patient) return []
  const sessions = patient.recentSessions ?? []
  // prefer timestamp sorting when available
  return sessions
    .slice()
    .sort((a, b) => {
      const ta = a.timestamp ?? a.date ?? ''
      const tb = b.timestamp ?? b.date ?? ''
      return new Date(tb).getTime() - new Date(ta).getTime()
    })
    .slice(0, count)
}

/**
 * Find the session closest to (now - windowDays). Returns null if none found.
 */
export function findSessionBeforeWindow(patient: PatientData | null, windowDays: number) {
  if (!patient) return null
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const sessions = (patient.recentSessions ?? []).slice()
  // filter sessions older than cutoff
  const older = sessions
    .map((s) => ({ s, t: new Date(s.timestamp ?? s.date ?? '').getTime() }))
    .filter(({ t }) => !Number.isNaN(t) && t <= cutoff)
    .sort((a, b) => Math.abs(a.t - cutoff) - Math.abs(b.t - cutoff))
  return older.length ? older[0].s : null
}

export type DeltaResult = {
  delta: number
  percentDelta: number | null
  arrow: 'up' | 'down' | 'flat'
}

/**
 * Compute delta and percent change between current and baseline scores (0..1)
 */
export function computeDelta(current: number, baseline: number, threshold = 0.005): DeltaResult {
  const delta = current - baseline
  let percentDelta: number | null = null
  if (baseline === 0) percentDelta = null
  else percentDelta = (delta / baseline) * 100

  const arrow = percentDelta === null ? 'flat' : percentDelta > threshold * 100 ? 'up' : percentDelta < -threshold * 100 ? 'down' : 'flat'
  return { delta, percentDelta, arrow }
}

// Convenience store-backed selectors
export function useSelectPatient() {
  return usePatientStore((s) => s.patient)
}

export function useSelectOverallComputed() {
  const p = usePatientStore((s) => s.patient)
  return computeOverallFromRegions(p ? p.brainRegions : null)
}

export function useSelectPreviousSnapshots(count = 2) {
  const p = usePatientStore((s) => s.patient)
  if (!p) return []
  return (p.previousSnapshots ?? p.snapshots ?? []).slice(0, count)
}
