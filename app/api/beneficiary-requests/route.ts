import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { getAdminDb, getAdminApp } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { uploadBufferToPath } from '@/lib/storage-server'

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const EMERGENCY_LEVELS = new Set(['low', 'medium', 'high', 'critical'])

type UploadedDoc = {
  url: string
  storagePath: string
  fileName: string
  fileSize: number
  mimeType: string
  fileHash: string
}

async function uploadPrivateDoc(
  file: File,
  requestId: string,
  documentType: string
): Promise<UploadedDoc> {
  if (file.size > MAX_SIZE) {
    throw new Error(`${documentType}: file must be under 10MB`)
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`${documentType}: unsupported file type (${file.type || 'unknown'})`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileHash = createHash('sha256').update(buffer).digest('hex').substring(0, 16)
  const timestamp = Date.now()
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
  // Restricted path — scoped separately in storage.rules (welfare-tier read only)
  const path = `beneficiary-documents/${requestId}/${documentType}/${timestamp}-${fileHash}-${sanitized}`

  const result = await uploadBufferToPath(
    buffer,
    file.type,
    path,
    {
      documentType,
      requestId,
      originalFileName: file.name,
      uploadedAt: new Date().toISOString(),
      sensitivity: 'restricted',
    },
    { makePublic: false, signedUrlDays: 365 }
  )

  return {
    url: result.url,
    storagePath: result.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    fileHash,
  }
}

async function notifyAdmins(db: Firestore, requestId: string, fullName: string) {
  const title = 'New beneficiary request submitted'
  const body = `${fullName} submitted a charity support request.`

  await db.collection('adminNotifications').add(
    sanitizeForFirestore({
      type: 'beneficiary_request',
      title,
      body,
      requestId,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    })
  )

  try {
    const adminSnap = await db.collection('adminUsers').limit(50).get()
    const tokens: string[] = []
    for (const adminDoc of adminSnap.docs) {
      const userSnap = await db.collection('users').doc(adminDoc.id).get()
      const token = userSnap.data()?.fcmToken
      if (typeof token === 'string' && token.length > 10) {
        tokens.push(token)
      }
    }

    if (tokens.length === 0) return

    const messaging = getMessaging(getAdminApp())
    await messaging.sendEachForMulticast({
      tokens: tokens.slice(0, 100),
      notification: { title, body },
      data: {
        type: 'beneficiary_request',
        requestId,
        click_action: '/admin/beneficiary-requests',
      },
    })
  } catch (err) {
    console.error('[beneficiary-requests] FCM notify failed:', err)
  }
}

/**
 * POST multipart — creates beneficiaryRequests/{id} via Admin SDK.
 * Sensitive files under beneficiary-documents/ (private; not makePublic).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const fullName = String(form.get('fullName') || '').trim()
    const phoneNumber = String(form.get('phoneNumber') || '').trim()
    const email = String(form.get('email') || '').trim()
    const nationality = String(form.get('nationality') || '').trim()
    const emirate = String(form.get('emirate') || '').trim()
    const familySizeRaw = String(form.get('familySize') || '').trim()
    const supportType = String(form.get('supportType') || '').trim()
    const amountNeededRaw = String(form.get('amountNeeded') || '').trim()
    const reason = String(form.get('reason') || '').trim()
    const emergencyLevelRaw = String(form.get('emergencyLevel') || '').trim().toLowerCase()
    const referralSource = String(form.get('referralSource') || '').trim()
    const consentAccepted = String(form.get('consentAccepted') || '') === 'true'

    const emiratesIdFile = form.get('emiratesId') as File | null
    const passportFile = form.get('passport') as File | null
    const visaFile = form.get('visa') as File | null
    const salaryCertificateFile = form.get('salaryCertificate') as File | null
    const bankStatementFile = form.get('bankStatement') as File | null
    const supportingFiles = form
      .getAll('supportingDocuments')
      .filter((f): f is File => f instanceof File && f.size > 0)

    const errors: string[] = []
    if (!fullName) errors.push('Full name is required')
    if (!phoneNumber) errors.push('Phone number is required')
    if (!email || !email.includes('@')) errors.push('A valid email is required')
    if (!nationality) errors.push('Nationality is required')
    if (!emirate) errors.push('Emirate / area is required')
    if (!supportType) errors.push('Type of support is required')
    if (!reason) errors.push('Reason for request is required')
    if (!EMERGENCY_LEVELS.has(emergencyLevelRaw)) {
      errors.push('Emergency level must be Low, Medium, High, or Critical')
    }
    if (!consentAccepted) errors.push('Consent is required')
    if (!emiratesIdFile || !(emiratesIdFile instanceof File) || !emiratesIdFile.size) {
      errors.push('Emirates ID upload is required')
    }
    if (!passportFile || !(passportFile instanceof File) || !passportFile.size) {
      errors.push('Passport copy upload is required')
    }
    if (!visaFile || !(visaFile instanceof File) || !visaFile.size) {
      errors.push('Visa copy upload is required')
    }
    if (
      !salaryCertificateFile ||
      !(salaryCertificateFile instanceof File) ||
      !salaryCertificateFile.size
    ) {
      errors.push('Salary certificate upload is required')
    }

    if (errors.length) {
      return NextResponse.json({ success: false, error: errors.join('. '), errors }, { status: 400 })
    }

    const db = getAdminDb()
    const requestId = randomUUID()
    const consentId = randomUUID()

    const [emiratesId, passport, visa, salaryCertificate, bankStatement] = await Promise.all([
      uploadPrivateDoc(emiratesIdFile!, requestId, 'emirates_id'),
      uploadPrivateDoc(passportFile!, requestId, 'passport'),
      uploadPrivateDoc(visaFile!, requestId, 'visa'),
      uploadPrivateDoc(salaryCertificateFile!, requestId, 'salary_certificate'),
      bankStatementFile && bankStatementFile instanceof File && bankStatementFile.size > 0
        ? uploadPrivateDoc(bankStatementFile, requestId, 'bank_statement')
        : Promise.resolve(null),
    ])

    const supportingDocumentUrls: string[] = []
    const supportingDocumentPaths: string[] = []
    for (const file of supportingFiles) {
      const uploaded = await uploadPrivateDoc(file, requestId, 'supporting_docs')
      supportingDocumentUrls.push(uploaded.url)
      supportingDocumentPaths.push(uploaded.storagePath)
    }

    const emergencyLevel = emergencyLevelRaw
    const visibleTo = [
      'welfare',
      'founder',
      'coordinator',
      'founder_admin',
      'manager',
      'admin',
      'super_admin',
      'superadmin',
    ]
    const canDownloadDocuments = [...visibleTo]

    await db.collection('beneficiaryConsents').doc(consentId).set(
      sanitizeForFirestore({
        id: consentId,
        beneficiaryRequestId: requestId,
        userId: uid,
        consentGiven: true,
        privacyPolicyAccepted: true,
        dataProcessingAgreed: true,
        documentRetentionUnderstood: true,
        uaePrivacyPolicyVersion: '1.0',
        consentText:
          "I consent to Passive Blessings collecting and storing this data in accordance with UAE data protection laws and the platform's privacy policy.",
        userAgent: request.headers.get('user-agent') || '',
        timestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      })
    )

    // Field names aligned with /admin/beneficiary-requests (Part 7B)
    await db.collection('beneficiaryRequests').doc(requestId).set(
      sanitizeForFirestore({
        id: requestId,
        userId: uid,
        status: 'pending',
        fullName,
        name: fullName,
        phoneNumber,
        email,
        nationality,
        currentEmirateArea: emirate,
        familySize: familySizeRaw ? Number(familySizeRaw) || null : null,
        supportType,
        amountNeeded: amountNeededRaw ? Number(amountNeededRaw) || null : null,
        reason,
        reasonCategory: supportType || 'support',
        emergencyLevel,
        referralSource: referralSource || null,

        emiratesIdUrl: emiratesId.url,
        emiratesIdStoragePath: emiratesId.storagePath,
        passportUrl: passport.url,
        passportStoragePath: passport.storagePath,
        visaUrl: visa.url,
        visaStoragePath: visa.storagePath,
        salaryCertificateUrl: salaryCertificate.url,
        salaryCertificateStoragePath: salaryCertificate.storagePath,
        bankStatementUrl: bankStatement?.url || null,
        bankStatementStoragePath: bankStatement?.storagePath || null,
        supportingDocumentUrls,
        supportingDocumentPaths,

        consentLogId: consentId,
        hasSignedConsent: true,
        privacyPolicyAccepted: true,
        dataProcessingAgreed: true,
        visibleTo,
        canDownloadDocuments,

        submissionDate: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    )

    await notifyAdmins(db, requestId, fullName)

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Your charity support request has been submitted successfully.',
    })
  } catch (error) {
    console.error('[beneficiary-requests POST]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit request',
      },
      { status: 500 }
    )
  }
}
