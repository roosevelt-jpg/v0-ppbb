/**
 * Branded transactional email via Zoho Mail SMTP only.
 * Layout: Logo → Greeting → Body → department signature
 */

import { getAdminDb } from '@/lib/firebase-admin'
import { getEmailBrandLogoUrl } from '@/lib/gmail-service'
import { createZohoTransporter, getZohoSmtpConfig } from '@/lib/zoho-mail-service'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'
import { DEFAULT_MAIL_FROM_NAME } from '@/lib/mail-identity'
import {
  type EmailDepartmentKey,
  type EmailSignature,
  signatureFor,
} from '@/lib/email-departments'
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
  /** Department key for the signature block */
  department?: EmailDepartmentKey
  /** Full signature override (e.g. founder welcome from DB) */
  signature?: EmailSignature
  /** Optional greeting line, e.g. "Hi Jordan," */
  greeting?: string
  /** @deprecated Prefer greeting + bodyHtml; still rendered as the first body line if set */
  headline?: string
  /** HTML body (paragraphs). Plain text is also fine — wrap in <p> if needed. */
  bodyHtml: string
  cta?: BrandedEmailCta
  /** Optional CRM linkage */
  userId?: string | null
  relatedType?: string | null
  relatedId?: string | null
}

function resolveSignature(input: Pick<SendBrandedEmailInput, 'purpose' | 'department' | 'signature'>): EmailSignature {
  if (input.signature) return input.signature
  if (input.department) return signatureFor(input.department, input.purpose)
  return signatureFor('admin', input.purpose)
}

function signatureText(sig: EmailSignature): string[] {
  return [
    sig.department,
    sig.purpose,
    sig.signerName || '',
    sig.signerTitle || '',
    'Passive Blessings',
  ].filter(Boolean)
}

