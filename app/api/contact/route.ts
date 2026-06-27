import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

const db = getAdminDb()

interface ContactMessage {
  id?: string
  name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'resolved'
  createdAt?: Date
  respondedAt?: Date
  response?: string
}

// POST: Submit contact form (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const contactData: ContactMessage = {
      name,
      email,
      subject,
      message,
      status: 'unread',
      createdAt: new Date(),
    }

    const docRef = await db.collection('contact-messages').add(contactData)

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...contactData },
      message: 'Message received successfully',
    })
  } catch (error) {
    console.error('[v0] Contact form error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit message' },
      { status: 500 }
    )
  }
}

// GET: Fetch contact messages (admin only)
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')

    let query = db.collection('contact-messages').orderBy('createdAt', 'desc')

    if (status) {
      query = db
        .collection('contact-messages')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
    }

    const snapshot = await query.get()
    const messages: ContactMessage[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      respondedAt: doc.data().respondedAt?.toDate?.(),
    })) as ContactMessage[]

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('[v0] Contact messages fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// PUT: Update message status and add response (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, response } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing message ID' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (response) {
      updateData.response = response
      updateData.respondedAt = new Date()
    }

    await db.collection('contact-messages').doc(id).update(updateData)

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
    })
  } catch (error) {
    console.error('[v0] Contact message update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

// DELETE: Remove message (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing message ID' },
        { status: 400 }
      )
    }

    await db.collection('contact-messages').doc(id).delete()
    return NextResponse.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    console.error('[v0] Contact message delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
