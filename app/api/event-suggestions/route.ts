import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { FieldValue } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }
    if (String(body.companyWebsite || '').trim()) {
      return NextResponse.json({ success: true })
    }

    const name = String(body.name || '').trim().slice(0, 120)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 180)
    const title = String(body.title || '').trim().slice(0, 160)
    const description = String(body.description || '').trim().slice(0, 4000)
    const phone = String(body.phone || '').trim().slice(0, 40)
    const preferredDate = String(body.preferredDate || '').trim().slice(0, 40)
    const location = String(body.location || '').trim().slice(0, 240)
    const audience = String(body.audience || '').trim().slice(0, 240)

    if (!name || !EMAIL_RE.test(email) || title.length < 3 || description.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Name, email, a title, and a short description are required.' },
        { status: 400 }
      )
    }

    const header = request.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const userId = token ? await verifyIdToken(token) : null

    const db = getAdminDb()
    const recent = await db.collection('eventSuggestions').where('email', '==', email).limit(8).get()
    const hourAgo = Date.now() - 60 * 60 * 1000
    const tooSoon = recent.docs.some((doc) => {
      const created = doc.data().createdAt?.toDate?.() as Date | undefined
      return created ? created.getTime() > hourAgo : false
    })
    if (tooSoon) {
      return NextResponse.json(
        { success: false, error: 'You already sent a suggestion recently. Please try again later.' },
        { status: 429 }
      )
    }

    const ref = await db.collection('eventSuggestions').add({
      name,
      email,
      phone: phone || null,
      title,
      description,
      preferredDate: preferredDate || null,
      location: location || null,
      audience: audience || null,
      userId: userId || null,
      status: 'pending',
      adminNote: '',
      source: 'event-registration-email',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    void import('@/lib/push-notifications-server').then(({ notifyAdminsPushSafe }) => {
      notifyAdminsPushSafe(
        {
          title: 'New event suggestion',
          body: `${name} suggested “${title}”`,
        },
        {
          type: 'event_suggestion',
          suggestionId: ref.id,
          click_action: '/admin/event-suggestions',
        }
      )
    })

    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    console.error('[event-suggestions] create failed:', error)
    return NextResponse.json({ success: false, error: 'Could not send your suggestion' }, { status: 500 })
  }
}
