import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

/** Notify admins that a donation proof is pending verification. */
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
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''
    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'submissionId required' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db.collection('donationSubmissions').doc(submissionId).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    const data = snap.data() || {}
    if (String(data.userId || '') !== uid) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const donationType = String(data.donationType || 'sadaqah')
    const typeLabel = donationType === 'zakat' ? 'Zakat' : 'Sadaqah'
    const amount = Number(data.amount) || 0
    const causeName = String(data.causeName || 'Cause')
    const partnerName = String(data.partnerName || 'Partner')

    await db.collection('adminNotifications').add(
      sanitizeForFirestore({
        type: 'donation_pending',
        title: 'New donation proof pending',
        message: `${typeLabel} donation of AED ${amount} for ${causeName} via ${partnerName}`,
        submissionId,
        causeId: data.causeId || null,
        href: '/admin/donation-verification',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      })
    )

    const { paragraphs, sendBrandedEmailToUserSafe } = await import('@/lib/platform-email')
    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')
    sendBrandedEmailToUserSafe({
      userId: uid,
      subject: 'Donation proof received',
      purpose: 'Donation submission confirmation',
      headline: 'Proof received',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        `We received your ${typeLabel} donation proof of AED ${amount} for ${causeName}.`,
        'Our team will verify it shortly and notify you once it is confirmed.'
      ),
      cta: { label: 'View donations', url: `${site}/dashboard/donations` },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[donations/notify-pending]', error)
    return NextResponse.json({ success: false, error: 'Notify failed' }, { status: 500 })
  }
}
