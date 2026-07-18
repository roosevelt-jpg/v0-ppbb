/**
 * Gmail SMTP Email Service
 * Sends emails via Gmail using Nodemailer
 */

import nodemailer from 'nodemailer'
import { SiteSettings } from './types'
import { getAdminDb } from '@/lib/firebase-admin'
import { mergeGlobalSettings } from '@/lib/global-settings'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import {
  emailParagraphs,
  escapeEmailHtml,
  renderSimpleEmailHtml,
} from '@/lib/email-template'

function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

/**
 * Load Gmail SMTP credentials from Integrations vault (decrypted)
 * with optional env fallback.
 */
export async function getGmailSmtpConfig(): Promise<{
  gmailEmail: string
  gmailAppPassword: string
  fromName: string
} | null> {
  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'gmailSmtp')
    const email = integration?.credentials?.gmailEmail?.trim()
    const appPassword = integration?.credentials?.gmailAppPassword?.trim()
    if (email && appPassword) {
      console.log('[v0] Loaded decrypted Gmail SMTP from integrations vault')
      return {
        gmailEmail: email,
        gmailAppPassword: appPassword,
        fromName: integration.credentials.fromName?.trim() || 'Passive Blessings',
      }
    }
    console.warn('[v0] Gmail SMTP integration missing email or app password')
  } catch (error) {
    console.error(
      '[v0] Failed to load Gmail SMTP from integrations:',
      error instanceof Error ? error.message : String(error)
    )
  }

  const envEmail = process.env.GMAIL_USER?.trim() || process.env.GMAIL_EMAIL?.trim()
  const envPassword = process.env.GMAIL_APP_PASSWORD?.trim()
  if (envEmail && envPassword) {
    console.log('[v0] Using Gmail SMTP from environment variables')
    return {
      gmailEmail: envEmail,
      gmailAppPassword: envPassword,
      fromName: process.env.GMAIL_FROM_NAME?.trim() || 'Passive Blessings',
    }
  }

  return null
}

/**
 * Create Nodemailer transporter with Gmail credentials
 */
export const createGmailTransporter = (emailConfig?: SiteSettings['emailConfig']) => {
  if (!emailConfig?.enabled || !emailConfig.gmailEmail || !emailConfig.gmailAppPassword) {
    console.warn('[v0] Gmail email config not properly configured:', {
      enabled: emailConfig?.enabled,
      hasEmail: !!emailConfig?.gmailEmail,
      hasPassword: !!emailConfig?.gmailAppPassword,
    })
    return null
  }

  try {
    console.log('[v0] Creating Gmail transporter with:', {
      email: emailConfig.gmailEmail,
      hasAppPassword: !!emailConfig.gmailAppPassword,
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.gmailEmail,
        pass: emailConfig.gmailAppPassword,
      },
    })

    console.log('[v0] Gmail transporter created successfully')
    return transporter
  } catch (error) {
    console.error('[v0] Failed to create Gmail transporter:', {
      error: error instanceof Error ? error.message : String(error),
      email: emailConfig.gmailEmail,
    })
    return null
  }
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

