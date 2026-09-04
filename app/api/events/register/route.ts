import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { persistUserReferralAttribution } from '@/lib/referral-attribution-server'
import { recordReferralConversion } from '@/lib/referral-conversion-server'
import { getReferralCodeFromRequest } from '@/lib/referral-cookie'
import { resolveStripeConfig } from '@/lib/resolve-stripe-key'
import { createEmbeddedPaymentIntent } from '@/lib/stripe-embedded'
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
  isExplicitTrue,
  nextWaitlistPosition,
  resolveTicketType,
} from '@/lib/event-luma-server'

export async function GET(request: NextRequest) {
  try {
    const registrationId = request.nextUrl.searchParams.get('registrationId')
    if (!registrationId) {
      return NextResponse.json({ success: false, error: 'registrationId required' }, { status: 400 })
    }
    const uid = await getAuthUidFromRequest(request)
    const db = getAdminDb()
    const snap = await db.collection('eventRegistrations').doc(registrationId).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    const data = snap.data() || {}
    // Registrant or unauthenticated with matching id only returns limited public confirmation fields
    if (uid && data.userId && uid !== data.userId) {
      const { canManageEvent } = await import('@/lib/event-luma-server')
      const eventSnap = await db.collection('events').doc(String(data.eventId || '')).get()
      const canManage = eventSnap.exists && (await canManageEvent(uid, eventSnap.data() || {}))
      if (!canManage) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
    }
    return NextResponse.json({
      success: true,
      registration: {
        id: snap.id,
        status: data.status,
        waitlistPosition: data.waitlistPosition ?? null,
        checkInCode: data.checkInCode || null,
        qrToken: data.qrToken || null,
        paymentStatus: data.paymentStatus || null,
        eventId: data.eventId,
      },
    })
  } catch (error) {
    console.error('[events/register] GET', error)
    return NextResponse.json({ success: false, error: 'Failed to load registration' }, { status: 500 })
  }
}

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
      const existingData = existing.data() || {}
      const existingStatus = String(existingData.status || '')
      const existingPay = String(existingData.paymentStatus || '')
      // Allow resuming unpaid checkout instead of hard-blocking the user.
      if (existingStatus === 'pending_payment' || existingPay === 'pending') {
        return NextResponse.json({
          success: true,
          registrationId: existing.id,
          status: existingStatus || 'pending_payment',
          resumePayment: true,
          registration: { id: existing.id, ...existingData },
        })
      }
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
    // Never trust client "free" when the resolved ticket still has a price.
    const isPaid = price > 0
    const full = isEventFull(event, ticket)
    const enableWaitlist = Boolean(event.enableWaitlist)
    // Event-level only. Strict check — Boolean("false") must not become pending.
    const requireApproval = isExplicitTrue(event.requireApproval)

    let status: 'confirmed' | 'pending' | 'pending_payment' | 'waitlisted' = 'confirmed'
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
    // Paid tickets stay pending_payment until Stripe/PayPal/Ziina succeeds.
    // Host-approval events stay pending until approve, then still need payment if priced.
    const registrationStatus: 'confirmed' | 'pending' | 'pending_payment' | 'waitlisted' =
      needsPayment
        ? requireApproval
          ? 'pending'
          : 'pending_payment'
        : status

    const registration = buildRegistrationRecord({
      eventId,
      userId,
      userName: userName || '',
      userEmail: userEmail || '',
      userGender,
      status: registrationStatus,
      ticket,
      amountPaid: 0,
      ticketPrice: price,
      paymentStatus: needsPayment ? 'pending' : 'free',
      pbCut,
      businessCut,
      currency: ticket.currency || (event.currency as string) || 'AED',
      paymentGateway: (event.paymentGateway as string) || 'stripe',
      waitlistPosition,
      inviteStatus: 'self',
      couponCode: couponResult.coupon?.code || null,
      referralCode,
      checkInCode:
        needsPayment || registrationStatus !== 'confirmed' ? null : generateCheckInCode(),
      qrToken: needsPayment || registrationStatus !== 'confirmed' ? null : generateQrToken(),
    })

    // Free confirmed path: amountPaid stays 0 with paymentStatus free
    if (!needsPayment && registrationStatus === 'confirmed') {
      registration.paymentStatus = 'free'
    }

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
        'https://www.passive-blessings.com'
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
      const gateway = ((event.paymentGateway as string) || 'stripe').toLowerCase()
      const origin =
        request.headers.get('origin') ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://www.passive-blessings.com'
      const currency = (ticket.currency || (event.currency as string) || 'AED').toString()
      const description = `${String(event.title || 'Event')} — ${ticket.name}`

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

      if (userEmail) {
        const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
        void sendEventRegistrationEmail({
          to: userEmail,
          eventTitle: String(event.title || 'Event'),
          eventUrl: `${origin}/events/${eventId}`,
          status: 'pending_payment',
        })
      }

      if (gateway === 'paypal') {
        const { resolvePayPalConfig } = await import('@/lib/resolve-paypal-config')
        const { createPayPalOrder } = await import('@/lib/paypal-client')
        const paypalConfig = await resolvePayPalConfig()
        if (!paypalConfig) {
          await regRef.delete()
          return NextResponse.json(
            { success: false, error: 'PayPal is not configured' },
            { status: 500 }
          )
        }
        const order = await createPayPalOrder({
          amountMajor: price,
          currency,
          description,
          returnUrl: `${origin}/api/paypal/return?type=event&eventId=${encodeURIComponent(eventId)}&registrationId=${encodeURIComponent(regRef.id)}`,
          cancelUrl: `${origin}/events/${eventId}?cancelled=1`,
          customId: regRef.id,
        })
        await regRef.update({
          paypalOrderId: order.id,
          paymentGateway: 'paypal',
        })
        return NextResponse.json({
          success: true,
          registrationId: regRef.id,
          checkoutUrl: order.approveUrl,
          gateway: 'paypal',
          status: registration.status,
          registration: { id: regRef.id, ...registration, paypalOrderId: order.id },
        })
      }

      if (gateway === 'ziina') {
        const { resolveZiinaConfig } = await import('@/lib/resolve-ziina-config')
        const { createZiinaPaymentIntent } = await import('@/lib/ziina-client')
        const ziinaConfig = await resolveZiinaConfig()
        if (!ziinaConfig) {
          await regRef.delete()
          return NextResponse.json(
            { success: false, error: 'Ziina is not configured' },
            { status: 500 }
          )
        }
        const intent = await createZiinaPaymentIntent({
          amountMinor: Math.round(price * 100),
          currency,
          message: description,
          successUrl:
            `${origin}/api/ziina/return?type=event` +
            `&eventId=${encodeURIComponent(eventId)}` +
            `&registrationId=${encodeURIComponent(regRef.id)}` +
            `&payment_intent_id={PAYMENT_INTENT_ID}`,
          cancelUrl: `${origin}/events/${eventId}?cancelled=1`,
        })
        if (!intent.redirect_url) {
          await regRef.delete()
          return NextResponse.json(
            { success: false, error: 'Ziina did not return a checkout URL' },
            { status: 500 }
          )
        }
        await regRef.update({
          ziinaPaymentIntentId: intent.id,
          paymentGateway: 'ziina',
        })
        return NextResponse.json({
          success: true,
          registrationId: regRef.id,
          checkoutUrl: intent.redirect_url,
          gateway: 'ziina',
          status: registration.status,
          registration: { id: regRef.id, ...registration, ziinaPaymentIntentId: intent.id },
        })
      }

      // Default: Stripe
      const stripeConfig = await resolveStripeConfig()
      if (!stripeConfig?.secretKey || !stripeConfig.publishableKey) {
        await regRef.delete()
        return NextResponse.json({ success: false, error: 'Stripe is not configured' }, { status: 500 })
      }

      const embedded = await createEmbeddedPaymentIntent({
        amountMinor: Math.round(price * 100),
        currency,
        description,
        metadata: {
          type: 'event_ticket',
          eventId,
          registrationId: regRef.id,
          userId,
          ticketTypeId: ticket.id,
          couponCode: couponResult.coupon?.code || '',
        },
      })

      await regRef.update({
        stripePaymentIntentId: embedded.paymentIntentId,
        paymentGateway: 'stripe',
      })

      return NextResponse.json({
        success: true,
        registrationId: regRef.id,
        embedded: true,
        clientSecret: embedded.clientSecret,
        publishableKey: embedded.publishableKey,
        paymentIntentId: embedded.paymentIntentId,
        gateway: 'stripe',
        status: registration.status,
        registration: {
          id: regRef.id,
          ...registration,
          stripePaymentIntentId: embedded.paymentIntentId,
        },
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
      'https://www.passive-blessings.com'
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
