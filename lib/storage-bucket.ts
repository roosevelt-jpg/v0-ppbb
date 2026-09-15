/**
 * Canonical Firebase Storage bucket for Passive Blessings (new project).
 * Old project used `pasiveblessings` / `pasiveblessings-media` — do not fall back to those.
 */
export const DEFAULT_FIREBASE_PROJECT_ID = 'passiveblessings-cc0ef'
export const DEFAULT_STORAGE_BUCKET = 'passiveblessings-cc0ef.firebasestorage.app'

/** Legacy buckets from the retired `pasiveblessings` Firebase project. */
export const LEGACY_STORAGE_BUCKETS = [
  'pasiveblessings-media',
  'pasiveblessings.appspot.com',
  'pasiveblessings.firebasestorage.app',
  'pasiveblessings-media.appspot.com',
  'pasiveblessings-media.firebasestorage.app',
] as const

export function resolveConfiguredStorageBucket(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_NAME ||
    DEFAULT_STORAGE_BUCKET
  )
    .trim()
    .replace(/^gs:\/\//, '')
    .replace(/\/+$/, '')
}

export function isLegacyStorageBucket(bucket: string): boolean {
  const name = decodeURIComponent(bucket.trim()).toLowerCase()
  if (!name) return false
  if ((LEGACY_STORAGE_BUCKETS as readonly string[]).includes(name)) return true
  // Typo project id only — do not treat passiveblessings-cc0ef as legacy.
  if (name === 'pasiveblessings' || name.startsWith('pasiveblessings.') || name.startsWith('pasiveblessings-')) {
    return true
  }
  return false
}

/** Map a legacy bucket name to the live project bucket (objects were migrated). */
export function rewriteStorageBucket(bucket: string): string {
  if (isLegacyStorageBucket(bucket)) return resolveConfiguredStorageBucket()
  return bucket.trim()
}

/** Rewrite a full media URL if it still points at the old Firebase Storage bucket. */
export function rewriteLegacyStorageUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  const current = resolveConfiguredStorageBucket()

  if (trimmed.startsWith('gs://')) {
    const rest = trimmed.slice(5)
    const slash = rest.indexOf('/')
    if (slash > 0) {
      const bucket = rest.slice(0, slash)
      const path = rest.slice(slash)
      if (isLegacyStorageBucket(bucket)) return `gs://${current}${path}`
    }
    return trimmed
  }

  try {
    const u = new URL(trimmed)
    const host = u.hostname.toLowerCase()

    if (host === 'firebasestorage.googleapis.com') {
      const match = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/)
      if (match && isLegacyStorageBucket(decodeURIComponent(match[1]))) {
        u.pathname = `/v0/b/${encodeURIComponent(current)}/o/${match[2]}`
        return u.toString()
      }
    }

    if (host === 'storage.googleapis.com' || host === 'storage.cloud.google.com') {
      const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean)
      if (parts[0] && isLegacyStorageBucket(decodeURIComponent(parts[0]))) {
        parts[0] = encodeURIComponent(current)
        u.pathname = `/${parts.join('/')}`
        return u.toString()
      }
    }

    if (host.endsWith('.storage.googleapis.com')) {
      const bucket = host.slice(0, -'.storage.googleapis.com'.length)
      if (isLegacyStorageBucket(bucket)) {
        u.hostname = `${current}.storage.googleapis.com`
        return u.toString()
      }
    }
  } catch {
    /* keep original */
  }

  return trimmed
}
