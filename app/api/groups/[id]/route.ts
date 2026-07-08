import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const communityId = request.nextUrl.searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const db = getAdminDb()
    const snap = await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .get()

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestoreDoc(snap.id, snap.data() as Record<string, unknown>),
    })
  } catch (error) {
    console.error('[v0] Error fetching group:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch group' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const communityId = request.nextUrl.searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const db = getAdminDb()
    await db.collection('communities').doc(communityId).collection('groups').doc(groupId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting group:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete group' }, { status: 500 })
  }
}
