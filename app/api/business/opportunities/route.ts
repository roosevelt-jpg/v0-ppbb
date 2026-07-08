import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { verifyIdToken } from '@/lib/admin-access-server'
import { hasBusinessAccessServer, hasAdminAccessServer } from '@/lib/roles-server'

/**
 * POST — create a job/opportunity for the authenticated business user.
 * Always stores status = pending_approval (admin must publish before public).
 * Basic members are rejected even if they bypass the upgrade modal.
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

    const now = Timestamp.now()
    const ref = db.collection('businessOpportunities').doc()
    const id = ref.id

    const requirements = Array.isArray(body.requirements)
      ? body.requirements
      : typeof body.requirements === 'string'
        ? body.requirements.split('\n').filter((r: string) => r.trim())
        : []
    const benefits = Array.isArray(body.benefits)
      ? body.benefits
      : typeof body.benefits === 'string'
        ? body.benefits.split('\n').filter((b: string) => b.trim())
        : []

    const opportunity = sanitizeForFirestore({
      id,
      businessId,
      businessName,
      title,
      type: body.type || 'job',
      description: body.description || '',
      category: body.category || '',
      salary: typeof body.salary === 'number' ? body.salary : undefined,
      remote: Boolean(body.remote),
      duration: body.duration || '',
      hoursPerWeek: typeof body.hoursPerWeek === 'number' ? body.hoursPerWeek : undefined,
      requirements,
      benefits,
      applications: 0,
      applicants: [],
      // Forced — never trust client open/published
      status: 'pending_approval',
      createdAt: now,
      updatedAt: now,
    })

    await ref.set(opportunity)

    await db.collection('jobs').doc(id).set(
      sanitizeForFirestore({
        id,
        businessId,
        businessName,
        title,
        description: body.description || '',
        category: body.category || body.type || '',
        jobType: body.type || 'job',
        status: 'pending_approval',
        createdAt: now,
        updatedAt: now,
      })
    )

    return NextResponse.json({ success: true, data: { id, status: 'pending_approval' } })
  } catch (error) {
    console.error('[v0] Error creating opportunity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create opportunity' },
      { status: 500 }
    )
  }
}
