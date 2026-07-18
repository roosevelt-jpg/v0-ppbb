import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

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

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const type = typeof body.type === 'string' ? body.type.trim() : 'Partnership'

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    const businessSnap = await db.collection('businesses').doc(uid).get()
    const businessData = businessSnap.data() || {}

    const submitterName =
      businessData.businessName ||
      `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      userData.displayName ||
      'Business User'
    const submitterEmail = userData.email || ''

    const ref = db.collection('partnerships').doc()
    const now = Timestamp.now()

    const doc = sanitizeForFirestore({
      id: ref.id,
      submittedBy: uid,
      submitterName,
      submitterEmail,
      type,
      title,
      description,
      proposedBudget: body.proposedBudget || null,
      attachmentURL: body.attachmentURL || null,
      status: 'pending',
      adminNotes: null,
      submittedAt: now,
      updatedAt: now,
    })

    await ref.set(doc)

    try {
      const adminsSnap = await db.collection('users').where('role', 'in', ['admin', 'super_admin']).limit(20).get()
      for (const adminDoc of adminsSnap.docs) {
        await adminDoc.ref.collection('notifications').add(
          sanitizeForFirestore({
            type: 'partnership_request',
            title: 'New partnership request',
            message: `${submitterName} submitted: ${title}`,
            requestId: ref.id,
            read: false,
            createdAt: now,
          })
        )
        sendBrandedEmailToUserSafe({
          userId: adminDoc.id,
          subject: 'New partnership request',
          purpose: 'Partnership request notification for admins',
          headline: 'New partnership request',
          bodyHtml: paragraphs(
            'Assalamu alaikum,',
            `${submitterName} submitted a partnership request: “${title}”.`
          ),
          cta: {
            label: 'Review in admin',
            url: `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.passive-blessings.com').replace(/\/$/, '')}/admin/approvals`,
          },
        })
      }
    } catch (notifyErr) {
      console.warn('[business/partnerships] admin notify failed:', notifyErr)
    }

    sendBrandedEmailToUserSafe({
      userId: uid,
      subject: 'Partnership request received',
      purpose: 'Partnership request confirmation',
      headline: 'Request received',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        `We received your partnership request “${title}”. Our team will review it shortly.`
      ),
      cta: {
        label: 'Open business dashboard',
        url: `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.passive-blessings.com').replace(/\/$/, '')}/business/dashboard`,
      },
    })

    return NextResponse.json({ success: true, data: { id: ref.id } })
  } catch (error) {
    console.error('[business/partnerships] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to submit request' }, { status: 500 })
  }
}
