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

const DOC_VIEW_KEYS = [
  'emiratesIdUrl',
  'passportUrl',
  'visaUrl',
  'salaryCertificateUrl',
  'bankStatementUrl',
  'supportingDocumentUrls',
] as const

/** Pull a Storage object path from a raw path or GCS / Firebase download URL. */
function extractStoragePath(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (!/^https?:\/\//i.test(v)) {
    if (v.includes('/') && !/\s/.test(v)) return v.replace(/^\/+/, '')
    return null
  }
  try {
    const u = new URL(v)
    if (u.hostname === 'storage.googleapis.com') {
      const parts = u.pathname.replace(/^\//, '').split('/')
      if (parts.length >= 2) return decodeURIComponent(parts.slice(1).join('/'))
    }
    if (u.hostname === 'firebasestorage.googleapis.com') {
      const match = u.pathname.match(/\/o\/(.+)$/)
      if (match?.[1]) return decodeURIComponent(match[1])
    }
  } catch {
    /* ignore */
  }
  return null
}

function pickFileRef(value: unknown): { url?: string; storagePath?: string } | null {
  if (!value) return null
  if (typeof value === 'string' && value.trim()) {
    const s = value.trim()
    if (/^https?:\/\//i.test(s)) return { url: s, storagePath: extractStoragePath(s) || undefined }
    if (s.includes('/')) return { storagePath: s.replace(/^\/+/, '') }
    return null
  }
  if (Array.isArray(value) && value.length > 0) return pickFileRef(value[0])
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    const url =
      (typeof o.url === 'string' && o.url) ||
      (typeof o.downloadURL === 'string' && o.downloadURL) ||
      undefined
    const storagePath =
      (typeof o.storagePath === 'string' && o.storagePath) ||
      (typeof o.path === 'string' && o.path) ||
      (url ? extractStoragePath(url) : null) ||
      undefined
    if (url || storagePath) return { url, storagePath: storagePath || undefined }
  }
  return null
}

function pickFileRefFromResponses(
  responses: Record<string, unknown>,
  ...keys: string[]
): { url?: string; storagePath?: string } | null {
  for (const key of keys) {
    const ref = pickFileRef(responses[key])
    if (ref) return ref
  }
  return null
}

async function mintReadableUrl(raw: string): Promise<string | null> {
  const path = extractStoragePath(raw)
  if (path) {
    try {
      return await getSignedReadUrl(path, 1)
    } catch (err) {
      console.error('[beneficiary-requests] signed URL failed for path:', path, err)
      if (/^https?:\/\//i.test(raw)) return raw
      return null
    }
  }
  if (/^https?:\/\//i.test(raw)) return raw
  return null
}

function hasDocumentForKey(data: Record<string, unknown>, key: string): boolean {
  if (key === 'supportingDocumentUrls' || key === 'supportingDocuments') {
    const arr =
      data.supportingDocumentUrls || data.supportingDocuments || data.supportingDocumentPaths
    return Array.isArray(arr) && arr.some((item) => Boolean(pickFileRef(item)))
  }
  const pathField = DOC_KEY_TO_PATH[key]
  if (pathField && typeof data[pathField] === 'string' && String(data[pathField]).trim()) {
    return true
  }
  return Boolean(pickFileRef(data[key]))
}

function listAvailableDocumentKeys(data: Record<string, unknown>): string[] {
  return DOC_VIEW_KEYS.filter((key) => hasDocumentForKey(data, key))
}

async function requireAdminAuth(request: NextRequest) {
  const uid = await requireAdminFromRequest(request)
  if (!uid) return null
  const adminData = await getAdminUserData(uid)
  const adminRole = String(adminData?.adminRole || adminData?.role || 'admin')
  const permissions = Array.isArray(adminData?.permissions)
    ? (adminData.permissions as unknown[]).map(String)
    : []
  const roles = Array.isArray(adminData?.roles)
    ? (adminData.roles as unknown[]).map(String)
    : []
  return { uid, adminRole, permissions, roles }
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
        roles: admin.roles,
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
      let url = await resolveDocumentUrl(data, documentKey)
      if (!url) {
        url = await resolveDocumentUrlFromFormSubmission(db, data, documentKey)
      }
      if (!url) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Document not found for this request. The file may not have been uploaded, or the storage path is missing.',
          },
          { status: 404 }
        )
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

      const emirates = pickFileRefFromResponses(responses, 'emiratesId', 'emiratesIdUrl')
      const passport = pickFileRefFromResponses(responses, 'passport', 'passportUrl')
      const visa = pickFileRefFromResponses(responses, 'visa', 'visaUrl')
      const salary = pickFileRefFromResponses(
        responses,
        'salaryCertificate',
        'salaryCertificateUrl'
      )
      const bank = pickFileRefFromResponses(responses, 'bankStatement', 'bankStatementUrl')
      const supporting = pickFileRefFromResponses(
        responses,
        'supportingDocs',
        'supportingDocuments',
        'supportingDocumentUrls'
      )

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
        emiratesIdUrl: emirates?.url || emirates?.storagePath || '',
        emiratesIdStoragePath: emirates?.storagePath || null,
        passportUrl: passport?.url || passport?.storagePath || '',
        passportStoragePath: passport?.storagePath || null,
        visaUrl: visa?.url || visa?.storagePath || '',
        visaStoragePath: visa?.storagePath || null,
        salaryCertificateUrl: salary?.url || salary?.storagePath || '',
        salaryCertificateStoragePath: salary?.storagePath || null,
        bankStatementUrl: bank?.url || bank?.storagePath || '',
        bankStatementStoragePath: bank?.storagePath || null,
        supportingDocumentUrls: supporting
          ? [supporting.url || supporting.storagePath].filter(Boolean)
          : [],
        supportingDocumentPaths: supporting?.storagePath ? [supporting.storagePath] : [],
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
    const arr =
      data.supportingDocumentUrls || data.supportingDocuments || data.supportingDocumentPaths
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const ref = pickFileRef(item)
        if (ref?.storagePath) {
          const signed = await mintReadableUrl(ref.storagePath)
          if (signed) return signed
        }
        if (ref?.url) {
          const signed = await mintReadableUrl(ref.url)
          if (signed) return signed
        }
      }
    }
  }

  const pathField = DOC_KEY_TO_PATH[key]
  const storagePath = pathField && typeof data[pathField] === 'string' ? String(data[pathField]) : ''
  if (storagePath.trim()) {
    const signed = await mintReadableUrl(storagePath.trim())
    if (signed) return signed
  }

  const direct = pickFileRef(data[key])
  if (direct?.storagePath) {
    const signed = await mintReadableUrl(direct.storagePath)
    if (signed) return signed
  }
  if (direct?.url) {
    const signed = await mintReadableUrl(direct.url)
    if (signed) return signed
  }

  return null
}

