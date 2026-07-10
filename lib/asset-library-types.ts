export type AssetFileType = 'photo' | 'video' | 'document'

export type AssetFolderVisibility = 'members' | 'business' | 'both'

export type AssetFolderStatus = 'draft' | 'published'

export type AssetStorageProvider = 'firebase' | 'aws_s3' | 'google_cloud' | 'google_drive'

export interface AssetFolder {
  id: string
  name: string
  description?: string
  tags: string[]
  eventId?: string | null
  eventTitle?: string | null
  visibility: AssetFolderVisibility
  status: AssetFolderStatus
  coverImageUrl?: string | null
  fileCount: number
  storageProvider: AssetStorageProvider
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface AssetFile {
  id: string
  folderId: string
  name: string
  description?: string
  tags: string[]
  type: AssetFileType
  url: string
  storagePath: string
  mimeType: string
  size: number
  storageProvider: AssetStorageProvider
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export function inferAssetFileType(mimeType: string): AssetFileType {
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('image/')) return 'photo'
  return 'document'
}

export function getStorageProviderLabel(provider: AssetStorageProvider): string {
  switch (provider) {
    case 'aws_s3':
      return 'AWS S3'
    case 'google_cloud':
      return 'Google Cloud Storage'
    case 'google_drive':
      return 'Google Drive'
    default:
      return 'Firebase / Google Cloud (default)'
  }
}

export function parseTagsInput(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => t.trim()).filter(Boolean)
  }
  if (!raw) return []
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}
