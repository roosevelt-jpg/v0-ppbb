import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    const communityId = params.id
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 })
    }

    // Get the member document
    const memberSnapshot = await db
      .collection('communities')
      .doc(communityId)
      .collection('members')
      .where('userId', '==', userId)
      .get()

    if (memberSnapshot.empty) {
      return NextResponse.json({ success: false, error: 'Not a member' }, { status: 400 })
    }

    // Delete the member document
    const memberDoc = memberSnapshot.docs[0]
    await memberDoc.ref.delete()

    // Update community member count
    const communityDoc = await db.collection('communities').doc(communityId).get()
    if (communityDoc.exists) {
      const currentCount = communityDoc.data()?.memberCount || 0
      await db.collection('communities').doc(communityId).update({
        memberCount: Math.max(0, currentCount - 1),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error leaving community:', error)
    return NextResponse.json({ success: false, error: 'Failed to leave community' }, { status: 500 })
  }
}
