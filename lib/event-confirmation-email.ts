/**
 * Event registration and payment confirmation emails (Events department).
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
  const lines: string[] = [`You're registered for "${opts.eventTitle}".`]

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
  } else if (opts.status === 'pending_payment') {
    purpose = 'Event registration confirmation'
    subject = `Registration received: ${opts.eventTitle}`
    headline = 'Registration received'
    lines.length = 0
    lines.push(
      `Your registration for "${opts.eventTitle}" has been received.`,
      'Complete payment to confirm your spot. A separate payment confirmation email will be sent once payment is processed.'
    )
  } else if (opts.checkInCode) {
    lines.push(`Your check-in code: ${opts.checkInCode}`)
  }

  try {
    const result = await sendBrandedEmail({
      to: opts.to,
      subject,
      purpose,
      department: 'events',
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

/** Sent after ticket payment succeeds (separate from registration confirmation). */
export async function sendEventPaymentConfirmationEmail(opts: {
  to: string
  eventTitle: string
  eventUrl: string
  amount: number
  currency?: string
  checkInCode?: string | null
  paymentReference?: string | null
}): Promise<boolean> {
  if (!opts.to) return false

  const currency = (opts.currency || 'AED').toUpperCase()
  const amountLine =
    opts.amount > 0 ? `Amount paid: ${currency} ${opts.amount.toFixed(2)}.` : ''
  const refLine = opts.paymentReference?.trim()
    ? `Payment reference: ${opts.paymentReference.trim()}.`
    : ''
  const lines = [
    `Your payment for "${opts.eventTitle}" has been received.`,
    amountLine,
    refLine,
    'Your registration is confirmed.',
  ].filter(Boolean)

  if (opts.checkInCode) {
    lines.push(`Your check-in code: ${opts.checkInCode}`)
  }

  try {
    const result = await sendBrandedEmail({
      to: opts.to,
      subject: `Payment confirmed: ${opts.eventTitle}`,
      purpose: 'Event payment confirmation',
      department: 'events',
      headline: 'Payment confirmed',
      bodyHtml: paragraphs(...lines),
      cta: { label: 'View event details', url: opts.eventUrl },
    })
    return result.ok
  } catch (e) {
    console.warn('[events] payment confirmation email failed:', e)
    return false
  }
}
