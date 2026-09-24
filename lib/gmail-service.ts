/**
 * Legacy email helpers (admin invite / password reset / certificate).
 * All sends go through Zoho Mail SMTP via platform-email / zoho-mail-service.
 * Gmail SMTP is disabled — do not use getGmailSmtpConfig for sending.
 */

import type { SiteSettings } from './types'
import { getSiteUrl } from '@/lib/site-metadata'
import { createZohoTransporter, getZohoSmtpConfig } from '@/lib/zoho-mail-service'
import { DEFAULT_MAIL_FROM_NAME } from '@/lib/mail-identity'

function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

/**
 * @deprecated Gmail SMTP is disabled. Always returns null.
 * Kept so Integrations vault UI / old imports do not break.
 */
export async function getGmailSmtpConfig(): Promise<{
  gmailEmail: string
  gmailAppPassword: string
  fromName: string
} | null> {
  return null
}

/**
 * @deprecated Gmail SMTP is disabled. Always returns null.
 */
export const createGmailTransporter = (_emailConfig?: SiteSettings['emailConfig']) => {
  console.warn('[email] Gmail SMTP is disabled — use Zoho Mail SMTP')
  return null
}

/**
 * Send admin invitation email with comprehensive details
 */
export interface AdminInviteDetails {
  adminName: string
  adminEmail: string
  role: string
  permissions: string[]
  accessCode: string
  expiresAt: Date
  setupUrl: string
  fromName?: string
  invitedBy?: {
    name: string
    roleLabel: string
    profilePictureURL?: string | null
    initials: string
  }
}

function formatInviteRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    founder_admin: 'Founder Admin',
    manager: 'Manager',
    welfare: 'Welfare',
    founder: 'Founder',
    coordinator: 'Coordinator',
    moderator: 'Moderator',
  }
  return labels[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Dark logo artwork for light (white) email backgrounds.
 *
 * This intentionally always returns the built-in brand asset rather than
 * reading platformConfig/globalSettings.logoUrlDark from Firestore: that
 * field has no admin UI of its own — the only thing that ever writes it is
 * the legacy one-shot "Migrate Global Settings" button, which copies over
 * whatever was in the old, pre-migration siteSettings/branding.darkLogoUrl.
 * The site's own header/footer <Logo> component (lib/logo-manager.ts)
 * already stopped trusting that same legacy value for looking worse than
 * the original mark — this mirrors that decision so invite/notification
 * emails don't end up rendering a stale or broken logo URL.
 */
export async function getEmailBrandLogoUrl(): Promise<string> {
  // Prefer same-origin icon so inbox clients don't block a third-party blob host.
  return `${getSiteUrl()}/api/pwa-icon?size=192`
}

/**
 * @deprecated Prefer dispatchAdminInviteEmail (Zoho). Kept for call sites that pass a transporter.
 */
export const sendAdminInviteEmail = async (
  _transporter: ReturnType<typeof createGmailTransporter>,
  _gmailEmail: string,
  details: AdminInviteDetails
) => {
  return dispatchAdminInviteEmail(details)
}

/**
 * Full invite send via Zoho Mail SMTP.
 */
export async function dispatchAdminInviteEmail(
  details: Omit<AdminInviteDetails, 'setupUrl' | 'fromName'> & {
    setupUrl?: string
    fromName?: string
  }
): Promise<{ success: true; messageId?: string }> {
  const { paragraphs, sendBrandedEmail } = await import('@/lib/platform-email')
  const setupUrl = details.setupUrl || `${getPublicSiteUrl()}/admin/setup`
  const roleLabel = formatInviteRoleLabel(details.role)
  const result = await sendBrandedEmail({
    to: details.adminEmail,
    subject: `Admin invite — ${roleLabel}`,
    purpose: 'Admin invitation',
    greeting: `Hi ${details.adminName},`,
    bodyHtml: paragraphs(
      `You've been invited to join Passive Blessings as ${roleLabel}.`,
      `Your 6-digit access code is ${details.accessCode}.`,
      `Complete setup here: ${setupUrl}`,
      `This code expires ${details.expiresAt.toLocaleString()}.`
    ),
    cta: { label: 'Go to Setup', url: setupUrl },
  })

  if (!result.ok) {
    throw new Error(
      result.error ||
        'Email service not configured. Please configure Zoho Mail SMTP in Admin → Integrations.'
    )
  }

  return { success: true }
}

/**
 * Certificate milestone congratulations email
 */
export interface CertificateMilestoneEmailDetails {
  to: string
  memberName: string
  subject: string
  bodyText: string
  certificateTitle: string
  hours: number
  fromName?: string
}

export async function sendCertificateMilestoneEmail(
  _transporter: ReturnType<typeof createGmailTransporter>,
  _gmailEmail: string,
  details: CertificateMilestoneEmailDetails
): Promise<{ success: boolean; messageId?: string }> {
  const { paragraphs, sendBrandedEmail } = await import('@/lib/platform-email')
  const bodyLines = details.bodyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const result = await sendBrandedEmail({
    to: details.to,
    subject: details.subject,
    purpose: 'Certificate milestone',
    greeting: `Hi ${details.memberName},`,
    bodyHtml:
      paragraphs(...bodyLines) +
      paragraphs(`${details.certificateTitle} · ${details.hours} volunteer hours.`),
  })
  if (!result.ok) {
    throw new Error(result.error || 'Failed to send certificate email via Zoho Mail SMTP')
  }
  return { success: true }
}

/**
 * Send a password-reset email with an Admin SDK–generated link (super-admin flow).
 */
export async function dispatchAdminPasswordResetEmail(details: {
  to: string
  adminName?: string
  resetLink: string
  requestedBy?: {
    name: string
    roleLabel: string
    profilePictureURL?: string | null
    initials: string
  }
}): Promise<{ success: true; messageId?: string }> {
  const { paragraphs, sendBrandedEmail } = await import('@/lib/platform-email')
  const name = details.adminName?.trim() || 'there'
  const loginUrl = `${getPublicSiteUrl()}/admin/login`
  const result = await sendBrandedEmail({
    to: details.to,
    subject: 'Reset your Passive Blessings admin password',
    purpose: 'Password reset',
    greeting: `Hi ${name},`,
    bodyHtml: paragraphs(
      'A super admin requested a password reset for your admin account.',
      `Then sign in at: ${loginUrl}`
    ),
    cta: { label: 'Choose a new password', url: details.resetLink },
  })

  if (!result.ok) {
    throw new Error(
      result.error ||
        'Email service not configured. Please configure Zoho Mail SMTP in Admin → Integrations.'
    )
  }

  return { success: true }
}

/**
 * Low-level Zoho send for callers that need a raw HTML payload (e.g. contact reply).
 */
export async function sendRawZohoEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}): Promise<{ success: true }> {
  const config = await getZohoSmtpConfig()
  if (!config) {
    throw new Error(
      'Email service not configured. Please configure Zoho Mail SMTP in Admin → Integrations.'
    )
  }

  const transporter = createZohoTransporter(config)
  await transporter.sendMail({
    from: `"${config.fromName || DEFAULT_MAIL_FROM_NAME}" <${config.email}>`,
    replyTo: opts.replyTo || config.email,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
  return { success: true }
}

/**
 * @deprecated Gmail verification is disabled.
 */
export const verifyGmailCredentials = async (
  _transporter: ReturnType<typeof createGmailTransporter>
): Promise<boolean> => {
  return false
}
