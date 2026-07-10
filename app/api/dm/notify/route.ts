import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendPushToUser } from '@/lib/push-notifications-server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const senderId = await verifyIdToken(token)
    if (!senderId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const recipientId = String(body.recipientId || '')
    const senderName = String(body.senderName || 'Someone')
    const preview = String(body.preview || 'New message')
    const threadId = String(body.threadId || '')

    if (!recipientId || recipientId === senderId) {
      return NextResponse.json({ success: false, error: 'Invalid recipient' }, { status: 400 })
    }

    await sendPushToUser(
      recipientId,
      { title: senderName, body: preview },
      {
        type: 'group_message',
        threadId,
        click_action: threadId ? `/dashboard/messages?thread=${threadId}` : '/dashboard/messages',
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[dm/notify] error:', error)
    return NextResponse.json({ success: false, error: 'Notify failed' }, { status: 500 })
  }
}
