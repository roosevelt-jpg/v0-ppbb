'use client'

export interface UploadedDocument {
  fileName: string
  fileSize: number
  mimeType: string
  downloadUrl: string
  storagePath: string
  uploadedAt: Date
  fileHash: string
}

/**
 * Upload a beneficiary document to Firebase Storage
 * Files are stored with path: beneficiary-documents/{requestId}/{timestamp}-{hash}-{fileName}
 * @param requestId - Beneficiary request ID
 * @param documentType - Type of document (emirates_id, passport, visa, salary_certificate, etc)
 * @param file - File to upload
 * @returns UploadedDocument with metadata and download URL
 */
export async function uploadBeneficiaryDocument(
  requestId: string,
  documentType: string,
  file: File
): Promise<UploadedDocument> {
  // Validate file client-side for fast feedback (the server re-validates).
  if (!file) {
    throw new Error('No file provided')
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  // Upload via the Admin SDK API route. The file bytes go to Firebase Storage
  // and only the download URL + metadata are returned (and later stored in
  // Firestore). The client Storage SDK is blocked by the deployed rules.
  const fd = new FormData()
  fd.append('file', file)
  fd.append('requestId', requestId)
  fd.append('documentType', documentType)

  const res = await fetch('/api/beneficiary-documents', { method: 'POST', body: fd })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Upload failed')
  }

  const doc = json.document
  return {
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    downloadUrl: doc.downloadUrl,
    storagePath: doc.storagePath,
    uploadedAt: new Date(doc.uploadedAt),
    fileHash: doc.fileHash,
  }
}

/**
 * Delete a beneficiary document from Firebase Storage
 * @param storagePath - Storage path of the document
 */
export async function deleteBeneficiaryDocument(storagePath: string): Promise<void> {
  try {
    await fetch('/api/beneficiary-documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    })
  } catch (error) {
    console.error('[v0] Error deleting document:', error)
    // Don't throw - document may have already been deleted
  }
}

/**
 * Get the public download URL for a stored document. Files are uploaded as
 * public objects, so the URL is derived directly from the storage path.
 * @param storagePath - Storage path of the document
 * @returns Download URL
 */
export async function getBeneficiaryDocumentUrl(storagePath: string): Promise<string> {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_NAME || 'pasiveblessings-media'
  return `https://storage.googleapis.com/${bucket}/${storagePath.replace(/^\/+/, '')}`
}

/**
 * Convert file to Base64 for preview/display
 * @param file - File to convert
 * @returns Base64 string with data URL prefix
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Preview a document file (show Base64 data URL)
 * Useful for PDF, images, etc before submission
 * @param file - File to preview
 * @returns Data URL for preview
 */
export async function previewDocument(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    // For PDFs, we need to use an iframe or PDF viewer
    return await fileToBase64(file)
  }

  if (file.type.startsWith('image/')) {
    // For images, convert to Base64
    return await fileToBase64(file)
  }

  // For documents (docx, xlsx, etc), we can't preview directly
  // Return a placeholder
  return `data:${file.type};base64,`
}
