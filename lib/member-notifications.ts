/**
 * Branded member lifecycle emails (auth + membership).
 * All go through sendBrandedEmail / sendBrandedEmailToUser (centered logo).
 *
 * Avoid top-level `firebase-admin/auth` — it can crash Next serverless bundles
 * at module load (same pattern as admin-access-server).
 */

import { getAdminDb } from '@/lib/firebase-admin'
import {
  paragraphs,
  sendBrandedEmail,
  sendBrandedEmailToUser,
  sendBrandedEmailToUserSafe,
} from '@/lib/platform-email'

async function getAdminAuth() {
  const { getAuth } = await import('firebase-admin/auth')
  const { getAdminApp } = await import('@/lib/firebase-admin')
  return getAuth(getAdminApp())
}

export function memberSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

function membershipDashboardUrl(): string {
  return `${memberSiteUrl()}/dashboard/membership`
}

/** Sign-in security alert (every successful login). */
export async function sendLoginAlertEmail(opts: {
  userId: string
  email?: string
  method?: string
  userAgent?: string
  ip?: string
}): Promise<{ ok: boolean; error?: string }> {
  const when = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const method = opts.method?.trim() || 'email/password'
  const device = opts.userAgent?.trim()
    ? opts.userAgent.trim().slice(0, 180)
    : 'Unknown device'
  const ipLine = opts.ip?.trim() ? `Approximate IP: ${opts.ip.trim()}.` : ''

  return sendBrandedEmailToUser({
    userId: opts.userId,
    subject: 'New sign-in to your Passive Blessings account',
    purpose: 'Sign-in security notification',
    department: 'security',
    headline: 'New sign-in detected',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `Someone just signed in to your Passive Blessings account (${method}) on ${when}.`,
      `Device: ${device}.`,
      ipLine,
      'If this was you, no action is needed. If you did not sign in, reset your password immediately and contact PB Admin.'
    ),
    cta: { label: 'Reset password', url: `${memberSiteUrl()}/forgot-password` },
    respectPreference: false,
  })
}

