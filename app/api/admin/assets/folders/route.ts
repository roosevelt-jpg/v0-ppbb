import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import {
  createAssetFolder,
  listAssetFolders,
} from '@/lib/asset-library-server'
import { getActiveAssetStorageProvider } from '@/lib/resolve-asset-storage'
import { parseTagsInput } from '@/lib/asset-library-types'

export async function GET(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const status = request.nextUrl.searchParams.get('status') as 'draft' | 'published' | 'all' | null
    const folders = await listAssetFolders({ status: status || 'all', limit: 200 })
    const provider = await getActiveAssetStorageProvider()
    return NextResponse.json({ success: true, data: folders, storageProvider: provider })
  } catch (error) {
    console.error('[assets] list folders error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load folders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const body = await request.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Folder name is required' }, { status: 400 })
    }

    const provider = await getActiveAssetStorageProvider()
    const folder = await createAssetFolder(
      {
        name: body.name.trim(),
        description: body.description || '',
        tags: parseTagsInput(body.tags),
        eventId: body.eventId || null,
        eventTitle: body.eventTitle || null,
        visibility: body.visibility || 'both',
        status: body.status || 'draft',
        coverImageUrl: null,
        storageProvider: provider,
      },
      uid
    )

    return NextResponse.json({ success: true, data: folder })
  } catch (error) {
    console.error('[assets] create folder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create folder' }, { status: 500 })
  }
}
