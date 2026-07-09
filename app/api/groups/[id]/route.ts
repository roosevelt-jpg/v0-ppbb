import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { normalizeGenderRestriction } from '@/lib/community-governance'
import { verifyIdToken, isAdminUser } from '@/lib/admin-access-server'

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params
    const communityId = request.nextUrl.searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const uid = await verifyIdToken(token)
    if (!uid || !(await isAdminUser(uid))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const db = getAdminDb()
    const ref = db.collection('communities').doc(communityId).collection('groups').doc(groupId)
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    const updates = sanitizeForFirestore({
      ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body.description !== undefined ? { description: String(body.description || '') } : {}),
      ...(body.type !== undefined ? { type: String(body.type || 'discussion') } : {}),
      ...(body.genderRestriction !== undefined
        ? { genderRestriction: normalizeGenderRestriction(body.genderRestriction) }
        : {}),
      ...(body.iconURL !== undefined ? { iconURL: String(body.iconURL || '') } : {}),
      ...(body.requiresApproval !== undefined ? { requiresApproval: body.requiresApproval === true } : {}),
      ...(body.capacity !== undefined
        ? { capacity: typeof body.capacity === 'number' ? body.capacity : null }
        : {}),
      updatedAt: Timestamp.now(),
    })

    await ref.update(updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error updating group:', error)
    return NextResponse.json({ success: false, error: 'Failed to update group' }, { status: 500 })
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
