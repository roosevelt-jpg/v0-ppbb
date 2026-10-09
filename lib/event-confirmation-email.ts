/**
 * Event registration and payment confirmation emails (Events department).
 * Failures are logged only — registration must not fail because of email.
 */

import { paragraphs, sendBrandedEmail } from '@/lib/platform-email'
import { addUserNotification } from '@/lib/in-app-notifications'

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

function suggestEventHtml(): string {
  const url = `${siteOrigin()}/events/suggest`
  return `<p style="margin:16px 0 0 0;">Have an idea for a community event? <a href="${url}" style="color:#111111;font-weight:700;text-decoration:underline;">Suggest an event</a> and the team will review it.</p>`
}

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
    const path = (() => {
      try {
        return new URL(opts.eventUrl).pathname
      } catch {
        return '/events'
      }
    })()
    void addUserNotification(opts.userId, {
      title: headline,
      message: opts.eventTitle,
      href: path,
      type: 'event_registration',
    }).catch(() => undefined)
    void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
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
      bodyHtml: paragraphs(...lines) + suggestEventHtml(),
      cta: { label: 'View event', url: opts.eventUrl },
    })
    return result.ok
  } catch (e) {
    console.warn('[events] confirmation email failed:', e)
    return false
  }
}

/** Asks a registered guest whose ticket was never charged to complete payment. */
export async function sendEventPaymentRequestEmail(opts: {
  to: string
  eventTitle: string
  eventUrl: string
  amount: number
  currency: string
  userId?: string | null
}): Promise<boolean> {
  const headline = 'Payment needed for your ticket'
  const amountLabel = `${opts.currency} ${opts.amount.toFixed(2).replace(/\.00$/, '')}`

  if (opts.userId) {
    const path = (() => {
      try {
        const u = new URL(opts.eventUrl)
        return `${u.pathname}${u.search}`
      } catch {
        return '/events'
      }
    })()
    void addUserNotification(opts.userId, {
      title: headline,
      message: `${opts.eventTitle} · ${amountLabel}`,
      href: path,
      type: 'event_registration',
    }).catch(() => undefined)
    void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
      pushToUserSafe(
        opts.userId!,
        { title: headline, body: `${opts.eventTitle} · ${amountLabel}` },
        { type: 'event_registration', click_action: path }
      )
    })
  }

  if (!opts.to) return false
  try {
    const result = await sendBrandedEmail({
      to: opts.to,
      subject: `Action needed: complete payment for ${opts.eventTitle}`,
      purpose: 'Event ticket payment request',
      department: 'events',
      headline,
      bodyHtml: paragraphs(
        `Thank you for registering for "${opts.eventTitle}".`,
        `This is a paid event, but your registration went through without the ticket being charged. Please complete your payment of ${amountLabel} to keep your spot.`,
        'Your check-in QR code will be issued as soon as payment is done.'
      ),
      cta: { label: `Pay ${amountLabel}`, url: opts.eventUrl },
    })
    return result.ok
  } catch (e) {
    console.warn('[events] payment request email failed:', e)
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
    const path = (() => {
      try {
        return new URL(opts.eventUrl).pathname
      } catch {
        return '/events'
      }
    })()
    void addUserNotification(opts.userId, {
      title: 'Payment confirmed',
      message: opts.eventTitle,
      href: path,
      type: 'event_registration',
    }).catch(() => undefined)
    void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
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
      bodyHtml: paragraphs(...lines) + suggestEventHtml(),
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
      bodyHtml: paragraphs(...lines) + suggestEventHtml(),
      cta: { label: 'View event', url: opts.eventUrl },
    })
    return result.ok
  } catch (e) {
    console.warn('[events] reminder email failed:', e)
    return false
  }
}
