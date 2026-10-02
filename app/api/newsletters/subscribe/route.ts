import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function attachToProfiles(email: string, name: string, userId: string | null) {
  const db = getAdminDb()
  const ids = new Set<string>()
  if (userId) ids.add(userId)

  const matches = await db.collection('users').where('email', '==', email).limit(5).get()
  matches.docs.forEach((doc) => ids.add(doc.id))

  const profilePatch: Record<string, unknown> = {
    newsletterSubscribed: true,
    newsletterSubscribedAt: new Date(),
    newsletterOptOut: false,
    'notificationPreferences.newsletter': true,
    'notificationPreferences.emailNotifications': true,
  }
  if (name) profilePatch.newsletterName = name

  await Promise.all(
    [...ids].map(async (id) => {
      const ref = db.collection('users').doc(id)
      try {
        await ref.update(profilePatch)
      } catch {
        await ref.set(
          {
            newsletterSubscribed: true,
            newsletterSubscribedAt: new Date(),
            newsletterOptOut: false,
          },
          { merge: true }
        )
      }
    })
  )
  return [...ids][0] || null
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body = (await request.json().catch(() => null)) as { email?: string; name?: string; source?: string } | null
    const email = String(body?.email || '').trim().toLowerCase()
    const name = String(body?.name || '').trim().slice(0, 120)
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 })
    }

    const header = request.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const userId = token ? await verifyIdToken(token) : null
    const linkedUserId = await attachToProfiles(email, name, userId)

    const existing = await db.collection('newsletter_subscribers').where('email', '==', email).limit(1).get()
    const payload = {
      email,
      name: name || null,
      userId: linkedUserId,
      isActive: true,
      source: String(body?.source || 'website').slice(0, 40),
      subscribedAt: new Date(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (existing.empty) {
      await db.collection('newsletter_subscribers').add(payload)
    } else {
      await existing.docs[0].ref.set(payload, { merge: true })
    }

    await db.collection('newsletterUnsubscribes').doc(email).delete().catch(() => undefined)

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    })
  } catch (error) {
    console.error('[v0] Error subscribing to newsletter:', error)
    return NextResponse.json({ success: false, error: 'Failed to subscribe' }, { status: 500 })
  }
}
