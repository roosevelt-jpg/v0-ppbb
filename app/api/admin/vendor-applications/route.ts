import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp, type Firestore, type DocumentData } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

async function requireAdmin(request: NextRequest): Promise<string | null> {
  return requireAdminFromRequest(request)
}

async function resolveApplicantUserId(db: Firestore, application: DocumentData): Promise<string | null> {
  if (typeof application.applicantId === 'string' && application.applicantId) {
    return application.applicantId
  }
  const email = String(application.contactEmail || '').trim().toLowerCase()
  if (!email) return null
  const snap = await db.collection('users').where('email', '==', email).limit(1).get()
  return snap.empty ? null : snap.docs[0].id
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = String(body.id || '')
    const action = String(body.action || '')

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'id and valid action required' }, { status: 400 })
    }

    const db = getAdminDb()
    const appRef = db.collection('vendorApplications').doc(id)
    const appSnap = await appRef.get()
    if (!appSnap.exists) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
    }

    const application = appSnap.data() || {}
    const now = Timestamp.now()

    if (action === 'reject') {
      await appRef.update({ status: 'rejected', reviewedAt: now, reviewedBy: adminUid })
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    const userId = await resolveApplicantUserId(db, application)
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No linked member account. Applicant must sign up with the same email before approval.',
        },
        { status: 400 }
      )
    }

    const userRef = db.collection('users').doc(userId)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const userData = userSnap.data() || {}
    const businessName = String(application.businessName || '').trim()
    const businessType = String(application.businessType || 'Services').trim()
    const description = String(application.description || '').trim()

    await db.collection('businessProfiles').doc(userId).set(
      sanitizeForFirestore({
        id: userId,
        businessName,
        businessType,
        businessDescription: description,
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
    if (!roles.includes('business')) roles.push('business')

    await userRef.set(
      sanitizeForFirestore({
        role: 'business',
        roles,
        hasBusinessProfile: true,
        updatedAt: now,
      }),
      { merge: true }
    )

    const businessRef = db.collection('businesses').doc(userId)
    const existing = await businessRef.get()
    await businessRef.set(
      sanitizeForFirestore({
        name: businessName,
        businessName,
        category: businessType,
        businessType,
        description,
        website: application.website || '',
        tradeLicenceURL: application.documentsURL || '',
        ownerId: userId,
        userId,
        email: application.contactEmail || userData.email || '',
        phone: application.contactPhone || userData.phone || '',
        isApproved: true,
        isActive: true,
        isVerified: true,
        status: 'approved',
        createdAt: existing.exists ? existing.data()?.createdAt || now : now,
        updatedAt: now,
        approvedAt: now,
        approvedBy: adminUid,
      }),
      { merge: true }
    )

    await appRef.update({
      status: 'approved',
      reviewedAt: now,
      reviewedBy: adminUid,
      linkedUserId: userId,
      businessId: userId,
    })

    return NextResponse.json({ success: true, status: 'approved', userId, businessId: userId })
  } catch (error) {
    console.error('[admin/vendor-applications] PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 })
  }
}
