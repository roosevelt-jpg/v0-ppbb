import type Stripe from 'stripe'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { recordReferralConversion } from '@/lib/referral-conversion-server'
import {
  generateCheckInCode,
  generateQrToken,
  incrementCouponUsed,
  incrementTicketSold,
} from '@/lib/event-luma-server'

import { getSiteUrl } from '@/lib/site-metadata'

export function getPublicAppUrl(): string {
  return getSiteUrl()
}

/**
 * Get or create the Stripe Customer for this user, reusing it across every
 * future subscription instead of creating a new one each time.
 */
async function getOrCreateStripeCustomer(
  stripe: Stripe,
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<string> {
  const userSnap = await db.collection('users').doc(userId).get()
  const userData = userSnap.data() || {}
  const existingId = userData.stripeCustomerId as string | undefined

  if (existingId) {
    const exists = await stripe.customers.retrieve(existingId).then(
      (c) => !c.deleted,
      () => false
    )
    if (exists) return existingId
  }

  const customer = await stripe.customers.create({
    email: (userData.email as string) || undefined,
    name: [userData.firstName, userData.lastName].filter(Boolean).join(' ') || undefined,
    metadata: { userId },
  })
  await db.collection('users').doc(userId).set({ stripeCustomerId: customer.id }, { merge: true })
  return customer.id
}

/**
 * Create a Stripe Subscription in `default_incomplete` mode and return the
 * client secret for whichever intent it produced — a card is collected via
 * an embedded Stripe Elements form on our own page (never a redirect to a
 * Stripe-hosted page). Shared by the plain signup/dashboard checkout path
 * and the trial-promo redemption path, so both get the same self-healing
 * product/price resolution.
 *
 * With a trial (trialDays set), the subscription has nothing to charge
 * immediately — Stripe produces a `pending_setup_intent` instead, just to
 * save the card for later. Without a trial, it produces a real
 * `latest_invoice.payment_intent` for the first charge. Either way the
 * frontend confirms the same way: stripe.confirmPayment / confirmSetup
 * with `redirect: 'if_required'`, which only pops an in-page 3DS modal
 * when the card's bank actually requires one, and otherwise never
 * navigates away from our own page at all.
 */
export async function createStripeMembershipIntent(params: {
  planId: string
  userId: string
  trialDays?: number
  extraMetadata?: Record<string, string>
}): Promise<{ clientSecret: string; mode: 'payment' | 'setup'; subscriptionId: string }> {
  const { getStripeClient } = await import('@/lib/get-stripe-client')
  const stripe = await getStripeClient()
  const db = getAdminDb()

  const planSnap = await db.collection('pricingPlans').doc(params.planId).get()
  if (!planSnap.exists) throw new Error('Plan not found')
  const plan = planSnap.data() as Record<string, unknown>

  let productId = plan.stripeProductId as string | undefined
  if (productId) {
    const exists = await stripe.products.retrieve(productId).then(
      () => true,
      () => false
    )
    if (!exists) productId = undefined
  }
  if (!productId) {
    const product = await stripe.products.create({
      name: String(plan.name || 'Membership'),
      description: String(plan.description || ''),
      metadata: { planId: params.planId },
    })
    productId = product.id
    await db.collection('pricingPlans').doc(params.planId).update({ stripeProductId: productId })
  }

  let priceId = productId === plan.stripeProductId ? (plan.stripePriceId as string | undefined) : undefined
  if (priceId) {
    const exists = await stripe.prices.retrieve(priceId).then(
      () => true,
      () => false
    )
    if (!exists) priceId = undefined
  }
  if (!priceId) {
    const price = await stripe.prices.create({
      unit_amount: Number(plan.price) || 0,
      currency: String(plan.currency || 'aed').toLowerCase(),
      recurring: {
        interval: plan.billingPeriod === 'yearly' ? 'year' : 'month',
      },
      product: productId,
    })
    priceId = price.id
    await db.collection('pricingPlans').doc(params.planId).update({ stripePriceId: priceId })
  }

  const customerId = await getOrCreateStripeCustomer(stripe, db, params.userId)

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      payment_method_types: ['card'],
    },
    trial_period_days: params.trialDays && params.trialDays > 0 ? params.trialDays : undefined,
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
    metadata: {
      type: 'membership',
      userId: params.userId,
      planId: params.planId,
      ...(params.extraMetadata || {}),
    },
  })

  const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null
  const paymentIntent = (subscription.latest_invoice as Stripe.Invoice | null)
    ?.payment_intent as Stripe.PaymentIntent | null | undefined

  const clientSecret = setupIntent?.client_secret || paymentIntent?.client_secret
  if (!clientSecret) {
    throw new Error('Stripe did not return a client secret for this subscription')
  }

  return {
    clientSecret,
    mode: setupIntent ? 'setup' : 'payment',
    subscriptionId: subscription.id,
  }
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

