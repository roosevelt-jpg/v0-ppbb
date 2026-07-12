import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'
import { auditAdminApiAction } from '@/lib/audit-api-helper'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  return (await isAdminUser(uid)) ? uid : null
}

async function syncOffer(id: string, updates: Record<string, unknown>) {
  const db = getAdminDb()
  const payload = sanitizeForFirestore({ ...updates, updatedAt: Timestamp.now() })
  const writes: Promise<unknown>[] = []

  const offersRef = db.collection('offers').doc(id)
  const legacyRef = db.collection('businessOffers').doc(id)
  const [offersSnap, legacySnap] = await Promise.all([offersRef.get(), legacyRef.get()])

  if (offersSnap.exists) {
    writes.push(offersRef.set(payload, { merge: true }))
  }
  if (legacySnap.exists) {
    const legacyPayload = { ...payload }
    if (updates.status === 'published') {
      legacyPayload.status = 'active'
    }
    writes.push(legacyRef.set(legacyPayload, { merge: true }))
  }

  // If the listing only exists in one collection under a different shape, still persist.
  if (writes.length === 0) {
    writes.push(offersRef.set(payload, { merge: true }))
  }

  await Promise.all(writes)
}

async function notifyBusinessOfferLive(businessId: string, title: string, offerId: string) {
  if (!businessId) return
  const db = getAdminDb()
  try {
    await db.collection('users').doc(businessId).collection('notifications').add(
      sanitizeForFirestore({
        type: 'offer_approved',
        title: 'Offer published',
        message: `Your listing "${title}" is now live on the marketplace.`,
        offerId,
        read: false,
        createdAt: Timestamp.now(),
      })
    )
  } catch (err) {
    console.warn('[admin/offers] notify failed:', err)
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    const db = getAdminDb()

    if (id) {
      const offersSnap = await db.collection('offers').doc(id).get()
      if (offersSnap.exists) {
        return NextResponse.json({
          success: true,
          data: serializeFirestoreDoc(offersSnap.id, offersSnap.data() as Record<string, unknown>),
        })
      }
      const legacySnap = await db.collection('businessOffers').doc(id).get()
      if (legacySnap.exists) {
        return NextResponse.json({
          success: true,
          data: serializeFirestoreDoc(legacySnap.id, legacySnap.data() as Record<string, unknown>),
        })
      }
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const snap = await db.collection('offers').limit(500).get()
    const data = snap.docs.map((d) =>
      serializeFirestoreDoc(d.id, d.data() as Record<string, unknown>)
    )
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[admin/offers] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const categoryRaw = String(body.category || 'merchandise').trim()
    const categoryNormalized =
      categoryRaw.toLowerCase() === 'merchandise' ||
      categoryRaw.toLowerCase() === 'merch' ||
      categoryRaw.toLowerCase() === 'product'
        ? categoryRaw.toLowerCase() === 'product'
          ? 'product'
          : 'merchandise'
        : categoryRaw.toLowerCase() || 'merchandise'

    const imageURLs: string[] = Array.isArray(body.imageURLs)
      ? body.imageURLs.filter((u: unknown) => typeof u === 'string' && (u as string).trim())
      : []
    const singleImage =
      (typeof body.imageUrl === 'string' && body.imageUrl) ||
      (typeof body.imageURL === 'string' && body.imageURL) ||
      ''
    if (singleImage && !imageURLs.includes(singleImage)) {
      imageURLs.unshift(singleImage)
    }
    const primaryImage = imageURLs[0] || ''

    const price =
      typeof body.price === 'number'
        ? body.price
        : body.price != null && body.price !== ''
          ? Number(body.price)
          : null

    const now = Timestamp.now()
    const db = getAdminDb()
    const ref = db.collection('offers').doc()
    const id = ref.id

    const businessId = 'passive-blessings'
    const businessName = 'Passive Blessings'
    const status = body.status === 'draft' ? 'draft' : 'published'

    const offer = sanitizeForFirestore({
      id,
      businessId,
      businessName,
      ownerType: 'platform',
      createdBy: adminUid,
      title,
      type: body.type || 'product',
      description: typeof body.description === 'string' ? body.description : '',
      category: categoryNormalized,
      variant: typeof body.variant === 'string' ? body.variant.trim() : '',
      price: Number.isFinite(price as number) ? price : null,
      originalPrice:
        typeof body.originalPrice === 'number'
          ? body.originalPrice
          : body.originalPrice != null && body.originalPrice !== ''
            ? Number(body.originalPrice)
            : null,
      currency: typeof body.currency === 'string' && body.currency ? body.currency : 'AED',
      imageURL: primaryImage || null,
      imageUrl: primaryImage || null,
      images: imageURLs,
      imageURLs,
      isAvailable: status === 'published',
      isFeatured: Boolean(body.isFeatured),
      isMemberOnly: Boolean(body.isMemberOnly),
      status,
      views: 0,
      conversions: 0,
      approvedAt: status === 'published' ? now : null,
      approvedBy: status === 'published' ? adminUid : null,
      createdAt: now,
      updatedAt: now,
    })

    await ref.set(offer)
    await db.collection('businessOffers').doc(id).set(
      sanitizeForFirestore({
        ...offer,
        status: status === 'published' ? 'active' : status,
      })
    )

    await auditAdminApiAction(request, adminUid, {
      actionType: 'create',
      action: `Created PB marketplace product: ${title}`,
      entityType: 'offer',
      entityId: id,
      entityName: title,
      status: 'success',
    })

    return NextResponse.json({ success: true, data: { id, status } })
  } catch (error) {
    console.error('[admin/offers] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''
    const action = typeof body.action === 'string' ? body.action : ''

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'id and action required' }, { status: 400 })
    }

    const db = getAdminDb()
    const offersSnap = await db.collection('offers').doc(id).get()
    const legacySnap = await db.collection('businessOffers').doc(id).get()
    if (!offersSnap.exists && !legacySnap.exists) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }

    const current = (offersSnap.exists ? offersSnap.data() : legacySnap.data()) || {}
    const title = (current.title as string) || 'Your offer'
    const businessId = (current.businessId as string) || ''

    if (action === 'approve') {
      await syncOffer(id, {
        status: 'published',
        isAvailable: true,
        approvedAt: Timestamp.now(),
        approvedBy: adminUid,
      })
      await notifyBusinessOfferLive(businessId, title, id)
      await auditAdminApiAction(request, adminUid, {
        actionType: 'approve',
        action: `Approved marketplace offer: ${title}`,
        entityType: 'offer',
        entityId: id,
        entityName: title,
        status: 'success',
      })
      return NextResponse.json({ success: true, status: 'published' })
    }

    if (action === 'remove' || action === 'close') {
      await syncOffer(id, {
        status: 'archived',
        isAvailable: false,
        archivedAt: Timestamp.now(),
        archivedBy: adminUid,
      })
      return NextResponse.json({ success: true, status: 'archived' })
    }

    if (action === 'feature') {
      const next = !(current.isFeatured === true)
      await syncOffer(id, { isFeatured: next })
      return NextResponse.json({ success: true, isFeatured: next })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[admin/offers] PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update offer' }, { status: 500 })
  }
}
