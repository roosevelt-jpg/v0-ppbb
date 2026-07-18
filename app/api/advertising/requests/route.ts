import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getStripeClient } from '@/lib/get-stripe-client'
import { getPublicAppUrl } from '@/lib/payment-completion'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export const runtime = 'nodejs'

const DEFAULT_PRICE_AED = 500

async function requireUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyIdToken(token)
}

/** Business submits a homepage advertising request (image + link).
 *  Admin may set adminFree: true to upload without payment. */
export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }

    const body = await request.json()
    const imageURL = String(body.imageURL || '').trim()
    const href = String(body.href || '').trim()
    const alt = String(body.alt || 'Advertisement').trim()
    const businessName = String(body.businessName || '').trim()
    const adminFree = body.adminFree === true
    const publishNow = body.publishNow === true

    if (!imageURL) {
      return NextResponse.json({ success: false, error: 'Banner image is required' }, { status: 400 })
    }

    const db = getAdminDb()
    const { isAdminUser } = await import('@/lib/admin-access-server')

    if (adminFree) {
      if (!(await isAdminUser(uid))) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      const ref = db.collection('advertisingRequests').doc()
      const payload = sanitizeForFirestore({
        businessId: uid,
        businessName: businessName || 'Passive Blessings (admin)',
        imageURL,
        href,
        alt,
        priceAed: 0,
        currency: 'AED',
        status: publishNow ? 'published' : 'admin_free',
        adminFree: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: publishNow ? Timestamp.now() : null,
      })
      await ref.set(payload)

      if (publishNow) {
        await db
          .collection('platformConfig')
          .doc('homepage')
          .set(
            {
              advertisingBanner: {
                enabled: true,
                imageURL,
                href,
                alt,
              },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
      }

      return NextResponse.json({ success: true, id: ref.id, priceAed: 0, adminFree: true })
    }

    const priceAed =
      typeof body.priceAed === 'number' && body.priceAed > 0 ? body.priceAed : DEFAULT_PRICE_AED

    const ref = db.collection('advertisingRequests').doc()
    const payload = sanitizeForFirestore({
      businessId: uid,
      businessName: businessName || 'Business',
      imageURL,
      href,
      alt,
      priceAed,
      currency: 'AED',
      status: 'pending_payment',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    await ref.set(payload)

    return NextResponse.json({ success: true, id: ref.id, priceAed })
  } catch (error) {
    console.error('[advertising/requests] POST', error)
    return NextResponse.json({ success: false, error: 'Failed to create request' }, { status: 500 })
  }
}

/** List own requests (business) or all (admin via query). */
export async function GET(request: NextRequest) {
  try {
    const uid = await requireUid(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }

    const db = getAdminDb()
    const admin = request.nextUrl.searchParams.get('admin') === '1'
    const { isAdminUser } = await import('@/lib/admin-access-server')

    if (admin) {
      if (!(await isAdminUser(uid))) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
      const snap = await db.collection('advertisingRequests').limit(100).get()
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aT = (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() || 0
          const bT = (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() || 0
          return bT - aT
        })
      return NextResponse.json({
        success: true,
        data,
      })
    }

    const snap = await db
      .collection('advertisingRequests')
      .where('businessId', '==', uid)
      .limit(50)
      .get()
    return NextResponse.json({
      success: true,
      data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    })
  } catch (error) {
    console.error('[advertising/requests] GET', error)
    return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 })
  }
}

/** Admin publish / reject */
export async function PATCH(request: NextRequest) {
  try {
    const uid = await requireUid(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }
    const { isAdminUser } = await import('@/lib/admin-access-server')
    if (!(await isAdminUser(uid))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const id = String(body.id || '')
    const action = String(body.action || '')
    if (!id || !['publish', 'reject', 'unpublish'].includes(action)) {
      return NextResponse.json({ success: false, error: 'id and action required' }, { status: 400 })
    }

    const db = getAdminDb()
    const ref = db.collection('advertisingRequests').doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    const data = snap.data() || {}

    if (action === 'publish') {
      // Paid business ads OR admin-created free creatives (status admin_free / paid / published)
      if (!['paid', 'published', 'admin_free'].includes(String(data.status))) {
        return NextResponse.json(
          {
            success: false,
            error: 'Only paid or admin free requests can be published to the homepage',
          },
          { status: 400 }
        )
      }
      await db
        .collection('platformConfig')
        .doc('homepage')
        .set(
          {
            advertisingBanner: {
              enabled: true,
              imageURL: String(data.imageURL || ''),
              href: String(data.href || ''),
              alt: String(data.alt || 'Advertisement'),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      await ref.update({ status: 'published', publishedAt: Timestamp.now(), updatedAt: Timestamp.now() })
      return NextResponse.json({ success: true })
    }

    if (action === 'unpublish') {
      await db
        .collection('platformConfig')
        .doc('homepage')
        .set(
          {
            advertisingBanner: { enabled: false },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      await ref.update({ status: 'paid', updatedAt: Timestamp.now() })
      return NextResponse.json({ success: true })
    }

    await ref.update({ status: 'rejected', updatedAt: Timestamp.now() })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[advertising/requests] PATCH', error)
    return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 })
  }
}

/** Create Stripe checkout for an advertising request */
export async function PUT(request: NextRequest) {
  try {
    const uid = await requireUid(request)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }

    const body = await request.json()
    const id = String(body.id || '')
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db.collection('advertisingRequests').doc(id).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    const data = snap.data() || {}
    if (data.businessId !== uid) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    if (data.status === 'paid' || data.status === 'published') {
      return NextResponse.json({ success: false, error: 'Already paid' }, { status: 400 })
    }

    const priceAed = Number(data.priceAed) || DEFAULT_PRICE_AED
    const stripe = await getStripeClient()
    const base = getPublicAppUrl()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'aed',
            unit_amount: Math.round(priceAed * 100),
            product_data: {
              name: 'Homepage advertising banner',
              description: 'Horizontal promo placement on Passive Blessings homepage',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/business/advertise?status=success&id=${id}`,
      cancel_url: `${base}/business/advertise?status=canceled&id=${id}`,
      metadata: {
        type: 'advertising',
        advertisingRequestId: id,
        userId: uid,
      },
    })

    await snap.ref.update({
      stripeSessionId: session.id,
      status: 'pending_payment',
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true, checkoutUrl: session.url })
  } catch (error) {
    console.error('[advertising/checkout]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
