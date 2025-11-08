
export interface BrainRegionScores {
  hippocampus: number;
  prefrontalCortex: number;
  brainStem: number;
  parietalLobe: number;
  amygdala: number;
  cerebellum: number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  score: number;
}

export interface MemoryMetrics {
  shortTermRecall: TimeSeriesDataPoint[];
  longTermRecall: TimeSeriesDataPoint[];
  semanticMemory: TimeSeriesDataPoint[];
  episodicMemory: TimeSeriesDataPoint[];
  workingMemory: TimeSeriesDataPoint[];
}

export interface RecentSession {
  date: string;
  score: number;
  exerciseType: string;
  notableEvents: string[];
}

export interface PatientData {
  patientId: string;
  patientName: string;
  lastUpdated: string;
  brainRegions: BrainRegionScores;
  memoryMetrics: MemoryMetrics;
  recentSessions: RecentSession[];
  overallCognitiveScore: number;
  memoryRetentionRate: number;
}

export type BrainRegionKey = keyof BrainRegionScores;