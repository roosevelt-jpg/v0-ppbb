import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

const COLLECTION = 'adminAccessCodes'

/**
 * Mark an access code as used after successful admin account setup,
 * and sync the admin into admin-users for the Management dashboard.
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

    const codeData = snap.data() || {}
    const role =
      (typeof codeData.adminRole === 'string' && codeData.adminRole) ||
      (typeof codeData.role === 'string' && codeData.role) ||
      'admin'
    const permissions = Array.isArray(codeData.permissions)
      ? codeData.permissions
      : ['full_access']
    const name =
      (typeof codeData.adminName === 'string' && codeData.adminName) ||
      String(email).split('@')[0]

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

    if (userId) {
      const adminRecord = sanitizeForFirestore({
        email: String(email).toLowerCase(),
        name,
        role,
        permissions,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        accessCodeId: codeId,
      })
      await db.collection('admin-users').doc(String(userId)).set(adminRecord, { merge: true })
      await db.collection('adminUsers').doc(String(userId)).set(
        sanitizeForFirestore({
          email: String(email).toLowerCase(),
          role,
          permissions,
          active: true,
          updatedAt: new Date(),
        }),
        { merge: true }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Access code redeem error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to redeem access code' },
      { status: 500 }
    )
  }
}
