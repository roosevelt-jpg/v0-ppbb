import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { communityId, groupId, memberDocId, joinStatus, approvedBy } = body

    if (!communityId || !groupId || !memberDocId || !joinStatus) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!['active', 'rejected'].includes(joinStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid joinStatus' }, { status: 400 })
    }

    const db = getAdminDb()
    const memberRef = db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .collection('members')
      .doc(memberDocId)

    const groupRef = db.collection('communities').doc(communityId).collection('groups').doc(groupId)
    const groupSnap = await groupRef.get()
    const groupData = groupSnap.data()

    await memberRef.update(
      sanitizeForFirestore({
        joinStatus,
        isActive: joinStatus === 'active',
        approvedBy: approvedBy || null,
        approvedAt: Timestamp.now(),
      })
    )

    if (joinStatus === 'active') {
      await groupRef.update({
        memberCount: (groupData?.memberCount || 0) + 1,
        updatedAt: Timestamp.now(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error updating group member:', error)
    return NextResponse.json({ success: false, error: 'Failed to update member' }, { status: 500 })
  }
}
