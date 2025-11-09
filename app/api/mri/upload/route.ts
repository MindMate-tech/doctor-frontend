import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { put } from '@vercel/blob'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB (Vercel Blob limit on Hobby plan)
const ACCEPTED_EXTENSIONS = ['.dcm', '.nii', '.nii.gz', '.zip']

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ message }, { status })

const sanitizeFilename = (name: string) => {
  const lower = name.toLowerCase()
  const safe = lower.replace(/[^a-z0-9.\-_]/g, '-')
  return safe.length > 0 ? safe.slice(-120) : `scan-${Date.now()}`
}

const hasAllowedExtension = (filename: string) => {
  const lower = filename.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('Expected multipart/form-data payload.')
    }

    const form = await request.formData()
    const file = form.get('file')
    const patientId = form.get('patientId')?.toString().trim()
    const doctorId =
      form.get('doctorId')?.toString().trim() || process.env.MRI_DEMO_DOCTOR_ID || null

    if (!patientId) {
      return errorResponse('patientId is required.')
    }

    if (!(file instanceof File)) {
      return errorResponse('file is required.')
    }

    if (file.size === 0) {
      return errorResponse('Uploaded file is empty.')
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File exceeds the 500MB limit.', 413)
    }

    if (!hasAllowedExtension(file.name)) {
      return errorResponse('File must be DICOM (.dcm), NIfTI (.nii/.nii.gz), or ZIP.')
    }

    // Upload to Vercel Blob
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${patientId}/${timestamp}-${randomBytes(6).toString('hex')}-${sanitizeFilename(file.name)}`

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || 'application/octet-stream',
    })

    if (!blob || !blob.url) {
      console.error('[MRI_UPLOAD][blob] Failed to get blob URL')
      return errorResponse('Failed to save file to storage.', 500)
    }

    const supabase = await getSupabaseAdmin()

    const { data: record, error: insertError } = await supabase
      .from('mri_scans')
      .insert({
        patient_id: patientId,
        uploaded_by: doctorId,
        original_filename: file.name,
        storage_path: blob.url,
        file_size_bytes: file.size,
        mime_type: file.type || 'application/octet-stream',
        status: 'pending',
        analysis: null,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[MRI_UPLOAD][insert]', insertError)
      return errorResponse(`Failed to log MRI scan: ${insertError.message}`, 500)
    }

    return NextResponse.json(
      {
        message: 'MRI uploaded successfully.',
        scan: record,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[MRI_UPLOAD][unhandled]', error)
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    const status = message.includes('credentials') ? 500 : 500
    return errorResponse(message, status)
  }
}
