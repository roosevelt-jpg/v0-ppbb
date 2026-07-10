import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import {
  deleteAssetFolder,
  getAssetFolder,
  listAssetFiles,
  updateAssetFolder,
} from '@/lib/asset-library-server'
import { parseTagsInput } from '@/lib/asset-library-types'

type RouteContext = { params: Promise<{ folderId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const { folderId } = await context.params
    const folder = await getAssetFolder(folderId)
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 })
    }
    const files = await listAssetFiles(folderId)
    return NextResponse.json({ success: true, data: { folder, files } })
  } catch (error) {
    console.error('[assets] get folder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load folder' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const { folderId } = await context.params
    const body = await request.json()
    const folder = await updateAssetFolder(folderId, {
      name: body.name,
      description: body.description,
      tags: body.tags !== undefined ? parseTagsInput(body.tags) : undefined,
      eventId: body.eventId,
      eventTitle: body.eventTitle,
      visibility: body.visibility,
      status: body.status,
      coverImageUrl: body.coverImageUrl,
    })
    if (!folder) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: folder })
  } catch (error) {
    console.error('[assets] update folder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update folder' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const { folderId } = await context.params
    await deleteAssetFolder(folderId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[assets] delete folder error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete folder' }, { status: 500 })
  }
}
