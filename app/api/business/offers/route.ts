import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'
import { hasBusinessAccessServer, hasAdminAccessServer } from '@/lib/roles-server'

/**
 * POST — create an offer for the authenticated business user.
 * Always stores status = pending_approval (admin must publish before public/shop).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      )
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const userData = userSnap.data() || {}
    if (!hasBusinessAccessServer(userData) && !hasAdminAccessServer(userData)) {
      return NextResponse.json(
        { success: false, error: 'Business membership required to post offers' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const businessId =
      hasAdminAccessServer(userData) && typeof body.businessId === 'string' && body.businessId
        ? body.businessId
        : uid

    const businessName =
      (typeof body.businessName === 'string' && body.businessName.trim()) ||
      userData.businessProfile?.businessName ||
      `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      'Business'

    const categoryRaw = String(body.category || body.type || '').trim()
    const categoryNormalized =
      categoryRaw.toLowerCase() === 'merchandise' || categoryRaw.toLowerCase() === 'merch'
        ? 'merchandise'
        : categoryRaw

    const imageURL =
      (typeof body.imageUrl === 'string' && body.imageUrl) ||
      (typeof body.imageURL === 'string' && body.imageURL) ||
      ''

    const isMemberDiscount =
      body.type === 'discount' ||
      (typeof body.memberBenefit === 'number' && body.memberBenefit > 0) ||
      (typeof body.discountPercentage === 'number' && body.discountPercentage > 0)

    const now = Timestamp.now()
    const ref = db.collection('businessOffers').doc()
    const id = ref.id

    const offer = sanitizeForFirestore({
      id,
      businessId,
      businessName,
      title,
      type: body.type || 'product',
      description: body.description || '',
      category: categoryNormalized,
      variant: typeof body.variant === 'string' ? body.variant.trim() : '',
      price: typeof body.price === 'number' ? body.price : undefined,
      discountPercentage:
        typeof body.discountPercentage === 'number' ? body.discountPercentage : undefined,
      originalPrice: typeof body.originalPrice === 'number' ? body.originalPrice : undefined,
      imageUrl: imageURL || undefined,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      targetAudience: body.targetAudience || 'members',
      memberBenefit: typeof body.memberBenefit === 'number' ? body.memberBenefit : undefined,
      status: 'pending_approval',
      views: 0,
      conversions: 0,
      createdAt: now,
      updatedAt: now,
    })

    await ref.set(offer)

    await db.collection('offers').doc(id).set(
      sanitizeForFirestore({
        id,
        businessId,
        businessName,
        title,
        description: body.description || '',
        category: categoryNormalized,
        type: body.type || 'product',
        status: 'pending_approval',
        price: typeof body.price === 'number' ? body.price : undefined,
        originalPrice: typeof body.originalPrice === 'number' ? body.originalPrice : undefined,
        currency: 'AED',
        variant: typeof body.variant === 'string' ? body.variant.trim() || null : null,
        imageURL,
        images: imageURL ? [imageURL] : [],
        isMemberDiscount,
        memberBenefit: typeof body.memberBenefit === 'number' ? body.memberBenefit : undefined,
        discountPercentage:
          typeof body.discountPercentage === 'number' ? body.discountPercentage : undefined,
        createdAt: now,
        updatedAt: now,
      })
    )

    return NextResponse.json({ success: true, data: { id, status: 'pending_approval' } })
  } catch (error) {
    console.error('[v0] Error creating offer:', error)
    return NextResponse.json({ success: false, error: 'Failed to create offer' }, { status: 500 })
  }
}
