import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  FORM_ATTACHMENT_MAX_BYTES,
  validateAttachmentFile,
} from '@/lib/form-builder-utils'
import { uploadBufferToStorage } from '@/lib/storage-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const formId = (formData.get('formId') as string) || ''
    const slug = (formData.get('slug') as string) || ''

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const clientError = validateAttachmentFile(file)
    if (clientError) {
      return NextResponse.json({ success: false, error: clientError }, { status: 400 })
    }

    if (file.size > FORM_ATTACHMENT_MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: `File must be ${FORM_ATTACHMENT_MAX_BYTES / (1024 * 1024)}MB or smaller` },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    let resolvedFormId = formId

    if (!resolvedFormId && slug) {
      const snap = await db
        .collection('customForms')
        .where('slug', '==', slug)
        .where('status', '==', 'active')
        .limit(1)
        .get()
      if (!snap.empty) resolvedFormId = snap.docs[0].id
    }

    if (!resolvedFormId) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })
    }

    const formDoc = await db.collection('customForms').doc(resolvedFormId).get()
    if (!formDoc.exists || formDoc.data()?.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Form is not active' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadBufferToStorage(
      buffer,
      file.type || 'application/octet-stream',
      `forms/${resolvedFormId}/attachments`,
      file.name
    )

    return NextResponse.json({
      success: true,
      file: {
        url: result.url,
        name: file.name,
        size: file.size,
        contentType: result.contentType,
      },
    })
  } catch (error) {
    console.error('[v0] /api/forms/upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
