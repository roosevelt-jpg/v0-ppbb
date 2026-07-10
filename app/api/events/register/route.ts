import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { persistUserReferralAttribution } from '@/lib/referral-attribution-server'
import { recordReferralConversion } from '@/lib/referral-conversion-server'
import { getReferralCodeFromRequest } from '@/lib/referral-cookie'
import { resolveStripeConfig } from '@/lib/resolve-stripe-key'
import Stripe from 'stripe'
import {
  applyCoupon,
  buildRegistrationRecord,
  findExistingRegistration,
  generateCheckInCode,
  generateQrToken,
  getAuthUidFromRequest,
  incrementCouponUsed,
  incrementTicketSold,
  isEventFull,
  nextWaitlistPosition,
  resolveTicketType,
} from '@/lib/event-luma-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventId,
      userId: bodyUserId,
      registrationType,
      userName,
      userEmail,
      userGender,
      ticketTypeId,
      couponCode,
    } = body

    const authUid = await getAuthUidFromRequest(request)
    const userId = authUid || bodyUserId
    if (!eventId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    if (authUid && bodyUserId && authUid !== bodyUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const referralCode = getReferralCodeFromRequest(request) || body.referralCode || null
    if (referralCode) {
      void persistUserReferralAttribution(userId, referralCode).catch(console.error)
    }

    const eventDoc = await db.collection('events').doc(eventId).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 })
    }
    const event = eventDoc.data() as Record<string, unknown>
    if (event.status !== 'published') {
      return NextResponse.json({ success: false, error: 'Event is not open for registration' }, { status: 400 })
    }

    const existing = await findExistingRegistration(eventId, userId)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You are already registered for this event', registrationId: existing.id },
        { status: 409 }
      )
    }

    const ticket = resolveTicketType(event, ticketTypeId)
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Invalid ticket type' }, { status: 400 })
    }

    const couponResult = applyCoupon(
      ticket.price || 0,
      couponCode,
      event.coupons as any,
      ticket.id
    )
    if (couponResult.error) {
      return NextResponse.json({ success: false, error: couponResult.error }, { status: 400 })
    }

    const price = couponResult.price
    const isPaid = price > 0 && registrationType !== 'free'
    const full = isEventFull(event, ticket)
    const enableWaitlist = Boolean(event.enableWaitlist)
    const requireApproval = Boolean(event.requireApproval) || Boolean(ticket.requireApproval)

    let status: 'confirmed' | 'pending' | 'waitlisted' = 'confirmed'
    let waitlistPosition: number | null = null

    if (full) {
      if (!enableWaitlist) {
        return NextResponse.json({ success: false, error: 'Event is full' }, { status: 400 })
      }
      status = 'waitlisted'
      waitlistPosition = await nextWaitlistPosition(eventId)
    } else if (requireApproval) {
      status = 'pending'
    }

    const pbPercent = (event.pbCommissionPercent as number) || 10
    const pbCut = isPaid ? (price * pbPercent) / 100 : 0
    const businessCut = isPaid ? price - pbCut : 0

    const needsPayment = isPaid && status !== 'waitlisted'
    const registration = buildRegistrationRecord({
      eventId,
      userId,
      userName: userName || '',
      userEmail: userEmail || '',
      userGender,
      status: needsPayment ? (requireApproval ? 'pending' : 'confirmed') : status,
      ticket,
      amountPaid: price,
      paymentStatus: needsPayment ? 'pending' : price > 0 ? 'pending' : 'free',
      pbCut,
      businessCut,
      currency: ticket.currency || (event.currency as string) || 'AED',
      paymentGateway: (event.paymentGateway as string) || 'stripe',
      waitlistPosition,
      inviteStatus: 'self',
      couponCode: couponResult.coupon?.code || null,
      referralCode,
      checkInCode: needsPayment || status !== 'confirmed' ? null : generateCheckInCode(),
      qrToken: needsPayment || status !== 'confirmed' ? null : generateQrToken(),
    })

    if (status === 'waitlisted') {
      registration.status = 'waitlisted'
      registration.paymentStatus = price > 0 ? 'pending' : 'free'
      registration.checkInCode = null
      registration.qrToken = null
    }

    const regRef = await db.collection('eventRegistrations').add(registration)

    if (status === 'waitlisted') {
      await db.collection('events').doc(eventId).update({
        waitlistCount: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      })
      const origin =
        request.headers.get('origin') ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'https://test.myflynai.com'
      if (userEmail) {
        const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
        void sendEventRegistrationEmail({
          to: userEmail,
          eventTitle: String(event.title || 'Event'),
          eventUrl: `${origin}/events/${eventId}`,
          status: 'waitlisted',
          waitlistPosition,
        })
      }
      return NextResponse.json({
        success: true,
        registrationId: regRef.id,
        status: 'waitlisted',
        waitlistPosition,
        registration: { id: regRef.id, ...registration },
      })
    }

    if (needsPayment) {
      const stripeConfig = await resolveStripeConfig()
      if (!stripeConfig?.secretKey) {
        await regRef.delete()
        return NextResponse.json({ success: false, error: 'Stripe is not configured' }, { status: 500 })
      }

      const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2024-04-10' })
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: userEmail || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: (ticket.currency || 'AED').toLowerCase(),
              unit_amount: Math.round(price * 100),
              product_data: {
                name: `${event.title} — ${ticket.name}`,
                description: `Event ticket via Passive Blessings`,
              },
            },
          },
        ],
        success_url: `${origin}/events/${eventId}/confirmation?registrationId=${regRef.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/events/${eventId}?cancelled=1`,
        metadata: {
          type: 'event_ticket',
          eventId,
          registrationId: regRef.id,
          userId,
          ticketTypeId: ticket.id,
          couponCode: couponResult.coupon?.code || '',
        },
      })

      await regRef.update({ stripeSessionId: session.id })

      if (price > 0) {
        void recordReferralConversion({
          convertedUserId: userId,
          conversionType: 'event',
          relatedDocId: regRef.id,
          revenueAmount: price,
          status: 'pending',
          idempotencyKey: `event:${regRef.id}`,
        }).catch((err) => console.error('[referral] event conversion:', err))
      }

      return NextResponse.json({
        success: true,
        registrationId: regRef.id,
        checkoutUrl: session.url,
        status: registration.status,
        registration: { id: regRef.id, ...registration, stripeSessionId: session.id },
      })
    }

    // Free / confirmed (or pending approval) path
    if (registration.status !== 'pending') {
      await db.collection('events').doc(eventId).update({
        currentAttendees: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      })
      if (ticket.id !== 'legacy') {
        await incrementTicketSold(eventId, ticket.id)
      }
      if (couponResult.coupon?.code) {
        await incrementCouponUsed(eventId, couponResult.coupon.code)
      }
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://test.myflynai.com'
    if (userEmail) {
      const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
      void sendEventRegistrationEmail({
        to: userEmail,
        eventTitle: String(event.title || 'Event'),
        eventUrl: `${origin}/events/${eventId}/confirmation?registrationId=${regRef.id}`,
        status: String(registration.status),
        checkInCode: registration.checkInCode as string | null,
      })
    }

    return NextResponse.json({
      success: true,
      registrationId: regRef.id,
      status: registration.status,
      checkInCode: registration.checkInCode,
      qrToken: registration.qrToken,
      registration: { id: regRef.id, ...registration },
    })
  } catch (error) {
    console.error('[v0] Registration error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
