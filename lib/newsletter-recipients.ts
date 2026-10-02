import { getAdminDb } from '@/lib/firebase-admin'
import { getUnsubscribedEmails } from '@/lib/newsletter-unsubscribe'
import { isAccountDeleted, shouldNotifyUser } from '@/lib/user-settings'

export interface NewsletterRecipient {
  email: string
  name?: string
  userId?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Canonical recipient list: all registered users with valid emails,
 * excluding newsletter opt-outs (newsletterUnsubscribes + inactive newsletter_subscribers).
 */
export async function fetchNewsletterRecipients(): Promise<NewsletterRecipient[]> {
  const db = getAdminDb()
  const unsubscribed = await getUnsubscribedEmails()
  const seen = new Set<string>()
  const optedOut = new Set<string>()
  const recipients: NewsletterRecipient[] = []

  const usersSnap = await db.collection('users').get()
  for (const doc of usersSnap.docs) {
    const data = doc.data()
    const email = String(data.email || '').trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email)) continue
    if (unsubscribed.has(email)) continue
    if (data.newsletterOptOut === true) {
      optedOut.add(email)
      continue
    }
    if (isAccountDeleted({ ...data, id: doc.id })) continue
    if (!shouldNotifyUser({ ...data, id: doc.id }, 'email', 'newsletter')) continue
    if (seen.has(email)) continue
    seen.add(email)
    const name =
      [data.firstName, data.lastName].filter(Boolean).join(' ') ||
      data.displayName ||
      data.name ||
      undefined
    recipients.push({ email, name: typeof name === 'string' ? name : undefined, userId: doc.id })
  }

  const subsSnap = await db.collection('newsletter_subscribers').get()
  for (const doc of subsSnap.docs) {
    const data = doc.data()
    if (data.isActive === false) continue
    const email = String(data.email || '').trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email) || seen.has(email) || unsubscribed.has(email) || optedOut.has(email)) continue
    seen.add(email)
    const name = typeof data.name === 'string' ? data.name : undefined
    const userId = typeof data.userId === 'string' ? data.userId : undefined
    recipients.push({ email, name, userId })
  }

  return recipients
}

export async function getNewsletterRecipientCount(): Promise<number> {
  const list = await fetchNewsletterRecipients()
  return list.length
}
