import { NextRequest, NextResponse } from 'next/server'
import {
  authRequiredResponse,
  getAuthAudience,
} from '@/lib/asset-api-auth'
import {
  folderVisibleToAudience,
  getAssetFolder,
  listAssetFiles,
} from '@/lib/asset-library-server'

type RouteContext = { params: Promise<{ folderId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const audience = await getAuthAudience(request)
  if (!audience) return authRequiredResponse()

  try {
    const { folderId } = await context.params
    const folder = await getAssetFolder(folderId)
    if (!folder || !folderVisibleToAudience(folder, audience)) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 })
    }

    const tagFilter = (request.nextUrl.searchParams.get('tag') || '').trim().toLowerCase()
    let files = await listAssetFiles(folderId)
    if (tagFilter) {
      files = files.filter(
        (f) =>
          f.tags.some((t) => t.toLowerCase().includes(tagFilter)) ||
          f.name.toLowerCase().includes(tagFilter)
      )
    }

    return NextResponse.json({ success: true, data: { folder, files } })
  } catch (error) {
    console.error('[assets] public get folder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load folder' }, { status: 500 })
  }
}
