import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sendPushToUser } from '@/lib/push-notifications-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

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

    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')

    const purpose =
      type === 'job_application'
        ? 'New job application notification'
        : type === 'marketplace_purchase'
          ? 'Marketplace purchase notification'
          : 'Business account notification'

    const ctaPath = clickAction.startsWith('/') ? clickAction : `/${clickAction}`

    sendBrandedEmailToUserSafe({
      userId: businessId,
      subject: title,
      purpose,
      headline: title,
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        message,
        'Please sign in to your business portal to review and respond.'
      ),
      cta: {
        label: 'Open business portal',
        url: clickAction.startsWith('http') ? clickAction : `${site}${ctaPath}`,
      },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[notifications/business-event] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to notify' }, { status: 500 })
  }
}