function addMonths(from: Date, months: number): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + Math.max(1, Math.floor(months)))
  return d
}

/** Keep portal role aligned with the pricing plan (Individual → member, Business → business). */
function portalFieldsFromPlan(
  plan: { name?: unknown },
  existing: Record<string, unknown>
): Record<string, unknown> {
  const name = String(plan.name || '').toLowerCase()
  const isBusiness =
    name.includes('business') ||
    name.includes('partner') ||
    name.includes('corporate') ||
    name.includes('company')

  const roles = new Set<string>()
  if (typeof existing.role === 'string' && existing.role) roles.add(existing.role)
  if (Array.isArray(existing.roles)) {
    for (const r of existing.roles) {
      if (typeof r === 'string' && r) roles.add(r)
    }
  }

  if (isBusiness) {
    roles.add('member')
    roles.add('business')
    return {
      role: 'business',
      roles: Array.from(roles),
      userType: 'business',
      hasBusinessProfile: true,
    }
  }

  roles.add('member')
  // Don't demote admins; only set primary role when it's a basic account
  const primary = String(existing.role || '')
  const keepPrimary =
    primary === 'admin' ||
    primary === 'super_admin' ||
    primary === 'business' ||
    primary === 'sponsor'
  return {
    role: keepPrimary ? primary || 'member' : 'member',
    roles: Array.from(roles),
    userType: keepPrimary && primary === 'business' ? 'business' : 'member',
  }
}

/**
 * Look up the `checkoutSessions` doc created server-side when a PayPal/Ziina
 * membership checkout was initiated, and atomically mark it consumed.
 *
 * The return-URL handlers for PayPal and Ziina only get an untrusted query
 * string back from the browser — a visitor can freely rewrite `userId` or
 * `planId` in that URL while keeping their own genuinely-completed payment
 * reference, which would otherwise let a real (but cheap) payment activate
 * an arbitrary, more expensive plan. It would also let the same return URL
 * be replayed indefinitely to keep pushing the renewal date forward with no
 * new payment. This resolves the real userId/planId from the record created
 * at checkout time (not client-suppliable) and fails once that record has
 * already been consumed once, closing both gaps.
 */
export async function consumeMembershipCheckoutSession(
  gateway: 'paypal' | 'ziina',
  matchField: 'subscriptionId' | 'transactionId',
  matchValue: string
): Promise<{ userId: string; planId: string }> {
  const db = getAdminDb()
  const snap = await db
    .collection('checkoutSessions')
    .where('gateway', '==', gateway)
    .where(matchField, '==', matchValue)
    .limit(1)
    .get()

  if (snap.empty) {
    throw new Error('Checkout session not found')
  }

  const sessionRef = snap.docs[0].ref
  return db.runTransaction(async (tx) => {
    const fresh = await tx.get(sessionRef)
    const session = fresh.data() || {}
    if (session.status !== 'pending') {
      throw new Error('This payment has already been processed')
    }

    const userId = String(session.userId || '')
    const planId = String(session.planId || '')
    if (!userId || !planId) {
      throw new Error('Checkout session is missing userId/planId')
    }

    tx.update(sessionRef, { status: 'completed', completedAt: Timestamp.now() })
    return { userId, planId }
  })
}

