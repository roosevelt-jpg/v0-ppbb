import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { isFieldValueEmpty } from '@/lib/form-builder-utils'
import type { CustomForm } from '@/lib/form-builder-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    return NextResponse.json({ success: true, submissionId: submissionRef.id })
  } catch (error) {
    console.error('[v0] /api/forms/submit error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit form' }, { status: 500 })
  }
}
