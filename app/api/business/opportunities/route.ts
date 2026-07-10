import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'
import { hasBusinessAccessServer, hasAdminAccessServer } from '@/lib/roles-server'

function parseLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split('\n').map((s) => s.trim()).filter(Boolean)
  return []
}

/**
 * POST — create a job/opportunity for the authenticated business user.
 * status: draft | pending_approval (default pending_approval)
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
        { success: false, error: 'Business membership required to post jobs' },
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

    const status =
      body.status === 'draft' || body.isDraft === true ? 'draft' : 'pending_approval'

    const suitableFor = parseLines(body.suitableFor)
    let genderRestriction = body.genderRestriction || 'mixed'
    if (suitableFor.includes('Women Only')) genderRestriction = 'female'
    if (suitableFor.includes('Men Only')) genderRestriction = 'male'

    const now = Timestamp.now()
    const ref = db.collection('businessOpportunities').doc()
    const id = ref.id

    const requirements = parseLines(body.requirements)
    const benefits = parseLines(body.benefits)

    const opportunity = sanitizeForFirestore({
      id,
      businessId,
      businessName,
      businessLogoUrl: userData.businessProfile?.logoURL || userData.profilePictureURL || null,
      title,
      type: body.type || body.roleType || 'job',
      roleType: body.roleType || body.type || 'job',
      companyName: body.companyName || businessName,
      description: body.description || '',
      category: body.category || '',
      salary: typeof body.salary === 'number' ? body.salary : null,
      remote: Boolean(body.remote),
      locationType: body.remote ? 'remote' : body.locationType || 'onsite',
      locationCity: body.remote ? null : body.locationCity || null,
      locationText: body.locationCity || null,
      duration: body.duration || null,
      hoursPerWeek: typeof body.hoursPerWeek === 'number' ? body.hoursPerWeek : null,
      requirements,
      benefits,
      suitableFor,
      genderRestriction,
      applicationProcess: body.applicationProcess || 'cv_upload',
      applicationURL: body.applicationURL || null,
      deadline: body.deadline ? Timestamp.fromDate(new Date(body.deadline)) : null,
      posterRelation: body.posterRelation || 'employer',
      isMemberOnly: Boolean(body.isMemberOnly),
      applications: 0,
      applicants: [],
      viewCount: 0,
      status,
      createdAt: now,
      updatedAt: now,
      expiresAt: body.deadline ? Timestamp.fromDate(new Date(body.deadline)) : null,
    })

    await ref.set(opportunity)

    await db.collection('jobs').doc(id).set(
      sanitizeForFirestore({
        id,
        businessId,
        businessName,
        companyName: body.companyName || businessName,
        title,
        description: body.description || '',
        category: body.category || body.type || '',
        jobType: body.type || 'job',
        roleType: body.roleType || body.type || 'job',
        genderRestriction,
        suitableFor,
        isMemberOnly: Boolean(body.isMemberOnly),
        applicationProcess: body.applicationProcess || 'cv_upload',
        applicationURL: body.applicationURL || null,
        locationCity: body.remote ? null : body.locationCity || null,
        locationType: body.remote ? 'remote' : 'onsite',
        status,
        createdAt: now,
        updatedAt: now,
      })
    )

    return NextResponse.json({ success: true, data: { id, status } })
  } catch (error) {
    console.error('[v0] Error creating opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create opportunity' },
      { status: 500 }
    )
  }
}
