import { NextRequest, NextResponse } from 'next/server'
import { uploadBufferToStorage, parseUploadRequest } from '@/lib/storage-server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Generic file upload endpoint. Stores the file in Storage and returns its
 * public URL. Used by admin editors (events, etc.) that post multipart
 * form-data with a `file` and a `type` folder hint.
 */
export async function POST(req: NextRequest) {
  try {
    const { buffer, mimeType, folder, originalName } = await parseUploadRequest(req)
    const result = await uploadBufferToStorage(buffer, mimeType, folder, originalName)
    return NextResponse.json({ success: true, url: result.url, ...result })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
