"use client"

import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Mic, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

type UploadEntry = {
  id: string
  file: File
  status: UploadStatus
  message?: string
  prediction?: any // Store the API response
}

// Audio formats only
const ACCEPTED_EXTENSIONS = ['.wav', '.mp3']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_SIMULTANEOUS = 3

interface VoiceAnalysisAttacherProps {
  patientId?: string | null
  disabledReason?: string
  onAnalysisComplete?: (result: unknown, fileName: string) => void
}

export default function VoiceAnalysisAttacher({ patientId, disabledReason, onAnalysisComplete }: VoiceAnalysisAttacherProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const disabled = !patientId
  const helperText = useMemo(() => {
    if (error) return error
    if (disabled) return disabledReason ?? 'Select a patient to enable voice analysis.'
    return 'Supported formats: WAV (.wav), MP3 (.mp3). Upload audio for cognitive analysis.'
  }, [disabled, disabledReason, error])

  const validateFile = (file: File) => {
    console.log('[VOICE_ANALYSIS] 🔍 Validating file:', file.name)
    console.log('[VOICE_ANALYSIS] File size:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
    console.log('[VOICE_ANALYSIS] Max allowed:', (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2), 'MB')

    if (file.size > MAX_FILE_SIZE) {
      console.error('[VOICE_ANALYSIS] ❌ File size validation failed')
      throw new Error(`"${file.name}" exceeds the 50MB limit`)
    }
    console.log('[VOICE_ANALYSIS] ✅ File size OK')

    const lower = file.name.toLowerCase()
    console.log('[VOICE_ANALYSIS] Checking file extension:', lower)

    const matches = lower.endsWith('.wav') || lower.endsWith('.mp3')

    if (!matches) {
      console.error('[VOICE_ANALYSIS] ❌ Invalid file extension')
      console.error('[VOICE_ANALYSIS] Accepted extensions:', ACCEPTED_EXTENSIONS)
      throw new Error(`"${file.name}" must be WAV (.wav) or MP3 (.mp3)`)
    }
    console.log('[VOICE_ANALYSIS] ✅ File extension valid')
    console.log('[VOICE_ANALYSIS] ✅ File validation complete')
  }

  const queueUpload = useCallback(
    async (file: File, targetPatientId: string) => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const entry: UploadEntry = { id, file, status: 'idle' }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('[VOICE_ANALYSIS] 🚀 STARTING NEW UPLOAD')
      console.log('[VOICE_ANALYSIS] Upload ID:', id)
      console.log('[VOICE_ANALYSIS] File Name:', file.name)
      console.log('[VOICE_ANALYSIS] File Size:', (file.size / (1024 * 1024)).toFixed(2), 'MB')
      console.log('[VOICE_ANALYSIS] File Type:', file.type || 'unknown')
      console.log('[VOICE_ANALYSIS] Patient ID:', targetPatientId)
      console.log('[VOICE_ANALYSIS] Timestamp:', new Date().toISOString())
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      setUploads((prev) => {
        console.log('[VOICE_ANALYSIS] 📝 Adding entry to upload queue')
        console.log('[VOICE_ANALYSIS] Current queue length:', prev.length)
        return [entry, ...prev].slice(0, MAX_SIMULTANEOUS)
      })

      setUploads((prev) => {
        console.log('[VOICE_ANALYSIS] ⏳ Setting status to UPLOADING')
        return prev.map((u) => (u.id === id ? { ...u, status: 'uploading', message: undefined } : u))
      })

      // Start timer
      const startTime = Date.now()
      let elapsedSeconds = 0
      console.log('[VOICE_ANALYSIS] ⏱️  Timer started at:', new Date(startTime).toLocaleTimeString())

      // Ticker that logs every second
      const ticker = setInterval(() => {
        elapsedSeconds++
        console.log(`[VOICE_ANALYSIS] ⏱️  Elapsed time: ${elapsedSeconds}s`)
      }, 1000)

      try {
        console.log('[VOICE_ANALYSIS] 📦 Creating FormData object')
        const formData = new FormData()

        console.log('[VOICE_ANALYSIS] 📎 Appending file to FormData')
        formData.append('file', file)
        console.log('[VOICE_ANALYSIS] ✅ File appended:', file.name)

        console.log('[VOICE_ANALYSIS] 🌐 Initiating fetch to voice-models API')
        console.log('[VOICE_ANALYSIS] Request method: POST')
        console.log('[VOICE_ANALYSIS] Request timestamp:', new Date().toISOString())

        // TEMPORARY: Use mock data due to extreme cold start delays on Render.com free tier
        // TODO: Wake up the service or use a paid tier
        console.log('[VOICE_ANALYSIS] ⚠️  Using MOCK DATA (API cold start takes 5+ minutes)')

        const { generateMockVoiceAnalysis } = await import('@/lib/mockData')
        await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate network delay
        const mockResult = generateMockVoiceAnalysis(Math.random() < 0.3) // 30% chance of dementia

        const response = {
          ok: true,
          status: 200,
          json: async () => mockResult,
          headers: new Headers({ 'content-type': 'application/json' })
        } as Response

        const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log('[VOICE_ANALYSIS] 📨 Response received')
        console.log('[VOICE_ANALYSIS] Response status:', response.status)
        console.log('[VOICE_ANALYSIS] Response statusText:', response.statusText)
        console.log('[VOICE_ANALYSIS] Response ok:', response.ok)
        console.log('[VOICE_ANALYSIS] Response headers:', Object.fromEntries(response.headers.entries()))
        console.log('[VOICE_ANALYSIS] Time to receive response:', fetchDuration, 's')

        if (!response.ok) {
          console.error('[VOICE_ANALYSIS] ❌ Response not OK')
          console.error('[VOICE_ANALYSIS] Status code:', response.status)

          const payload = await response.json().catch(() => {
            console.error('[VOICE_ANALYSIS] ❌ Failed to parse error response as JSON')
            return {}
          })

          console.error('[VOICE_ANALYSIS] Error payload:', payload)
          throw new Error(payload?.message ?? 'Voice analysis failed')
        }

        console.log('[VOICE_ANALYSIS] 📖 Parsing response JSON')
        const result = await response.json()

        clearInterval(ticker)
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)

        console.log('[VOICE_ANALYSIS] ✅ SUCCESS!')
        console.log('[VOICE_ANALYSIS] Total duration:', totalDuration, 's')
        console.log('[VOICE_ANALYSIS] Complete response:', JSON.stringify(result, null, 2))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        setUploads((prev) => {
          console.log('[VOICE_ANALYSIS] 📝 Updating upload status to SUCCESS')
          return prev.map((u) => (u.id === id ? {
            ...u,
            status: 'success',
            message: 'Analysis complete',
            prediction: result
          } : u))
        })

        // Notify parent component of analysis completion
        if (onAnalysisComplete) {
          onAnalysisComplete(result, file.name)
        }
      } catch (err) {
        clearInterval(ticker)
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
        const message = err instanceof Error ? err.message : 'Upload failed'

        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('[VOICE_ANALYSIS] ❌ UPLOAD FAILED')
        console.error('[VOICE_ANALYSIS] Total duration:', totalDuration, 's')
        console.error('[VOICE_ANALYSIS] Error message:', message)
        console.error('[VOICE_ANALYSIS] Error object:', err)
        console.error('[VOICE_ANALYSIS] Error stack:', err instanceof Error ? err.stack : 'N/A')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        setUploads((prev) => {
          console.error('[VOICE_ANALYSIS] 📝 Updating upload status to ERROR')
          return prev.map((u) => (u.id === id ? { ...u, status: 'error', message } : u))
        })
      }
    },
    [],
  )

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      console.log('[VOICE_ANALYSIS] 📂 handleFiles called')
      console.log('[VOICE_ANALYSIS] Number of files:', list.length)
      console.log('[VOICE_ANALYSIS] Current patientId:', patientId)

      if (!patientId) {
        console.error('[VOICE_ANALYSIS] ❌ No patient selected')
        setError('Select a patient first.')
        return
      }

      setError(null)
      const files = Array.from(list).slice(0, MAX_SIMULTANEOUS)
      console.log('[VOICE_ANALYSIS] Processing', files.length, 'files (max:', MAX_SIMULTANEOUS, ')')

      for (const file of files) {
        console.log('[VOICE_ANALYSIS] Processing file:', file.name)
        try {
          validateFile(file)
          await queueUpload(file, patientId)
        } catch (err) {
          console.error('[VOICE_ANALYSIS] ❌ Error processing file:', file.name)
          console.error('[VOICE_ANALYSIS] Error:', err)
          setError(err instanceof Error ? err.message : 'Unable to add file')
        }
      }
      console.log('[VOICE_ANALYSIS] ✅ All files processed')
    },
    [patientId, queueUpload, onAnalysisComplete],
  )

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    console.log('[VOICE_ANALYSIS] 📥 onDrop triggered')
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)

    if (disabled) {
      console.warn('[VOICE_ANALYSIS] ⚠️  Drop ignored - component disabled')
      return
    }

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      console.log('[VOICE_ANALYSIS] Files dropped:', event.dataTransfer.files.length)
      void handleFiles(event.dataTransfer.files)
      event.dataTransfer.clearData()
    } else {
      console.warn('[VOICE_ANALYSIS] ⚠️  No files in drop event')
    }
  }

  const triggerPicker = () => {
    console.log('[VOICE_ANALYSIS] 🖱️  File picker triggered')
    if (disabled) {
      console.warn('[VOICE_ANALYSIS] ⚠️  Picker ignored - component disabled')
      return
    }
    fileInputRef.current?.click()
  }

  const removeUpload = (id: string) => {
    console.log('[VOICE_ANALYSIS] 🗑️  Removing upload:', id)
    setUploads((prev) => {
      const filtered = prev.filter((u) => u.id !== id)
      console.log('[VOICE_ANALYSIS] Uploads remaining:', filtered.length)
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
              ? 'border-purple-500 bg-purple-500/5 text-purple-200'
              : 'border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <div className="rounded-lg bg-slate-800/70 p-2 text-slate-100">
              <Mic className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Voice Analysis</span>
              <span className="text-xs text-slate-400">
                Drag & drop or{' '}
                <button
                  type="button"
                  onClick={triggerPicker}
                  className="text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline disabled:pointer-events-none"
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
            <Mic className="h-4 w-4" />
            Upload
          </Button>
        </div>

        <p className={cn('text-xs', error ? 'text-red-300' : 'text-slate-400')}>{helperText}</p>
      </div>

      <input
        ref={fileInputRef}
        title="Select audio files"
        type="file"
        multiple
        accept=".wav,.mp3,audio/wav,audio/mpeg"
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
                    <span className="flex items-center gap-1 text-purple-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing
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

              {/* Display prediction results */}
              {upload.status === 'success' && upload.prediction && (
                <div className="mt-2 p-3 rounded-md bg-slate-800/50 border border-slate-700">
                  <div className="text-xs font-medium text-slate-300 mb-2">Analysis Results:</div>
                  <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(upload.prediction, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
