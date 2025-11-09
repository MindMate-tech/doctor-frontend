import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max on Hobby plan

/**
 * MRI Background Processor
 *
 * Can be triggered manually via GET request or by external cron service (e.g., cron-job.org)
 * For Vercel Cron, requires Pro+ plan and configuration in vercel.json
 *
 * Workflow:
 * 1. Fetch pending MRI scans from database
 * 2. Download file from Vercel Blob
 * 3. Send to MRI analysis model (your ML/LLM backend)
 * 4. Update database with analysis results
 * 5. Create doctor_record for chat context
 */
export async function GET(request: Request) {
  const startTime = Date.now()

  // ==========================================
  // 1. AUTHENTICATION (optional - verify cron secret if set)
  // ==========================================
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Only check auth if CRON_SECRET is configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[MRI_PROCESSOR] Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await getSupabaseAdmin()

  // ==========================================
  // 2. FETCH PENDING SCANS
  // ==========================================
  const { data: pendingScans, error: fetchError } = await supabase
    .from('mri_scans')
    .select('*')
    .eq('status', 'pending')
    .lt('retry_count', 3) // Max 3 retries
    .order('created_at', { ascending: true })
    .limit(5) // Process 5 at a time to avoid timeout

  if (fetchError) {
    console.error('[MRI_PROCESSOR] Database fetch error:', fetchError)
    return NextResponse.json({ error: 'Database error', details: fetchError }, { status: 500 })
  }

  if (!pendingScans || pendingScans.length === 0) {
    console.log('[MRI_PROCESSOR] No pending scans to process')
    return NextResponse.json({ processed: 0, message: 'No pending scans' })
  }

  console.log(`[MRI_PROCESSOR] Found ${pendingScans.length} pending scans`)

  const results: Array<{ id: string; status: 'success' | 'failed'; error?: string }> = []

  // ==========================================
  // 3. PROCESS EACH SCAN
  // ==========================================
  for (const scan of pendingScans) {
    try {
      console.log(`[MRI_PROCESSOR] Processing scan ${scan.id} (${scan.original_filename})`)

      // Mark as processing
      await supabase
        .from('mri_scans')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', scan.id)

      // ==========================================
      // 4. DOWNLOAD FILE FROM VERCEL BLOB
      // ==========================================
      console.log(`[MRI_PROCESSOR] Downloading from ${scan.storage_path}`)
      const fileResponse = await fetch(scan.storage_path)

      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: ${fileResponse.statusText}`)
      }

      const fileBuffer = await fileResponse.arrayBuffer()
      console.log(`[MRI_PROCESSOR] Downloaded ${fileBuffer.byteLength} bytes`)

      // ==========================================
      // 5. FETCH PATIENT DATA (age/sex for AssemblyNet)
      // ==========================================
      const { data: patient } = await supabase
        .from('patients')
        .select('dob, name, sex, gender')
        .eq('patient_id', scan.patient_id)
        .single()

      // Calculate age from dob
      let age = 50 // Default
      const sex = patient?.sex || patient?.gender || 'Male' // Use sex or gender field

      if (patient?.dob) {
        const birthDate = new Date(patient.dob)
        const today = new Date()
        age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
      }

      console.log(`[MRI_PROCESSOR] Patient data: age=${age}, sex=${sex}, name=${patient?.name}`)

      // ==========================================
      // 6. CALL MRI ANALYSIS MODEL (AssemblyNet API)
      // ==========================================
      const analysisModelUrl = process.env.MRI_ANALYSIS_MODEL_URL || 'http://52.15.158.102:8001'

      console.log(`[MRI_PROCESSOR] Uploading to AssemblyNet API: ${analysisModelUrl}/upload`)

      // Create FormData with file, age, sex
      const formData = new FormData()
      const blob = new Blob([fileBuffer], { type: scan.mime_type || 'application/octet-stream' })
      formData.append('file', blob, scan.original_filename)
      formData.append('age', age.toString())
      formData.append('sex', sex)

      const uploadResponse = await fetch(`${analysisModelUrl}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`AssemblyNet upload failed: ${uploadResponse.status} - ${errorText}`)
      }

      const { job_id } = await uploadResponse.json()
      console.log(`[MRI_PROCESSOR] Job queued: ${job_id}`)

      // ==========================================
      // 7. POLL FOR RESULTS (max 10 minutes)
      // ==========================================
      let analysis = null
      const maxPolls = 60 // 60 polls * 10s = 10 minutes max
      let pollCount = 0

      while (pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10s
        pollCount++

        console.log(`[MRI_PROCESSOR] Polling status (${pollCount}/${maxPolls}): ${job_id}`)

        const statusResponse = await fetch(`${analysisModelUrl}/status/${job_id}`)

        if (!statusResponse.ok) {
          console.warn(`[MRI_PROCESSOR] Status check failed: ${statusResponse.status}`)
          continue
        }

        const statusData = await statusResponse.json()

        if (statusData.status === 'completed') {
          analysis = statusData
          console.log(`[MRI_PROCESSOR] Analysis complete after ${pollCount * 10}s`)
          break
        } else if (statusData.status === 'failed') {
          throw new Error(`AssemblyNet processing failed: ${statusData.error || 'Unknown error'}`)
        }

        // Status is 'processing' or 'queued', continue polling
      }

      if (!analysis || analysis.status !== 'completed') {
        throw new Error(`Analysis timeout after ${pollCount * 10} seconds`)
      }

      // ==========================================
      // 8. UPDATE MRI_SCANS WITH ANALYSIS
      // ==========================================
      // Parse AssemblyNet results
      const volumetricData = analysis.volumetric_data || {}
      const clinicalFindings = analysis.findings || []

      const { error: updateError } = await supabase
        .from('mri_scans')
        .update({
          status: 'completed',
          analysis: {
            job_id: job_id,
            model: 'AssemblyNet-1.0.0',
            patient_age: age,
            patient_sex: sex,
            volumetric_data: volumetricData,
            findings: clinicalFindings,
            pdf_report_url: analysis.pdf_report_url || null,
            csv_report_url: analysis.csv_report_url || null,
            processed_at: new Date().toISOString(),
          },
          processed_at: new Date().toISOString(),
        })
        .eq('id', scan.id)

      if (updateError) {
        throw new Error(`Failed to update scan: ${updateError.message}`)
      }

      // ==========================================
      // 9. CREATE DOCTOR_RECORD FOR CHAT CONTEXT
      // ==========================================
      // Generate clinical summary from volumetric data
      const hippocampusVol = volumetricData?.hippocampus?.volume_mm3 || 0
      const ventriclesVol = volumetricData?.ventricles?.volume_mm3 || 0

      let summaryText = 'MRI volumetric analysis completed using AssemblyNet.'
      const structuralFindings: string[] = []

      if (hippocampusVol > 0 && hippocampusVol < 7000) {
        structuralFindings.push('Possible hippocampal atrophy detected')
      }

      if (ventriclesVol > 60000) {
        structuralFindings.push('Ventricular enlargement noted')
      }

      if (clinicalFindings.length > 0) {
        summaryText += `\n\nKey Findings:\n${clinicalFindings.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}`
      }

      if (structuralFindings.length > 0) {
        summaryText += `\n\nStructural Observations:\n${structuralFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
      }

      const recordContent = `
MRI Volumetric Analysis (AssemblyNet)
Patient: ${patient?.name || 'Unknown'}
Age: ${age} years | Sex: ${sex}
Scan Date: ${new Date(scan.created_at).toLocaleDateString()}
File: ${scan.original_filename}

${summaryText}

${analysis.pdf_report_url ? `\nFull Report: ${analysis.pdf_report_url}` : ''}
      `.trim()

      // Create doctor record
      await supabase.from('doctor_records').insert({
        patient_id: scan.patient_id,
        doctor_id: scan.uploaded_by,
        mri_scan_id: scan.id,
        session_id: scan.session_id || null,
        record_type: 'mri_summary',
        summary: `MRI analysis completed: ${clinicalFindings.length} findings, ${structuralFindings.length} structural observations`,
        detailed_notes: summaryText,
        content: recordContent, // Full formatted content
        metadata: {
          model: 'AssemblyNet-1.0.0',
          job_id: job_id,
          volumetric_data: volumetricData,
          patient_age: age,
          patient_sex: sex,
        },
      })

      console.log(`[MRI_PROCESSOR] Created doctor_record for scan ${scan.id}`)

      results.push({ id: scan.id, status: 'success' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[MRI_PROCESSOR] Failed to process scan ${scan.id}:`, errorMessage)

      // Mark as failed and increment retry count
      await supabase
        .from('mri_scans')
        .update({
          status: scan.retry_count + 1 >= 3 ? 'failed' : 'pending', // Retry if < 3 attempts
          error_message: errorMessage,
          retry_count: scan.retry_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scan.id)

      results.push({ id: scan.id, status: 'failed', error: errorMessage })
    }
  }

  const duration = Date.now() - startTime
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length

  console.log(`[MRI_PROCESSOR] Completed in ${duration}ms: ${successCount} success, ${failedCount} failed`)

  return NextResponse.json({
    processed: results.length,
    success: successCount,
    failed: failedCount,
    duration_ms: duration,
    results,
  })
}
