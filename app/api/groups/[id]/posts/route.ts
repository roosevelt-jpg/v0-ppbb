import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { toGroupChatIdentity } from '@/lib/user-settings'
import { memberCanChat } from '@/lib/community-governance'

async function assertGroupMember(
  communityId: string,
  groupId: string,
  uid: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const db = getAdminDb()
  const groupSnap = await db
    .collection('communities')
    .doc(communityId)
    .collection('groups')
    .doc(groupId)
    .get()
  if (!groupSnap.exists) return { ok: false, status: 404, error: 'Group not found' }

  const membersSnap = await db
    .collection('communities')
    .doc(communityId)
    .collection('groups')
    .doc(groupId)
    .collection('members')
    .where('userId', '==', uid)
    .limit(1)
    .get()

  if (membersSnap.empty) {
    const createdBy = groupSnap.data()?.createdBy
    if (createdBy === uid) return { ok: true }
    return { ok: false, status: 403, error: 'Not a group member' }
  }

  const member = membersSnap.docs[0].data()
  const status = String(member.memberStatus || 'active')
  const active =
    (member.joinStatus === 'active' || member.isActive !== false) && memberCanChat(status)
  if (!active && groupSnap.data()?.createdBy !== uid) {
    return { ok: false, status: 403, error: 'Membership is not active' }
  }
  return { ok: true }
}

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

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const access = await assertGroupMember(communityId, groupId, uid)
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status })
    }

    const db = getAdminDb()
    const snap = await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const posts = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const data = docSnap.data()
        const authorId = String(data.authorId || '')
        let identity = {
          displayName: data.authorName || 'Member',
          profilePictureURL: data.authorAvatar || null,
          canOpenProfile: false,
        }
        if (authorId) {
          const userSnap = await db.collection('users').doc(authorId).get()
          identity = toGroupChatIdentity(authorId, userSnap.data(), uid)
        }
        return {
          ...serializeFirestoreDoc(docSnap.id, data as Record<string, unknown>),
          authorName: identity.displayName,
          authorAvatar: identity.profilePictureURL,
          canOpenProfile: identity.canOpenProfile,
        }
      })
    )

    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    console.error('[v0] list group posts error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const body = await request.json()
    const communityId = body.communityId as string
    const title = String(body.title || '').trim()
    const content = String(body.content || '').trim()
    const type = String(body.type || 'discussion')

    if (!communityId || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'communityId, title, and content are required' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const access = await assertGroupMember(communityId, groupId, uid)
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status })
    }

    const db = getAdminDb()
    const userSnap = await db.collection('users').doc(uid).get()
    const identity = toGroupChatIdentity(uid, userSnap.data(), uid)

    const payload = sanitizeForFirestore({
      communityId,
      groupId,
      authorId: uid,
      authorName: identity.displayName,
      authorAvatar: identity.profilePictureURL || '',
      title: title.slice(0, 200),
      content: content.slice(0, 10000),
      type,
      mediaURL: typeof body.mediaURL === 'string' ? body.mediaURL : '',
      mediaType: typeof body.mediaType === 'string' ? body.mediaType : '',
      commentCount: 0,
      likesCount: 0,
      likedBy: [],
      isPinned: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const ref = await db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .collection('posts')
      .add(payload)

    return NextResponse.json({
      success: true,
      data: { id: ref.id, ...payload, canOpenProfile: true },
    })
  } catch (error) {
    console.error('[v0] create group post error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 })
  }
}
