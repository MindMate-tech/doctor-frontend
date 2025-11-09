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
}

// Medical imaging formats only (no JPG/PNG)
const ACCEPTED_EXTENSIONS = ['.dcm', '.nii.gz', '.nii', '.zip']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB (Vercel Blob limit)
const MAX_SIMULTANEOUS = 3

interface MRIAttacherProps {
  patientId?: string | null
  disabledReason?: string
}

export default function MRIAttacher({ patientId, disabledReason }: MRIAttacherProps) {
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
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`"${file.name}" exceeds the 500MB limit`)
    }
    const lower = file.name.toLowerCase()
    // Check for .nii.gz first (compound extension), then other extensions
    const matches = lower.endsWith('.nii.gz') ||
                    lower.endsWith('.nii') ||
                    lower.endsWith('.dcm') ||
                    lower.endsWith('.zip')
    if (!matches) {
      throw new Error(`"${file.name}" must be DICOM (.dcm), NIfTI (.nii/.nii.gz), or ZIP`)
    }
  }

  const queueUpload = useCallback(
    async (file: File, targetPatientId: string) => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const entry: UploadEntry = { id, file, status: 'idle' }
      setUploads((prev) => [entry, ...prev].slice(0, MAX_SIMULTANEOUS))

      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'uploading', message: undefined } : u)))
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('patientId', targetPatientId)
        const response = await fetch('/api/mri/upload', {
          method: 'POST',
          body: form,
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.message ?? 'Upload failed')
        }

        const result = await response.json()
        console.log('[MRI_UPLOAD] Success:', result)
        console.log('[MRI_UPLOAD] Scan ID:', result.scan?.id)
        console.log('[MRI_UPLOAD] Status:', result.scan?.status)

        setUploads((prev) =>
          prev.map((u) => (u.id === id ? {
            ...u,
            status: 'success',
            message: `Uploaded (ID: ${result.scan?.id?.slice(0, 8)}...)`
          } : u)),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        console.error('[MRI_UPLOAD] Error:', err)
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'error', message } : u)),
        )
      }
    },
    [],
  )

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      if (!patientId) {
        setError('Select a patient first.')
        return
      }
      setError(null)
      const files = Array.from(list).slice(0, MAX_SIMULTANEOUS)
      for (const file of files) {
        try {
          validateFile(file)
          await queueUpload(file, patientId)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to add file')
        }
      }
    },
    [patientId, queueUpload],
  )

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    if (disabled) return
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void handleFiles(event.dataTransfer.files)
      event.dataTransfer.clearData()
    }
  }

  const triggerPicker = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
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
              className="flex items-center gap-3 rounded-lg bg-slate-900/60 px-3 py-2 text-sm"
            >
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
          ))}
        </div>
      )}
    </div>
  )
}
