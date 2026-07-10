import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'

const ALLOWED_SOURCES = ['profile_view', 'offer_view', 'job_view', 'discount_use'] as const

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const businessId = String(body.businessId || '')
    const sourceType = String(body.sourceType || 'profile_view') as (typeof ALLOWED_SOURCES)[number]
    const entityId = body.entityId ? String(body.entityId) : null

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId required' }, { status: 400 })
    }
    if (!ALLOWED_SOURCES.includes(sourceType)) {
      return NextResponse.json({ success: false, error: 'Invalid sourceType' }, { status: 400 })
    }
    if (businessId === uid) {
      return NextResponse.json({ success: true, skipped: 'self_view' })
    }

    const db = getAdminDb()
    const now = Timestamp.now()
    const payload = sanitizeForFirestore({
      businessId,
      sourceType,
      leadSource: sourceType,
      leadUserId: uid,
      entityId,
      convertedToCustomer: false,
      createdAt: now,
      updatedAt: now,
    })

    await db.collection('businessLeads').add(payload)
    await db.collection('leads').add(payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[business/leads/track] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to track lead' }, { status: 500 })
  }
}
