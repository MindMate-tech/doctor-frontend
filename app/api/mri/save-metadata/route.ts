import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status })

export async function POST(request: Request) {
  try {
    console.log('[API_MRI_SAVE] 🚀 NEW REQUEST RECEIVED')
    
    const body = await request.json()
    const { blobUrl, filename, fileSize, patientId, doctorId } = body

    console.log('[API_MRI_SAVE] 📋 Request data:')
    console.log('[API_MRI_SAVE]   - blobUrl:', blobUrl)
    console.log('[API_MRI_SAVE]   - filename:', filename)
    console.log('[API_MRI_SAVE]   - fileSize:', fileSize)
    console.log('[API_MRI_SAVE]   - patientId:', patientId)
    console.log('[API_MRI_SAVE]   - doctorId:', doctorId)

    if (!patientId) {
      return errorResponse('patientId is required.')
    }

    if (!blobUrl || !filename) {
      return errorResponse('blobUrl and filename are required.')
    }

    const finalDoctorId = doctorId || process.env.MRI_DEMO_DOCTOR_ID || null

    console.log('[API_MRI_SAVE] 💾 Inserting into database...')
    const dbStartTime = Date.now()

    const supabase = await getSupabaseAdmin()
    const { data: scan, error: dbError } = await supabase
      .from('mri_scans')
      .insert({
        patient_id: patientId,
        uploaded_by: finalDoctorId,
        storage_path: blobUrl,
        original_filename: filename,
        file_size_bytes: fileSize,
        mime_type: 'application/x-gzip',
        status: 'pending',
        analysis: {
          uploadedAt: new Date().toISOString(),
          uploadMethod: 'client-direct',
        },
      })
      .select()
      .single()

    const dbDuration = ((Date.now() - dbStartTime) / 1000).toFixed(2)
    console.log('[API_MRI_SAVE]   - duration:', dbDuration, 's')

    if (dbError) {
      console.error('[API_MRI_SAVE] ❌ Database error:', dbError)
      return errorResponse(`Database error: ${dbError.message}`, 500)
    }

    console.log('[API_MRI_SAVE] ✅ SUCCESS!')
    console.log('[API_MRI_SAVE] Scan record created:', scan)

    return NextResponse.json({ scan })
  } catch (error) {
    console.error('[API_MRI_SAVE] ❌ Error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to save MRI metadata',
      500
    )
  }
}
