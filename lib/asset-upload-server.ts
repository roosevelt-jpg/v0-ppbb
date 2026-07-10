import { createAssetFile, getAssetFolder } from '@/lib/asset-library-server'
import { uploadEventAsset } from '@/lib/resolve-asset-storage'
import { inferAssetFileType, parseTagsInput, type AssetFile } from '@/lib/asset-library-types'

export async function processAssetFileUpload(input: {
  folderId: string
  file: File | { name: string; type: string; buffer: Buffer }
  name?: string
  description?: string
  tags?: string | string[]
  createdBy: string
}): Promise<AssetFile> {
  const folder = await getAssetFolder(input.folderId)
  if (!folder) {
    throw new Error('Folder not found')
  }

  const buffer =
    input.file instanceof File
      ? Buffer.from(await input.file.arrayBuffer())
      : input.file.buffer
  const mimeType =
    (input.file instanceof File ? input.file.type : input.file.type) || 'application/octet-stream'
  const originalName = input.file instanceof File ? input.file.name : input.file.name
  const name = (input.name || originalName || 'Untitled').trim()
  const description = (input.description || '').trim()
  const tags = parseTagsInput(input.tags)

  const upload = await uploadEventAsset(buffer, mimeType, input.folderId, originalName)

  return createAssetFile(
    {
      folderId: input.folderId,
      name,
      description,
      tags,
      type: inferAssetFileType(mimeType),
      url: upload.url,
      storagePath: upload.path,
      mimeType: upload.contentType,
      size: upload.size,
      storageProvider: upload.provider,
      driveFileId: upload.driveFileId ?? null,
    },
    input.createdBy
  )
}
