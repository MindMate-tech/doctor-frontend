/**
 * Typed API client for MindMate backend
 * Handles all communication with the FastAPI backend
 */

// AI Analysis microservice (dedalus) - for cognitive analysis only
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';
// Next.js API routes - for patient CRUD operations
const API_URL = '/api';
const TIMEOUT_MS = 5000; // 5 second timeout

// Backend response types (matching FastAPI schemas)
export interface BackendPatient {
  patient_id: string;
  name: string;
  dob?: string;
  gender?: string;
  created_at: string;
}

export interface BackendSession {
  session_id: string;
  patient_id: string;
  session_date?: string;
  exercise_type?: string;
  transcript?: string;
  overall_score?: number;
  notable_events?: string[];
  created_at: string;
}

export interface BackendMemory {
  memory_id: string;
  patient_id: string;
  title: string;
  description: string;
  dateapprox?: string;
  location?: string;
  created_at: string;
}

export interface BackendPatientData {
  patientId: string;
  patientName: string;
  lastUpdated: string;
  brainRegions: {
    hippocampus: number;
    prefrontalCortex: number;
    brainStem: number;
    parietalLobe: number;
    amygdala: number;
    cerebellum: number;
  };
  memoryMetrics: {
    shortTermRecall: Array<{ timestamp: string; score: number }>;
    longTermRecall: Array<{ timestamp: string; score: number }>;
    semanticMemory: Array<{ timestamp: string; score: number }>;
    episodicMemory: Array<{ timestamp: string; score: number }>;
    workingMemory: Array<{ timestamp: string; score: number }>;
  };
  recentSessions: Array<{
    date: string;
    score: number;
    exerciseType: string;
    notableEvents: string[];
  }>;
  overallCognitiveScore: number;
  memoryRetentionRate: number;
}

export interface HealthResponse {
  status: string;
  message: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw error;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If response is not JSON, use status text
    }
    throw new ApiError(errorMessage, response.status);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

const api = {
  /**
   * Check if backend is available
   */
  async health(): Promise<HealthResponse> {
    try {
      const response = await fetchWithTimeout(`${AI_API_URL}/health`);
      return handleResponse<HealthResponse>(response);
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to connect to backend', 0);
    }
  },

  patients: {
    /**
     * List all patients
     */
    async list(): Promise<BackendPatient[]> {
      const response = await fetchWithTimeout(`${API_URL}/patients`);
      return handleResponse<BackendPatient[]>(response);
    },

    /**
     * Get a single patient by ID
     */
    async get(patientId: string): Promise<BackendPatient> {
      const response = await fetchWithTimeout(`${API_URL}/patients/${patientId}`);
      return handleResponse<BackendPatient>(response);
    },

    /**
     * Create a new patient
     */
    async create(data: {
      name: string;
      dob?: string;
      gender?: string;
    }): Promise<BackendPatient> {
      const response = await fetchWithTimeout(`${API_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<BackendPatient>(response);
    },

    /**
     * Get enriched cognitive data for a patient
     */
    async getCognitiveData(patientId: string): Promise<BackendPatientData> {
      const response = await fetchWithTimeout(
        `${API_URL}/patients/${patientId}/cognitive-data`
      );
      return handleResponse<BackendPatientData>(response);
    },
  },

  sessions: {
    /**
     * List all sessions
     */
    async list(): Promise<BackendSession[]> {
      const response = await fetchWithTimeout(`${API_URL}/sessions`);
      return handleResponse<BackendSession[]>(response);
    },

    /**
     * Create a new session
     */
    async create(data: {
      patient_id: string;
      session_date?: string;
      exercise_type?: string;
      transcript?: string;
      overall_score?: number;
      notable_events?: string[];
    }): Promise<BackendSession> {
      const response = await fetchWithTimeout(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<BackendSession>(response);
    },
  },

  memories: {
    /**
     * List all memories
     */
    async list(): Promise<BackendMemory[]> {
      const response = await fetchWithTimeout(`${API_URL}/memories`);
      return handleResponse<BackendMemory[]>(response);
    },

    /**
     * Create a new memory
     */
    async create(data: {
      title: string;
      description: string;
      patient_id: string;
      dateapprox?: string;
      location?: string;
      peopleinvolved?: string[];
      emotional_tone?: string;
      tags?: string[];
      significance_level?: number;
    }): Promise<BackendMemory> {
      const response = await fetchWithTimeout(`${API_URL}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return handleResponse<BackendMemory>(response);
    },
  },
};

export default api;
export { ApiError };