/** Activate membership on the user after a successful PayPal/Ziina (or manual/promo) payment. */
export async function completeMembershipPayment(params: {
  userId: string
  planId: string
  gateway: 'stripe' | 'paypal' | 'ziina' | 'promo' | 'admin_grant'
  paymentReference: string
  amountCents?: number
  currency?: string
  /** When set (promo grants), overrides plan billing period for renew/period end */
  benefitDurationMonths?: number
  promoCodeId?: string
  promoCode?: string
  /**
   * Stripe's own current_period_end (or trial_end) for this subscription,
   * when available — takes priority over benefitDurationMonths/billing-
   * period math below. This matters most for a trial checkout: without it,
   * renewDate would be set to "one plan billing period from now" at the
   * moment checkout completes (day 0 of the trial), not the actual trial
   * end Stripe is tracking — membership-expire would then downgrade the
   * member mid-trial, before Stripe has attempted to charge them at all.
   */
  renewDateOverride?: Date
}): Promise<{ membershipUrl: string }> {
  const db = getAdminDb()
  const planSnap = await db.collection('pricingPlans').doc(params.planId).get()
  if (!planSnap.exists) throw new Error('Plan not found')
  const plan = planSnap.data()!
  const userSnap = await db.collection('users').doc(params.userId).get()
  const existingUser = (userSnap.data() || {}) as Record<string, unknown>
  const now = new Date()
  const isLifetimePromo =
    params.gateway === 'promo' &&
    typeof params.benefitDurationMonths === 'number' &&
    params.benefitDurationMonths === 0
  const renewDate = isLifetimePromo
    ? new Date('9999-12-31T23:59:59.000Z')
    : params.renewDateOverride
      ? params.renewDateOverride
      : typeof params.benefitDurationMonths === 'number' && params.benefitDurationMonths > 0
        ? addMonths(now, params.benefitDurationMonths)
        : addBillingPeriod(now, String(plan.billingPeriod || 'monthly'))
  const amountCents =
    typeof params.amountCents === 'number' ? params.amountCents : Number(plan.price) || 0
  const currency = (params.currency || plan.currency || 'AED').toString().toUpperCase()

  await db.collection('users').doc(params.userId).set(
    {
      membershipPlanId: params.planId,
      membershipPlanName: plan.name || params.planId,
      membershipTier: params.planId,
      membershipStatus: 'active',
      membershipRenewDate: isLifetimePromo ? null : renewDate.toISOString(),
      membershipLifetimeForever: isLifetimePromo ? true : FieldValue.delete(),
      membershipExpiredAt: FieldValue.delete(),
      // Portal access follows the pricing plan (not a hardcoded role alone)
      ...portalFieldsFromPlan(plan, existingUser),
      ...(params.promoCodeId
        ? {
            membershipPromoCodeId: params.promoCodeId,
            membershipPromoCode: params.promoCode || null,
          }
        : {}),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )

  const portal = portalFieldsFromPlan(plan, existingUser)
  if (portal.role === 'business') {
    const bizName =
      String(
        (existingUser.business as { name?: string } | undefined)?.name ||
          existingUser.businessName ||
          existingUser.companyName ||
          [existingUser.firstName, existingUser.lastName].filter(Boolean).join(' ') ||
          'Business account'
      ).trim() || 'Business account'
    await db.collection('businessProfiles').doc(params.userId).set(
      {
        id: params.userId,
        businessName: bizName,
        membership: 'partner',
        active: true,
        updatedAt: now,
        createdAt: existingUser.createdAt || now,
      },
      { merge: true }
    )
    await db.collection('businesses').doc(params.userId).set(
      {
        name: bizName,
        businessName: bizName,
        ownerId: params.userId,
        userId: params.userId,
        email: existingUser.email || '',
        isApproved: true,
        isActive: true,
        isVerified: true,
        status: 'approved',
        updatedAt: now,
        createdAt: existingUser.createdAt || now,
      },
      { merge: true }
    )
  }

  await db.collection('subscriptions').doc(params.paymentReference).set(
    {
      userId: params.userId,
      planId: params.planId,
      gateway: params.gateway,
      paymentReference: params.paymentReference,
      amount: amountCents / 100,
      currency: currency.toLowerCase(),
      interval: isLifetimePromo
        ? 'lifetime'
        : typeof params.benefitDurationMonths === 'number' && params.benefitDurationMonths > 0
          ? 'promo'
          : plan.billingPeriod === 'yearly'
            ? 'year'
            : 'month',
      status: 'active',
      currentPeriodStart: Timestamp.fromDate(now),
      currentPeriodEnd: Timestamp.fromDate(renewDate),
      nextBillingDate: isLifetimePromo ? null : Timestamp.fromDate(renewDate),
      cancelAtPeriodEnd: false,
      ...(params.promoCodeId
        ? {
            promoCodeId: params.promoCodeId,
            promoCode: params.promoCode || null,
            benefitDurationMonths: params.benefitDurationMonths ?? null,
            lifetime: isLifetimePromo,
          }
        : {}),
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
  const isPromo = params.gateway === 'promo'
  const prevPlanId = String(existingUser.membershipPlanId || existingUser.membershipTier || '').trim()
  const wasActive = String(existingUser.membershipStatus || '').toLowerCase() === 'active'
  const isUpgrade =
    wasActive &&
    Boolean(prevPlanId) &&
    prevPlanId !== params.planId &&
    params.gateway !== 'promo'

  void import('@/lib/member-notifications')
    .then(({ notifyMembershipActivated }) => {
      notifyMembershipActivated({
        userId: params.userId,
        planName,
        renewDate: isLifetimePromo ? null : renewDate,
        isPromo,
        isLifetime: isLifetimePromo,
        isUpgrade,
        previousPlanName: isUpgrade
          ? String(existingUser.membershipPlanName || prevPlanId || '')
          : null,
      })
    })
    .catch((err) => console.error('[payment-completion] membership email:', err))

  return { membershipUrl }
}
