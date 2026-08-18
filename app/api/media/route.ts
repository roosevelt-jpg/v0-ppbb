import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { getAdminApp, getAdminBucket, STORAGE_BUCKET } from '@/lib/firebase-admin'
import {
  isAllowedMediaBucket,
  isPrivateStoragePath,
  parseStorageObject,
} from '@/lib/media-url'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_INLINE_BYTES = 12 * 1024 * 1024

function allowedBucket(bucket: string): boolean {
  if (bucket === STORAGE_BUCKET) return true
  try {
    if (bucket === getAdminBucket().name) return true
  } catch {
    /* credentials may be unavailable during build */
  }
  return isAllowedMediaBucket(bucket)
}

/**
 * Streams a public CMS object from Storage. Used when
 * storage.googleapis.com URLs 403 (uniform bucket-level access) and when
 * tokenless Firebase download URLs are blocked by Storage rules.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('u') || ''
  const parsed = parseStorageObject(raw)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid media URL' }, { status: 400 })
  }
  if (!allowedBucket(parsed.bucket) || isPrivateStoragePath(parsed.objectPath)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const file = getStorage(getAdminApp()).bucket(parsed.bucket).file(parsed.objectPath)
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [meta] = await file.getMetadata()
    const size = Number(meta.size || 0)
    const contentType = String(meta.contentType || 'application/octet-stream')

    if (size > MAX_INLINE_BYTES) {
      const [signed] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })
      return NextResponse.redirect(signed, 302)
    }

    const [buffer] = await file.download()
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[media] proxy failed:', error)
    return NextResponse.json({ error: 'Media unavailable' }, { status: 502 })
  }
}
