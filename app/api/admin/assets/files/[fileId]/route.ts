import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { deleteAssetFile, updateAssetFile } from '@/lib/asset-library-server'
import { parseTagsInput } from '@/lib/asset-library-types'

type RouteContext = { params: Promise<{ fileId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const { fileId } = await context.params
    const body = await request.json()
    const file = await updateAssetFile(fileId, {
      name: body.name,
      description: body.description,
      tags: body.tags !== undefined ? parseTagsInput(body.tags) : undefined,
    })
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: file })
  } catch (error) {
    console.error('[assets] update file error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const { fileId } = await context.params
    await deleteAssetFile(fileId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[assets] delete file error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 })
  }
}
