import {
  compressImageToFile,
  CmsImagePreset,
  CompressImageOptions,
} from '@/lib/image-service'

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
}

/**
 * Uploads an image to Firebase Storage (via the server upload route) and
 * returns its public download URL. Images are resized/compressed client-side
 * before upload. Only the URL is stored in Firestore.
 */
export async function uploadImageToFirebase(
  file: File,
  path: string,
  options: UploadImageOptions = {}
): Promise<string> {
  if (!file) {
    throw new Error('No file selected')
  }

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

  const fd = new FormData()
  fd.append('file', prepared)
  fd.append('folder', path)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Image upload failed')
  }
  return json.url as string
}

/**
 * Uploads any file (image, video, etc.) to Firebase Storage via the server
 * upload route. Only the returned URL should be stored in Firestore.
 * Pass `exactPath` for a deterministic Storage object (e.g. partners/{id}/logo.png).
 */
export async function uploadFileToFirebase(
  file: File,
  folder: string,
  exactPath?: string
): Promise<string> {
  if (!file) {
    throw new Error('No file selected')
  }

  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  if (exactPath) fd.append('path', exactPath)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'File upload failed')
  }
  return json.url as string
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
