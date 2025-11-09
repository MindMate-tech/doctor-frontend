import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseAdmin();
    const { id } = await params;

    const { data: patient, error } = await supabase
      .from('patients')
      .select('patient_id, name, dob, gender, sex, created_at')
      .eq('patient_id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Patient not found', detail: error.message },
        { status: 404 }
      );
    }

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Transform to match the expected frontend format
    const transformedPatient = {
      patient_id: patient.patient_id,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender || patient.sex,
      created_at: patient.created_at,
    };

    return NextResponse.json(transformedPatient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', detail: errorMessage },
      { status: 500 }
    );
  }
}
