
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
  // human-friendly date (optional) and canonical ISO timestamp for comparisons
  date?: string;
  timestamp?: string;
  score: number;
  exerciseType: string;
  notableEvents: string[];
  // optional reference to a visualization snapshot (public path or snapshot id)
  visualizationRef?: string;
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
  // lightweight references to saved visualization snapshots (e.g. files under /public/brain-data)
  snapshots?: SnapshotRef[];
  // convenience: two most recent snapshot refs for quick comparison
  previousSnapshots?: SnapshotRef[];
}

export type BrainRegionKey = keyof BrainRegionScores;

export interface SnapshotRef {
  id: string;
  // path under `public/` (e.g. '/brain-data/patient-1/snapshot-2025-11-08.json')
  path: string;
  // ISO timestamp of when the snapshot was captured
  timestamp: string;
  // optional short description or label
  description?: string;
}