import crypto from 'crypto'
import { getAdminDb } from '@/lib/firebase-admin'

const COLLECTION = 'newsletterUnsubscribes'

function getUnsubscribeSecret(): string {
  return (
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY?.slice(0, 32) ||
    'pb-newsletter-unsubscribe-dev'
  )
}

export function buildUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase()
  return crypto.createHmac('sha256', getUnsubscribeSecret()).update(normalized).digest('hex')
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false
  const expected = buildUnsubscribeToken(email)
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.passive-blessings.com'
  const normalized = encodeURIComponent(email.trim().toLowerCase())
  const token = buildUnsubscribeToken(email)
  return `${site}/newsletters/unsubscribe?email=${normalized}&token=${token}`
}

/** Record opt-out for bulk campaign sends (Admin SDK only). */
export async function recordNewsletterUnsubscribe(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  const db = getAdminDb()
  await db.collection(COLLECTION).doc(normalized).set(
    {
      email: normalized,
      unsubscribedAt: new Date(),
      source: 'link',
    },
    { merge: true }
  )
}

/** Load all opted-out emails for recipient filtering. */
export async function getUnsubscribedEmails(): Promise<Set<string>> {
  const db = getAdminDb()
  const snap = await db.collection(COLLECTION).get()
  const set = new Set<string>()
  snap.docs.forEach((doc) => {
    const email = String(doc.data().email || doc.id).trim().toLowerCase()
    if (email) set.add(email)
  })

  // Also honor legacy newsletter_subscribers opt-outs
  const subsSnap = await db.collection('newsletter_subscribers').where('isActive', '==', false).get()
  subsSnap.docs.forEach((doc) => {
    const email = String(doc.data().email || '').trim().toLowerCase()
    if (email) set.add(email)
  })

  return set
}

export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const set = await getUnsubscribedEmails()
  return set.has(normalized)
}
