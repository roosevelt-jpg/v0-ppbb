import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'

/**
 * Contact form API.
 * Public POST → `contactSubmissions` (+ legacy dual-write).
 * Admin GET/PUT/DELETE require Bearer token.
 */

const ALLOWED_SOURCES = new Set(['partners', 'contact', 'website'])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message, source: rawSource } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const source =
      typeof rawSource === 'string' && ALLOWED_SOURCES.has(rawSource.trim().toLowerCase())
        ? rawSource.trim().toLowerCase()
        : 'website'

    const db = getAdminDb()
    const now = new Date()

    const contactData = sanitizeForFirestore({
      name: String(name).trim().slice(0, 200),
      email: String(email).trim().toLowerCase().slice(0, 320),
      phone: phone ? String(phone).trim().slice(0, 40) : '',
      subject: String(subject).trim().slice(0, 200),
      message: String(message).trim().slice(0, 10000),
      source,
      category:
        source === 'partners' ||
        /partner|sponsor/i.test(String(subject))
          ? 'partnership'
          : 'other',
      submittedAt: now,
      status: 'unread',
      createdAt: now,
    })

    const docRef = await db.collection('contactSubmissions').add(contactData)

    try {
      await db.collection('contact-messages').add({
        ...contactData,
        submissionId: docRef.id,
      })
    } catch (legacyErr) {
      console.warn('[v0] Legacy contact-messages write skipped:', legacyErr)
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id },
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
    const uid = await requireAdminFromRequest(request)
    if (!uid) return unauthorizedResponse()

    const db = getAdminDb()
    const status = request.nextUrl.searchParams.get('status')
    const subject = request.nextUrl.searchParams.get('subject')
    const source = request.nextUrl.searchParams.get('source') || 'submissions'

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
        source: data.source || 'website',
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt || null,
        status: data.status || 'unread',
        response: data.response || '',
        respondedAt: data.respondedAt?.toDate?.() || data.respondedAt || null,
      }
    })

    if (status && status !== 'all') {
      submissions = submissions.filter((s) => s.status === status)
    }
    if (subject && subject !== 'all') {
      submissions = submissions.filter((s) => s.subject === subject)
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
    const uid = await requireAdminFromRequest(request)
    if (!uid) return unauthorizedResponse()

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

    // Keep both collections in sync when updating submissions
    if (collectionName === 'contactSubmissions') {
      try {
        const legacySnap = await db
          .collection('contact-messages')
          .where('submissionId', '==', id)
          .limit(1)
          .get()
        if (!legacySnap.empty) {
          await legacySnap.docs[0].ref.set(updateData, { merge: true })
        }
      } catch {
        /* legacy sync optional */
      }
    }

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
    const uid = await requireAdminFromRequest(request)
    if (!uid) return unauthorizedResponse()

    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const source = searchParams.get('source') || 'legacy'

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing message ID' }, { status: 400 })
    }

    const collectionName = source === 'submissions' ? 'contactSubmissions' : 'contact-messages'
    await db.collection(collectionName).doc(id).delete()

    if (collectionName === 'contactSubmissions') {
      try {
        const legacySnap = await db
          .collection('contact-messages')
          .where('submissionId', '==', id)
          .get()
        const batch = db.batch()
        legacySnap.docs.forEach((d) => batch.delete(d.ref))
        if (!legacySnap.empty) await batch.commit()
      } catch {
        /* optional */
      }
    }

    return NextResponse.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    console.error('[v0] Contact message delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
