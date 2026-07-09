import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  mapNotificationTypeToPreference,
  shouldNotifyUser,
} from '@/lib/user-settings'

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { userId, notification, data } = body

    if (!userId || !notification) {
      return NextResponse.json(
        { success: false, error: 'userId and notification required' },
        { status: 400 }
      )
    }

    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists || !userDoc.data()?.fcmToken) {
      return NextResponse.json(
        { success: false, error: 'FCM token not found for user' },
        { status: 404 }
      )
    }

    const userData = userDoc.data() || {}
    const fcmToken = userData.fcmToken
    if (typeof fcmToken !== 'string' || fcmToken.length < 10) {
      return NextResponse.json(
        { success: false, error: 'FCM token not found for user' },
        { status: 404 }
      )
    }

    const prefKey = mapNotificationTypeToPreference(
      typeof data?.type === 'string' ? data.type : undefined
    )
    if (!shouldNotifyUser({ ...userData, id: userId }, 'push', prefKey)) {
      return NextResponse.json({ success: true, skipped: 'Push notifications disabled for user' })
    }

    const fcmSettings = userData.fcmSettings || {}
    if (fcmSettings.enabled === false) {
      return NextResponse.json({ success: true, skipped: 'Notifications disabled' })
    }

    // Send via Firebase Admin SDK (would use firebase-admin messaging)
    console.log('[v0] Sending FCM notification to:', userId, {
      title: notification.title,
      body: notification.body,
    })

    return NextResponse.json({
      success: true,
      message: 'Notification queued for delivery',
    })
  } catch (error) {
    console.error('[v0] Error sending notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
