import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseAdmin();
    const { id } = await params;

    // Fetch patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('patient_id, name, dob, gender, sex, created_at')
      .eq('patient_id', id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Fetch latest MRI scan with analysis
    const { data: mriScans } = await supabase
      .from('mri_scans')
      .select('analysis, processed_at')
      .eq('patient_id', id)
      .eq('status', 'completed')
      .order('processed_at', { ascending: false })
      .limit(1);

    // Extract brain regions from MRI analysis if available
    const latestMri = mriScans?.[0];
    const brainRegions = latestMri?.analysis?.regions || {
      hippocampus: 0.85,
      prefrontalCortex: 0.90,
      brainStem: 0.88,
      parietalLobe: 0.87,
      amygdala: 0.86,
      cerebellum: 0.89,
    };

    // Generate time series data for memory metrics (last 30 days)
    const generateTimeSeries = (baseScore: number, variance: number) => {
      const now = Date.now();
      return Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(now - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        score: Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * variance)),
      }));
    };

    // Fetch recent doctor records/sessions if available
    const { data: doctorRecords } = await supabase
      .from('doctor_records')
      .select('content, created_at, record_type, metadata')
      .eq('patient_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentSessions = doctorRecords?.map((record) => ({
      date: record.created_at,
      score: record.metadata?.overall_score || 75,
      exerciseType: record.record_type || 'assessment',
      notableEvents: record.metadata?.notable_events || [],
    })) || [];

    // Calculate overall cognitive score from brain regions
    const regionScores = Object.values(brainRegions) as number[];
    const overallCognitiveScore =
      regionScores.reduce((sum, score) => sum + score, 0) / regionScores.length;

    // Return structured cognitive data
    const cognitiveData = {
      patientId: patient.patient_id,
      patientName: patient.name,
      lastUpdated: latestMri?.processed_at || new Date().toISOString(),
      brainRegions,
      memoryMetrics: {
        shortTermRecall: generateTimeSeries(78, 15),
        longTermRecall: generateTimeSeries(82, 12),
        semanticMemory: generateTimeSeries(85, 10),
        episodicMemory: generateTimeSeries(76, 18),
        workingMemory: generateTimeSeries(80, 14),
      },
      recentSessions,
      overallCognitiveScore,
      memoryRetentionRate: Math.round(overallCognitiveScore * 100),
    };

    return NextResponse.json(cognitiveData);
  } catch (error) {
    console.error('Error fetching cognitive data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', detail: errorMessage },
      { status: 500 }
    );
  }
}
