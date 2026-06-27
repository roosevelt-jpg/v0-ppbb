/**
 * Uploads an image to Firebase Storage (via the server upload route) and
 * returns its public download URL. Only the URL is ever stored in Firestore —
 * never the file bytes. Uploads run server-side with the Admin SDK because the
 * client Storage SDK is blocked by the deployed security rules.
 */
export async function uploadImageToFirebase(file: File, path: string): Promise<string> {
  // Validate file
  if (!file) {
    throw new Error('No file selected')
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB')
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new Error('File must be an image (JPEG, PNG, WebP, or GIF)')
  }

  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', path)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Image upload failed')
  }
  return json.url as string
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'File must be an image (JPEG, PNG, WebP, or GIF)' }
  }

  return { valid: true }
}
