/**
 * Format analysis results for display in chat interface
 */

export function formatMRIAnalysis(result: any, fileName: string, patientName?: string): string {
  const structures = result?.structures || {}
  const clinicalSummary = result?.clinical_summary || 'No clinical summary available.'

  const hippocampus = structures.hippocampus
  const ventricles = structures.ventricles
  const temporalLobe = structures.temporal_lobe
  const brainVolume = structures.brain_volume
  const grayMatter = structures.gray_matter

  // Determine risk level based on hippocampal volume
  let riskLevel = '✅ Normal'
  let riskColor = 'normal'

  if (hippocampus?.normalized < 0.003) {
    riskLevel = '⚠️ High Risk'
    riskColor = 'high'
  } else if (hippocampus?.normalized < 0.004) {
    riskLevel = '⚠️ Moderate Risk'
    riskColor = 'moderate'
  }

  return `## 🧠 MRI Analysis Complete

**File:** ${fileName}${patientName ? `\n**Patient:** ${patientName}` : ''}

### Clinical Assessment
${clinicalSummary}

**Risk Level:** ${riskLevel}

---

### Brain Structure Volumes

#### Hippocampus ${hippocampus?.normalized < 0.004 ? '⚠️' : '✓'}
- **Volume:** ${hippocampus?.volume_mm3?.toFixed(2) || 'N/A'} mm³
- **Normalized:** ${hippocampus?.normalized?.toFixed(6) || 'N/A'}
${hippocampus?.normalized < 0.003 ? '- **Note:** Significant atrophy detected' : hippocampus?.normalized < 0.004 ? '- **Note:** Mild volume reduction' : '- **Note:** Within expected range'}

#### Ventricles
- **Volume:** ${ventricles?.volume_mm3?.toFixed(2) || 'N/A'} mm³
- **Normalized:** ${ventricles?.normalized?.toFixed(6) || 'N/A'}

#### Temporal Lobe
- **Volume:** ${temporalLobe?.volume_mm3?.toFixed(2) || 'N/A'} mm³
- **Normalized:** ${temporalLobe?.normalized?.toFixed(6) || 'N/A'}

#### Total Brain Volume
- **Volume:** ${brainVolume?.volume_mm3?.toFixed(2) || 'N/A'} mm³
- **Normalized:** ${brainVolume?.normalized?.toFixed(2) || 'N/A'}

#### Gray Matter
- **Volume:** ${grayMatter?.volume_mm3?.toFixed(2) || 'N/A'} mm³
- **Normalized:** ${grayMatter?.normalized?.toFixed(6) || 'N/A'}

---

### Recommendations
${riskColor === 'high'
  ? '- **Immediate follow-up recommended**\n- Consider comprehensive cognitive assessment\n- Schedule neurologist consultation\n- Monitor for progression with repeat imaging in 6 months'
  : riskColor === 'moderate'
  ? '- Schedule follow-up in 6-12 months\n- Consider cognitive screening tests\n- Monitor for any cognitive changes\n- Lifestyle interventions may be beneficial'
  : '- Continue routine monitoring\n- Annual cognitive screening recommended\n- Maintain healthy lifestyle practices'
}
`
}

export function formatVoiceAnalysis(result: any, fileName: string, patientName?: string): string {
  const prediction = result?.prediction || 'unknown'
  const confidence = result?.confidence || 0
  const probabilities = result?.probabilities || {}
  const features = result?.features || {}

  const isDementia = prediction === 'dementia'
  const confidencePercent = (confidence * 100).toFixed(1)
  const dementiaProb = ((probabilities.dementia || 0) * 100).toFixed(1)
  const healthyProb = ((probabilities.healthy || 0) * 100).toFixed(1)

  // Determine risk level
  let riskLevel = ''
  let riskEmoji = ''

  if (probabilities.dementia >= 0.7) {
    riskLevel = 'High Risk'
    riskEmoji = '🔴'
  } else if (probabilities.dementia >= 0.5) {
    riskLevel = 'Moderate-High Risk'
    riskEmoji = '🟠'
  } else if (probabilities.dementia >= 0.3) {
    riskLevel = 'Moderate Risk'
    riskEmoji = '🟡'
  } else {
    riskLevel = 'Low Risk'
    riskEmoji = '🟢'
  }

  return `## 🎙️ Voice Analysis Complete

**File:** ${fileName}${patientName ? `\n**Patient:** ${patientName}` : ''}

### Prediction Results

**Overall Assessment:** ${riskEmoji} **${riskLevel}**

**Model Prediction:** ${isDementia ? '⚠️ Dementia Indicators Detected' : '✅ Healthy Speech Patterns'}
**Confidence:** ${confidencePercent}%

---

### Probability Scores

| Category | Probability |
|----------|-------------|
| Dementia Risk | **${dementiaProb}%** ${probabilities.dementia >= 0.5 ? '⚠️' : ''} |
| Healthy | **${healthyProb}%** ${probabilities.healthy >= 0.5 ? '✅' : ''} |

---

### Voice Features Analysis

#### Speech Rate
- **${features.speech_rate?.toFixed(1) || 'N/A'}** words per minute
${features.speech_rate < 100 ? '- ⚠️ Below normal range (may indicate cognitive slowing)' : features.speech_rate > 150 ? '- ℹ️ Above normal range' : '- ✓ Within normal range (100-150 wpm)'}

#### Pause Duration
- **${features.pause_duration?.toFixed(2) || 'N/A'}** seconds average
${features.pause_duration > 1.5 ? '- ⚠️ Prolonged pauses detected' : '- ✓ Normal pause patterns'}

#### Voice Tremor Index
- **${features.voice_tremor?.toFixed(3) || 'N/A'}** (scale: 0-0.5)
${features.voice_tremor > 0.3 ? '- ⚠️ Elevated tremor detected' : '- ✓ Minimal tremor'}

---

### Clinical Interpretation

${isDementia
  ? `The voice analysis model has detected patterns consistent with cognitive decline. Key findings include:

${features.speech_rate < 100 ? '- Reduced speech rate suggesting processing difficulties' : ''}
${features.pause_duration > 1.5 ? '- Increased pause duration indicating word-finding difficulties' : ''}
${features.voice_tremor > 0.3 ? '- Voice tremor patterns associated with neurodegenerative changes' : ''}

**Recommended Actions:**
- Comprehensive cognitive assessment
- In-depth clinical interview
- Consider additional diagnostic testing (MRI, neuropsychological evaluation)
- Monitor for progression over time`
  : `The voice analysis indicates normal speech patterns with low dementia probability. However, this should be considered alongside other clinical findings.

**Recommended Actions:**
- Continue routine cognitive monitoring
- Repeat analysis in 6-12 months if concerns arise
- Maintain baseline for future comparison`
}
`
}

export function createAnalysisMessage(
  type: 'mri' | 'voice',
  result: any,
  fileName: string,
  patientName?: string
): string {
  if (type === 'mri') {
    return formatMRIAnalysis(result, fileName, patientName)
  } else {
    return formatVoiceAnalysis(result, fileName, patientName)
  }
}
