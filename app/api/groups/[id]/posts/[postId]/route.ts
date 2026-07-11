import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { serializeFirestoreDoc } from '@/lib/serialize-firestore'
import { verifyIdToken } from '@/lib/admin-access-server'
import { toGroupChatIdentity } from '@/lib/user-settings'
import { assertCanUseGroup } from '@/lib/group-access-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: groupId, postId } = await params
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

    const access = await assertCanUseGroup(communityId, groupId, uid)
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status })
    }

    const db = getAdminDb()
    const postRef = db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .collection('posts')
      .doc(postId)
    const postSnap = await postRef.get()
    if (!postSnap.exists) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    const postData = postSnap.data() || {}
    const authorId = String(postData.authorId || '')
    let authorIdentity = toGroupChatIdentity(authorId, null, uid)
    if (authorId) {
      const userSnap = await db.collection('users').doc(authorId).get()
      authorIdentity = toGroupChatIdentity(authorId, userSnap.data(), uid)
    }

    const commentsSnap = await postRef.collection('comments').orderBy('createdAt', 'asc').get()
    const comments = await Promise.all(
      commentsSnap.docs.map(async (docSnap) => {
        const data = docSnap.data()
        const cAuthorId = String(data.authorId || '')
        let identity = toGroupChatIdentity(cAuthorId, null, uid)
        if (cAuthorId) {
          const u = await db.collection('users').doc(cAuthorId).get()
          identity = toGroupChatIdentity(cAuthorId, u.data(), uid)
        }
        return {
          ...serializeFirestoreDoc(docSnap.id, data as Record<string, unknown>),
          authorName: identity.displayName,
          authorAvatar: identity.profilePictureURL,
          canOpenProfile: identity.canOpenProfile,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        post: {
          ...serializeFirestoreDoc(postSnap.id, postData as Record<string, unknown>),
          authorName: authorIdentity.displayName,
          authorAvatar: authorIdentity.profilePictureURL,
          canOpenProfile: authorIdentity.canOpenProfile,
        },
        comments,
      },
    })
  } catch (error) {
    console.error('[v0] get group post error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load post' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: groupId, postId } = await params
    const body = await request.json()
    const communityId = body.communityId as string
    const action = String(body.action || 'comment')

    if (!communityId) {
      return NextResponse.json({ success: false, error: 'communityId required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const access = await assertCanUseGroup(communityId, groupId, uid)
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status })
    }

    const db = getAdminDb()
    const postRef = db
      .collection('communities')
      .doc(communityId)
      .collection('groups')
      .doc(groupId)
      .collection('posts')
      .doc(postId)
    const postSnap = await postRef.get()
    if (!postSnap.exists) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    if (action === 'like') {
      const likedBy = Array.isArray(postSnap.data()?.likedBy) ? [...postSnap.data()!.likedBy] : []
      const idx = likedBy.indexOf(uid)
      if (idx >= 0) likedBy.splice(idx, 1)
      else likedBy.push(uid)
      await postRef.update({
        likedBy,
        likesCount: likedBy.length,
        updatedAt: Timestamp.now(),
      })
      return NextResponse.json({ success: true, data: { likedBy, likesCount: likedBy.length } })
    }

    const content = String(body.content || '').trim()
    if (!content) {
      return NextResponse.json({ success: false, error: 'Comment content required' }, { status: 400 })
    }

    const userSnap = await db.collection('users').doc(uid).get()
    const identity = toGroupChatIdentity(uid, userSnap.data(), uid)
    const comment = sanitizeForFirestore({
      authorId: uid,
      authorName: identity.displayName,
      authorAvatar: identity.profilePictureURL || '',
      content: content.slice(0, 5000),
      parentCommentId: typeof body.parentCommentId === 'string' ? body.parentCommentId : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const commentRef = await postRef.collection('comments').add(comment)
    await postRef.update({
      commentCount: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({
      success: true,
      data: { id: commentRef.id, ...comment, canOpenProfile: true },
    })
  } catch (error) {
    console.error('[v0] group post action error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 })
  }
}
