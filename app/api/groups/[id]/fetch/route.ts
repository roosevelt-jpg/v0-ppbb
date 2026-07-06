import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    const groupId = params.id
    const searchParams = request.nextUrl.searchParams
    const communityId = searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const doc = await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .get()

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching group:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch group' }, { status: 500 })
  }
}