/** Fallback: resolve file from linked formSubmissions.responses when request fields are empty. */
async function resolveDocumentUrlFromFormSubmission(
  db: Firestore,
  data: Record<string, unknown>,
  key: string
): Promise<string | null> {
  const submissionId =
    (typeof data.formSubmissionId === 'string' && data.formSubmissionId) ||
    (typeof data.id === 'string' && data.id.startsWith('form_') ? data.id.slice(5) : '')
  if (!submissionId) return null

  try {
    const snap = await db.collection('formSubmissions').doc(submissionId).get()
    if (!snap.exists) return null
    const responses =
      snap.data()?.responses && typeof snap.data()?.responses === 'object'
        ? (snap.data()!.responses as Record<string, unknown>)
        : {}

    const responseKeys: Record<string, string[]> = {
      emiratesIdUrl: ['emiratesId', 'emiratesIdUrl'],
      passportUrl: ['passport', 'passportUrl'],
      visaUrl: ['visa', 'visaUrl'],
      salaryCertificateUrl: ['salaryCertificate', 'salaryCertificateUrl'],
      bankStatementUrl: ['bankStatement', 'bankStatementUrl'],
      supportingDocumentUrls: ['supportingDocs', 'supportingDocuments', 'supportingDocumentUrls'],
    }
    const keys = responseKeys[key] || [key]
    const ref = pickFileRefFromResponses(responses, ...keys)
    if (!ref) return null
    if (ref.storagePath) {
      const signed = await mintReadableUrl(ref.storagePath)
      if (signed) return signed
    }
    if (ref.url) return mintReadableUrl(ref.url)
  } catch (err) {
    console.error('[beneficiary-requests] form submission fallback failed:', err)
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
  const availableDocuments = listAvailableDocumentKeys(data)
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
    out.hasSensitiveDocuments = availableDocuments.length > 0
    out.availableDocuments = []
    out.sensitiveDocumentsRedacted = true
    return out
  }

  out.hasSensitiveDocuments = availableDocuments.length > 0
  out.availableDocuments = availableDocuments
  return out
}

function hasAnySensitive(data: Record<string, unknown>): boolean {
  return listAvailableDocumentKeys(data).length > 0
}
