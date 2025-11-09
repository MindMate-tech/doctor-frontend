import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

export const runtime = 'edge'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        console.log('[UPLOAD_TOKEN] Generating token for:', pathname)
        
        // Validate file extension
        const lower = pathname.toLowerCase()
        const validExtensions = ['.dcm', '.nii', '.nii.gz', '.zip']
        const isValid = validExtensions.some((ext) => lower.endsWith(ext))
        
        if (!isValid) {
          throw new Error('Invalid file type. Only DICOM, NIfTI, and ZIP files are allowed.')
        }

        return {
          allowedContentTypes: [
            'application/dicom',
            'application/x-gzip',
            'application/gzip',
            'application/zip',
            'application/octet-stream',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('[UPLOAD_TOKEN] Upload completed:', blob.url)
        // You can add additional processing here if needed
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('[UPLOAD_TOKEN] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload token' },
      { status: 400 }
    )
  }
}
