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
  userId?: string | null
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

  if (opts.userId) {
    void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
      const path = (() => {
        try {
          return new URL(opts.eventUrl).pathname
        } catch {
          return '/events'
        }
      })()
      pushToUserSafe(
        opts.userId!,
        { title: headline, body: opts.eventTitle },
        {
          type: 'event_registration',
          click_action: path,
        }
      )
    })
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

/** Sent after ticket payment succeeds — this is the confirmation (pay first). */
export async function sendEventPaymentConfirmationEmail(opts: {
  to: string
  eventTitle: string
  eventUrl: string
  amount: number
  currency?: string
  checkInCode?: string | null
  paymentReference?: string | null
  userId?: string | null
  startDate?: Date | null
}): Promise<boolean> {
  if (!opts.to) return false

  const currency = (opts.currency || 'AED').toUpperCase()
  const amountLine =
    opts.amount > 0 ? `Amount paid: ${currency} ${opts.amount.toFixed(2)}.` : ''
  const refLine = opts.paymentReference?.trim()
    ? `Payment reference: ${opts.paymentReference.trim()}.`
    : ''
  const whenLine = opts.startDate
    ? `When: ${opts.startDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}.`
    : ''
  const lines = [
    `You're confirmed for "${opts.eventTitle}".`,
    amountLine,
    refLine,
    whenLine,
    'Payment received — your spot is secured.',
  ].filter(Boolean)

  if (opts.checkInCode) {
    lines.push(`Your check-in code: ${opts.checkInCode}`)
  }

  if (opts.userId) {
    void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
      const path = (() => {
        try {
          return new URL(opts.eventUrl).pathname
        } catch {
          return '/events'
        }
      })()
      pushToUserSafe(
        opts.userId!,
        { title: 'Payment confirmed', body: opts.eventTitle },
        {
          type: 'event_registration',
          click_action: path,
        }
      )
    })
  }

  try {
    const result = await sendBrandedEmail({
      to: opts.to,
      subject: `Confirmed: ${opts.eventTitle}`,
      purpose: 'Event payment confirmation',
      department: 'events',
      headline: 'You’re confirmed',
      bodyHtml: paragraphs(...lines),
      cta: { label: 'View event details', url: opts.eventUrl },
    })
    return result.ok
  } catch (e) {
    console.warn('[events] payment confirmation email failed:', e)
    return false
  }
}

export type EventReminderKind = 'daily' | 'day_before' | 'hours_before'

/** Reminder before an event starts (daily countdown, ~2 days out, or ~6 hours). */
export async function sendEventReminderEmail(opts: {
  to: string
  eventTitle: string
  eventUrl: string
  startDate: Date
  locationLabel?: string | null
  kind: EventReminderKind
  checkInCode?: string | null
  daysUntil?: number | null
}): Promise<boolean> {
  if (!opts.to) return false

  const when = opts.startDate.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })
  const location = opts.locationLabel?.trim()
  const isHours = opts.kind === 'hours_before'
  const isTwoDays = opts.kind === 'day_before'
  const daysUntil =
    typeof opts.daysUntil === 'number' && Number.isFinite(opts.daysUntil)
      ? Math.max(0, Math.ceil(opts.daysUntil))
      : null

  let subject: string
  let headline: string
  let lead: string
  let purpose: string

  if (isHours) {
    subject = `In about 6 hours: ${opts.eventTitle}`
    headline = 'Your event starts soon'
    lead = `Just a heads-up — "${opts.eventTitle}" starts in about 6 hours.`
    purpose = 'Event 6-hour reminder'
  } else if (isTwoDays) {
    subject = `In 2 days: ${opts.eventTitle}`
    headline = 'Event reminder'
    lead = `Friendly reminder — "${opts.eventTitle}" is coming up in 2 days.`
    purpose = 'Event 2-day reminder'
  } else {
    const dayLabel =
      daysUntil === 0
        ? 'today'
        : daysUntil === 1
          ? 'tomorrow'
          : daysUntil != null
            ? `in ${daysUntil} days`
            : 'soon'
    subject = `Reminder: ${opts.eventTitle} ${dayLabel}`
    headline = daysUntil === 0 ? 'Event day' : 'Upcoming event'
    lead =
      daysUntil === 0
        ? `"${opts.eventTitle}" is today — see you there.`
        : daysUntil === 1
          ? `"${opts.eventTitle}" is tomorrow.`
          : `"${opts.eventTitle}" is ${dayLabel}.`
    purpose = 'Event countdown reminder'
  }

  const lines = [
    lead,
    `When: ${when}.`,
    location ? `Where: ${location}.` : '',
    opts.checkInCode ? `Your check-in code: ${opts.checkInCode}` : '',
    'We look forward to seeing you.',
  ].filter(Boolean)

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
    console.warn('[events] reminder email failed:', e)
    return false
  }
}