/** Dark logo for light email backgrounds — reads platformConfig/globalSettings.logoUrlDark */
export async function getEmailBrandLogoUrl(): Promise<string> {
  const site = getPublicSiteUrl()
  try {
    const db = getAdminDb()
    const snap = await db.collection('platformConfig').doc('globalSettings').get()
    const settings = mergeGlobalSettings(snap.data() as Record<string, unknown> | undefined)
    if (settings.logoUrlDark) {
      const logo = settings.logoUrlDark.trim()
      if (/^https?:\/\//i.test(logo)) return logo
      return `${site}${logo.startsWith('/') ? '' : '/'}${logo}`
    }
  } catch (error) {
    console.warn(
      '[v0] Failed to load email logo from Firestore:',
      error instanceof Error ? error.message : String(error)
    )
  }
  return `${site}/images/pb-logo-black.png`
}

export const sendAdminInviteEmail = async (
  transporter: ReturnType<typeof createGmailTransporter>,
  gmailEmail: string,
  details: AdminInviteDetails
) => {
  if (!transporter) {
    throw new Error('Gmail transporter not available')
  }

  const logoUrl = await getEmailBrandLogoUrl()
  const roleLabel = formatInviteRoleLabel(details.role)
  const greeting = `Hi ${details.adminName},`
  const bodyHtml = emailParagraphs(
    `You've been invited to join Passive Blessings as ${roleLabel}.`,
    `Your 6-digit access code is ${details.accessCode}.`,
    `Complete setup here: ${details.setupUrl}`,
    `This code expires ${details.expiresAt.toLocaleString()}.`
  )

  const html = renderSimpleEmailHtml({
    logoUrl,
    greeting,
    bodyHtml,
    purpose: 'Admin invitation',
    cta: { label: 'Go to Setup', url: details.setupUrl },
  })

  const text = [
    greeting,
    '',
    `You've been invited to join Passive Blessings as ${roleLabel}.`,
    `Your 6-digit access code is ${details.accessCode}.`,
    `Complete setup here: ${details.setupUrl}`,
    `This code expires ${details.expiresAt.toLocaleString()}.`,
    '',
    'Admin invitation',
    'PB Admin',
  ].join('\n')

  try {
    const mailOptions = {
      from: `"${details.fromName || 'Passive Blessings'}" <${gmailEmail}>`,
      to: details.adminEmail,
      subject: `Admin invite — ${roleLabel}`,
      html,
      text,
    }

    console.log('[v0] Sending admin invite email with config:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      transporterExists: !!transporter,
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('[v0] Admin invite email sent successfully:', {
      messageId: info.messageId,
      to: details.adminEmail,
      timestamp: new Date().toISOString(),
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[v0] Failed to send admin invite email:', {
      error: error instanceof Error ? error.message : String(error),
      to: details.adminEmail,
      from: gmailEmail,
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

/**
 * Full invite send: load vault credentials → transporter → branded email.
 */
export async function dispatchAdminInviteEmail(
  details: Omit<AdminInviteDetails, 'setupUrl' | 'fromName'> & {
    setupUrl?: string
    fromName?: string
  }
): Promise<{ success: true; messageId?: string }> {
  const gmailConfig = await getGmailSmtpConfig()
  if (!gmailConfig) {
    throw new Error(
      'Email service not configured. Please configure Gmail SMTP in Admin → Integrations.'
    )
  }

  const transporter = createGmailTransporter({
    enabled: true,
    gmailEmail: gmailConfig.gmailEmail,
    gmailAppPassword: gmailConfig.gmailAppPassword,
  } as SiteSettings['emailConfig'])

  if (!transporter) {
    throw new Error('Failed to initialize Gmail SMTP. Check your Gmail App Password.')
  }

  const setupUrl = details.setupUrl || `${getPublicSiteUrl()}/admin/setup`
  return sendAdminInviteEmail(transporter, gmailConfig.gmailEmail, {
    ...details,
    setupUrl,
    fromName: details.fromName || gmailConfig.fromName,
  })
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
  transporter: ReturnType<typeof createGmailTransporter>,
  gmailEmail: string,
  details: CertificateMilestoneEmailDetails
): Promise<{ success: boolean; messageId?: string }> {
  if (!transporter) {
    throw new Error('Email transporter not configured')
  }

  const paragraphs = details.bodyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 10px 0;line-height:1.55;color:#333;">${escapeEmailHtml(p)}</p>`)
    .join('')

  const logoUrl = await getEmailBrandLogoUrl()
  const html = renderSimpleEmailHtml({
    logoUrl,
    greeting: `Hi ${details.memberName},`,
    bodyHtml:
      paragraphs +
      `<p style="margin:0 0 10px 0;">${escapeEmailHtml(details.certificateTitle)} · ${details.hours} volunteer hours.</p>`,
    purpose: 'Certificate milestone',
  })

  const info = await transporter.sendMail({
    from: `"${details.fromName || 'Passive Blessings'}" <${gmailEmail}>`,
    to: details.to,
    subject: details.subject,
    html,
    text: details.bodyText,
  })

  return { success: true, messageId: info.messageId }
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
  const gmailConfig = await getGmailSmtpConfig()
  if (!gmailConfig) {
    throw new Error(
      'Email service not configured. Please configure Gmail SMTP in Admin → Integrations.'
    )
  }

  const transporter = createGmailTransporter({
    enabled: true,
    gmailEmail: gmailConfig.gmailEmail,
    gmailAppPassword: gmailConfig.gmailAppPassword,
  } as SiteSettings['emailConfig'])

  if (!transporter) {
    throw new Error('Failed to initialize Gmail SMTP. Check your Gmail App Password.')
  }

  const logoUrl = await getEmailBrandLogoUrl()
  const name = details.adminName?.trim() || 'there'
  const loginUrl = `${getPublicSiteUrl()}/admin/login`
  const subject = 'Reset your Passive Blessings admin password'
  const greeting = `Hi ${name},`
  const text = `${greeting}

A super admin requested a password reset for your admin account.

Choose a new password: ${details.resetLink}

Then sign in at: ${loginUrl}

Password reset
PB Admin`

  const html = renderSimpleEmailHtml({
    logoUrl,
    greeting,
    bodyHtml: emailParagraphs(
      'A super admin requested a password reset for your admin account.',
      `Then sign in at: ${loginUrl}`
    ),
    purpose: 'Password reset',
    cta: { label: 'Choose a new password', url: details.resetLink },
  })

  const info = await transporter.sendMail({
    from: `"${gmailConfig.fromName || 'Passive Blessings'}" <${gmailConfig.gmailEmail}>`,
    to: details.to,
    subject,
    html,
    text,
  })

  return { success: true, messageId: info.messageId }
}

/**
 * Verify Gmail credentials are valid
 */
export const verifyGmailCredentials = async (
  transporter: ReturnType<typeof createGmailTransporter>
): Promise<boolean> => {
  if (!transporter) {
    return false
  }

  try {
    await transporter.verify()
    console.log('[v0] Gmail credentials verified successfully')
    return true
  } catch (error) {
    console.error('[v0] Gmail credentials verification failed:', error)
    return false
  }
}
