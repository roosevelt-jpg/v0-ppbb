import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const businessName = String(body.businessName || '').trim()
    const businessType = String(body.businessType || '').trim()
    const description = String(body.description || '').trim()

    if (!businessName || !businessType || !description) {
      return NextResponse.json(
        { success: false, error: 'Business name, type, and description are required' },
        { status: 400 }
      )
    }

    let applicantId: string | null = body.applicantId || null
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const uid = await verifyIdToken(token)
      if (uid) applicantId = uid
    }

    const db = getAdminDb()
    const ref = db.collection('vendorApplications').doc()
    const now = Timestamp.now()

    await ref.set(
      sanitizeForFirestore({
        id: ref.id,
        applicantId,
        businessName,
        businessType,
        description,
        website: body.website || null,
        documentsURL: body.documentsURL || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        status: 'pending',
        submittedAt: now,
        createdAt: now,
      })
    )

    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    console.error('[vendor/apply] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 500 })
  }
}
