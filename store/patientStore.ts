import { create } from 'zustand'
import { PatientData, SnapshotRef } from '../types/patient'

type PatientStore = {
  patient: PatientData | null
  setPatient: (p: PatientData) => void
  patchPatient: (patch: Partial<PatientData>) => void
  addSnapshot: (snapshot: SnapshotRef) => void
  getPreviousSnapshots: (count?: number) => SnapshotRef[]
  clearPatient: () => void
}

/**
 * Minimal patient store using Zustand.
 * - Keeps a single patient in memory (MVP)
 * - Supports setting, patching, and adding lightweight snapshot refs
 * - Exposes a helper to read the most recent snapshots
 */
export const usePatientStore = create<PatientStore>((set, get) => ({
  patient: null,

  setPatient: (p: PatientData) => {
    set({ patient: p })
  },

  patchPatient: (patch: Partial<PatientData>) => {
    set((state) => {
      if (!state.patient) return state
      // shallow merge for top-level fields; merge brainRegions if provided
      const merged = { ...state.patient, ...patch }
      if (patch.brainRegions && state.patient.brainRegions) {
        merged.brainRegions = { ...state.patient.brainRegions, ...patch.brainRegions }
      }
      return { patient: merged }
    })
  },

  addSnapshot: (snapshot: SnapshotRef) => {
    set((state) => {
      if (!state.patient) return state
      const existing = state.patient.snapshots ?? []
      // add newest at head
      const snapshots = [snapshot, ...existing]
      // keep previousSnapshots as convenience (first two)
      const previousSnapshots = snapshots.slice(0, 2)
      return { patient: { ...state.patient, snapshots, previousSnapshots } }
    })
  },

  getPreviousSnapshots: (count = 2) => {
    const p = get().patient
    if (!p) return []
    const snaps = p.previousSnapshots ?? p.snapshots ?? []
    return snaps.slice(0, count)
  },

  clearPatient: () => set({ patient: null }),
}))

export default usePatientStore