export function renderBrandedEmailHtml(opts: {
  logoUrl: string
  purpose: string
  department?: EmailDepartmentKey
  signature?: EmailSignature
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

  const signature = resolveSignature(opts)

  return renderSimpleEmailHtml({
    logoUrl: opts.logoUrl,
    greeting: opts.greeting,
    bodyHtml: bodyParts.join(''),
    purpose: opts.purpose,
    signature,
    cta: opts.cta,
  })
}

async function resolveLogoUrl(): Promise<string> {
  try {
    const logo = await getEmailBrandLogoUrl()
    if (logo && /^https?:\/\//i.test(logo)) {
      return logo
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_LOGO_ON_LIGHT_BG
}

type PreparedMail = {
  html: string
  text: string
}

async function prepareMail(input: SendBrandedEmailInput): Promise<PreparedMail> {
  const logoUrl = await resolveLogoUrl()
  const signature = resolveSignature(input)
  const html = renderBrandedEmailHtml({
    logoUrl,
    purpose: input.purpose,
    department: input.department,
    signature: input.signature,
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
    ...signatureText(signature),
  ]
    .filter(Boolean)
    .join('\n')
  return { html, text }
}

async function sendViaZohoSmtp(
  input: SendBrandedEmailInput,
  prepared: PreparedMail
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await getZohoSmtpConfig()
  if (!config) return { ok: false, error: 'Zoho Mail SMTP not configured' }

  try {
    const transporter = createZohoTransporter(config)
    await transporter.sendMail({
      from: `"${config.fromName || DEFAULT_MAIL_FROM_NAME}" <${config.email}>`,
      replyTo: config.email,
      to: input.to,
      subject: input.subject,
      html: prepared.html,
      text: prepared.text,
    })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[platform-email] Zoho SMTP send failed:', message)
    return { ok: false, error: message }
  }
}

/**
 * Send a branded platform email via Zoho Mail SMTP only.
 * Returns ok:false (does not throw) when Zoho is not configured or send fails.
 * Always writes an emailSendLogs CRM activity row (success or failure).
 */
export async function sendBrandedEmail(
  input: SendBrandedEmailInput
): Promise<{ ok: boolean; error?: string }> {
  const { previewFromBodyHtml, recordEmailSendLog } = await import('@/lib/email-send-log')
  const to = String(input.to || '').trim().toLowerCase()
  const logBase = {
    to: to || String(input.to || ''),
    subject: input.subject,
    purpose: input.purpose,
    department: input.department || null,
    userId: input.userId || null,
    relatedType: input.relatedType || null,
    relatedId: input.relatedId || null,
    ctaUrl: input.cta?.url || null,
    preview: previewFromBodyHtml(input.bodyHtml, input.headline),
  }

  if (!to || !to.includes('@')) {
    await recordEmailSendLog({ ...logBase, status: 'failed', error: 'Invalid recipient' })
    return { ok: false, error: 'Invalid recipient' }
  }

  try {
    const prepared = await prepareMail({ ...input, to })
    const viaZoho = await sendViaZohoSmtp({ ...input, to }, prepared)
    if (viaZoho.ok) {
      await recordEmailSendLog({ ...logBase, status: 'sent' })
      return { ok: true }
    }

    const error = viaZoho.error || 'Zoho Mail SMTP not configured'
    console.warn('[platform-email] Zoho send failed:', input.subject, error)
    await recordEmailSendLog({ ...logBase, status: 'skipped', error })
    return { ok: false, error }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[platform-email] send failed:', message)
    await recordEmailSendLog({ ...logBase, status: 'failed', error: message })
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
  department?: EmailDepartmentKey
  signature?: EmailSignature
  greeting?: string
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
  /** When true (default), skip if user disabled email notifications */
  respectPreference?: boolean
  relatedType?: string | null
  relatedId?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const userId = String(opts.userId || '').trim()
  if (!userId) return { ok: false, error: 'Missing userId' }

  if (opts.respectPreference !== false) {
    const allowed = await userAllowsEmail(userId)
    if (!allowed) {
      const { recordEmailSendLog, previewFromBodyHtml } = await import('@/lib/email-send-log')
      await recordEmailSendLog({
        to: '',
        subject: opts.subject,
        purpose: opts.purpose,
        department: opts.department || null,
        status: 'skipped',
        error: 'User opted out of email notifications',
        userId,
        relatedType: opts.relatedType || null,
        relatedId: opts.relatedId || null,
        ctaUrl: opts.cta?.url || null,
        preview: previewFromBodyHtml(opts.bodyHtml, opts.headline),
      })
      return { ok: false, error: 'User opted out of email notifications' }
    }
  }

  try {
    const email = await resolveRecipientEmail(userId)
    if (!email) {
      const { recordEmailSendLog, previewFromBodyHtml } = await import('@/lib/email-send-log')
      await recordEmailSendLog({
        to: '',
        subject: opts.subject,
        purpose: opts.purpose,
        department: opts.department || null,
        status: 'failed',
        error: 'User has no email',
        userId,
        relatedType: opts.relatedType || null,
        relatedId: opts.relatedId || null,
        ctaUrl: opts.cta?.url || null,
        preview: previewFromBodyHtml(opts.bodyHtml, opts.headline),
      })
      return { ok: false, error: 'User has no email' }
    }

    return sendBrandedEmail({
      to: email,
      subject: opts.subject,
      purpose: opts.purpose,
      department: opts.department,
      signature: opts.signature,
      greeting: opts.greeting,
      headline: opts.headline,
      bodyHtml: opts.bodyHtml,
      cta: opts.cta,
      userId,
      relatedType: opts.relatedType,
      relatedId: opts.relatedId,
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
  department?: EmailDepartmentKey
  signature?: EmailSignature
  greeting?: string
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
  respectPreference?: boolean
  relatedType?: string | null
  relatedId?: string | null
}): void {
  void sendBrandedEmailToUser(opts).catch((err) => {
    console.error('[platform-email] to-user safe send error:', err)
  })
}

export const paragraph = emailParagraph
export const paragraphs = emailParagraphs
