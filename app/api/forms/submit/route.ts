import { NextResponse } from 'next/server'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { isFieldValueEmpty } from '@/lib/form-builder-utils'
import type { CustomForm } from '@/lib/form-builder-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CHARITY_FORM_SLUGS = new Set(['charity-support-request', 'charity-support', 'beneficiary-request'])

function validateResponses(form: CustomForm, responses: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const section of form.sections || []) {
    for (const field of section.fields || []) {
      const value = responses[field.id]
      if (field.required && isFieldValueEmpty(value, field)) {
        errors[field.id] = `${field.label} is required`
      }

      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          errors[field.id] = 'Please enter a valid email'
        }
      }
    }
  }

  return errors
}

function isCharitySupportForm(form: CustomForm): boolean {
  const slug = String(form.slug || '').toLowerCase()
  const category = String(form.category || '').toLowerCase()
  const title = String(form.title || '').toLowerCase()
  if (CHARITY_FORM_SLUGS.has(slug)) return true
  if (category === 'charity' || category === 'beneficiary') return true
  if (title.includes('charity support') || title.includes('beneficiary')) return true
  return false
}

function pickResponse(responses: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = responses[key]
    if (value == null || value === '') continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim()
    }
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]).trim()
    }
  }
  return ''
}

function pickFileUrl(responses: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = responses[key]
    if (!value) continue
    if (typeof value === 'string' && (value.startsWith('http') || value.includes('/'))) return value
    if (typeof value === 'object') {
      const o = value as Record<string, unknown>
      if (typeof o.url === 'string') return o.url
      if (typeof o.downloadURL === 'string') return o.downloadURL
      if (typeof o.storagePath === 'string') return o.storagePath
    }
    if (Array.isArray(value) && value[0]) {
      const first = value[0]
      if (typeof first === 'string') return first
      if (first && typeof first === 'object') {
        const o = first as Record<string, unknown>
        if (typeof o.url === 'string') return o.url
        if (typeof o.downloadURL === 'string') return o.downloadURL
        if (typeof o.storagePath === 'string') return o.storagePath
      }
    }
  }
  return ''
}

function pickFileStoragePath(responses: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = responses[key]
    if (!value) continue
    if (typeof value === 'object' && !Array.isArray(value)) {
      const o = value as Record<string, unknown>
      if (typeof o.storagePath === 'string' && o.storagePath) return o.storagePath
      if (typeof o.path === 'string' && o.path) return o.path
    }
    if (Array.isArray(value) && value[0] && typeof value[0] === 'object') {
      const o = value[0] as Record<string, unknown>
      if (typeof o.storagePath === 'string' && o.storagePath) return o.storagePath
    }
    if (typeof value === 'string' && value.includes('/') && !value.startsWith('http')) {
      return value.replace(/^\/+/, '')
    }
  }
  return null
}

