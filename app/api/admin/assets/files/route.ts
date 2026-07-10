import { NextRequest, NextResponse } from 'next/server'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { processAssetFileUpload } from '@/lib/asset-upload-server'
import type { AssetFile } from '@/lib/asset-library-types'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return unauthorizedResponse()

  try {
    const form = await request.formData()
    const folderId = (form.get('folderId') as string) || ''
    const sharedTags = (form.get('tags') as string) || ''
    const sharedDescription = (form.get('description') as string) || ''

    if (!folderId) {
      return NextResponse.json({ success: false, error: 'folderId is required' }, { status: 400 })
    }

    const singleFile = form.get('file') as File | null
    const bulkFiles = form.getAll('files').filter((f): f is File => f instanceof File)
    const filesToUpload = singleFile ? [singleFile] : bulkFiles

    if (filesToUpload.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one file is required' }, { status: 400 })
    }

    const uploaded: AssetFile[] = []
    const failed: Array<{ name: string; error: string }> = []

    for (const file of filesToUpload) {
      try {
        const assetFile = await processAssetFileUpload({
          folderId,
          file,
          name: file.name,
          description: sharedDescription,
          tags: sharedTags,
          createdBy: uid,
        })
        uploaded.push(assetFile)
      } catch (error) {
        failed.push({
          name: file.name,
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    }

    const bulk = filesToUpload.length > 1
    return NextResponse.json({
      success: uploaded.length > 0,
      data: bulk ? uploaded : uploaded[0],
      uploaded,
      failed,
      error:
        uploaded.length === 0
          ? failed[0]?.error || 'All uploads failed'
          : failed.length > 0
            ? `${failed.length} file(s) failed`
            : undefined,
    })
  } catch (error) {
    console.error('[assets] upload file error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
