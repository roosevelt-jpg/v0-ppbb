import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const db = getAdminDb()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = Timestamp.now()
    await userRef.set(
      sanitizeForFirestore({
        status: 'deleted',
        active: false,
        deletedAt: now,
        updatedAt: now,
        notificationPreferences: {
          emailNotifications: false,
          pushNotifications: false,
          eventReminders: false,
          memberMessages: false,
          systemAlerts: false,
          newsletter: false,
          communityUpdates: false,
        },
        privacySettings: {
          showProfileToCommunity: false,
          showInMemberDirectory: false,
        },
        newsletterOptOut: true,
        fcmToken: null,
      }),
      { merge: true }
    )

    try {
      const adminAuth = getAuth()
      await adminAuth.updateUser(uid, { disabled: true })
    } catch (authError) {
      console.warn('[account/delete] Could not disable auth user:', authError)
    }

    return NextResponse.json({ success: true, message: 'Account deactivated' })
  } catch (error) {
    console.error('[v0] Account delete error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