/** Email verification link for newly created accounts. */
export async function sendEmailVerificationBranded(opts: {
  email: string
  firstName?: string
}): Promise<{ ok: boolean; error?: string }> {
  const email = String(opts.email || '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) return { ok: false, error: 'Invalid email' }

  try {
    const auth = await getAdminAuth()
    const link = await auth.generateEmailVerificationLink(email, {
      url: `${memberSiteUrl()}/login`,
      handleCodeInApp: false,
    })
    const name = opts.firstName?.trim()
    const greeting = name ? `Assalamu alaikum, ${name}.` : 'Assalamu alaikum,'

    return sendBrandedEmail({
      to: email,
      subject: 'Verify your Passive Blessings email',
      purpose: 'Email verification',
      department: 'security',
      headline: 'Verify your email',
      bodyHtml: paragraphs(
        greeting,
        'Please verify your email address to secure your Passive Blessings account and receive important membership updates.',
        'This link expires after a limited time. If you did not create an account, you can ignore this message.'
      ),
      cta: { label: 'Verify email', url: link },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[member-notifications] verification email failed:', message)
    return { ok: false, error: message }
  }
}

/** Branded forgot / reset password (replaces Firebase default template). */
export async function sendPasswordResetBranded(opts: {
  email: string
}): Promise<{ ok: boolean; error?: string }> {
  const email = String(opts.email || '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) return { ok: false, error: 'Invalid email' }

  try {
    const auth = await getAdminAuth()
    // Always return success to the client to avoid email enumeration;
    // only send when the Auth user exists.
    try {
      await auth.getUserByEmail(email)
    } catch {
      return { ok: true }
    }

    const link = await auth.generatePasswordResetLink(email, {
      url: `${memberSiteUrl()}/login`,
      handleCodeInApp: false,
    })

    return sendBrandedEmail({
      to: email,
      subject: 'Reset your Passive Blessings password',
      purpose: 'Password reset',
      department: 'security',
      headline: 'Reset your password',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        'We received a request to reset the password for your Passive Blessings account.',
        'Click the link below to choose a new password. If you did not request this, you can safely ignore this email.'
      ),
      cta: { label: 'Reset password', url: link },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[member-notifications] password reset email failed:', message)
    return { ok: false, error: message }
  }
}

export function notifyMembershipActivated(opts: {
  userId: string
  planName: string
  renewDate?: Date | null
  isPromo?: boolean
  isLifetime?: boolean
  isUpgrade?: boolean
  previousPlanName?: string | null
}): void {
  const planName = opts.planName
  const membershipUrl = membershipDashboardUrl()

  if (opts.isUpgrade) {
    sendBrandedEmailToUserSafe({
      userId: opts.userId,
      subject: `Your membership was upgraded to ${planName}`,
      purpose: 'Membership upgrade confirmation',
      department: 'membership',
      headline: 'Membership upgraded',
      bodyHtml: paragraphs(
        'Assalamu alaikum,',
        opts.previousPlanName
          ? `Your Passive Blessings membership has been upgraded from ${opts.previousPlanName} to ${planName}.`
          : `Your Passive Blessings membership has been upgraded to ${planName}.`,
        opts.isLifetime
          ? 'Your upgraded plan is active with no end date.'
          : opts.renewDate
            ? `Your upgraded access continues until ${opts.renewDate.toLocaleDateString()}.`
            : 'Your upgraded plan is now active.',
        'You can review benefits and billing from your membership dashboard.'
      ),
      cta: { label: 'View membership', url: membershipUrl },
    })
    return
  }

  const isPromo = Boolean(opts.isPromo)
  sendBrandedEmailToUserSafe({
    userId: opts.userId,
    subject: isPromo
      ? `Welcome — ${planName} (promo) activated`
      : `Welcome — ${planName} membership activated`,
    purpose: 'Membership activation confirmation',
    department: 'membership',
    headline: 'Membership activated',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      opts.isLifetime
        ? `Your ${planName} membership is now active for free with no end date. Thank you for joining Passive Blessings.`
        : isPromo
          ? `Your ${planName} membership is now active via a promo code. Access continues until ${opts.renewDate?.toLocaleDateString() || 'your promo end date'}.`
          : `Your ${planName} membership is now active. Thank you for joining Passive Blessings.`,
      'You can manage your plan anytime from your member dashboard.'
    ),
    cta: { label: 'Open membership', url: membershipUrl },
  })
}

export function notifyMembershipRenewed(opts: {
  userId: string
  planName?: string
  amount?: number
  currency?: string
  nextBillingDate?: Date | null
}): void {
  const plan = opts.planName || 'your plan'
  const amountLine =
    typeof opts.amount === 'number' && opts.amount > 0
      ? `Amount charged: ${opts.currency || 'AED'} ${opts.amount.toFixed(2)}.`
      : ''
  const nextLine = opts.nextBillingDate
    ? `Your next renewal date is ${opts.nextBillingDate.toLocaleDateString()}.`
    : ''

  sendBrandedEmailToUserSafe({
    userId: opts.userId,
    subject: `Membership renewed — ${plan}`,
    purpose: 'Subscription renewal confirmation',
    department: 'membership',
    headline: 'Membership renewed',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `Your Passive Blessings membership (${plan}) has renewed successfully.`,
      amountLine,
      nextLine,
      'Thank you for staying with the community.'
    ),
    cta: { label: 'Manage membership', url: membershipDashboardUrl() },
  })
}

export function notifyMembershipExpiring(opts: {
  userId: string
  planName?: string
  renewDate: Date
  daysLeft: number
}): void {
  const plan = opts.planName || 'your membership'
  const days =
    opts.daysLeft <= 1
      ? 'tomorrow'
      : `in ${opts.daysLeft} days`

  sendBrandedEmailToUserSafe({
    userId: opts.userId,
    subject: `Your membership expires ${days}`,
    purpose: 'Membership expiry reminder',
    department: 'membership',
    headline: 'Membership expiring soon',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `Your Passive Blessings ${plan} is set to expire on ${opts.renewDate.toLocaleDateString()} (${days}).`,
      'Renew now to keep uninterrupted access to communities, events, and member benefits.',
      'If you already renewed, you can ignore this reminder.'
    ),
    cta: { label: 'Renew membership', url: membershipDashboardUrl() },
  })
}

export function notifyMembershipPaymentFailed(opts: {
  userId: string
  planName?: string
  amount?: number
  currency?: string
  reason?: string
}): void {
  const plan = opts.planName || 'your membership'
  const amountLine =
    typeof opts.amount === 'number' && opts.amount > 0
      ? `Amount due: ${opts.currency || 'AED'} ${opts.amount.toFixed(2)}.`
      : ''
  const reason = opts.reason?.trim()
    ? `Reason: ${opts.reason.trim()}.`
    : ''

  sendBrandedEmailToUserSafe({
    userId: opts.userId,
    subject: 'Action needed — membership payment failed',
    purpose: 'Failed subscription payment',
    department: 'membership',
    headline: 'Payment failed',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `We could not process the renewal payment for ${plan}.`,
      amountLine,
      reason,
      'Please update your payment method or retry payment so your membership stays active.'
    ),
    cta: { label: 'Update membership', url: membershipDashboardUrl() },
  })
}

export function notifyMembershipCancelled(opts: {
  userId: string
  planName?: string
  endsAt?: Date | null
}): void {
  const plan = opts.planName || 'your membership'
  const endLine = opts.endsAt
    ? `Access continues until ${opts.endsAt.toLocaleDateString()} unless restarted earlier.`
    : 'Your subscription will not renew.'

  sendBrandedEmailToUserSafe({
    userId: opts.userId,
    subject: `Subscription cancelled — ${plan}`,
    purpose: 'Subscription cancellation notice',
    department: 'membership',
    headline: 'Subscription cancelled',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `Your Passive Blessings subscription (${plan}) has been cancelled.`,
      endLine,
      'You can restart or choose a new plan anytime from your dashboard.'
    ),
    cta: { label: 'View membership', url: membershipDashboardUrl() },
  })
}

export function notifyMembershipExpired(opts: {
  userId: string
  planName?: string
}): void {
  const plan = opts.planName || 'your membership'

  sendBrandedEmailToUserSafe({
    userId: opts.userId,
    subject: `Your membership has expired — ${plan}`,
    purpose: 'Membership expired',
    department: 'membership',
    headline: 'Membership expired',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      `Your Passive Blessings ${plan} has reached its end date and is no longer active.`,
      'Subscribe again anytime to restore full access to communities, events, and member benefits.'
    ),
    cta: { label: 'Subscribe again', url: membershipDashboardUrl() },
  })
}

/** Resolve userId from a Stripe subscription Firestore doc or customer email. */
export async function resolveUserIdForSubscription(opts: {
  subscriptionId?: string
  email?: string | null
}): Promise<string | null> {
  const db = getAdminDb()
  const subId = String(opts.subscriptionId || '').trim()
  if (subId) {
    const snap = await db.collection('subscriptions').doc(subId).get()
    const uid = String(snap.data()?.userId || '').trim()
    if (uid) return uid
  }
  const email = String(opts.email || '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) return null
  const users = await db.collection('users').where('email', '==', email).limit(1).get()
  return users.docs[0]?.id || null
}
