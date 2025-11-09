/**
 * Mock data generators for MRI and Voice analysis APIs
 * Use these for testing when the actual APIs are unavailable or for development
 */

// Types matching the actual API responses
export type MRIStructure = {
  volume_mm3: number
  normalized: number
}

export type MRIAnalysisResponse = {
  structures: {
    hippocampus: MRIStructure
    ventricles: MRIStructure
    temporal_lobe: MRIStructure
    brain_volume: MRIStructure
    gray_matter: MRIStructure
  }
  clinical_summary?: string
}

export type VoiceAnalysisResponse = {
  prediction: 'dementia' | 'healthy'
  confidence: number
  probabilities: {
    dementia: number
    healthy: number
  }
  features?: {
    speech_rate: number
    pause_duration: number
    voice_tremor: number
  }
}

/**
 * Generate mock MRI analysis data based on patient age and sex
 * Mimics the output from models/tools/mri_analysis.py
 */
export function generateMockMRIAnalysis(age: number = 50, sex: string = 'Male'): MRIAnalysisResponse {
  // Base ICV (intracranial volume) - typically around 1,500,000 mm³
  const icv = 1500000

  // Age-based adjustments (brain volume decreases with age)
  const ageFactor = Math.max(0.7, 1 - (age - 20) * 0.004) // ~0.4% decrease per year after 20

  // Sex-based adjustments (males typically have slightly larger volumes)
  const sexFactor = sex.toLowerCase() === 'male' ? 1.1 : 1.0

  // Generate random variation (±10%)
  const randomVariation = () => 0.9 + Math.random() * 0.2

  // Calculate volumes with realistic variations
  const hippocampusVolume = 7200 * ageFactor * sexFactor * randomVariation()
  const ventriclesVolume = 25000 * (2 - ageFactor) * randomVariation() // Ventricles enlarge with age
  const temporalLobeVolume = 145000 * ageFactor * sexFactor * randomVariation()
  const brainVolume = icv * ageFactor * sexFactor * randomVariation()
  const grayMatterVolume = 600000 * ageFactor * sexFactor * randomVariation()

  const structures = {
    hippocampus: {
      volume_mm3: parseFloat(hippocampusVolume.toFixed(2)),
      normalized: parseFloat((hippocampusVolume / icv).toFixed(6))
    },
    ventricles: {
      volume_mm3: parseFloat(ventriclesVolume.toFixed(2)),
      normalized: parseFloat((ventriclesVolume / icv).toFixed(6))
    },
    temporal_lobe: {
      volume_mm3: parseFloat(temporalLobeVolume.toFixed(2)),
      normalized: parseFloat((temporalLobeVolume / icv).toFixed(6))
    },
    brain_volume: {
      volume_mm3: parseFloat(brainVolume.toFixed(2)),
      normalized: parseFloat((brainVolume / icv).toFixed(6))
    },
    gray_matter: {
      volume_mm3: parseFloat(grayMatterVolume.toFixed(2)),
      normalized: parseFloat((grayMatterVolume / icv).toFixed(6))
    }
  }

  // Generate clinical summary based on hippocampal volume
  let clinical_summary = "Volumetric measures within expected range."
  const hippocampusNormalized = structures.hippocampus.normalized

  if (hippocampusNormalized < 0.003) {
    clinical_summary = "MRI findings: significant hippocampal atrophy."
  } else if (hippocampusNormalized < 0.004) {
    clinical_summary = "MRI findings: mild hippocampal volume reduction."
  }

  return {
    structures,
    clinical_summary
  }
}

/**
 * Generate mock voice analysis data
 * Mimics the output from https://voice-models.onrender.com/predict
 */
