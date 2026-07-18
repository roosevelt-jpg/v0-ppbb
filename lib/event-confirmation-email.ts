/**
 * Send event registration confirmation (or waitlist/pending) via branded Gmail SMTP.
 * Failures are logged only — registration must not fail because of email.
 */

import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'

export async function sendEventRegistrationEmail(opts: {
  to: string
  eventTitle: string
  eventUrl: string
  status: string
  checkInCode?: string | null
  waitlistPosition?: number | null
}): Promise<boolean> {
  if (!opts.to) return false

  let purpose = 'Event registration confirmation'
  let subject = `Registered: ${opts.eventTitle}`
  let headline = 'You’re registered'
  const lines: string[] = [
    `You're registered for "${opts.eventTitle}".`,
  ]

  if (opts.status === 'waitlisted') {
    purpose = 'Event waitlist confirmation'
    subject = `Waitlisted: ${opts.eventTitle}`
    headline = 'You’re on the waitlist'
    lines.length = 0
    lines.push(
      `You're on the waitlist for "${opts.eventTitle}"${
        opts.waitlistPosition ? ` (position #${opts.waitlistPosition})` : ''
      }. We'll notify you if a spot opens.`
    )
  } else if (opts.status === 'pending') {
    purpose = 'Event registration pending approval'
    subject = `Pending approval: ${opts.eventTitle}`
    headline = 'Registration pending'
    lines.length = 0
    lines.push(
      `Your registration for "${opts.eventTitle}" is pending host approval. We'll update you once it's reviewed.`
    )
  } else if (opts.checkInCode) {
    lines.push(`Your check-in code: ${opts.checkInCode}`)
  }

  try {
    const result = await sendBrandedEmail({
      to: opts.to,
      subject,
      purpose,
      headline,
      bodyHtml: paragraphs(...lines),
      cta: { label: 'View event', url: opts.eventUrl },
    })
    return result.ok
  } catch (e) {
    console.warn('[events] confirmation email failed:', e)
    return false
  }
}
