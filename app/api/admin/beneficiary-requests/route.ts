import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, getAdminUserData, isAdminUser } from '@/lib/admin-access-server'
import { canAccessSensitiveBeneficiaryDocs } from '@/lib/charity-cases'
import { getSignedReadUrl } from '@/lib/storage-server'

const SENSITIVE_KEYS = [
  'emiratesIdUrl',
  'passportUrl',
  'visaUrl',
  'salaryCertificateUrl',
  'bankStatementUrl',
  'supportingDocumentUrls',
  'emiratesIdStoragePath',
  'passportStoragePath',
  'visaStoragePath',
  'salaryCertificateStoragePath',
  'bankStatementStoragePath',
  'supportingDocumentPaths',
  'emiratesId',
  'passport',
  'visa',
  'salaryDocument',
  'bankStatement',
  'supportingDocuments',
] as const

const DOC_KEY_TO_PATH: Record<string, string> = {
  emiratesIdUrl: 'emiratesIdStoragePath',
  passportUrl: 'passportStoragePath',
  visaUrl: 'visaStoragePath',
  salaryCertificateUrl: 'salaryCertificateStoragePath',
  bankStatementUrl: 'bankStatementStoragePath',
}

async function requireAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const isAdmin = await isAdminUser(uid)
  if (!isAdmin) {
    // Also allow users.role admin/super_admin (legacy)
    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const role = userSnap.data()?.role
    if (role !== 'admin' && role !== 'super_admin') return null
  }
  const adminData = await getAdminUserData(uid)
  return { uid, adminRole: adminData?.adminRole || adminData?.role || 'admin' }
}

/**
 * GET /api/admin/beneficiary-requests
 * Lists beneficiary requests. Sensitive document URLs are stripped unless
 * adminRole is welfare | founder | coordinator (or founder_admin / manager).
 *
 * GET ?id=xxx&document=salaryCertificateUrl — returns a short-lived proxy
 * payload only for authorized roles (never exposes Storage URL to unauthorized).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')
    const documentKey = searchParams.get('document')
    const canViewDocs = canAccessSensitiveBeneficiaryDocs(admin.adminRole)

    const db = getAdminDb()

    if (id && documentKey) {
      if (!canViewDocs) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: insufficient role for sensitive documents' },
          { status: 403 }
        )
      }
      const snap = await db.collection('beneficiaryRequests').doc(id).get()
      if (!snap.exists) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      }
      const data = snap.data() || {}
      const url = await resolveDocumentUrl(data, documentKey)
      if (!url) {
        return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        url,
        canDownload: true,
        adminRole: admin.adminRole,
      })
    }

    if (id) {
      const snap = await db.collection('beneficiaryRequests').doc(id).get()
      if (!snap.exists) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: redactRequest(snap.id, snap.data() || {}, canViewDocs),
        canViewSensitiveDocuments: canViewDocs,
      })
    }

    const snapshot = await db.collection('beneficiaryRequests').limit(200).get()
    const data = snapshot.docs
      .map((d) => redactRequest(d.id, d.data() || {}, canViewDocs))
      .sort((a, b) => {
        const aT = timestampMs(a.createdAt) || timestampMs(a.submissionDate)
        const bT = timestampMs(b.createdAt) || timestampMs(b.submissionDate)
        return bT - aT
      })

    return NextResponse.json({
      success: true,
      data,
      canViewSensitiveDocuments: canViewDocs,
    })
  } catch (error) {
    console.error('[beneficiary-requests GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 })
  }
}

function timestampMs(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).getTime() || 0
  if (typeof value === 'object') {
    const o = value as { seconds?: number; _seconds?: number; toDate?: () => Date }
    if (typeof o.toDate === 'function') return o.toDate().getTime()
    const sec = o.seconds ?? o._seconds
    if (typeof sec === 'number') return sec * 1000
  }
  return 0
}

/**
 * PATCH — Review / Accept / Reject
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, action, notes } = body as {
      id?: string
      action?: 'review' | 'accept' | 'reject'
      notes?: string
    }

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action required' }, { status: 400 })
    }

    const statusMap = {
      review: 'under_review',
      accept: 'approved',
      reject: 'rejected',
    } as const

    const db = getAdminDb()
    await db
      .collection('beneficiaryRequests')
      .doc(id)
      .update({
        status: statusMap[action],
        reviewedBy: admin.uid,
        reviewDate: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date(),
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[beneficiary-requests PATCH]', error)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

async function resolveDocumentUrl(
  data: Record<string, unknown>,
  key: string
): Promise<string | null> {
  const pathField = DOC_KEY_TO_PATH[key]
  const storagePath = pathField && typeof data[pathField] === 'string' ? String(data[pathField]) : ''
  if (storagePath) {
    try {
      return await getSignedReadUrl(storagePath, 1)
    } catch (err) {
      console.error('[beneficiary-requests] signed URL failed:', err)
    }
  }

  if (typeof data[key] === 'string' && (data[key] as string).startsWith('http')) {
    return data[key] as string
  }
  const nested = data[key]
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>
    if (typeof n.storagePath === 'string') {
      try {
        return await getSignedReadUrl(String(n.storagePath), 1)
      } catch {
        /* fall through */
      }
    }
    if (typeof n.url === 'string') return n.url
    if (typeof n.downloadURL === 'string') return n.downloadURL
  }
  return null
}

function redactRequest(
  id: string,
  data: Record<string, unknown>,
  canViewDocs: boolean
): Record<string, unknown> {
  const out: Record<string, unknown> = { id, ...data }
  // Never send long-lived signed URLs in list payloads — welfare opens via ?document=
  delete out.emiratesIdUrl
  delete out.passportUrl
  delete out.visaUrl
  delete out.salaryCertificateUrl
  delete out.bankStatementUrl
  delete out.supportingDocumentUrls

  if (!canViewDocs) {
    for (const key of SENSITIVE_KEYS) {
      if (key in out) delete out[key]
    }
    out.hasSensitiveDocuments = hasAnySensitive(data)
    out.sensitiveDocumentsRedacted = true
    return out
  }

  out.hasSensitiveDocuments = hasAnySensitive(data)
  return out
}

function hasAnySensitive(data: Record<string, unknown>): boolean {
  return SENSITIVE_KEYS.some((key) => {
    const v = data[key]
    if (!v) return false
    if (typeof v === 'string' && v.length > 0) return true
    if (Array.isArray(v) && v.length > 0) return true
    if (typeof v === 'object') return true
    return false
  })
}
