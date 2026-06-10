'use client'

import { storage } from '@/lib/firebase'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import crypto from 'crypto'

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
  // Validate file
  if (!file) {
    throw new Error('No file provided')
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size must be less than 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  // Allowed MIME types for documents
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(
      `File type not allowed. Accepted types: PDF, JPG, PNG, WebP, DOC, DOCX, XLS, XLSX`
    )
  }

  try {
    // Generate file hash for integrity verification
    const fileBuffer = await file.arrayBuffer()
    const hashBuffer = crypto.subtle
      ? await crypto.subtle.digest('SHA-256', fileBuffer)
      : Buffer.from(file.name) // Fallback for browser environments

    const fileHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 16)

    // Create storage path: beneficiary-documents/{requestId}/{documentType}/{timestamp}-{hash}-{fileName}
    const timestamp = Date.now()
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50)
    const storagePath = `beneficiary-documents/${requestId}/${documentType}/${timestamp}-${fileHash}-${sanitizedFileName}`

    console.log('[v0] Uploading document to Firebase Storage:', storagePath)

    // Upload file to Firebase Storage
    const fileRef = ref(storage, storagePath)
    const metadata = {
      contentType: file.type,
      customMetadata: {
        documentType,
        requestId,
        originalFileName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    }

    await uploadBytes(fileRef, fileBuffer, metadata)

    // Get download URL
    const downloadUrl = await getDownloadURL(fileRef)

    console.log('[v0] Document uploaded successfully:', downloadUrl)

    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      downloadUrl,
      storagePath,
      uploadedAt: new Date(),
      fileHash,
    }
  } catch (error) {
    console.error('[v0] Error uploading document:', error)
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    throw error
  }
}

/**
 * Delete a beneficiary document from Firebase Storage
 * @param storagePath - Storage path of the document
 */
export async function deleteBeneficiaryDocument(storagePath: string): Promise<void> {
  try {
    console.log('[v0] Deleting document from Firebase Storage:', storagePath)
    const fileRef = ref(storage, storagePath)
    await deleteObject(fileRef)
    console.log('[v0] Document deleted successfully')
  } catch (error) {
    console.error('[v0] Error deleting document:', error)
    // Don't throw - document may have already been deleted
  }
}

/**
 * Get download URL for a stored document
 * @param storagePath - Storage path of the document
 * @returns Download URL
 */
export async function getBeneficiaryDocumentUrl(storagePath: string): Promise<string> {
  try {
    const fileRef = ref(storage, storagePath)
    return await getDownloadURL(fileRef)
  } catch (error) {
    console.error('[v0] Error getting document URL:', error)
    throw new Error('Failed to retrieve document URL')
  }
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
