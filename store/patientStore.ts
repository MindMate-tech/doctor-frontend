import { create } from 'zustand';
import type { PatientData } from '@/types/patient';

interface PatientStore {
  currentPatient: PatientData | null;
  isLoading: boolean;
  lastPolled: Date | null;
  
  // Actions
  setPatient: (patient: PatientData) => void;
  updateBrainRegions: (regions: PatientData['brainRegions']) => void;
  setLoading: (loading: boolean) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  // Initial state
  currentPatient: null,
  isLoading: false,
  lastPolled: null,
  
  // Actions
  setPatient: (patient) => set({
    currentPatient: patient,
    lastPolled: new Date(),
  }),
  
  updateBrainRegions: (regions) => set((state) => ({
    currentPatient: state.currentPatient
      ? { ...state.currentPatient, brainRegions: regions }
      : null,
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));