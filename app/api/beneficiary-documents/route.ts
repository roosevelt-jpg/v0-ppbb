import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { uploadBufferToPath, deleteFromStorage } from '@/lib/storage-server'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// Upload a beneficiary document to Firebase Storage via the Admin SDK.
// Only the resulting download URL + metadata is meant to be stored in
// Firestore — never the file bytes.
export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const requestId = (form.get('requestId') as string) || ''
    const documentType = (form.get('documentType') as string) || 'document'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size must be less than 10MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      )
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Accepted: PDF, JPG, PNG, WebP, DOC, DOCX, XLS, XLSX' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileHash = createHash('sha256').update(buffer).digest('hex').substring(0, 16)
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
    const path = `beneficiary-documents/${requestId}/${documentType}/${timestamp}-${fileHash}-${sanitizedFileName}`

    const result = await uploadBufferToPath(buffer, file.type, path, {
      documentType,
      requestId,
      originalFileName: file.name,
      uploadedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      document: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        downloadUrl: result.url,
        storagePath: result.path,
        uploadedAt: new Date().toISOString(),
        fileHash,
      },
    })
  } catch (error) {
    console.error('[v0] Beneficiary document upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { storagePath } = await req.json()
    if (!storagePath) {
      return NextResponse.json({ success: false, error: 'storagePath required' }, { status: 400 })
    }
    await deleteFromStorage(storagePath)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Beneficiary document delete error:', error)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
