import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendPushToUser } from '@/lib/push-notifications-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

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

    const clickAction = threadId ? `/dashboard/messages?thread=${threadId}` : '/dashboard/messages'
    await sendPushToUser(
      recipientId,
      { title: senderName, body: preview },
      {
        type: 'group_message',
        threadId,
        click_action: clickAction,
      }
    )

    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')
    sendBrandedEmailToUserSafe({
      userId: recipientId,
      subject: `New message from ${senderName}`,
      purpose: 'Direct message notification',
      headline: 'New message',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        `${senderName} sent you a message:`,
        preview
      ),
      cta: { label: 'Open messages', url: `${site}${clickAction}` },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[dm/notify] error:', error)
    return NextResponse.json({ success: false, error: 'Notify failed' }, { status: 500 })
  }
}
