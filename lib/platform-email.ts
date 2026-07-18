/**
 * Branded transactional email via Gmail SMTP.
 * Layout: Passive Blessings logo → body → purpose + "PB Admin" signature.
 */

import nodemailer from 'nodemailer'
import { getAdminDb } from '@/lib/firebase-admin'
import { getGmailSmtpConfig, getEmailBrandLogoUrl } from '@/lib/gmail-service'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'

export type BrandedEmailCta = { label: string; url: string }

export type SendBrandedEmailInput = {
  to: string
  subject: string
  /** Short purpose line used in the signature (e.g. "New job application") */
  purpose: string
  headline?: string
  /** HTML body (paragraphs). Plain text is also fine — wrap in <p> if needed. */
  bodyHtml: string
  cta?: BrandedEmailCta
}

function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderBrandedEmailHtml(opts: {
  logoUrl: string
  purpose: string
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
}): string {
  const site = getPublicSiteUrl()
  const headline = opts.headline
    ? `<h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:#111111;font-family:Georgia,'Times New Roman',serif;">${escapeHtml(opts.headline)}</h1>`
    : ''
  const cta = opts.cta
    ? `<p style="margin:24px 0 8px 0;"><a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700;font-size:14px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(opts.cta.label)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Passive Blessings</title>
</head>
<body style="margin:0;padding:0;background:#f7f6f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6f2;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e1da;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px 28px;text-align:center;border-bottom:1px solid #eee;">
              <img src="${escapeHtml(opts.logoUrl)}" alt="Passive Blessings" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:#333333;font-size:15px;line-height:1.6;">
              ${headline}
              <div style="color:#333333;">${opts.bodyHtml}</div>
              ${cta}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid #e4e1da;">
                <tr>
                  <td style="padding-top:20px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 4px 0;font-size:13px;color:#555555;line-height:1.5;">
                      ${escapeHtml(opts.purpose)}
                    </p>
                    <p style="margin:0;font-size:14px;font-weight:700;color:#111111;">
                      PB Admin
                    </p>
                    <p style="margin:8px 0 0 0;font-size:12px;color:#999999;">
                      Passive Blessings · <a href="${site}" style="color:#666666;">${site.replace(/^https?:\/\//, '')}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function resolveLogoUrl(): Promise<string> {
  try {
    const logo = await getEmailBrandLogoUrl()
    if (logo && /^https?:\/\//i.test(logo) && !logo.includes('/images/pb-logo-black.png')) {
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
      headline: input.headline,
      bodyHtml: input.bodyHtml,
      cta: input.cta,
    })
    const text = [
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
    // Prefer explicit false; missing means allow
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
  headline?: string
  bodyHtml: string
  cta?: BrandedEmailCta
  respectPreference?: boolean
}): void {
  void sendBrandedEmailToUser(opts).catch((err) => {
    console.error('[platform-email] to-user safe send error:', err)
  })
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px 0;">${escapeHtml(text)}</p>`
}

export function paragraphs(...lines: string[]): string {
  return lines.filter(Boolean).map(paragraph).join('')
}
