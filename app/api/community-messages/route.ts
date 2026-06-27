import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

let db: any

function getAdminDb() {
  if (db) return db
  
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  })
  
  db = getAdminFirestore(app)
  return db
}

// GET - Fetch messages
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'groupId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Fetching messages for group:', groupId)

    const snapshot = await db.collection('community-messages')
      .where('groupId', '==', groupId)
      .where('moderationStatus', '!=', 'rejected')
      .orderBy('moderationStatus')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.(),
    }))

    return NextResponse.json({ success: true, data: messages.reverse() })
  } catch (error) {
    console.error('[v0] Error fetching messages:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - Create message
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { groupId, communityId, authorId, authorName, authorAvatar, content, type, imageUrls, fileAttachments } = body

    if (!groupId || !authorId || !content) {
      return NextResponse.json(
        { success: false, error: 'groupId, authorId, and content are required' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating message:', { groupId, authorId, type })

    const messageRef = await db.collection('community-messages').add({
      communityId,
      groupId,
      authorId,
      authorName: authorName || 'Anonymous',
      authorAvatar: authorAvatar || null,
      content,
      type: type || 'text',
      imageUrls: imageUrls || [],
      fileAttachments: fileAttachments || [],
      reactions: [],
      repliesCount: 0,
      isEdited: false,
      isPinned: false,
      flaggedCount: 0,
      isFlagged: false,
      moderationStatus: 'pending', // Messages await admin review
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log('[v0] Message created:', messageRef.id)

    return NextResponse.json({
      success: true,
      data: {
        id: messageRef.id,
        groupId,
        authorId,
        content,
        type,
      },
    })
  } catch (error) {
    console.error('[v0] Error creating message:', error)
    return NextResponse.json({ success: false, error: 'Failed to create message' }, { status: 500 })
  }
}

// PUT - Update message
export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { messageId, ...updateData } = body

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Updating message:', messageId)

    await db.collection('community-messages').doc(messageId).update({
      ...updateData,
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    })

    console.log('[v0] Message updated successfully')

    return NextResponse.json({ success: true, message: 'Message updated' })
  } catch (error) {
    console.error('[v0] Error updating message:', error)
    return NextResponse.json({ success: false, error: 'Failed to update message' }, { status: 500 })
  }
}

// DELETE - Delete or flag message
export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { messageId, action = 'delete' } = body

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing message action:', { messageId, action })

    if (action === 'delete') {
      await db.collection('community-messages').doc(messageId).delete()
      console.log('[v0] Message deleted')
    } else if (action === 'flag') {
      const doc = await db.collection('community-messages').doc(messageId).get()
      const flaggedCount = (doc.data().flaggedCount || 0) + 1
      await db.collection('community-messages').doc(messageId).update({
        isFlagged: true,
        flaggedCount,
        updatedAt: new Date(),
      })
      console.log('[v0] Message flagged')
    }

    return NextResponse.json({ success: true, message: `Message ${action}ed` })
  } catch (error) {
    console.error('[v0] Error processing message:', error)
    return NextResponse.json({ success: false, error: 'Failed to process message' }, { status: 500 })
  }
}
