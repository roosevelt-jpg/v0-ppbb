import { NextRequest, NextResponse } from 'next/server'
import { uploadBufferToStorage, parseUploadRequest } from '@/lib/storage-server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Uploads a binary file to Firebase/GCS Storage and returns its public URL.
 * Accepts multipart/form-data (`file` + optional `folder`/`type`) or JSON
 * ({ dataUrl, folder, filename }). Any base64 data URL is only a transport
 * mechanism — the decoded bytes go to Storage and are never persisted in
 * Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const { buffer, mimeType, folder, originalName } = await parseUploadRequest(req)
    const result = await uploadBufferToStorage(buffer, mimeType, folder, originalName)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
