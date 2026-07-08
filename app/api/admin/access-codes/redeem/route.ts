import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

const COLLECTION = 'adminAccessCodes'

/**
 * Mark an access code as used after successful admin account setup.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { codeId, email, userId } = body

    if (!codeId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing codeId or email' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const ref = db.collection(COLLECTION).doc(codeId)
    const snap = await ref.get()

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Access code not found' }, { status: 404 })
    }

    await ref.update(
      sanitizeForFirestore({
        isUsed: true,
        used: true,
        status: 'used',
        usedBy: String(email).toLowerCase(),
        usedAt: new Date(),
        redeemedUserId: userId || null,
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Access code redeem error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to redeem access code' },
      { status: 500 }
    )
  }
}
