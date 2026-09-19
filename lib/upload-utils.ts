import {
  compressImageToFile,
  CmsImagePreset,
  CompressImageOptions,
} from '@/lib/image-service'
import { uploadToFirebaseStorage, type UploadProgress } from '@/lib/firebase-storage'
import { auth } from '@/lib/firebase'

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024

const RASTER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const LOGO_TYPES = [...RASTER_TYPES, 'image/svg+xml']
const FAVICON_TYPES = [
  ...RASTER_TYPES,
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/svg+xml',
]

export interface UploadImageOptions extends CompressImageOptions {
  preset?: CmsImagePreset
  onProgress?: (progress: UploadProgress) => void
}

function sanitizeExt(name: string, mimeType: string): string {
  const fromName = name.includes('.') ? name.split('.').pop() || '' : ''
  const fromMime = mimeType.split('/')[1]?.split('+')[0] || ''
  const raw = (fromName || fromMime || 'bin').toLowerCase()
  return raw.replace(/[^a-z0-9]/g, '') || 'bin'
}

function buildObjectPath(folder: string, file: File, exactPath?: string): string {
  if (exactPath?.trim()) return exactPath.replace(/^\/+/, '')
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '') || 'uploads'
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${cleanFolder}/${Date.now()}-${id}.${sanitizeExt(file.name, file.type)}`
}

async function ensureSignedIn(): Promise<void> {
  if (!auth?.currentUser) {
    throw new Error('Sign in required to upload files')
  }
  // Refresh token so Storage rules see a valid auth session
  await auth.currentUser.getIdToken(true).catch(() => undefined)
}

/**
 * Compress/resize in the browser, then upload directly to Firebase Storage
 * (client SDK — no /api/upload round-trip). Only the download URL is stored.
 */
export async function uploadImageToFirebase(
  file: File,
  path: string,
  options: UploadImageOptions = {}
): Promise<string> {
  if (!file) {
    throw new Error('No file selected')
  }

  await ensureSignedIn()

  const preset = options.preset ?? 'content'
  const allowSvg =
    options.allowSvg ?? (preset === 'logo' || preset === 'brandLogo' || preset === 'favicon')

  const typeCheck = validateImageFile(file, { allowSvg, preset })
  if (!typeCheck.valid) {
    throw new Error(typeCheck.error || 'Invalid image file')
  }

  const prepared = await compressImageToFile(file, {
    preset,
    allowSvg,
    maxDimension: options.maxDimension,
    maxBytes: options.maxBytes,
    aspectRatio: options.aspectRatio,
    exactWidth: options.exactWidth,
    exactHeight: options.exactHeight,
  })

  if (prepared.size > UPLOAD_MAX_BYTES) {
    throw new Error(
      'Image is still too large after compression (5MB max). Try a smaller image.'
    )
  }

  const objectPath = buildObjectPath(path, prepared)
  return uploadToFirebaseStorage(prepared, objectPath, options.onProgress)
}

/**
 * Uploads any file directly to Firebase Storage. Images should prefer
 * {@link uploadImageToFirebase} so they are resized first.
 */
export async function uploadFileToFirebase(
  file: File,
  folder: string,
  exactPath?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  if (!file) {
    throw new Error('No file selected')
  }

  await ensureSignedIn()

  // Images go through resize/compress automatically
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    return uploadImageToFirebase(file, folder, { preset: 'content', onProgress })
  }

  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File is too large (25MB max)')
  }

  const objectPath = buildObjectPath(folder, file, exactPath)
  return uploadToFirebaseStorage(file, objectPath, onProgress)
}

export function validateImageFile(
  file: File,
  options: { allowSvg?: boolean; preset?: CmsImagePreset } = {}
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  const allowSvg =
    options.allowSvg ??
    (options.preset === 'logo' || options.preset === 'brandLogo')
  const validTypes =
    options.preset === 'favicon'
      ? FAVICON_TYPES
      : allowSvg
        ? LOGO_TYPES
        : RASTER_TYPES

  if (!validTypes.includes(file.type) && !(options.preset === 'favicon' && file.name.toLowerCase().endsWith('.ico'))) {
    return {
      valid: false,
      error:
        options.preset === 'favicon'
          ? 'File must be an image (PNG, JPEG, WebP, GIF, ICO, or SVG)'
          : allowSvg
            ? 'File must be an image (JPEG, PNG, WebP, GIF, or SVG)'
            : 'File must be an image (JPEG, PNG, WebP, or GIF)',
    }
  }

  return { valid: true }
}
