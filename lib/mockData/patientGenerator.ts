import type { PatientData, BrainRegionScores, TimeSeriesDataPoint, MemoryMetrics, RecentSession } from "@/types/patient";

function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
} 

function generateTimeSeries(
    days: number,
    baseScore: number,
    trend: 'improving' | 'declining' | 'stable'
): TimeSeriesDataPoint[] {
    const data: TimeSeriesDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const progress = (days - i) / days;
        let calcultedScore = baseScore;
        const isoString = date.toISOString();
        if (trend === 'improving') {
            calcultedScore = baseScore - (30 * progress) + random(-5, 5);
        } else if (trend === 'declining') {
            calcultedScore = baseScore + (30 * progress) + random(-5, 5);
        } else {
            calcultedScore = baseScore + random(-5, 5);
        }

        data.push({
            timestamp: isoString,
            score: calcultedScore
        });
    }
    return data;
}

function generateBrainRegionScores(condition: 'healthy' | 'mild' | 'moderate' | 'severe'): BrainRegionScores {
    switch (condition) {
        case 'healthy':
            return {
                hippocampus: random(0.85, 1),
                prefrontalCortex: random(0.85, 1),
                brainStem: random(0.85, 1),
                parietalLobe: random(0.85, 1),
                amygdala: random(0.85, 1),
                cerebellum: random(0.85, 1),
            };
        case 'mild':
            return {
                hippocampus: random(0.60, 0.70),
                prefrontalCortex: random(0.70, 0.90),
                brainStem: random(0.70, 0.90),
                parietalLobe: random(0.70, 0.90),
                amygdala: random(0.70, 0.90),
                cerebellum: random(0.70, 0.90),
            };
        case 'moderate':
            return {
                hippocampus: random(0.40, 0.50),
                prefrontalCortex: random(0.60, 0.80),
                brainStem: random(0.50, 0.60),
                parietalLobe: random(0.60, 0.80),
                amygdala: random(0.60, 0.80),
                cerebellum: random(0.60, 0.80),
            };
        case 'severe':
            return {
                hippocampus: random(0.20, 0.30),
                prefrontalCortex: random(0.40, 0.60),
                brainStem: random(0.30, 0.40),
                parietalLobe: random(0.40, 0.60),
                amygdala: random(0.40, 0.60),
                cerebellum: random(0.40, 0.60),
            };
        default:
            throw new Error('Unknown condition');
    }

}

function generateRecentSessions(condition: 'healthy' | 'mild' | 'moderate' | 'severe'): RecentSession[] {
    const exerciseTypes = ['Word Recall', 'Pattern Recognition', 'Story Retelling', 'Number Sequence', 'Face-Name Association'];
    const positiveEvents = ['Excellent long-term recall', 'Improved from last session', 'Strong engagement', 'Quick response times'];
    const negativeEvents = ['Struggled with recent memories', 'Confused temporal sequence', 'Required multiple prompts', 'Showed frustration'];

    //Deterine baseScore range based on condition
    let baseScoreRange: [number, number];
    switch (condition) {
        case 'healthy':
            baseScoreRange = [0.80, 1];
            break;
        case 'mild':
            baseScoreRange = [0.60, 0.80];
            break;
        case 'moderate':
            baseScoreRange = [0.40, 0.60];
            break;
        case 'severe':
            baseScoreRange = [0.20, 0.40];
            break;
        default:
            baseScoreRange = [0.50, 0.70];
    }

    //Generate 5 recent sessions
    const sessions: RecentSession[] = [];
    for (let i = 5; i >= 1; i--) {
        const date = new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000); //Every 3 days
        const score = random(baseScoreRange[0], baseScoreRange[1]);
        const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

        //Determine notable events based on score
        const notableEvents: string[] = [];
        if (score > (baseScoreRange[1] - 10)) {
            notableEvents.push(positiveEvents[Math.floor(Math.random() * positiveEvents.length)]);
        } else if (score < (baseScoreRange[0] + 10)) {
            notableEvents.push(negativeEvents[Math.floor(Math.random() * negativeEvents.length)]);
        }
        
        sessions.push({
            date: date.toISOString(),
            timestamp: date.toISOString(),
            score,
            exerciseType,
            notableEvents
        });
    }

    return sessions.sort((a, b) => new Date(b.timestamp ?? b.date ?? 0).getTime() - new Date(a.timestamp ?? a.date ?? 0).getTime());
}

export function generateMockPatient(patientId: string, condition: 'healthy' | 'mild' | 'moderate' | 'severe'): PatientData {
    const brainRegions = generateBrainRegionScores(condition);
    //calculate overall cognitive score as average of brain region scores
    const overallCognitiveScore = Math.round(Object.values(brainRegions).reduce((a, b) => a + b, 0) / Object.values(brainRegions).length);

    const memoryMetrics: MemoryMetrics = {
        shortTermRecall: generateTimeSeries(30, overallCognitiveScore, condition === 'healthy' ? 'stable' : condition === 'mild' ? 'declining' : 'declining'),
        longTermRecall: generateTimeSeries(30, overallCognitiveScore - 5, condition === 'healthy' ? 'stable' : condition === 'mild' ? 'declining' : 'declining'),
        semanticMemory: generateTimeSeries(30, overallCognitiveScore - 10, condition === 'healthy' ? 'stable' : condition === 'mild' ? 'declining' : 'declining'),
        episodicMemory: generateTimeSeries(30, overallCognitiveScore - 15, condition === 'healthy' ? 'stable' : condition === 'mild' ? 'declining' : 'declining'),
        workingMemory: generateTimeSeries(30, overallCognitiveScore - 5, condition === 'healthy' ? 'stable' : condition === 'mild' ? 'declining' : 'declining'),
    };

    //calculate memory retention rate as a most recent score compared to old score
    const recentScore = memoryMetrics.longTermRecall[memoryMetrics.longTermRecall.length - 1].score;
    const oldScore = memoryMetrics.longTermRecall[0].score;
    const memoryRetentionRate = Math.max(0, Math.min(100, Math.round((recentScore / oldScore) * 100)));

    const recentSessions = generateRecentSessions(condition);
    
    // Generate patient names
    const names = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Mary Williams'];
    const patientName = names[parseInt(patientId.slice(-1)) % names.length] || 'Patient ' + patientId;

    return {
        patientId,
        patientName,
        lastUpdated: new Date().toISOString(),
        brainRegions,
        memoryMetrics,
        recentSessions,
        overallCognitiveScore,
        memoryRetentionRate
    };
}

    
export const MOCK_PATIENTS = {
    healthy: generateMockPatient('P001', 'healthy'),
    mild: generateMockPatient('P002', 'mild'),
    moderate: generateMockPatient('P003', 'moderate'),
    severe: generateMockPatient('P004', 'severe'),
};