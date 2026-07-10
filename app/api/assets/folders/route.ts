import { NextRequest, NextResponse } from 'next/server'
import {
  authRequiredResponse,
  getAuthAudience,
} from '@/lib/asset-api-auth'
import {
  folderVisibleToAudience,
  listAssetFolders,
} from '@/lib/asset-library-server'

export async function GET(request: NextRequest) {
  const audience = await getAuthAudience(request)
  if (!audience) return authRequiredResponse()

  try {
    const tagFilter = (request.nextUrl.searchParams.get('tag') || '').trim().toLowerCase()
    const eventId = request.nextUrl.searchParams.get('eventId') || ''

    let folders = await listAssetFolders({ status: 'published', limit: 200 })
    folders = folders.filter((f) => folderVisibleToAudience(f, audience))

    if (eventId) {
      folders = folders.filter((f) => f.eventId === eventId)
    }
    if (tagFilter) {
      folders = folders.filter((f) =>
        f.tags.some((t) => t.toLowerCase().includes(tagFilter))
      )
    }

    return NextResponse.json({ success: true, data: folders })
  } catch (error) {
    console.error('[assets] public list folders error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load assets' }, { status: 500 })
  }
}
