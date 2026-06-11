import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const db = getFirestore()

export async function POST(request: NextRequest) {
  try {
    const { userId, title, role } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const conversationRef = await db.collection('conversations').add({
      userId,
      userRole: role || 'user',
      title: title || 'New Conversation',
      messages: [],
      status: 'active',
      category: 'other',
      sentiment: 'neutral',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    })

    return NextResponse.json({
      id: conversationRef.id,
      message: 'Conversation created successfully',
    })
  } catch (error) {
    console.error('[v0] Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const role = request.nextUrl.searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    let query = db.collection('conversations').where('userId', '==', userId)

    // Admins can see all conversations
    if (role !== 'admin') {
      query = query.orderBy('lastMessageAt', 'desc').limit(50)
    } else {
      query = db.collection('conversations').orderBy('lastMessageAt', 'desc').limit(100)
    }

    const snapshot = await query.get()
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('[v0] Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
