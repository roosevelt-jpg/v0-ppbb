import { randomUUID } from 'crypto'
import { getAdminBucket } from '@/lib/firebase-admin'

interface UploadResult {
  url: string
  path: string
  contentType: string
  size: number
}

/**
 * Uploads raw bytes to Storage and returns a public URL. This is the single
 * code path for persisting any binary file (image, PDF, video). Firestore only
 * ever stores the returned `url` — never the bytes.
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  mimeType: string,
  folder: string,
  originalName = ''
): Promise<UploadResult> {
  if (!buffer.length) {
    throw new Error('Empty file')
  }

  const bucket = getAdminBucket()
  const extFromMime = mimeType.split('/')[1]?.split('+')[0]
  const extFromName = originalName.includes('.') ? originalName.split('.').pop() : ''
  const ext = (extFromName || extFromMime || 'bin').toLowerCase()
  const path = `${folder.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${randomUUID()}.${ext}`

  const file = bucket.file(path)
  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  })
  await file.makePublic()

  return {
    url: `https://storage.googleapis.com/${bucket.name}/${path}`,
    path,
    contentType: mimeType,
    size: buffer.length,
  }
}

/**
 * Uploads bytes to an explicit Storage path with optional custom metadata.
 * Used when the caller needs a deterministic path (e.g. beneficiary documents
 * keyed by request + document type) rather than a random one.
 */
export async function uploadBufferToPath(
  buffer: Buffer,
  mimeType: string,
  path: string,
  customMetadata: Record<string, string> = {},
  options: { makePublic?: boolean; signedUrlDays?: number } = {}
): Promise<UploadResult> {
  if (!buffer.length) {
    throw new Error('Empty file')
  }
  const bucket = getAdminBucket()
  const cleanPath = path.replace(/^\/+/, '')
  const file = bucket.file(cleanPath)
  const makePublic = options.makePublic === true
  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
    metadata: {
      cacheControl: makePublic ? 'public, max-age=31536000' : 'private, max-age=3600',
      metadata: customMetadata,
    },
  })

  let url: string
  if (makePublic) {
    await file.makePublic()
    url = `https://storage.googleapis.com/${bucket.name}/${cleanPath}`
  } else {
    // Private object — temporary signed URL for authorized app/API consumers only.
    // Do not use for public CMS assets. Firestore should not expose this to unrelated users.
    const days = options.signedUrlDays ?? 365
    const [signed] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + days * 24 * 60 * 60 * 1000,
    })
    url = signed
  }

  return {
    url,
    path: cleanPath,
    contentType: mimeType,
    size: buffer.length,
  }
}

/** Mint a fresh signed URL for a private Storage object (Admin SDK only). */
export async function getSignedReadUrl(path: string, days = 7): Promise<string> {
  const file = getAdminBucket().file(path.replace(/^\/+/, ''))
  const [signed] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + days * 24 * 60 * 60 * 1000,
  })
  return signed
}

/**
 * Deletes a file from Storage by its path. Never throws — the object may
 * already be gone.
 */
export async function deleteFromStorage(path: string): Promise<void> {
  try {
    await getAdminBucket().file(path.replace(/^\/+/, '')).delete()
  } catch {
    // ignore — already deleted or missing
  }
}

/**
 * Parses a request (multipart form-data with `file`, or JSON with `dataUrl`)
 * into a buffer + metadata ready for {@link uploadBufferToStorage}.
 * Optional `path` forces an exact Storage object path (e.g. partners/{id}/logo.png).
 */
export async function parseUploadRequest(
  req: Request
): Promise<{
  buffer: Buffer
  mimeType: string
  folder: string
  originalName: string
  path?: string
}> {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) throw new Error('No file provided')
    const maxBytes = 25 * 1024 * 1024
    if (typeof file.size === 'number' && file.size > maxBytes) {
      throw new Error(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum upload size is 25 MB.`
      )
    }
    // `type` is an alias some callers use to bucket uploads into a folder.
    const folder = (form.get('folder') as string) || (form.get('type') as string) || 'uploads'
    const pathRaw = (form.get('path') as string) || ''
    return {
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type || 'application/octet-stream',
      folder,
      originalName: file.name || '',
      path: pathRaw.trim() || undefined,
    }
  }

  const body = await req.json()
  const match = /^data:([^;]+);base64,(.*)$/.exec(body.dataUrl || '')
  if (!match) throw new Error('Invalid dataUrl')
  return {
    buffer: Buffer.from(match[2], 'base64'),
    mimeType: match[1],
    folder: body.folder || 'uploads',
    originalName: body.filename || '',
    path: typeof body.path === 'string' && body.path.trim() ? body.path.trim() : undefined,
  }
}
