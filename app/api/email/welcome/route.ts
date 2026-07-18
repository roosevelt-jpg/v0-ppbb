import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { paragraphs, sendBrandedEmailToUser } from '@/lib/platform-email'

/**
 * Send branded welcome email after signup (member or business).
 * Auth required — only the signed-in user can trigger their own welcome mail.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const accountType = String(body.accountType || 'member').toLowerCase()
    const firstName = String(body.firstName || '').trim()
    const isBusiness = accountType === 'business'

    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')

    const greeting = firstName ? `Assalamu alaikum, ${firstName}.` : 'Assalamu alaikum,'
    const result = await sendBrandedEmailToUser({
      userId: uid,
      subject: isBusiness
        ? 'Welcome to Passive Blessings Business'
        : 'Welcome to Passive Blessings',
      purpose: isBusiness ? 'Business account welcome' : 'Member account welcome',
      headline: 'Welcome to Passive Blessings',
      bodyHtml: paragraphs(
        greeting,
        isBusiness
          ? 'Your business account has been created. Complete membership payment and wait for approval to unlock the full business portal.'
          : 'Your member account has been created. Choose a membership plan to activate your access and start exploring communities, events, and volunteering.',
        'If you have any questions, reply to this email or contact PB Admin through the platform.'
      ),
      cta: {
        label: isBusiness ? 'Open business dashboard' : 'Complete membership',
        url: isBusiness ? `${site}/business/dashboard` : `${site}/dashboard/membership`,
      },
      respectPreference: false,
    })

    return NextResponse.json({ success: result.ok, error: result.error })
  } catch (error) {
    console.error('[email/welcome]', error)
    return NextResponse.json({ success: false, error: 'Failed to send welcome email' }, { status: 500 })
  }
}
