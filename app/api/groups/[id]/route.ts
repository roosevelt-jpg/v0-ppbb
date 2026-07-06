import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    const groupId = params.id
    const searchParams = request.nextUrl.searchParams
    const communityId = searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
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
