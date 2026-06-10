'use client'

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { app } from './firebase'

export interface UploadedImage {
  base64: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: number
}

/**
 * Convert file to Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Remove data:image/jpeg;base64, prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Upload image file and return Base64 + metadata
 * Store directly in Firestore document
 */
export async function uploadImageForFirestore(file: File): Promise<UploadedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB')
  }

  const base64 = await fileToBase64(file)

  return {
    base64,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedAt: Date.now(),
  }
}

/**
 * Optional: Upload to Firebase Storage if you need CDN URLs later
 * Keep Base64 in Firestore for quick access
 */
export async function uploadImageToStorage(file: File, path: string): Promise<string> {
  const storage = getStorage(app)
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
  
  await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(storageRef)
  
  return downloadURL
}

/**
 * Convert Base64 back to blob/image for display
 */
export function base64ToImage(base64: string, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${base64}`
}
