/**
 * Branded transactional email via Gmail SMTP.
 * Layout: Logo → Greeting → Body → purpose + "PB Admin"
 */

import nodemailer from 'nodemailer'
import { getAdminDb } from '@/lib/firebase-admin'
import { getGmailSmtpConfig, getEmailBrandLogoUrl } from '@/lib/gmail-service'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'
import {
  emailParagraph,
  emailParagraphs,
  escapeEmailHtml,
  renderSimpleEmailHtml,
  type SimpleEmailCta,
} from '@/lib/email-template'

export type BrandedEmailCta = SimpleEmailCta

export type SendBrandedEmailInput = {
  to: string
  subject: string
  /** Short purpose line used in the signature (e.g. "New job application") */
  purpose: string
  /** Optional greeting line, e.g. "Hi Jordan," */
  greeting?: string
  /** @deprecated Prefer greeting + bodyHtml; still rendered as the first body line if set */
  headline?: string
  /** HTML body (paragraphs). Plain text is also fine — wrap in <p> if needed. */
  bodyHtml: string
  cta?: BrandedEmailCta
}

export function renderBrandedEmailHtml(opts: {
  logoUrl: string
  purpose: string
  greeting?: string
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
}): string {
  const bodyParts: string[] = []
  if (opts.headline?.trim()) {
    bodyParts.push(
      `<p style="margin:0 0 10px 0;font-weight:700;color:#111;">${escapeEmailHtml(opts.headline.trim())}</p>`
    )
  }
  bodyParts.push(opts.bodyHtml)

  return renderSimpleEmailHtml({
    logoUrl: opts.logoUrl,
    greeting: opts.greeting,
    bodyHtml: bodyParts.join(''),
    purpose: opts.purpose,
    cta: opts.cta,
  })
}

async function resolveLogoUrl(): Promise<string> {
  try {
    // Prefer the site's own hosted logo (custom logoUrlDark, or the built-in
    // /images/pb-logo-black.png fallback that getEmailBrandLogoUrl() returns).
    // This used to explicitly skip the local fallback in favor of a
    // third-party Vercel Blob Storage URL left over from the original v0
    // project; that external URL is no longer reliably reachable (it showed
    // as a broken image in delivered emails, e.g. the admin login OTP mail),
    // while the self-hosted asset is served from our own production domain.
    const logo = await getEmailBrandLogoUrl()
    if (logo && /^https?:\/\//i.test(logo)) {
      return logo
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_LOGO_ON_LIGHT_BG
}

/**
 * Send a branded platform email via Gmail SMTP.
 * Returns ok:false (does not throw) when SMTP is not configured.
 */
export async function sendBrandedEmail(
  input: SendBrandedEmailInput
): Promise<{ ok: boolean; error?: string }> {
  const to = String(input.to || '').trim().toLowerCase()
  if (!to || !to.includes('@')) {
    return { ok: false, error: 'Invalid recipient' }
  }

  const config = await getGmailSmtpConfig()
  if (!config) {
    console.warn('[platform-email] Gmail SMTP not configured — skipped:', input.subject)
    return { ok: false, error: 'Gmail SMTP not configured' }
  }

  try {
    const logoUrl = await resolveLogoUrl()
    const html = renderBrandedEmailHtml({
      logoUrl,
      purpose: input.purpose,
      greeting: input.greeting,
      headline: input.headline,
      bodyHtml: input.bodyHtml,
      cta: input.cta,
    })
    const text = [
      input.greeting || '',
      input.headline || '',
      input.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      '',
      input.purpose,
      'PB Admin',
    ]
      .filter(Boolean)
      .join('\n')

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmailEmail,
        pass: config.gmailAppPassword,
      },
    })

    await transporter.sendMail({
      from: `"${config.fromName || 'Passive Blessings'}" <${config.gmailEmail}>`,
      to,
      subject: input.subject,
      html,
      text,
    })

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[platform-email] send failed:', message)
    return { ok: false, error: message }
  }
}

/** Fire-and-forget branded email (never throws). */
export function sendBrandedEmailSafe(input: SendBrandedEmailInput): void {
  void sendBrandedEmail(input).catch((err) => {
    console.error('[platform-email] safe send error:', err)
  })
}

async function userAllowsEmail(userId: string): Promise<boolean> {
  try {
    const snap = await getAdminDb().collection('users').doc(userId).get()
    if (!snap.exists) return true
    const data = snap.data() || {}
    if (data.emailNotifications === false) return false
    if (data.settings && (data.settings as { emailNotifications?: boolean }).emailNotifications === false) {
      return false
    }
    return true
  } catch {
    return true
  }
}

/** Resolve email for a member uid or business id (users → businesses → owner). */
async function resolveRecipientEmail(userId: string): Promise<string | null> {
  const db = getAdminDb()
  const userSnap = await db.collection('users').doc(userId).get()
  const userEmail = String(userSnap.data()?.email || '').trim()
  if (userEmail.includes('@')) return userEmail

  const bizSnap = await db.collection('businesses').doc(userId).get()
  if (bizSnap.exists) {
    const d = bizSnap.data() || {}
    const bizEmail = String(d.email || d.contactEmail || d.businessEmail || '').trim()
    if (bizEmail.includes('@')) return bizEmail
    const ownerId = String(d.ownerId || d.userId || d.createdBy || '').trim()
    if (ownerId && ownerId !== userId) {
      const ownerSnap = await db.collection('users').doc(ownerId).get()
      const ownerEmail = String(ownerSnap.data()?.email || '').trim()
      if (ownerEmail.includes('@')) return ownerEmail
    }
  }
  return null
}

/**
 * Look up user/business email by uid and send branded mail.
 */
export async function sendBrandedEmailToUser(opts: {
  userId: string
  subject: string
  purpose: string
  greeting?: string
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
  /** When true (default), skip if user disabled email notifications */
  respectPreference?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const userId = String(opts.userId || '').trim()
  if (!userId) return { ok: false, error: 'Missing userId' }

  if (opts.respectPreference !== false) {
    const allowed = await userAllowsEmail(userId)
    if (!allowed) return { ok: false, error: 'User opted out of email notifications' }
  }

  try {
    const email = await resolveRecipientEmail(userId)
    if (!email) return { ok: false, error: 'User has no email' }

    return sendBrandedEmail({
      to: email,
      subject: opts.subject,
      purpose: opts.purpose,
      greeting: opts.greeting,
      headline: opts.headline,
      bodyHtml: opts.bodyHtml,
      cta: opts.cta,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: message }
  }
}

export function sendBrandedEmailToUserSafe(opts: {
  userId: string
  subject: string
  purpose: string
  greeting?: string
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
  respectPreference?: boolean
}): void {
  void sendBrandedEmailToUser(opts).catch((err) => {
    console.error('[platform-email] to-user safe send error:', err)
  })
}

export const paragraph = emailParagraph
export const paragraphs = emailParagraphs
