import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export interface UploadProgress {
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export async function uploadToFirebaseStorage(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    onProgress?.({ progress: 0, status: 'uploading' })

    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)

    onProgress?.({ progress: 50, status: 'uploading' })

    const downloadURL = await getDownloadURL(storageRef)

    onProgress?.({ progress: 100, status: 'success' })

    return downloadURL
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    onProgress?.({ progress: 0, status: 'error', error: errorMessage })
    throw error
  }
}

export async function uploadCommunityIcon(communityId: string, file: File): Promise<string> {
  return uploadToFirebaseStorage(file, `communities/${communityId}/icon`)
}

export async function uploadCommunityBanner(communityId: string, file: File): Promise<string> {
  return uploadToFirebaseStorage(file, `communities/${communityId}/banner`)
}

export async function uploadGroupIcon(communityId: string, groupId: string, file: File): Promise<string> {
  return uploadToFirebaseStorage(file, `communities/${communityId}/groups/${groupId}/icon`)
}

export async function uploadGroupFile(
  communityId: string,
  groupId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const fileName = `${Date.now()}_${file.name}`
  return uploadToFirebaseStorage(file, `communities/${communityId}/groups/${groupId}/files/${fileName}`, onProgress)
}

export async function deleteFromFirebaseStorage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('[v0] Error deleting from storage:', error)
  }
}

export function getFileType(file: File): 'image' | 'video' | 'pdf' | 'file' {
  const type = file.type.toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type === 'application/pdf') return 'pdf'
  return 'file'
}
