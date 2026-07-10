import { NextRequest, NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/push-notifications-server'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid || !(await isAdminUser(uid))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, notification, data } = body

    const targetUserId = typeof userId === 'string' && userId ? userId : uid

    if (!notification?.title) {
      return NextResponse.json(
        { success: false, error: 'notification.title required' },
        { status: 400 }
      )
    }

    const result = await sendPushToUser(
      targetUserId,
      { title: notification.title, body: notification.body || '' },
      typeof data === 'object' && data ? data : { type: 'test' }
    )

    if (result.skipped && !result.sent) {
      return NextResponse.json({ success: true, skipped: result.skipped })
    }

    return NextResponse.json({ success: true, sent: result.sent })
  } catch (error) {
    console.error('[v0] Error sending notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
