import { getStorage } from 'firebase-admin/storage'
import sharp from 'sharp'
import { getAdminApp, getAdminBucket, STORAGE_BUCKET } from '@/lib/firebase-admin'
import {
  isAllowedMediaBucket,
  isPrivateStoragePath,
  parseStorageObject,
} from '@/lib/media-url'
import { rewriteLegacyStorageUrl } from '@/lib/storage-bucket'
import { getSiteUrl } from '@/lib/site-metadata'

export const EVENT_OG_WIDTH = 1200
export const EVENT_OG_HEIGHT = 630
/** WhatsApp docs: og:image should stay under 600KB. */
const MAX_OG_BYTES = 520_000

function pickBannerUrl(data: Record<string, unknown>): string {
  const candidates = [
    data.bannerURL,
    data.bannerImage,
    data.bannerImageUrl,
    data.coverImage,
    data.imageURL,
  ]
  for (const raw of candidates) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (value) return rewriteLegacyStorageUrl(value)
  }
  return ''
}

function allowedBucket(bucket: string): boolean {
  if (bucket === STORAGE_BUCKET) return true
  try {
    if (bucket === getAdminBucket().name) return true
  } catch {
    /* ignore */
  }
  return isAllowedMediaBucket(bucket)
}

async function loadBannerBytes(bannerUrl: string): Promise<Buffer | null> {
  if (!bannerUrl) return null

  const parsed = parseStorageObject(bannerUrl)
  if (parsed && allowedBucket(parsed.bucket) && !isPrivateStoragePath(parsed.objectPath)) {
    try {
      const file = getStorage(getAdminApp()).bucket(parsed.bucket).file(parsed.objectPath)
      const [exists] = await file.exists()
      if (exists) {
        const [buffer] = await file.download()
        return Buffer.from(buffer)
      }
    } catch (err) {
      console.warn('[event-og] storage download failed, trying HTTP:', err)
    }
  }

  try {
    const absolute = /^https?:\/\//i.test(bannerUrl)
      ? bannerUrl
      : bannerUrl.startsWith('/')
        ? `${getSiteUrl()}${bannerUrl}`
        : ''
    if (!absolute) return null
    const res = await fetch(absolute, { redirect: 'follow' })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function compressForOg(input: Buffer): Promise<Buffer> {
  let quality = 78
  let out = await sharp(input)
    .rotate()
    .resize(EVENT_OG_WIDTH, EVENT_OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()

  while (out.length > MAX_OG_BYTES && quality > 40) {
    quality -= 12
    out = await sharp(input)
      .rotate()
      .resize(EVENT_OG_WIDTH, EVENT_OG_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer()
  }
  return out
}

/**
 * Build a WhatsApp/Facebook-safe OG JPEG for an event (same-origin, under ~520KB).
 * Returns null when no usable banner exists — callers should fall back to site OG.
 */
export async function buildEventOgJpeg(
  eventData: Record<string, unknown>
): Promise<Buffer | null> {
  const bannerUrl = pickBannerUrl(eventData)
  const raw = await loadBannerBytes(bannerUrl)
  if (!raw?.length) return null
  try {
    return await compressForOg(raw)
  } catch (err) {
    console.error('[event-og] compress failed:', err)
    return null
  }
}

export function eventOgImageAbsoluteUrl(eventId: string): string {
  return `${getSiteUrl()}/api/og/event/${encodeURIComponent(eventId)}`
}