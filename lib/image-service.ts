/**
 * Image optimization and processing service
 * Handles responsive image sizing, aspect ratio preservation, and quality optimization
 */

export interface ImageDimensions {
  width: number
  height: number
}

export interface ProcessedImage {
  /** Optimized base64 data URL ready to store in Firestore */
  dataUrl: string
  width: number
  height: number
  /** Approximate stored size in bytes */
  sizeBytes: number
}

/** Estimate the decoded byte size of a base64 data URL. */
function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  // 4 base64 chars => 3 bytes
  return Math.floor((b64.length * 3) / 4)
}

/** Load a File/URL into an HTMLImageElement. */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Process an uploaded image file entirely in the browser:
 * - Preserves aspect ratio (never stretches/distorts).
 * - Downscales oversized images to a max dimension for optimization.
 * - Uses high-quality smoothing so smaller images stay crisp.
 * - Iteratively reduces quality/size to keep the result safely under the
 *   Firestore per-document limit (~1 MiB) so it can be stored directly.
 *
 * Returns an optimized base64 data URL suitable for storing in Firestore.
 */
export async function processImageFile(
  file: File,
  options: { maxDimension?: number; maxBytes?: number } = {}
): Promise<ProcessedImage> {
  if (typeof document === 'undefined') {
    throw new Error('processImageFile must run in the browser')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image')
  }

  const maxDimension = options.maxDimension ?? 1920
  // Keep well under Firestore's 1,048,576-byte document limit, leaving room
  // for the other fields stored alongside the image.
  const maxBytes = options.maxBytes ?? 750_000

  // GIFs would lose animation through canvas; store small ones as-is.
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(objectUrl)
    let targetWidth = img.naturalWidth
    let targetHeight = img.naturalHeight

    // Downscale large images while preserving aspect ratio.
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight)
      targetWidth = Math.round(targetWidth * scale)
      targetHeight = Math.round(targetHeight * scale)
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not supported in this browser')

    const draw = (w: number, h: number) => {
      canvas.width = w
      canvas.height = h
      // White backdrop so transparent PNGs converted to JPEG aren't black.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
    }

    draw(targetWidth, targetHeight)

    // Step 1: reduce JPEG quality until under the size cap.
    let quality = 0.92
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (estimateDataUrlBytes(dataUrl) > maxBytes && quality > 0.45) {
      quality -= 0.08
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    // Step 2: if still too large, progressively downscale dimensions.
    while (
      estimateDataUrlBytes(dataUrl) > maxBytes &&
      (targetWidth > 640 || targetHeight > 640)
    ) {
      targetWidth = Math.round(targetWidth * 0.85)
      targetHeight = Math.round(targetHeight * 0.85)
      draw(targetWidth, targetHeight)
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    return {
      dataUrl,
      width: targetWidth,
      height: targetHeight,
      sizeBytes: estimateDataUrlBytes(dataUrl),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export const CMS_IMAGE_PRESETS = {
  /** Hero, mission, and other large CMS imagery */
  content: { maxDimension: 1920, maxBytes: 5 * 1024 * 1024 },
  /** Homepage hero column — landscape 4:3 center-crop matches the hero frame */
  hero: { maxDimension: 1920, maxBytes: 5 * 1024 * 1024, aspectRatio: 4 / 3 },
  /** About Story founder headshot — portrait 3:4 center-crop */
  founder: { maxDimension: 1920, maxBytes: 5 * 1024 * 1024, aspectRatio: 3 / 4 },
  /** Partner / logo thumbnails */
  logo: { maxDimension: 500, maxBytes: 2 * 1024 * 1024 },
} as const

export type CmsImagePreset = keyof typeof CMS_IMAGE_PRESETS

export interface CompressImageOptions {
  maxDimension?: number
  maxBytes?: number
  allowSvg?: boolean
  preset?: CmsImagePreset
  /** Target width ÷ height; when set, image is center-cropped (cover) before resize */
  aspectRatio?: number
  /** Auto-trim fully transparent edges (logo preset enables this by default) */
  trimTransparent?: boolean
}

function resolveCompressOptions(
  presetOrOptions: CmsImagePreset | CompressImageOptions
): Required<Pick<CompressImageOptions, 'maxDimension' | 'maxBytes'>> & {
  allowSvg: boolean
  aspectRatio?: number
  trimTransparent: boolean
} {
  if (typeof presetOrOptions === 'string') {
    const defaults = CMS_IMAGE_PRESETS[presetOrOptions]
    return {
      maxDimension: defaults.maxDimension,
      maxBytes: defaults.maxBytes,
      allowSvg: presetOrOptions === 'logo',
      aspectRatio: 'aspectRatio' in defaults ? defaults.aspectRatio : undefined,
      trimTransparent: presetOrOptions === 'logo',
    }
  }

  const presetDefaults = presetOrOptions.preset
    ? CMS_IMAGE_PRESETS[presetOrOptions.preset]
    : CMS_IMAGE_PRESETS.content

  return {
    maxDimension: presetOrOptions.maxDimension ?? presetDefaults.maxDimension,
    maxBytes: presetOrOptions.maxBytes ?? presetDefaults.maxBytes,
    allowSvg: presetOrOptions.allowSvg ?? presetOrOptions.preset === 'logo',
    aspectRatio:
      presetOrOptions.aspectRatio ??
      ('aspectRatio' in presetDefaults ? presetDefaults.aspectRatio : undefined),
    trimTransparent:
      presetOrOptions.trimTransparent ?? presetOrOptions.preset === 'logo',
  }
}

/** Center-crop source rect to match target aspect ratio (width / height). */
function getCoverCropRect(
  srcW: number,
  srcH: number,
  targetAspect: number
): { sx: number; sy: number; sw: number; sh: number } {
  const srcAspect = srcW / srcH
  let sw: number
  let sh: number
  if (srcAspect > targetAspect) {
    sh = srcH
    sw = srcH * targetAspect
  } else {
    sw = srcW
    sh = srcW / targetAspect
  }
  return {
    sx: (srcW - sw) / 2,
    sy: (srcH - sh) / 2,
    sw,
    sh,
  }
}

function outputDimensionsForAspect(
  aspectRatio: number,
  maxDimension: number
): { width: number; height: number } {
  let height = maxDimension
  let width = Math.round(height * aspectRatio)
  if (width > maxDimension) {
    width = maxDimension
    height = Math.round(width / aspectRatio)
  }
  return { width, height }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      mime,
      quality
    )
  })
}

function replaceFileExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.${ext}`
}

const RASTER_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

interface TrimBounds {
  left: number
  top: number
  width: number
  height: number
}

/** Find tight bounding box of non-transparent pixels. */
function findOpaqueBounds(imageData: ImageData, alphaThreshold = 8): TrimBounds | null {
  const { width, height, data } = imageData
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > alphaThreshold) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (!found) return null
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

/** Find tight bounding box of pixels that differ from a corner background sample. */
function findContentBoundsFromBackground(
  imageData: ImageData,
  colorThreshold = 18
): TrimBounds | null {
  const { width, height, data } = imageData
  if (width === 0 || height === 0) return null

  const bgR = data[0]
  const bgG = data[1]
  const bgB = data[2]
  const bgA = data[3]

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let found = false

  const differs = (i: number) => {
    const dr = Math.abs(data[i] - bgR)
    const dg = Math.abs(data[i + 1] - bgG)
    const db = Math.abs(data[i + 2] - bgB)
    const da = Math.abs(data[i + 3] - bgA)
    return dr + dg + db + da > colorThreshold
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (differs(i)) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (!found) return null
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function cropCanvasToBounds(source: HTMLCanvasElement, bounds: TrimBounds, margin = 1): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = bounds.width + margin * 2
  out.height = bounds.height + margin * 2
  const outCtx = out.getContext('2d')
  if (!outCtx) return source

  outCtx.drawImage(
    source,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height,
    margin,
    margin,
    bounds.width,
    bounds.height
  )
  return out
}

/** Crop canvas to opaque content, optionally adding a tiny inner margin. */
function trimCanvasToOpaqueContent(source: HTMLCanvasElement, margin = 1): HTMLCanvasElement {
  const ctx = source.getContext('2d')
  if (!ctx) return source

  const imageData = ctx.getImageData(0, 0, source.width, source.height)
  let bounds = findOpaqueBounds(imageData)

  if (
    !bounds ||
    (bounds.width >= source.width - 2 && bounds.height >= source.height - 2)
  ) {
    bounds = findContentBoundsFromBackground(imageData)
  }

  if (!bounds) return source

  if (bounds.width === source.width && bounds.height === source.height) {
    return source
  }

  return cropCanvasToBounds(source, bounds, margin)
}

function scaleCanvas(source: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = targetWidth
  out.height = targetHeight
  const ctx = out.getContext('2d')
  if (!ctx) return source
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
  return out
}

/** Logo pipeline: trim transparent padding, preserve alpha, export PNG. */
async function compressLogoToFile(file: File, maxDimension: number, maxBytes: number): Promise<File> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(objectUrl)

    const stage = document.createElement('canvas')
    stage.width = img.naturalWidth
    stage.height = img.naturalHeight
    const stageCtx = stage.getContext('2d')
    if (!stageCtx) throw new Error('Canvas is not supported in this browser')

    stageCtx.clearRect(0, 0, stage.width, stage.height)
    stageCtx.drawImage(img, 0, 0)

    let trimmed = trimCanvasToOpaqueContent(stage, 1)

    let targetWidth = trimmed.width
    let targetHeight = trimmed.height
    if (targetWidth > maxDimension || targetHeight > maxDimension) {
      const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight)
      targetWidth = Math.max(1, Math.round(targetWidth * scale))
      targetHeight = Math.max(1, Math.round(targetHeight * scale))
      trimmed = scaleCanvas(trimmed, targetWidth, targetHeight)
    }

    let blob = await canvasToBlob(trimmed, 'image/png')

    while (blob.size > maxBytes && (targetWidth > 120 || targetHeight > 120)) {
      targetWidth = Math.max(1, Math.round(targetWidth * 0.85))
      targetHeight = Math.max(1, Math.round(targetHeight * 0.85))
      trimmed = scaleCanvas(trimmed, targetWidth, targetHeight)
      blob = await canvasToBlob(trimmed, 'image/png')
    }

    if (blob.size > maxBytes) {
      throw new Error(
        'Logo is still too large after trimming and compression. Try a simpler image.'
      )
    }

    return new File([blob], replaceFileExtension(file.name, 'png'), {
      type: 'image/png',
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Resize and compress an image in the browser before upload.
 * SVG files are passed through unchanged when allowSvg is true.
 */
export async function compressImageToFile(
  file: File,
  presetOrOptions: CmsImagePreset | CompressImageOptions = 'content'
): Promise<File> {
  if (typeof document === 'undefined') {
    throw new Error('compressImageToFile must run in the browser')
  }

  const { maxDimension, maxBytes, allowSvg, aspectRatio, trimTransparent } =
    resolveCompressOptions(presetOrOptions)

  if (file.type === 'image/svg+xml') {
    if (!allowSvg) {
      throw new Error('SVG is not supported for this upload. Use PNG, WebP, or JPEG.')
    }
    if (file.size > maxBytes) {
      throw new Error(
        `SVG is still too large after limits (${(maxBytes / (1024 * 1024)).toFixed(1)}MB max).`
      )
    }
    return file
  }

  if (!RASTER_IMAGE_TYPES.has(file.type)) {
    throw new Error('File must be an image (JPEG, PNG, WebP, GIF, or SVG for logos).')
  }

  // Logos always run through trim pipeline (never skip early return).
  if (trimTransparent && !aspectRatio) {
    return compressLogoToFile(file, maxDimension, maxBytes)
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(objectUrl)

    let targetWidth = img.naturalWidth
    let targetHeight = img.naturalHeight
    let crop: { sx: number; sy: number; sw: number; sh: number } | null = null

    if (aspectRatio && aspectRatio > 0) {
      crop = getCoverCropRect(img.naturalWidth, img.naturalHeight, aspectRatio)
      const sized = outputDimensionsForAspect(aspectRatio, maxDimension)
      targetWidth = sized.width
      targetHeight = sized.height
    } else if (targetWidth > maxDimension || targetHeight > maxDimension) {
      const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight)
      targetWidth = Math.round(targetWidth * scale)
      targetHeight = Math.round(targetHeight * scale)
    } else if (file.size <= maxBytes && file.type !== 'image/gif') {
      return file
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not supported in this browser')

    const draw = (w: number, h: number) => {
      canvas.width = w
      canvas.height = h
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      if (crop) {
        ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h)
      } else {
        ctx.drawImage(img, 0, 0, w, h)
      }
    }

    draw(targetWidth, targetHeight)

    let outputMime: 'image/webp' | 'image/jpeg' = 'image/webp'
    let ext = 'webp'
    let quality = 0.88
    let blob = await canvasToBlob(canvas, outputMime, quality).catch(async () => {
      outputMime = 'image/jpeg'
      ext = 'jpg'
      return canvasToBlob(canvas, outputMime, quality)
    })

    while (blob.size > maxBytes && quality > 0.4) {
      quality -= 0.08
      blob = await canvasToBlob(canvas, outputMime, quality)
    }

    while (blob.size > maxBytes && (targetWidth > 320 || targetHeight > 320)) {
      targetWidth = Math.round(targetWidth * 0.85)
      targetHeight = Math.round(targetHeight * 0.85)
      if (aspectRatio && aspectRatio > 0) {
        const sized = outputDimensionsForAspect(
          aspectRatio,
          Math.max(targetWidth, targetHeight)
        )
        targetWidth = sized.width
        targetHeight = sized.height
      }
      draw(targetWidth, targetHeight)
      blob = await canvasToBlob(canvas, outputMime, quality)
    }

    if (blob.size > maxBytes) {
      throw new Error(
        'Image is still too large after compression. Try a smaller or simpler image.'
      )
    }

    return new File([blob], replaceFileExtension(file.name, ext), {
      type: outputMime,
      lastModified: Date.now(),
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export interface OptimizedImage {
  url: string
  srcSet: string
  width: number
  height: number
  aspectRatio: number
}

/**
 * Calculate dimensions to fit container while maintaining aspect ratio
 * Uses "contain" strategy - fits entire image within container
 */
export function calculateResponsiveDimensions(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  containerHeight: number
): ImageDimensions {
  if (!originalWidth || !originalHeight) {
    return { width: containerWidth, height: containerHeight }
  }

  const originalAspectRatio = originalWidth / originalHeight
  const containerAspectRatio = containerWidth / containerHeight

  let width = containerWidth
  let height = containerHeight

  if (originalAspectRatio > containerAspectRatio) {
    // Image is wider - fit to width
    height = containerWidth / originalAspectRatio
  } else {
    // Image is taller - fit to height
    width = containerHeight * originalAspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

/**
 * Generate responsive image URL with size parameters (for services like Cloudinary, imgix, etc.)
 */
export function generateOptimizedImageUrl(
  url: string,
  width: number,
  height: number,
  quality = 85
): string {
  if (!url) return ''

  // Check if URL is from common image CDNs
  if (url.includes('cloudinary.com')) {
    // Cloudinary format
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fit,q_${quality}/`)
  } else if (url.includes('imgix')) {
    // imgix format
    return `${url}${url.includes('?') ? '&' : '?'}w=${width}&h=${height}&fit=max&q=${quality}`
  } else if (url.includes('blob.vercel-storage.com')) {
    // Vercel Blob - no built-in resizing, return as-is
    return url
  }

  // For other CDNs or direct URLs, return original
  return url
}

