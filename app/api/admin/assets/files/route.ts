import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { createAssetFile, getAssetFolder } from '@/lib/asset-library-server'
import { uploadEventAsset } from '@/lib/resolve-asset-storage'
import { inferAssetFileType, parseTagsInput } from '@/lib/asset-library-types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const folderId = (form.get('folderId') as string) || ''
    const name = ((form.get('name') as string) || file?.name || 'Untitled').trim()
    const description = ((form.get('description') as string) || '').trim()
    const tags = parseTagsInput((form.get('tags') as string) || '')

    if (!file || !folderId) {
      return NextResponse.json({ success: false, error: 'File and folderId are required' }, { status: 400 })
    }

    const folder = await getAssetFolder(folderId)
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'application/octet-stream'
    const upload = await uploadEventAsset(buffer, mimeType, folderId, file.name)

    const assetFile = await createAssetFile(
      {
        folderId,
        name,
        description,
        tags,
        type: inferAssetFileType(mimeType),
        url: upload.url,
        storagePath: upload.path,
        mimeType: upload.contentType,
        size: upload.size,
        storageProvider: upload.provider,
      },
      uid
    )

    return NextResponse.json({ success: true, data: assetFile })
  } catch (error) {
    console.error('[assets] upload file error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
