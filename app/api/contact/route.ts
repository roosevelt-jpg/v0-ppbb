import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

/**
 * Contact form API.
 * New submissions go to `contactSubmissions` (Part 6D).
 * Legacy admin tools that still read `contact-messages` remain supported via GET/PUT/DELETE.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const now = new Date()

    const contactData = sanitizeForFirestore({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : '',
      subject: String(subject).trim(),
      message: String(message).trim(),
      submittedAt: now,
      status: 'unread',
      createdAt: now,
    })

    // Canonical collection for Part 6D admin table
    const docRef = await db.collection('contactSubmissions').add(contactData)

    // Dual-write legacy collection so /admin/contact-requests stays usable
    try {
      await db.collection('contact-messages').add({
        ...contactData,
        id: docRef.id,
      })
    } catch (legacyErr) {
      console.warn('[v0] Legacy contact-messages write skipped:', legacyErr)
    }

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

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const status = request.nextUrl.searchParams.get('status')
    const source = request.nextUrl.searchParams.get('source') || 'submissions'

    // Prefer contactSubmissions (6D); fall back to legacy for contact-requests page
    if (source === 'legacy') {
      let query = db.collection('contact-messages').orderBy('createdAt', 'desc')
      if (status) {
        query = db
          .collection('contact-messages')
          .where('status', '==', status)
          .orderBy('createdAt', 'desc')
      }
      const snapshot = await query.get()
      const messages = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          respondedAt: data.respondedAt?.toDate?.() || data.respondedAt,
          submittedAt: data.submittedAt?.toDate?.() || data.submittedAt || data.createdAt?.toDate?.(),
        }
      })
      return NextResponse.json({ success: true, data: messages })
    }

    const snapshot = await db.collection('contactSubmissions').orderBy('submittedAt', 'desc').get()
    let submissions = snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        subject: data.subject || '',
        message: data.message || '',
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt || null,
        status: data.status || 'unread',
      }
    })

    if (status && status !== 'all') {
      submissions = submissions.filter((s) => s.subject === status)
    }

    return NextResponse.json({ success: true, data: submissions })
  } catch (error) {
    console.error('[v0] Contact messages fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = await request.json()
    const { id, status, response, collection: col } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing message ID' }, { status: 400 })
    }

    const updateData = sanitizeForFirestore({
      status,
      ...(response
        ? {
            response,
            respondedAt: new Date(),
          }
        : {}),
    })

    const collectionName = col === 'contactSubmissions' ? 'contactSubmissions' : 'contact-messages'
    await db.collection(collectionName).doc(id).set(updateData, { merge: true })

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

export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const source = searchParams.get('source') || 'legacy'

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing message ID' }, { status: 400 })
    }

    const collectionName = source === 'submissions' ? 'contactSubmissions' : 'contact-messages'
    await db.collection(collectionName).doc(id).delete()
    return NextResponse.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    console.error('[v0] Contact message delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
