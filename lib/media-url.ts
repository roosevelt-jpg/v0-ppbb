/**
 * Public media URLs for Firebase / GCS objects.
 *
 * Uploads historically stored https://storage.googleapis.com/<bucket>/<path>
 * after makePublic(). Uniform bucket-level access ignores object ACLs, so those
 * URLs 403 and every CMS image appears broken. Firebase download URLs
 * (`firebasestorage.googleapis.com/.../o/...?alt=media`) honor Storage rules,
 * and `/api/media` streams the same object via the Admin SDK as a fallback.
 */

import {
  isLegacyStorageBucket,
  resolveConfiguredStorageBucket,
  rewriteLegacyStorageUrl,
  rewriteStorageBucket,
} from '@/lib/storage-bucket'

export const PRIVATE_STORAGE_FOLDERS = [
  'beneficiary-docs',
  'beneficiaryRequests',
  'beneficiary-support',
  'beneficiary-documents',
  'donation-proofs',
  'marketplace-orders',
] as const

export type ParsedStorageObject = {
  bucket: string
  objectPath: string
  hasToken: boolean
}

export function isPrivateStoragePath(objectPath: string): boolean {
  const folder = objectPath.replace(/^\/+/, '').split('/')[0] || ''
  return (PRIVATE_STORAGE_FOLDERS as readonly string[]).includes(folder)
}

export function firebaseDownloadUrl(bucket: string, objectPath: string): string {
  const liveBucket = rewriteStorageBucket(bucket)
  const encoded = encodeURIComponent(objectPath.replace(/^\/+/, ''))
  return `https://firebasestorage.googleapis.com/v0/b/${liveBucket}/o/${encoded}?alt=media`
}

export function parseStorageObject(url: string | null | undefined): ParsedStorageObject | null {
  if (!url) return null
  const trimmed = rewriteLegacyStorageUrl(url.trim())
  if (!trimmed) return null

  if (trimmed.startsWith('gs://')) {
    const rest = trimmed.slice(5)
    const slash = rest.indexOf('/')
    if (slash <= 0) return null
    return {
      bucket: rewriteStorageBucket(decodeURIComponent(rest.slice(0, slash))),
      objectPath: decodeURIComponent(rest.slice(slash + 1).replace(/^\/+/, '')),
      hasToken: false,
    }
  }

  try {
    const u = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const host = u.hostname.toLowerCase()
    const hasToken = Boolean(u.searchParams.get('token'))

    if (host === 'storage.googleapis.com' || host === 'storage.cloud.google.com') {
      const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean)
      if (parts.length < 2) return null
      return {
        bucket: rewriteStorageBucket(decodeURIComponent(parts[0])),
        objectPath: parts.slice(1).map(decodeURIComponent).join('/'),
        hasToken,
      }
    }

    if (host.endsWith('.storage.googleapis.com')) {
      const bucket = host.slice(0, -'.storage.googleapis.com'.length)
      const objectPath = decodeURIComponent(u.pathname.replace(/^\//, ''))
      if (!bucket || !objectPath) return null
      return { bucket: rewriteStorageBucket(bucket), objectPath, hasToken }
    }

    if (host === 'firebasestorage.googleapis.com') {
      const match = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/)
      if (!match) return null
      return {
        bucket: rewriteStorageBucket(decodeURIComponent(match[1])),
        objectPath: decodeURIComponent(match[2]),
        hasToken,
      }
    }

    return null
  } catch {
    return null
  }
}

export function isAllowedMediaBucket(bucket: string): boolean {
  const name = rewriteStorageBucket(bucket).trim().toLowerCase()
  if (!name) return false
  if (isLegacyStorageBucket(name)) return false
  if (name === resolveConfiguredStorageBucket().toLowerCase()) return true
  if (name.endsWith('.appspot.com') || name.endsWith('.firebasestorage.app')) {
    // Only the live Passive Blessings project — block retired typo-project buckets.
    return name.includes('passiveblessings-cc0ef') || name.includes('passive-blessings')
  }
  if (name.includes('passiveblessings-cc0ef') || name.includes('passive-blessings')) {
    return true
  }
  return false
}

/** Same-origin Admin SDK stream. Use when direct GCS / tokenless Firebase URLs 403. */
export function toMediaProxyUrl(url: string): string {
  const rewritten = rewriteLegacyStorageUrl(url)
  const parsed = parseStorageObject(rewritten)
  if (!parsed || isPrivateStoragePath(parsed.objectPath) || !isAllowedMediaBucket(parsed.bucket)) {
    return ''
  }
  if (rewritten.startsWith('/api/media')) return rewritten
  return `/api/media?u=${encodeURIComponent(rewritten.trim())}`
}

/** Rewrite a stored URL so the browser can load it. Pass through data/blob/local/http(s) others. */
export function resolvePublicMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = rewriteLegacyStorageUrl(url.trim())
  if (!trimmed) return ''
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('//')
  ) {
    return trimmed
  }

  const parsed = parseStorageObject(trimmed)
  if (!parsed) return trimmed
  if (isPrivateStoragePath(parsed.objectPath)) return trimmed
  if (parsed.hasToken) return trimmed

  return firebaseDownloadUrl(parsed.bucket, parsed.objectPath)
}

export function mediaUrl(value: unknown): string {
  return typeof value === 'string' ? resolvePublicMediaUrl(value) : ''
}

export function mediaUrlOrNull(value: unknown): string | null {
  const next = mediaUrl(value)
  return next || null
}

export function mediaUrlList(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values.map(mediaUrl).filter(Boolean)
}
