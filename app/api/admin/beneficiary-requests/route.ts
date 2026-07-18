import { NextRequest, NextResponse } from 'next/server'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getAdminUserData } from '@/lib/admin-access-server'
import {
  canAccessSensitiveBeneficiaryDocs,
  canUserAccessSensitiveBeneficiaryDocs,
} from '@/lib/charity-cases'
import { getSignedReadUrl } from '@/lib/storage-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  const uid = await requireAdminFromRequest(request)
  if (!uid) return null
  const adminData = await getAdminUserData(uid)
  const adminRole = String(adminData?.adminRole || adminData?.role || 'admin')
  const permissions = Array.isArray(adminData?.permissions)
    ? (adminData.permissions as unknown[]).map(String)
    : []
  return { uid, adminRole, permissions }
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
    const canViewDocs =
      canAccessSensitiveBeneficiaryDocs(admin.adminRole) ||
      canUserAccessSensitiveBeneficiaryDocs({
        role: admin.adminRole,
        adminRole: admin.adminRole,
        permissions: admin.permissions,
      })

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
    const byId = new Map<string, Record<string, unknown>>()
    for (const d of snapshot.docs) {
      byId.set(d.id, redactRequest(d.id, d.data() || {}, canViewDocs))
    }

    // Surface CMS Charity Support submissions that never landed in beneficiaryRequests
    try {
      await importOrphanedCharityFormSubmissions(db, byId, canViewDocs)
    } catch (importErr) {
      console.warn('[beneficiary-requests] charity form import skipped:', importErr)
    }

    const data = Array.from(byId.values()).sort((a, b) => {
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

async function importOrphanedCharityFormSubmissions(
  db: Firestore,
  byId: Map<string, Record<string, unknown>>,
  canViewDocs: boolean
) {
  const formsSnap = await db.collection('customForms').limit(100).get()
  const charityFormIds = formsSnap.docs
    .filter((d) => {
      const data = d.data() || {}
      const slug = String(data.slug || '').toLowerCase()
      const category = String(data.category || '').toLowerCase()
      const title = String(data.title || '').toLowerCase()
      return (
        slug.includes('charity') ||
        category === 'charity' ||
        category === 'beneficiary' ||
        title.includes('charity support')
      )
    })
    .map((d) => d.id)

  if (charityFormIds.length === 0) return

  const existingSubmissionIds = new Set<string>()
  for (const row of byId.values()) {
    if (typeof row.formSubmissionId === 'string') existingSubmissionIds.add(row.formSubmissionId)
    if (typeof row.id === 'string' && row.id.startsWith('form_')) {
      existingSubmissionIds.add(row.id.slice(5))
    }
  }

  for (const formId of charityFormIds.slice(0, 10)) {
    const subs = await db
      .collection('formSubmissions')
      .where('formId', '==', formId)
      .limit(50)
      .get()

    for (const sub of subs.docs) {
      if (existingSubmissionIds.has(sub.id)) continue
      const mirroredId = `form_${sub.id}`
      if (byId.has(mirroredId)) continue

      const subData = sub.data() || {}
      const responses =
        subData.responses && typeof subData.responses === 'object'
          ? (subData.responses as Record<string, unknown>)
          : {}

      const fullName = String(responses.fullName || responses.name || 'Charity support applicant')
      const email = String(responses.email || subData.userEmail || '')
      const emergencyRaw = String(responses.emergencyLevel || 'medium').toLowerCase()
      const emergencyLevel = ['low', 'medium', 'high', 'critical'].includes(emergencyRaw)
        ? emergencyRaw
        : 'medium'

      const payload = {
        id: mirroredId,
        formSubmissionId: sub.id,
        formId,
        source: 'formSubmissions',
        status: String(subData.status || 'pending'),
        fullName,
        name: fullName,
        email,
        phoneNumber: String(responses.phone || responses.phoneNumber || ''),
        emergencyLevel,
        reason: String(responses.reason || ''),
        reasonCategory: String(responses.supportType || 'support'),
        emiratesIdUrl: typeof responses.emiratesId === 'string' ? responses.emiratesId : '',
        passportUrl: typeof responses.passport === 'string' ? responses.passport : '',
        visaUrl: typeof responses.visa === 'string' ? responses.visa : '',
        salaryCertificateUrl:
          typeof responses.salaryCertificate === 'string' ? responses.salaryCertificate : '',
        bankStatementUrl:
          typeof responses.bankStatement === 'string' ? responses.bankStatement : '',
        submissionDate: subData.submittedAt || subData.createdAt || null,
        createdAt: subData.submittedAt || subData.createdAt || null,
      }

      // Persist so Refresh stays stable (idempotent doc id)
      try {
        await db.collection('beneficiaryRequests').doc(mirroredId).set(payload, { merge: true })
      } catch {
        /* list still includes in-memory row */
      }

      byId.set(mirroredId, redactRequest(mirroredId, payload, canViewDocs))
      existingSubmissionIds.add(sub.id)
    }
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

    const actionType = action === 'accept' ? 'approve' : action === 'reject' ? 'reject' : 'update'
    await auditAdminApiAction(request, admin.uid, {
      actionType,
      action: `Beneficiary request ${action}: ${id}`,
      entityType: 'beneficiary',
      entityId: id,
      status: 'success',
      details: notes || '',
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
  if (key === 'supportingDocumentUrls' || key === 'supportingDocuments') {
    const arr = data.supportingDocumentUrls || data.supportingDocuments || data.supportingDocumentPaths
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0]
      if (typeof first === 'string') {
        if (first.startsWith('http')) return first
        try {
          return await getSignedReadUrl(first, 1)
        } catch {
          return null
        }
      }
      if (first && typeof first === 'object') {
        const n = first as Record<string, unknown>
        if (typeof n.storagePath === 'string') {
          try {
            return await getSignedReadUrl(String(n.storagePath), 1)
          } catch {
            /* fall through */
          }
        }
        if (typeof n.url === 'string') return n.url
      }
    }
  }

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
  const serialized = serializeFirestoreDoc(id, data) as Record<string, unknown>
  const out: Record<string, unknown> = { ...serialized }
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
