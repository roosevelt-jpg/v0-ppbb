import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'
import { hasBusinessAccessServer } from '@/lib/roles-server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    if (!hasBusinessAccessServer(userData)) {
      return NextResponse.json({ success: false, error: 'Business access required' }, { status: 403 })
    }

    const body = await request.json()
    const title = String(body.title || '').trim()
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 })
    }

    const now = Timestamp.now()
    const status = 'pending_approval'
    const doc = sanitizeForFirestore({
      businessId: uid,
      ownerId: uid,
      title,
      description: String(body.description || ''),
      discountCode: body.discountCode ? String(body.discountCode) : null,
      discountType: body.discountType === 'fixed' ? 'fixed' : 'percent',
      discountValue: Number(body.discountValue || 0),
      currency: body.currency ? String(body.currency) : 'AED',
      validFrom: body.validFrom ? Timestamp.fromDate(new Date(body.validFrom)) : now,
      validUntil: body.validUntil ? Timestamp.fromDate(new Date(body.validUntil)) : null,
      isMemberOnly: body.isMemberOnly !== false,
      usageLimit: typeof body.usageLimit === 'number' ? body.usageLimit : null,
      usageCount: 0,
      status,
      createdAt: now,
      updatedAt: now,
    })

    const ref = await db.collection('discounts').add(doc)
    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    console.error('[business/discounts] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create discount' }, { status: 500 })
  }
}
