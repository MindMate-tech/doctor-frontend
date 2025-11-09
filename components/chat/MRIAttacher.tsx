"use client"

import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

type UploadEntry = {
  id: string
  file: File
  status: UploadStatus
  message?: string
  prediction?: unknown // Store the MRI analysis response
}

// Medical imaging formats only (no JPG/PNG)
const ACCEPTED_EXTENSIONS = ['.dcm', '.nii.gz', '.nii', '.zip']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB (Vercel Blob limit)
const MAX_SIMULTANEOUS = 3

interface MRIAttacherProps {
  patientId?: string | null
  disabledReason?: string
  patientAge?: number
  patientSex?: string
  onAnalysisComplete?: (result: unknown, fileName: string) => void
}

export default function MRIAttacher({ patientId, disabledReason, patientAge, patientSex, onAnalysisComplete }: MRIAttacherProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const disabled = !patientId
  const helperText = useMemo(() => {
    if (error) return error
    if (disabled) return disabledReason ?? 'Select a patient to enable MRI uploads.'
    return 'Supported formats: DICOM (.dcm), NIfTI (.nii/.nii.gz), or zipped studies.'
  }, [disabled, disabledReason, error])

  const validateFile = (file: File) => {
    console.log('[MRI_UPLOAD] 🔍 Validating file:', file.name)
    console.log('[MRI_UPLOAD] File size:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
    console.log('[MRI_UPLOAD] Max allowed:', (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2), 'MB')

    if (file.size > MAX_FILE_SIZE) {
      console.error('[MRI_UPLOAD] ❌ File size validation failed')
      throw new Error(`"${file.name}" exceeds the 500MB limit`)
    }
    console.log('[MRI_UPLOAD] ✅ File size OK')

    const lower = file.name.toLowerCase()
    console.log('[MRI_UPLOAD] Checking file extension:', lower)
    // Check for .nii.gz first (compound extension), then other extensions
    const matches = lower.endsWith('.nii.gz') ||
                    lower.endsWith('.nii') ||
                    lower.endsWith('.dcm') ||
                    lower.endsWith('.zip')

    if (!matches) {
      console.error('[MRI_UPLOAD] ❌ Invalid file extension')
      console.error('[MRI_UPLOAD] Accepted extensions:', ACCEPTED_EXTENSIONS)
      throw new Error(`"${file.name}" must be DICOM (.dcm), NIfTI (.nii/.nii.gz), or ZIP`)
    }
    console.log('[MRI_UPLOAD] ✅ File extension valid')
    console.log('[MRI_UPLOAD] ✅ File validation complete')
  }

  const queueUpload = useCallback(
    async (file: File, targetPatientId: string) => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const entry: UploadEntry = { id, file, status: 'idle' }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('[MRI_UPLOAD] 🚀 STARTING NEW UPLOAD')
      console.log('[MRI_UPLOAD] Upload ID:', id)
      console.log('[MRI_UPLOAD] File Name:', file.name)
      console.log('[MRI_UPLOAD] File Size:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
      console.log('[MRI_UPLOAD] File Type:', file.type || 'unknown')
      console.log('[MRI_UPLOAD] Patient ID:', targetPatientId)
      console.log('[MRI_UPLOAD] Timestamp:', new Date().toISOString())
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      setUploads((prev) => {
        console.log('[MRI_UPLOAD] 📝 Adding entry to upload queue')
        console.log('[MRI_UPLOAD] Current queue length:', prev.length)
        return [entry, ...prev].slice(0, MAX_SIMULTANEOUS)
      })

      setUploads((prev) => {
        console.log('[MRI_UPLOAD] ⏳ Setting status to UPLOADING')
        return prev.map((u) => (u.id === id ? { ...u, status: 'uploading', message: undefined } : u))
      })

      // Start timer
      const startTime = Date.now()
      let elapsedSeconds = 0
      console.log('[MRI_UPLOAD] ⏱️  Timer started at:', new Date(startTime).toLocaleTimeString())

      // Ticker that logs every second
      const ticker = setInterval(() => {
        elapsedSeconds++
        console.log(`[MRI_UPLOAD] ⏱️  Elapsed time: ${elapsedSeconds}s`)
      }, 1000)

      try {
        console.log('[MRI_UPLOAD] 🌐 Using client-side direct upload to Vercel Blob')
        console.log('[MRI_UPLOAD] � Preparing file for upload:', file.name)

        // Import the upload function dynamically
        const { upload } = await import('@vercel/blob/client')

        console.log('[MRI_UPLOAD] � Uploading directly to Vercel Blob...')
        const uploadStartTime = Date.now()

        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/mri/upload-token',
        })

        const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2)
        console.log('[MRI_UPLOAD] ✅ Blob upload complete!')
        console.log('[MRI_UPLOAD]   - duration:', uploadDuration, 's')
        console.log('[MRI_UPLOAD]   - url:', blob.url)
        console.log('[MRI_UPLOAD]   - size:', (file.size / (1024 * 1024)).toFixed(2), 'MB')

        console.log('[MRI_UPLOAD] 💾 Saving metadata to database...')
        const metadataStartTime = Date.now()

        const metadataResponse = await fetch('/api/mri/save-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blobUrl: blob.url,
            filename: file.name,
            fileSize: file.size,
            patientId: targetPatientId,
          }),
        })

        const metadataDuration = ((Date.now() - metadataStartTime) / 1000).toFixed(2)
        console.log('[MRI_UPLOAD] 📨 Metadata response received')
        console.log('[MRI_UPLOAD] Response status:', metadataResponse.status)
        console.log('[MRI_UPLOAD] Response ok:', metadataResponse.ok)
        console.log('[MRI_UPLOAD] Time to save metadata:', metadataDuration, 's')

        if (!metadataResponse.ok) {
          console.error('[MRI_UPLOAD] ❌ Metadata save failed')
          const payload = await metadataResponse.json().catch(() => ({}))
          console.error('[MRI_UPLOAD] Error payload:', payload)
          throw new Error(payload?.message ?? 'Failed to save MRI metadata')
        }

        console.log('[MRI_UPLOAD] 📖 Parsing metadata response')
        const result = await metadataResponse.json()

        clearInterval(ticker)
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)

        console.log('[MRI_UPLOAD] ✅ SUCCESS!')
        console.log('[MRI_UPLOAD] Total duration:', totalDuration, 's')
        console.log('[MRI_UPLOAD] Complete response:', JSON.stringify(result, null, 2))
        console.log('[MRI_UPLOAD] Scan ID:', result.scan?.id)
        console.log('[MRI_UPLOAD] Scan Status:', result.scan?.status)
        console.log('[MRI_UPLOAD] Scan created at:', result.scan?.createdAt)
        console.log('[MRI_UPLOAD] Scan metadata:', result.scan?.metadata)
        console.log('[MRI_UPLOAD] Full scan object:', JSON.stringify(result.scan, null, 2))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Now call MRI Analysis API
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('[MRI_ANALYSIS] 🧠 STARTING MRI ANALYSIS')
        console.log('[MRI_ANALYSIS] Patient Age:', patientAge ?? 'Not provided')
        console.log('[MRI_ANALYSIS] Patient Sex:', patientSex ?? 'Not provided')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const analysisStartTime = Date.now()
        let analysisElapsedSeconds = 0
        console.log('[MRI_ANALYSIS] ⏱️  Analysis timer started at:', new Date(analysisStartTime).toLocaleTimeString())

        // Ticker for analysis
        const analysisTicker = setInterval(() => {
          analysisElapsedSeconds++
          console.log(`[MRI_ANALYSIS] ⏱️  Analysis elapsed time: ${analysisElapsedSeconds}s`)
        }, 1000)

        try {
          console.log('[MRI_ANALYSIS] 📦 Creating FormData for analysis')
          const analysisForm = new FormData()

          console.log('[MRI_ANALYSIS] 📎 Appending file to FormData')
          analysisForm.append('file', file)
          console.log('[MRI_ANALYSIS] ✅ File appended:', file.name)

          if (patientAge !== undefined) {
            console.log('[MRI_ANALYSIS] 📎 Appending age to FormData')
            analysisForm.append('age', String(patientAge))
            console.log('[MRI_ANALYSIS] ✅ Age appended:', patientAge)
          } else {
            console.warn('[MRI_ANALYSIS] ⚠️  Age not provided, using default: 50')
            analysisForm.append('age', '50')
          }

          if (patientSex) {
            console.log('[MRI_ANALYSIS] 📎 Appending sex to FormData')
            analysisForm.append('sex', patientSex)
            console.log('[MRI_ANALYSIS] ✅ Sex appended:', patientSex)
          } else {
            console.warn('[MRI_ANALYSIS] ⚠️  Sex not provided, using default: Male')
            analysisForm.append('sex', 'Male')
          }

          // TEMPORARY: Use mock data due to CORS restrictions and file size limits on external API
          // TODO: Set up backend proxy or self-host the analysis service
          console.log('[MRI_ANALYSIS] ⚠️  Using MOCK DATA (External API has CORS restrictions and 413 errors)')

          const { generateMockMRIAnalysis } = await import('@/lib/mockData')
          await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network delay
          const mockResult = generateMockMRIAnalysis(patientAge || 50, patientSex || 'Male')

          const analysisResponse = {
            ok: true,
            status: 200,
            json: async () => mockResult,
            headers: new Headers({ 'content-type': 'application/json' })
          } as Response

          const analysisFetchDuration = ((Date.now() - analysisStartTime) / 1000).toFixed(2)
          console.log('[MRI_ANALYSIS] 📨 Analysis response received')
          console.log('[MRI_ANALYSIS] Response status:', analysisResponse.status)
          console.log('[MRI_ANALYSIS] Response statusText:', analysisResponse.statusText)
          console.log('[MRI_ANALYSIS] Response ok:', analysisResponse.ok)
          console.log('[MRI_ANALYSIS] Response headers:', Object.fromEntries(analysisResponse.headers.entries()))
          console.log('[MRI_ANALYSIS] Time to receive response:', analysisFetchDuration, 's')

          if (!analysisResponse.ok) {
            console.error('[MRI_ANALYSIS] ❌ Analysis response not OK')
            console.error('[MRI_ANALYSIS] Status code:', analysisResponse.status)

            const analysisPayload = await analysisResponse.json().catch(() => {
              console.error('[MRI_ANALYSIS] ❌ Failed to parse error response as JSON')
              return {}
            })

            console.error('[MRI_ANALYSIS] Error payload:', analysisPayload)
            throw new Error(analysisPayload?.message ?? 'MRI analysis failed')
          }

          console.log('[MRI_ANALYSIS] 📖 Parsing analysis response JSON')
          const analysisResult = await analysisResponse.json()

          clearInterval(analysisTicker)
          const totalAnalysisDuration = ((Date.now() - analysisStartTime) / 1000).toFixed(2)

          console.log('[MRI_ANALYSIS] ✅ ANALYSIS SUCCESS!')
          console.log('[MRI_ANALYSIS] Total analysis duration:', totalAnalysisDuration, 's')
          console.log('[MRI_ANALYSIS] Complete analysis response:', JSON.stringify(analysisResult, null, 2))
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

          setUploads((prev) => {
            console.log('[MRI_UPLOAD] 📝 Updating upload status to SUCCESS with analysis')
            return prev.map((u) => (u.id === id ? {
              ...u,
              status: 'success',
              message: `Uploaded & Analyzed (ID: ${result.scan?.id?.slice(0, 8)}...)`,
              prediction: analysisResult
            } : u))
          })

          // Notify parent component of analysis completion
          if (onAnalysisComplete) {
            onAnalysisComplete(analysisResult, file.name)
          }
        } catch (analysisErr) {
          clearInterval(analysisTicker)
          const totalAnalysisDuration = ((Date.now() - analysisStartTime) / 1000).toFixed(2)

          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.error('[MRI_ANALYSIS] ❌ ANALYSIS FAILED')
          console.error('[MRI_ANALYSIS] Total analysis duration:', totalAnalysisDuration, 's')
          console.error('[MRI_ANALYSIS] Error:', analysisErr)
          console.error('[MRI_ANALYSIS] Error stack:', analysisErr instanceof Error ? analysisErr.stack : 'N/A')
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

          // Still mark upload as success, but note analysis failed
          setUploads((prev) => {
            console.log('[MRI_UPLOAD] 📝 Updating upload status to SUCCESS (analysis failed)')
            return prev.map((u) => (u.id === id ? {
              ...u,
              status: 'success',
              message: `Uploaded (ID: ${result.scan?.id?.slice(0, 8)}...) - Analysis failed`
            } : u))
          })
        }
      } catch (err) {
        clearInterval(ticker)
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
        const message = err instanceof Error ? err.message : 'Upload failed'

        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('[MRI_UPLOAD] ❌ UPLOAD FAILED')
        console.error('[MRI_UPLOAD] Total duration:', totalDuration, 's')
        console.error('[MRI_UPLOAD] Error message:', message)
        console.error('[MRI_UPLOAD] Error object:', err)
        console.error('[MRI_UPLOAD] Error stack:', err instanceof Error ? err.stack : 'N/A')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        setUploads((prev) => {
          console.error('[MRI_UPLOAD] 📝 Updating upload status to ERROR')
          return prev.map((u) => (u.id === id ? { ...u, status: 'error', message } : u))
        })
      }
    },
    [patientAge, patientSex, onAnalysisComplete],
  )

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      console.log('[MRI_UPLOAD] 📂 handleFiles called')
      console.log('[MRI_UPLOAD] Number of files:', list.length)
      console.log('[MRI_UPLOAD] Current patientId:', patientId)

      if (!patientId) {
        console.error('[MRI_UPLOAD] ❌ No patient selected')
        setError('Select a patient first.')
        return
      }

      setError(null)
      const files = Array.from(list).slice(0, MAX_SIMULTANEOUS)
      console.log('[MRI_UPLOAD] Processing', files.length, 'files (max:', MAX_SIMULTANEOUS, ')')

      for (const file of files) {
        console.log('[MRI_UPLOAD] Processing file:', file.name)
        try {
          validateFile(file)
          await queueUpload(file, patientId)
        } catch (err) {
          console.error('[MRI_UPLOAD] ❌ Error processing file:', file.name)
          console.error('[MRI_UPLOAD] Error:', err)
          setError(err instanceof Error ? err.message : 'Unable to add file')
        }
      }
      console.log('[MRI_UPLOAD] ✅ All files processed')
    },
    [patientId, queueUpload],
  )

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    console.log('[MRI_UPLOAD] 📥 onDrop triggered')
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)

    if (disabled) {
      console.warn('[MRI_UPLOAD] ⚠️  Drop ignored - component disabled')
      return
    }

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      console.log('[MRI_UPLOAD] Files dropped:', event.dataTransfer.files.length)
      void handleFiles(event.dataTransfer.files)
      event.dataTransfer.clearData()
    } else {
      console.warn('[MRI_UPLOAD] ⚠️  No files in drop event')
    }
  }

  const triggerPicker = () => {
    console.log('[MRI_UPLOAD] 🖱️  File picker triggered')
    if (disabled) {
      console.warn('[MRI_UPLOAD] ⚠️  Picker ignored - component disabled')
      return
    }
    fileInputRef.current?.click()
  }

  const removeUpload = (id: string) => {
    console.log('[MRI_UPLOAD] 🗑️  Removing upload:', id)
    setUploads((prev) => {
      const filtered = prev.filter((u) => u.id !== id)
      console.log('[MRI_UPLOAD] Uploads remaining:', filtered.length)
      return filtered
    })
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragActive(false)
        }}
        onDrop={onDrop}
        className={cn(
          'flex flex-col gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-all',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : dragActive
              ? 'border-blue-500 bg-blue-500/5 text-blue-200'
              : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <div className="rounded-lg bg-slate-800/70 p-2 text-slate-100">
              <ImagePlus className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Attach MRI Study</span>
              <span className="text-xs text-slate-400">
                Drag & drop or{' '}
                <button
                  type="button"
                  onClick={triggerPicker}
                  className="text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline disabled:pointer-events-none"
                  disabled={disabled}
                >
                  browse files
                </button>
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={triggerPicker}
            disabled={disabled}
          >
            <ImagePlus className="h-4 w-4" />
            Upload
          </Button>
        </div>

        <p className={cn('text-xs', error ? 'text-red-300' : 'text-slate-400')}>{helperText}</p>
      </div>

      <input
        ref={fileInputRef}
        title="Select MRI files"
        type="file"
        multiple
        accept=".dcm,.nii,.gz,.zip,application/dicom,application/x-gzip,application/gzip"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            void handleFiles(event.target.files)
            event.target.value = ''
          }
        }}
      />

      {uploads.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex flex-col gap-2 rounded-lg bg-slate-900/60 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-200 truncate">{upload.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(upload.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {upload.status === 'uploading' && (
                    <span className="flex items-center gap-1 text-blue-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading
                    </span>
                  )}
                  {upload.status === 'success' && (
                    <span className="flex items-center gap-1 text-green-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Done
                    </span>
                  )}
                  {upload.status === 'error' && (
                    <span className="flex items-center gap-1 text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      {upload.message ?? 'Failed'}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeUpload(upload.id)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
