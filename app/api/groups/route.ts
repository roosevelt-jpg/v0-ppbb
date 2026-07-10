import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import {
  initialGroupStatus,
  normalizeGenderRestriction,
} from '@/lib/community-governance'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const communityId = searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const snapshot = await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .get()

    const groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }))

    return NextResponse.json({ success: true, data: groups })
  } catch (error) {
    console.error('[v0] Error fetching groups:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { communityId, name, description, genderRestriction, iconURL, createdBy, requiresApproval, type } =
      body

    if (!communityId || !name) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const communitySnap = await db.collection('communities').doc(communityId).get()
    if (!communitySnap.exists) {
      return NextResponse.json({ success: false, error: 'Community not found' }, { status: 404 })
    }
    const community = communitySnap.data() || {}

    let isAdmin = false
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const uid = await verifyIdToken(token)
      if (uid) isAdmin = await isAdminUser(uid)
    }

    const groupStatus = initialGroupStatus({
      isAdmin,
      communityBusinessId: community.businessId,
      createdByBusiness: Boolean(community.businessId && createdBy === community.createdBy),
    })

    const payload = sanitizeForFirestore({
      name,
      description: description || '',
      genderRestriction: normalizeGenderRestriction(genderRestriction),
      iconURL: iconURL || '',
      type: type || 'discussion',
      requiresApproval: requiresApproval === true,
      capacity: typeof body.capacity === 'number' ? body.capacity : null,
      status: groupStatus,
      memberCount: 0,
      createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docRef = await db.collection('communities').doc(communityId).collection('groups').add(payload)

    await db
      .collection('communities')
      .doc(communityId)
      .update({
        groupCount: (community.groupCount || 0) + 1,
        updatedAt: Timestamp.now(),
      })

    return NextResponse.json({ success: true, id: docRef.id })
  } catch (error) {
    console.error('[v0] Error creating group:', error)
    return NextResponse.json({ success: false, error: 'Failed to create group' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const communityId = searchParams.get('communityId')
    const groupId = searchParams.get('id')

    if (!communityId || !groupId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 })
    }

    await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting group:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete group' }, { status: 500 })
  }
}
