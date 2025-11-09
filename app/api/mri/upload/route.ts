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
  const requestStartTime = Date.now()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('[API_MRI_UPLOAD] 🚀 NEW REQUEST RECEIVED')
  console.log('[API_MRI_UPLOAD] Timestamp:', new Date().toISOString())
  console.log('[API_MRI_UPLOAD] Request URL:', request.url)
  console.log('[API_MRI_UPLOAD] Request method:', request.method)

  try {
    const contentType = request.headers.get('content-type') ?? ''
    console.log('[API_MRI_UPLOAD] 📋 Content-Type:', contentType)
    console.log('[API_MRI_UPLOAD] 📋 All headers:', Object.fromEntries(request.headers.entries()))

    if (!contentType.includes('multipart/form-data')) {
      console.error('[API_MRI_UPLOAD] ❌ Invalid content type')
      return errorResponse('Expected multipart/form-data payload.')
    }

    console.log('[API_MRI_UPLOAD] 📦 Parsing FormData')
    const form = await request.formData()
    console.log('[API_MRI_UPLOAD] ✅ FormData parsed successfully')
    console.log('[API_MRI_UPLOAD] FormData keys:', Array.from(form.keys()))

    const file = form.get('file')
    const patientId = form.get('patientId')?.toString().trim()
    const doctorId =
      form.get('doctorId')?.toString().trim() || process.env.MRI_DEMO_DOCTOR_ID || null

    console.log('[API_MRI_UPLOAD] 📝 Extracted values:')
    console.log('[API_MRI_UPLOAD]   - patientId:', patientId)
    console.log('[API_MRI_UPLOAD]   - doctorId:', doctorId)
    console.log('[API_MRI_UPLOAD]   - file type:', file?.constructor.name)

    if (!patientId) {
      console.error('[API_MRI_UPLOAD] ❌ Missing patientId')
      return errorResponse('patientId is required.')
    }

    if (!(file instanceof File)) {
      console.error('[API_MRI_UPLOAD] ❌ Missing or invalid file')
      return errorResponse('file is required.')
    }

    console.log('[API_MRI_UPLOAD] 📁 File details:')
    console.log('[API_MRI_UPLOAD]   - name:', file.name)
    console.log('[API_MRI_UPLOAD]   - size:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
    console.log('[API_MRI_UPLOAD]   - type:', file.type || 'unknown')
    console.log('[API_MRI_UPLOAD]   - lastModified:', new Date(file.lastModified).toISOString())

    if (file.size === 0) {
      console.error('[API_MRI_UPLOAD] ❌ Empty file')
      return errorResponse('Uploaded file is empty.')
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error('[API_MRI_UPLOAD] ❌ File too large:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
      return errorResponse('File exceeds the 500MB limit.', 413)
    }

    if (!hasAllowedExtension(file.name)) {
      console.error('[API_MRI_UPLOAD] ❌ Invalid file extension:', file.name)
      return errorResponse('File must be DICOM (.dcm), NIfTI (.nii/.nii.gz), or ZIP.')
    }

    console.log('[API_MRI_UPLOAD] ✅ All validations passed')

    // Upload to Vercel Blob
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${patientId}/${timestamp}-${randomBytes(6).toString('hex')}-${sanitizeFilename(file.name)}`

    console.log('[API_MRI_UPLOAD] ☁️  Uploading to Vercel Blob')
    console.log('[API_MRI_UPLOAD]   - destination path:', filename)
    console.log('[API_MRI_UPLOAD]   - access:', 'public')

    const blobStartTime = Date.now()
    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || 'application/octet-stream',
    })
    const blobDuration = ((Date.now() - blobStartTime) / 1000).toFixed(2)

    console.log('[API_MRI_UPLOAD] ✅ Blob upload complete')
    console.log('[API_MRI_UPLOAD]   - duration:', blobDuration, 's')
    console.log('[API_MRI_UPLOAD]   - url:', blob.url)
    console.log('[API_MRI_UPLOAD]   - downloadUrl:', blob.downloadUrl)
    console.log('[API_MRI_UPLOAD]   - pathname:', blob.pathname)
    console.log('[API_MRI_UPLOAD]   - full blob object:', JSON.stringify(blob, null, 2))

    if (!blob || !blob.url) {
      console.error('[API_MRI_UPLOAD] ❌ Failed to get blob URL')
      console.error('[API_MRI_UPLOAD][blob] Blob response:', blob)
      return errorResponse('Failed to save file to storage.', 500)
    }

    console.log('[API_MRI_UPLOAD] 💾 Inserting record to Supabase')
    const supabase = await getSupabaseAdmin()

    const insertData = {
      patient_id: patientId,
      uploaded_by: doctorId,
      original_filename: file.name,
      storage_path: blob.url,
      file_size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
      status: 'pending',
      analysis: null,
    }
    console.log('[API_MRI_UPLOAD] Insert data:', JSON.stringify(insertData, null, 2))

    const dbStartTime = Date.now()
    const { data: record, error: insertError } = await supabase
      .from('mri_scans')
      .insert(insertData)
      .select('*')
      .single()
    const dbDuration = ((Date.now() - dbStartTime) / 1000).toFixed(2)

    console.log('[API_MRI_UPLOAD] Database operation complete')
    console.log('[API_MRI_UPLOAD]   - duration:', dbDuration, 's')

    if (insertError) {
      console.error('[API_MRI_UPLOAD] ❌ Database insert error:', insertError)
      console.error('[API_MRI_UPLOAD][insert] Error message:', insertError.message)
      console.error('[API_MRI_UPLOAD][insert] Error details:', insertError.details)
      console.error('[API_MRI_UPLOAD][insert] Error hint:', insertError.hint)
      return errorResponse(`Failed to log MRI scan: ${insertError.message}`, 500)
    }

    console.log('[API_MRI_UPLOAD] ✅ Record created successfully')
    console.log('[API_MRI_UPLOAD] Record:', JSON.stringify(record, null, 2))

    const totalDuration = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    console.log('[API_MRI_UPLOAD] 🎉 SUCCESS!')
    console.log('[API_MRI_UPLOAD] Total request duration:', totalDuration, 's')
    console.log('[API_MRI_UPLOAD]   - Blob upload:', blobDuration, 's')
    console.log('[API_MRI_UPLOAD]   - Database insert:', dbDuration, 's')
    console.log('[API_MRI_UPLOAD] Response payload:', JSON.stringify({ message: 'MRI uploaded successfully.', scan: record }, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return NextResponse.json(
      {
        message: 'MRI uploaded successfully.',
        scan: record,
      },
      { status: 201 },
    )
  } catch (error) {
    const totalDuration = ((Date.now() - requestStartTime) / 1000).toFixed(2)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('[API_MRI_UPLOAD] ❌ UNHANDLED ERROR')
    console.error('[API_MRI_UPLOAD] Total duration:', totalDuration, 's')
    console.error('[API_MRI_UPLOAD] Error:', error)
    console.error('[API_MRI_UPLOAD] Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('[API_MRI_UPLOAD] Error stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    const status = message.includes('credentials') ? 500 : 500
    return errorResponse(message, status)
  }
}
