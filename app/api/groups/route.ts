import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

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
    const { communityId, name, description, genderRestriction, iconURL, createdBy } = body

    if (!communityId || !name) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const docRef = await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .add({
        name,
        description: description || '',
        genderRestriction: genderRestriction || 'mixed',
        iconURL: iconURL || '',
        memberCount: 0,
        createdBy,
        createdAt: Timestamp.now(),
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
