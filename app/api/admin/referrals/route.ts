import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const ok = await isAdminUser(uid)
  return ok ? uid : null
}

/**
 * Part 13C final — bulk-mark confirmed referral contributions as paid.
 * Does NOT promote pending → paid (confirmed is required).
 */
export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as {
      action?: string
      businessId?: string
    }

    if (body.action !== 'mark_paid') {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }

    const businessId = typeof body.businessId === 'string' ? body.businessId.trim() : ''
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'businessId required' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db
      .collection('referrals')
      .where('businessId', '==', businessId)
      .where('status', '==', 'confirmed')
      .get()

    if (snap.empty) {
      const pendingSnap = await db
        .collection('referrals')
        .where('businessId', '==', businessId)
        .where('status', '==', 'pending')
        .limit(1)
        .get()

      return NextResponse.json({
        success: false,
        error: pendingSnap.empty
          ? 'No confirmed contributions to mark as paid for this business.'
          : 'No confirmed contributions to mark as paid. Referrals currently default to "pending" and must be "confirmed" before they can be marked paid. Nothing in the conversion pipeline sets status to "confirmed" yet.',
        marked: 0,
        gap: !pendingSnap.empty,
      })
    }

    const batchSize = 400
    let marked = 0
    let batch = db.batch()
    let ops = 0

    for (const docSnap of snap.docs) {
      batch.update(
        docSnap.ref,
        sanitizeForFirestore({
          status: 'paid',
          paidAt: FieldValue.serverTimestamp(),
          paidBy: adminUid,
          updatedAt: FieldValue.serverTimestamp(),
        })
      )
      ops += 1
      marked += 1
      if (ops >= batchSize) {
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }

    if (ops > 0) await batch.commit()

    return NextResponse.json({ success: true, marked })
  } catch (error) {
    console.error('[api/admin/referrals]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
