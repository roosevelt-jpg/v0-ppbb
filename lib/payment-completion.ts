import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { recordReferralConversion } from '@/lib/referral-conversion-server'
import {
  generateCheckInCode,
  generateQrToken,
  incrementCouponUsed,
  incrementTicketSold,
} from '@/lib/event-luma-server'
import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

export function getPublicAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://test.myflynai.com'
  ).replace(/\/$/, '')
}

/** Mark an event registration paid and update event counters (idempotent). */
export async function completeEventTicketPayment(params: {
  registrationId: string
  eventId: string
  paymentReference: string
  gateway: 'stripe' | 'paypal' | 'ziina'
  amountMajor?: number
  ticketTypeId?: string
  couponCode?: string
  userId?: string
}): Promise<{ alreadyPaid: boolean; confirmationUrl: string }> {
  const db = getAdminDb()
  const regRef = db.collection('eventRegistrations').doc(params.registrationId)
  const regSnap = await regRef.get()
  if (!regSnap.exists) {
    throw new Error('Registration not found')
  }
  const reg = regSnap.data()!
  const site = getPublicAppUrl()
  const confirmationUrl = `${site}/events/${params.eventId}/confirmation?registrationId=${params.registrationId}`

  if (reg.paymentStatus === 'paid') {
    return { alreadyPaid: true, confirmationUrl }
  }

  const amount =
    typeof params.amountMajor === 'number' && Number.isFinite(params.amountMajor)
      ? params.amountMajor
      : Number(reg.amountPaid) || 0

  await regRef.update({
    paymentStatus: 'paid',
    status: reg.status === 'pending' ? 'pending' : 'confirmed',
    paidAt: Timestamp.now(),
    paymentReference: params.paymentReference,
    paymentGateway: params.gateway,
    checkInCode: reg.checkInCode || generateCheckInCode(),
    qrToken: reg.qrToken || generateQrToken(),
    amountPaid: amount,
  })

  if (reg.status !== 'pending') {
    await db.collection('events').doc(params.eventId).update({
      currentAttendees: FieldValue.increment(1),
      totalRevenue: FieldValue.increment(amount),
      pbRevenue: FieldValue.increment(reg.pbCut || 0),
      businessRevenue: FieldValue.increment(reg.businessCut || 0),
      updatedAt: Timestamp.now(),
    })
    const ticketTypeId = params.ticketTypeId || (reg.ticketTypeId as string) || ''
    if (ticketTypeId && ticketTypeId !== 'legacy') {
      await incrementTicketSold(params.eventId, ticketTypeId)
    }
    const couponCode = params.couponCode || (reg.couponCode as string) || ''
    if (couponCode) {
      await incrementCouponUsed(params.eventId, couponCode)
    }
  }

  const userId = params.userId || (reg.userId as string) || ''
  if (amount > 0 && userId) {
    void recordReferralConversion({
      convertedUserId: userId,
      conversionType: 'event',
      relatedDocId: params.registrationId,
      revenueAmount: amount,
      status: 'confirmed',
      idempotencyKey: `event-paid:${params.gateway}:${params.paymentReference}`,
    }).catch((err) => console.error('[referral] event paid:', err))
  }

  const email = (reg.userEmail as string) || ''
  if (email) {
    const eventSnap = await db.collection('events').doc(params.eventId).get()
    const title = (eventSnap.data()?.title as string) || 'Event'
    const updated = (await regRef.get()).data()
    const { sendEventRegistrationEmail } = await import('@/lib/event-confirmation-email')
    void sendEventRegistrationEmail({
      to: email,
      eventTitle: title,
      eventUrl: confirmationUrl,
      status: String(updated?.status || 'confirmed'),
      checkInCode: (updated?.checkInCode as string) || null,
    })
  }

  return { alreadyPaid: false, confirmationUrl }
}

function addBillingPeriod(from: Date, billingPeriod: string): Date {
  const d = new Date(from)
  if (billingPeriod === 'yearly') {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  return d
}

/** Activate membership on the user after a successful PayPal/Ziina (or manual) payment. */
export async function completeMembershipPayment(params: {
  userId: string
  planId: string
  gateway: 'stripe' | 'paypal' | 'ziina'
  paymentReference: string
  amountCents?: number
  currency?: string
}): Promise<{ membershipUrl: string }> {
  const db = getAdminDb()
  const planSnap = await db.collection('pricingPlans').doc(params.planId).get()
  if (!planSnap.exists) throw new Error('Plan not found')
  const plan = planSnap.data()!
  const now = new Date()
  const renewDate = addBillingPeriod(now, String(plan.billingPeriod || 'monthly'))
  const amountCents =
    typeof params.amountCents === 'number' ? params.amountCents : Number(plan.price) || 0
  const currency = (params.currency || plan.currency || 'AED').toString().toUpperCase()

  await db.collection('users').doc(params.userId).set(
    {
      membershipPlanId: params.planId,
      membershipPlanName: plan.name || params.planId,
      membershipTier: params.planId,
      membershipStatus: 'active',
      membershipRenewDate: renewDate.toISOString(),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )

  await db.collection('subscriptions').doc(params.paymentReference).set(
    {
      userId: params.userId,
      planId: params.planId,
      gateway: params.gateway,
      paymentReference: params.paymentReference,
      amount: amountCents / 100,
      currency: currency.toLowerCase(),
      interval: plan.billingPeriod === 'yearly' ? 'year' : 'month',
      status: 'active',
      currentPeriodStart: Timestamp.fromDate(now),
      currentPeriodEnd: Timestamp.fromDate(renewDate),
      nextBillingDate: Timestamp.fromDate(renewDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )

  const sessions = await db
    .collection('checkoutSessions')
    .where('userId', '==', params.userId)
    .where('planId', '==', params.planId)
    .where('status', '==', 'pending')
    .limit(10)
    .get()
  for (const doc of sessions.docs) {
    await doc.ref.update({
      status: 'completed',
      paymentReference: params.paymentReference,
      completedAt: Timestamp.now(),
    })
  }

  if (amountCents > 0) {
    void recordReferralConversion({
      convertedUserId: params.userId,
      conversionType: 'membership',
      relatedDocId: params.planId,
      revenueAmount: amountCents / 100,
      status: 'confirmed',
      idempotencyKey: `membership:${params.gateway}:${params.paymentReference}`,
    }).catch((err) => console.error('[referral] membership conversion:', err))
  }

  const membershipUrl = `${getPublicAppUrl()}/dashboard/membership?status=success`
  const planName = String(plan.name || params.planId)
  sendBrandedEmailToUserSafe({
    userId: params.userId,
    subject: `Welcome — ${planName} membership activated`,
    purpose: 'Membership activation confirmation',
    headline: 'Membership activated',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `Your ${planName} membership is now active. Thank you for joining Passive Blessings.`,
      'You can manage your plan anytime from your member dashboard.'
    ),
    cta: { label: 'Open membership', url: membershipUrl },
  })

  return { membershipUrl }
}