/**
 * Get image dimensions from URL
 * Returns dimensions via a promise - useful for responsive design
 */
export async function getImageDimensions(url: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`))
    }

    img.src = url
  })
}

/**
 * Calculate scale factor for images to fit viewport without stretching
 * Returns padding/background-color strategy for proper aspect ratio
 */
export function calculateImageScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number
): {
  scale: number
  offsetX: number
  offsetY: number
  displayWidth: number
  displayHeight: number
} {
  const imageAspect = imageWidth / imageHeight
  const viewportAspect = viewportWidth / viewportHeight

  let scale: number
  let displayWidth: number
  let displayHeight: number

  if (imageAspect > viewportAspect) {
    // Image is wider
    scale = viewportWidth / imageWidth
    displayWidth = viewportWidth
    displayHeight = imageHeight * scale
  } else {
    // Image is taller
    scale = viewportHeight / imageHeight
    displayWidth = imageWidth * scale
    displayHeight = viewportHeight
  }

  const offsetX = (viewportWidth - displayWidth) / 2
  const offsetY = (viewportHeight - displayHeight) / 2

  return {
    scale,
    offsetX,
    offsetY,
    displayWidth,
    displayHeight,
  }
}

/**
 * Generate srcSet for responsive images
 * Creates multiple size variants for different screen densities and sizes
 */
export function generateSrcSet(
  url: string,
  sizes: number[] = [640, 960, 1280, 1920]
): string {
  return sizes
    .map(size => {
      const optimizedUrl = generateOptimizedImageUrl(url, size, Math.round(size * 0.75))
      return `${optimizedUrl} ${size}w`
    })
    .join(', ')
}

/**
 * Determine best image size based on container dimensions
 * Uses common breakpoints for responsive design
 */
export function getBestImageSize(containerWidth: number): number {
  const sizes = [320, 640, 960, 1280, 1920, 2560]
  return sizes.find(size => size >= containerWidth) || sizes[sizes.length - 1]
}

/**
 * Create CSS for proper image fit without stretching
 * Returns object-fit and object-position values
 */
export function getImageFitStyle(aspectRatio: 'wide' | 'square' | 'portrait'): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
  }

  return baseStyles
}

/**
 * Validate image quality (file size, dimensions, format)
 */
export interface ImageValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateImage(
  width: number,
  height: number,
  fileSize?: number,
  maxWidth = 4000,
  maxHeight = 4000,
  maxFileSize = 10 * 1024 * 1024 // 10MB
): ImageValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (width > maxWidth || height > maxHeight) {
    warnings.push(
      `Image dimensions (${width}x${height}) exceed recommended maximum (${maxWidth}x${maxHeight}). It will be resized.`
    )
  }

  if (width < 320 || height < 240) {
    warnings.push(`Image is quite small (${width}x${height}). Quality may be reduced on larger screens.`)
  }

  if (fileSize && fileSize > maxFileSize) {
    errors.push(`File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