export function generateMockVoiceAnalysis(simulateDementia: boolean = false): VoiceAnalysisResponse {
  // Generate probabilities
  let dementiaProbability: number
  let healthyProbability: number

  if (simulateDementia) {
    // Simulate high dementia risk
    dementiaProbability = 0.65 + Math.random() * 0.3 // 65-95%
    healthyProbability = 1 - dementiaProbability
  } else {
    // Simulate low dementia risk
    dementiaProbability = 0.05 + Math.random() * 0.25 // 5-30%
    healthyProbability = 1 - dementiaProbability
  }

  const prediction = dementiaProbability > 0.5 ? 'dementia' : 'healthy'
  const confidence = Math.max(dementiaProbability, healthyProbability)

  return {
    prediction,
    confidence: parseFloat(confidence.toFixed(4)),
    probabilities: {
      dementia: parseFloat(dementiaProbability.toFixed(4)),
      healthy: parseFloat(healthyProbability.toFixed(4))
    },
    features: {
      speech_rate: parseFloat((120 + (Math.random() - 0.5) * 40).toFixed(2)), // words per minute
      pause_duration: parseFloat((0.5 + Math.random() * 1.5).toFixed(2)), // seconds
      voice_tremor: parseFloat((Math.random() * 0.5).toFixed(3)) // 0-0.5 scale
    }
  }
}

/**
 * Simulate API delay (useful for testing loading states)
 */
export async function simulateDelay(minMs: number = 1000, maxMs: number = 3000): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs)
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Mock MRI analysis API call with realistic delay
 */
export async function mockMRIAnalysisAPI(
  file: File,
  age: number = 50,
  sex: string = 'Male'
): Promise<MRIAnalysisResponse> {
  console.log('[MOCK] MRI Analysis API called with:', { fileName: file.name, age, sex })

  await simulateDelay(2000, 5000) // 2-5 seconds

  const result = generateMockMRIAnalysis(age, sex)
  console.log('[MOCK] MRI Analysis result:', result)

  return result
}

/**
 * Mock voice analysis API call with realistic delay
 */
export async function mockVoiceAnalysisAPI(file: File): Promise<VoiceAnalysisResponse> {
  console.log('[MOCK] Voice Analysis API called with:', { fileName: file.name })

  await simulateDelay(1000, 4000) // 1-4 seconds (simulating cold start)

  // Randomly decide if it should simulate dementia (30% chance)
  const simulateDementia = Math.random() < 0.3

  const result = generateMockVoiceAnalysis(simulateDementia)
  console.log('[MOCK] Voice Analysis result:', result)

  return result
}

// Example usage and test data
export const EXAMPLE_MRI_RESPONSES = {
  // Young, healthy patient
  youngHealthy: generateMockMRIAnalysis(25, 'Female'),

  // Middle-aged patient
  middleAged: generateMockMRIAnalysis(55, 'Male'),

  // Elderly patient with mild atrophy
  elderlyMild: generateMockMRIAnalysis(75, 'Female'),

  // Patient with significant atrophy
  significantAtrophy: {
    structures: {
      hippocampus: { volume_mm3: 4200.0, normalized: 0.0028 },
      ventricles: { volume_mm3: 65000.0, normalized: 0.0433 },
      temporal_lobe: { volume_mm3: 98000.0, normalized: 0.0653 },
      brain_volume: { volume_mm3: 1200000.0, normalized: 0.8 },
      gray_matter: { volume_mm3: 420000.0, normalized: 0.28 }
    },
    clinical_summary: "MRI findings: significant hippocampal atrophy."
  }
}

export const EXAMPLE_VOICE_RESPONSES = {
  // Healthy patient
  healthy: generateMockVoiceAnalysis(false),

  // Patient with dementia indicators
  dementia: generateMockVoiceAnalysis(true),

  // Borderline case
  borderline: {
    prediction: 'healthy' as const,
    confidence: 0.5234,
    probabilities: {
      dementia: 0.4766,
      healthy: 0.5234
    },
    features: {
      speech_rate: 105.4,
      pause_duration: 1.2,
      voice_tremor: 0.234
    }
  }
}
