import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest, unauthorizedResponse } from '@/lib/admin-api-auth'
import { FieldValue } from 'firebase-admin/firestore'
import { addUserNotification } from '@/lib/in-app-notifications'
import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'

export const runtime = 'nodejs'

const STATUSES = new Set(['pending', 'reviewing', 'planned', 'declined'])

function serialize(id: string, data: Record<string, any>) {
  const created = data.createdAt?.toDate?.() as Date | undefined
  const updated = data.updatedAt?.toDate?.() as Date | undefined
  return {
    id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    title: data.title || '',
    description: data.description || '',
    preferredDate: data.preferredDate || '',
    location: data.location || '',
    audience: data.audience || '',
    userId: data.userId || '',
    status: data.status || 'pending',
    adminNote: data.adminNote || '',
    createdAt: created ? created.toISOString() : null,
    updatedAt: updated ? updated.toISOString() : null,
  }
}

export async function GET(request: NextRequest) {
  const adminUid = await requireAdminFromRequest(request)
  if (!adminUid) return unauthorizedResponse()

  const snap = await getAdminDb().collection('eventSuggestions').limit(200).get()
  const items = snap.docs
    .map((doc) => serialize(doc.id, doc.data()))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  return NextResponse.json({ success: true, items })
}

export async function PATCH(request: NextRequest) {
  const adminUid = await requireAdminFromRequest(request)
  if (!adminUid) return unauthorizedResponse()

  const body = (await request.json().catch(() => null)) as {
    id?: string
    status?: string
    adminNote?: string
  } | null
  const id = String(body?.id || '').trim()
  const status = String(body?.status || '').trim()
  if (!id || !STATUSES.has(status)) {
    return NextResponse.json({ success: false, error: 'Invalid suggestion' }, { status: 400 })
  }

  const db = getAdminDb()
  const ref = db.collection('eventSuggestions').doc(id)
  const snap = await ref.get()
  if (!snap.exists) {
    return NextResponse.json({ success: false, error: 'Suggestion not found' }, { status: 404 })
  }

  const adminNote = String(body?.adminNote || '').trim().slice(0, 2000)
  await ref.set(
    {
      status,
      adminNote,
      updatedAt: FieldValue.serverTimestamp(),
      reviewedBy: adminUid,
    },
    { merge: true }
  )

  const data = snap.data() || {}
  const userId = String(data.userId || '')
  const email = String(data.email || '')
  const title = String(data.title || 'your event idea')
  const statusLabel =
    status === 'planned' ? 'added to the plan' : status === 'declined' ? 'not moving ahead right now' : 'being reviewed'
  const message = `Your event idea “${title}” is ${statusLabel}.${adminNote ? ` Note: ${adminNote}` : ''}`

  if (userId) {
    await addUserNotification(userId, {
      title: 'Event suggestion update',
      message,
      href: '/events/suggest',
      type: 'event_suggestion',
    }).catch((error) => console.warn('[event-suggestions] user notification failed:', error))
  }

  if (email.includes('@') && status !== 'pending') {
    const site = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.passive-blessings.com'
    ).replace(/\/$/, '')
    void sendBrandedEmail({
      to: email,
      subject: `Update on your event idea: ${title}`,
      purpose: 'Event suggestion update',
      department: 'events',
      headline: 'Event idea update',
      bodyHtml: paragraphs('Assalamu alaikum,', message),
      cta: { label: 'Suggest another idea', url: `${site}/events/suggest` },
    }).catch((error) => console.warn('[event-suggestions] email failed:', error))
  }

  return NextResponse.json({ success: true })
}
