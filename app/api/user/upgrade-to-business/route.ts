import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      businessName,
      businessType,
      businessDescription,
      communityBenefit,
      services,
      tradeLicenceURL,
      productImages,
      ownerName,
      email,
      phone,
      logoURL,
      bannerURL,
    } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const db = getAdminDb()
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data() || {}
    const now = new Date()

    // Keep portal profile for existing dashboard stats (merge)
    await db.collection('businessProfiles').doc(userId).set(
      sanitizeForFirestore({
        id: userId,
        businessName: businessName.trim(),
        businessType: typeof businessType === 'string' ? businessType : '',
        businessDescription:
          typeof businessDescription === 'string'
            ? businessDescription
            : typeof communityBenefit === 'string'
              ? communityBenefit
              : '',
        membership: 'partner',
        activeOpportunities: 0,
        referralEarnings: 0,
        conversionRate: 0,
        active: true,
        createdAt: userData.createdAt || now,
        updatedAt: now,
      }),
      { merge: true }
    )

    const roles: string[] = Array.isArray(userData.roles) ? [...userData.roles] : []
    if (userData.role && typeof userData.role === 'string' && !roles.includes(userData.role)) {
      roles.push(userData.role)
    }
    if (!roles.includes('business')) {
      roles.push('business')
    }
    // Spec: role becomes business (also keep roles array for multi-portal access)
    await userRef.set(
      sanitizeForFirestore({
        role: 'business',
        roles,
        hasBusinessProfile: true,
        updatedAt: now,
      }),
      { merge: true }
    )

    const serviceList = Array.isArray(services)
      ? services.filter((s: unknown) => typeof s === 'string' && s.trim()).map((s: string) => s.trim())
      : []
    const images = Array.isArray(productImages)
      ? productImages.filter((u: unknown) => typeof u === 'string' && u.trim())
      : []

    const category =
      typeof businessType === 'string' && businessType.trim() ? businessType.trim() : 'Services'

    const displayOwner =
      (typeof ownerName === 'string' && ownerName.trim()) ||
      [userData.firstName, userData.lastName].filter(Boolean).join(' ') ||
      userData.displayName ||
      ''

    // One listing per owner: upsert by owner uid as doc id
    const businessId = userId
    const businessRef = db.collection('businesses').doc(businessId)
    const existing = await businessRef.get()

    const listing = sanitizeForFirestore({
      name: businessName.trim(),
      businessName: businessName.trim(),
      category,
      businessType: category,
      description:
        (typeof businessDescription === 'string' && businessDescription.trim()) ||
        (typeof communityBenefit === 'string' && communityBenefit.trim()) ||
        '',
      communityBenefit: typeof communityBenefit === 'string' ? communityBenefit.trim() : '',
      services: serviceList,
      productImages: images,
      tradeLicenceURL: typeof tradeLicenceURL === 'string' ? tradeLicenceURL : '',
      logoURL: typeof logoURL === 'string' ? logoURL : existing.data()?.logoURL || '',
      bannerURL: typeof bannerURL === 'string' ? bannerURL : existing.data()?.bannerURL || '',
      ownerName: displayOwner,
      ownerId: userId,
      userId,
      email: (typeof email === 'string' && email) || userData.email || '',
      phone: (typeof phone === 'string' && phone) || userData.phone || '',
      // Defaults for marketplace visibility — admin must approve
      isApproved: existing.exists ? existing.data()?.isApproved === true : false,
      isActive: true,
      isVerified: existing.exists ? existing.data()?.isVerified === true : false,
      featured: existing.exists ? existing.data()?.featured === true : false,
      status: existing.exists && existing.data()?.isApproved === true ? 'approved' : 'pending_review',
      createdAt: existing.exists ? existing.data()?.createdAt || now : now,
      updatedAt: now,
      submittedAt: now,
    })

    // On first create / resubmit while not approved, force pending
    if (!existing.exists || existing.data()?.isApproved !== true) {
      listing.isApproved = false
      listing.status = 'pending_review'
    }

    await businessRef.set(listing, { merge: true })

    return NextResponse.json(
      {
        success: true,
        message: 'Business listing submitted for review',
        userId,
        businessId,
        isApproved: listing.isApproved === true,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[v0] Error upgrading to business:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
