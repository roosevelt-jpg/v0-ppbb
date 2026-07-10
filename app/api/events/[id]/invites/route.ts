import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import {
  buildRegistrationRecord,
  canManageEvent,
  generateCheckInCode,
  generateQrToken,
  getAuthUidFromRequest,
  resolveTicketType,
} from '@/lib/event-luma-server'

type Ctx = { params: Promise<{ id: string }> }

async function sendInviteEmail(to: string, eventTitle: string, eventUrl: string) {
  try {
    const { getGmailSmtpConfig, createGmailTransporter } = await import('@/lib/gmail-service')
    const config = await getGmailSmtpConfig()
    if (!config?.gmailEmail || !config?.gmailAppPassword) {
      console.warn('[events] Gmail SMTP not configured — invite logged only')
      return false
    }
    const transporter = createGmailTransporter({
      enabled: true,
      gmailEmail: config.gmailEmail,
      gmailAppPassword: config.gmailAppPassword,
      fromName: config.fromName || 'Passive Blessings',
    } as any)
    if (!transporter) return false
    await transporter.sendMail({
      from: `"${config.fromName || 'Passive Blessings'}" <${config.gmailEmail}>`,
      to,
      subject: `You're invited: ${eventTitle}`,
      html: `<p>You've been invited to <strong>${eventTitle}</strong>.</p>
        <p><a href="${eventUrl}">View event & RSVP</a></p>
        <p>— Passive Blessings</p>`,
    })
    return true
  } catch (e) {
    console.warn('[events] invite email failed:', e)
    return false
  }
}

export async function POST(request: NextRequest, context: Ctx) {
  const { id: eventId } = await context.params
  const uid = await getAuthUidFromRequest(request)
  if (!uid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const eventDoc = await getAdminDb().collection('events').doc(eventId).get()
  if (!eventDoc.exists) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
  const event = eventDoc.data()!
  if (!(await canManageEvent(uid, event))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const emails: string[] = String(body.emails || '')
    .split(/[,;\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const addDirectly = Boolean(body.addDirectly)
  const ticket = resolveTicketType(event, body.ticketTypeId)
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Invalid ticket type' }, { status: 400 })
  }

  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://test.myflynai.com'
  const eventUrl = `${origin}/events/${eventId}`

  const results: Array<{ email: string; ok: boolean; registrationId?: string }> = []

  for (const email of emails.slice(0, 200)) {
    if (addDirectly) {
      const registration = buildRegistrationRecord({
        eventId,
        userId: `invited_${email}`,
        userName: email.split('@')[0],
        userEmail: email,
        status: 'confirmed',
        ticket,
        amountPaid: 0,
        paymentStatus: 'free',
        pbCut: 0,
        businessCut: 0,
        currency: ticket.currency,
        inviteStatus: 'invited',
        checkInCode: generateCheckInCode(),
        qrToken: generateQrToken(),
      })
      const ref = await getAdminDb().collection('eventRegistrations').add(registration)
      await getAdminDb()
        .collection('events')
        .doc(eventId)
        .update({ currentAttendees: FieldValue.increment(1), updatedAt: Timestamp.now() })
      await sendInviteEmail(email, String(event.title), eventUrl)
      results.push({ email, ok: true, registrationId: ref.id })
    } else {
      const sent = await sendInviteEmail(email, String(event.title), eventUrl)
      results.push({ email, ok: sent })
    }
  }

  return NextResponse.json({ success: true, data: results })
}