/** Mirror CMS Charity Support submissions into the Beneficiary Requests inbox. */
async function mirrorCharitySubmissionToBeneficiaryRequests(
  db: Firestore,
  form: CustomForm,
  submissionId: string,
  responses: Record<string, unknown>,
  userEmail: string
) {
  const fullName = pickResponse(responses, 'fullName', 'name', 'full_name')
  const email = pickResponse(responses, 'email', 'emailAddress') || userEmail
  const phoneNumber = pickResponse(responses, 'phone', 'phoneNumber', 'whatsapp')
  const emergencyRaw = pickResponse(responses, 'emergencyLevel', 'urgency').toLowerCase()
  const emergencyLevel = ['low', 'medium', 'high', 'critical'].includes(emergencyRaw)
    ? emergencyRaw
    : 'medium'

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

  const requestId = `form_${submissionId}`
  await db.collection('beneficiaryRequests').doc(requestId).set(
    sanitizeForFirestore({
      id: requestId,
      formSubmissionId: submissionId,
      formId: form.id,
      formSlug: form.slug || '',
      source: 'formSubmissions',
      status: 'pending',
      fullName: fullName || 'Charity support applicant',
      name: fullName || 'Charity support applicant',
      email,
      phoneNumber,
      nationality: pickResponse(responses, 'nationality'),
      currentEmirateArea: pickResponse(responses, 'emirate', 'currentEmirateArea'),
      familySize: Number(pickResponse(responses, 'familySize')) || null,
      supportType: pickResponse(responses, 'supportType', 'typeOfSupport'),
      amountNeeded: Number(pickResponse(responses, 'amountNeeded')) || null,
      reason: pickResponse(responses, 'reason', 'situation', 'message'),
      reasonCategory: pickResponse(responses, 'supportType') || 'support',
      emergencyLevel,
      referralSource: pickResponse(responses, 'referralSource') || null,
      emiratesIdUrl: pickFileUrl(responses, 'emiratesId', 'emiratesIdUrl'),
      emiratesIdStoragePath: pickFileStoragePath(responses, 'emiratesId', 'emiratesIdUrl'),
      passportUrl: pickFileUrl(responses, 'passport', 'passportUrl'),
      passportStoragePath: pickFileStoragePath(responses, 'passport', 'passportUrl'),
      visaUrl: pickFileUrl(responses, 'visa', 'visaUrl'),
      visaStoragePath: pickFileStoragePath(responses, 'visa', 'visaUrl'),
      salaryCertificateUrl: pickFileUrl(responses, 'salaryCertificate', 'salaryCertificateUrl'),
      salaryCertificateStoragePath: pickFileStoragePath(
        responses,
        'salaryCertificate',
        'salaryCertificateUrl'
      ),
      bankStatementUrl: pickFileUrl(responses, 'bankStatement', 'bankStatementUrl') || null,
      bankStatementStoragePath: pickFileStoragePath(responses, 'bankStatement', 'bankStatementUrl'),
      supportingDocumentUrls: [
        pickFileUrl(responses, 'supportingDocs', 'supportingDocuments', 'supportingDocumentUrls'),
      ].filter(Boolean),
      supportingDocumentPaths: [
        pickFileStoragePath(
          responses,
          'supportingDocs',
          'supportingDocuments',
          'supportingDocumentUrls'
        ),
      ].filter(Boolean) as string[],
      hasSignedConsent: Boolean(
        responses.consent === true ||
          responses.consent === 'true' ||
          (Array.isArray(responses.consent) && responses.consent.length > 0)
      ),
      visibleTo,
      canDownloadDocuments: visibleTo,
      submissionDate: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }),
    { merge: true }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { formId, slug, responses, userEmail } = body as {
      formId?: string
      slug?: string
      responses?: Record<string, unknown>
      userEmail?: string
    }

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid responses' }, { status: 400 })
    }

    const db = getAdminDb()
    let formSnap

    if (formId) {
      formSnap = await db.collection('customForms').doc(formId).get()
    } else if (slug) {
      const q = await db
        .collection('customForms')
        .where('slug', '==', slug)
        .where('status', '==', 'active')
        .limit(1)
        .get()
      formSnap = q.empty ? null : q.docs[0]
    }

    if (!formSnap || !formSnap.exists) {
      return NextResponse.json({ success: false, error: 'Form not found or inactive' }, { status: 404 })
    }

    const form = { id: formSnap.id, ...formSnap.data() } as CustomForm
    const errors = validateResponses(form, responses)
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors }, { status: 400 })
    }

    const now = new Date()
    const submissionRef = await db.collection('formSubmissions').add(
      sanitizeForFirestore({
        formId: form.id,
        userEmail: userEmail || '',
        responses,
        status: 'pending',
        submittedAt: now,
      })
    )

    const currentCount = form.submissionCount || 0
    await db.collection('customForms').doc(form.id).set(
      sanitizeForFirestore({
        submissionCount: currentCount + 1,
        updatedAt: now,
      }),
      { merge: true }
    )

    if (isCharitySupportForm(form)) {
      try {
        await mirrorCharitySubmissionToBeneficiaryRequests(
          db,
          form,
          submissionRef.id,
          responses,
          userEmail || ''
        )
      } catch (mirrorErr) {
        console.warn('[forms/submit] beneficiaryRequests mirror skipped:', mirrorErr)
      }
    }

    return NextResponse.json({ success: true, submissionId: submissionRef.id })
  } catch (error) {
    console.error('[v0] /api/forms/submit error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit form' }, { status: 500 })
  }
}
