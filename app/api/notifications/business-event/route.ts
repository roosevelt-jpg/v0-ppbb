import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendPushToUser } from '@/lib/push-notifications-server'

/** Notify business owner on job application or other business events */
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

    const body = await request.json()
    const businessId = String(body.businessId || '')
    const type = String(body.type || 'job_application')
    const title = String(body.title || 'Business update')
    const message = String(body.message || '')
    const clickAction = String(body.clickAction || '/business/dashboard')

    if (!businessId || !message) {
      return NextResponse.json(
        { success: false, error: 'businessId and message required' },
        { status: 400 }
      )
    }

    const pushType =
      type === 'job_application'
        ? 'job_application'
        : type === 'marketplace_purchase'
          ? 'marketplace_purchase'
          : 'job_application'

    const result = await sendPushToUser(
      businessId,
      { title, body: message },
      { type: pushType, eventType: type, click_action: clickAction }
    )

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[notifications/business-event] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to notify' }, { status: 500 })
  }
}
