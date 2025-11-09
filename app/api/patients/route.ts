import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await getSupabaseAdmin();

    const { data: patients, error } = await supabase
      .from('patients')
      .select('patient_id, name, dob, gender, sex, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch patients', detail: error.message },
        { status: 500 }
      );
    }

    // Transform to match the expected frontend format
    const transformedPatients = patients?.map((patient) => ({
      patient_id: patient.patient_id,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender || patient.sex,
      created_at: patient.created_at,
    })) || [];

    return NextResponse.json(transformedPatients);
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}
