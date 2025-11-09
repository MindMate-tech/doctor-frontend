/**
 * Data transformation layer
 * Converts backend API responses to frontend data formats
 */

import { PatientData, TimeSeriesDataPoint, RecentSession } from '@/types/patient';
import { BackendPatientData, BackendPatient } from './client';

/**
 * Transform backend PatientData to frontend PatientData format
 */
export function transformPatientData(backendData: BackendPatientData): PatientData {
  // Transform memory metrics time series
  const transformTimeSeries = (
    points: Array<{ timestamp: string; score: number }>
  ): TimeSeriesDataPoint[] => {
    return points.map((point) => ({
      timestamp: point.timestamp,
      score: point.score,
    }));
  };

  // Transform recent sessions
  const transformRecentSessions = (
    sessions: Array<{
      date: string;
      score: number;
      exerciseType: string;
      notableEvents: string[];
    }>
  ): RecentSession[] => {
    return sessions.map((session) => ({
      date: session.date,
      timestamp: session.date, // Use date as timestamp if separate timestamp not provided
      score: session.score,
      exerciseType: session.exerciseType,
      notableEvents: session.notableEvents || [],
    }));
  };

  return {
    patientId: backendData.patientId,
    patientName: backendData.patientName,
    lastUpdated: backendData.lastUpdated,
    brainRegions: {
      hippocampus: backendData.brainRegions.hippocampus,
      prefrontalCortex: backendData.brainRegions.prefrontalCortex,
      brainStem: backendData.brainRegions.brainStem,
      parietalLobe: backendData.brainRegions.parietalLobe,
      amygdala: backendData.brainRegions.amygdala,
      cerebellum: backendData.brainRegions.cerebellum,
    },
    memoryMetrics: {
      shortTermRecall: transformTimeSeries(backendData.memoryMetrics.shortTermRecall),
      longTermRecall: transformTimeSeries(backendData.memoryMetrics.longTermRecall),
      semanticMemory: transformTimeSeries(backendData.memoryMetrics.semanticMemory),
      episodicMemory: transformTimeSeries(backendData.memoryMetrics.episodicMemory),
      workingMemory: transformTimeSeries(backendData.memoryMetrics.workingMemory),
    },
    recentSessions: transformRecentSessions(backendData.recentSessions),
    overallCognitiveScore: backendData.overallCognitiveScore,
    memoryRetentionRate: backendData.memoryRetentionRate,
  };
}

/**
 * Transform backend patient list item to a simple patient info object
 */
export function transformPatientListItem(backendPatient: BackendPatient) {
  return {
    id: backendPatient.patient_id,
    name: backendPatient.name,
    dob: backendPatient.dob,
    gender: backendPatient.gender,
    createdAt: backendPatient.created_at,
  };
}

