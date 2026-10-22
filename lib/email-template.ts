/**
 * Shared short email layout: Logo → Greeting → Body → Department signature
 */

import type { EmailSignature } from '@/lib/email-departments'
import type { GlobalSocialLinks } from '@/lib/global-settings'
import { MAIL_PHYSICAL_ADDRESS } from '@/lib/mail-identity'
import { getSiteUrl } from '@/lib/site-metadata'

export function escapeEmailHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export type SimpleEmailCta = { label: string; url: string }

/**
 * Very short branded email:
 * 1. Header (logo)
 * 2. Greeting
 * 3. Body
 * 4. Signature (department + optional named signer)
 */
export function renderEmailSocialFooter(links: GlobalSocialLinks, whatsapp?: string): string {
  const items: Array<[string, string | undefined]> = [
    ['Facebook', links.facebook],
    ['Instagram', links.instagram],
    ['X', links.twitter],
    ['LinkedIn', links.linkedin],
    ['YouTube', links.youtube],
    ['TikTok', links.tiktok],
    ['Snapchat', links.snapchat],
    ['Discord', links.discord],
    ['WhatsApp', whatsapp],
  ]
  const cells = items
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(
      ([label, url]) =>
        `<td style="padding:4px;"><a href="${escapeEmailHtml(url)}" style="display:inline-block;padding:8px 12px;background:#111111;color:#ffffff;border-radius:999px;font-size:12px;font-weight:700;text-decoration:none;line-height:1;">${escapeEmailHtml(label)}</a></td>`
    )
    .join('')
  if (!cells) return ''
  return `<p style="margin:16px 0 4px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Follow Passive Blessings</p><table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px auto;"><tr>${cells}</tr></table>`
}

export function renderSimpleEmailHtml(opts: {
  logoUrl: string
  greeting?: string
  bodyHtml: string
  purpose: string
  signature?: EmailSignature
  cta?: SimpleEmailCta
  socialLinks?: GlobalSocialLinks
  whatsappLink?: string
}): string {
  const sig: EmailSignature = opts.signature || {
    purpose: opts.purpose,
    department: 'PB Admin',
    signerName: 'Passive Blessings Admin',
    signerTitle: 'Platform Administration',
  }

  const greeting = opts.greeting?.trim()
    ? `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;color:#111;">${escapeEmailHtml(opts.greeting.trim())}</p>`
    : ''

  const cta = opts.cta
    ? `<p style="margin:16px 0 0 0;"><a href="${escapeEmailHtml(opts.cta.url)}" style="color:#111;font-weight:700;text-decoration:underline;">${escapeEmailHtml(opts.cta.label)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center" style="padding:0 0 20px 0;text-align:center;">
        <img src="${escapeEmailHtml(opts.logoUrl)}" alt="Passive Blessings" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:0;font-size:15px;line-height:1.55;color:#333;">
        ${greeting}
        <div>${opts.bodyHtml}</div>
        ${cta}
      </td>
    </tr>
    <tr>
      <td style="padding:24px 0 0 0;font-size:14px;line-height:1.5;color:#555;border-top:1px solid #e8e8e8;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.04em;">${escapeEmailHtml(sig.department)}</p>
        <p style="margin:0 0 2px 0;">${escapeEmailHtml(sig.purpose)}</p>
        ${sig.signerName ? `<p style="margin:8px 0 0 0;font-weight:700;color:#111;">${escapeEmailHtml(sig.signerName)}</p>` : ''}
        ${sig.signerTitle ? `<p style="margin:2px 0 0 0;font-size:13px;color:#666;">${escapeEmailHtml(sig.signerTitle)}</p>` : ''}
        <p style="margin:12px 0 0 0;font-size:12px;color:#888;">Passive Blessings</p>
        <p style="margin:4px 0 0 0;font-size:11px;color:#999;">${escapeEmailHtml(MAIL_PHYSICAL_ADDRESS)}</p>
        <p style="margin:4px 0 0 0;font-size:11px;color:#999;">
          <a href="${escapeEmailHtml(getSiteUrl())}" style="color:#888;text-decoration:underline;">${escapeEmailHtml(getSiteUrl().replace(/^https?:\/\//, ''))}</a>
        </p>
        ${renderEmailSocialFooter(opts.socialLinks || {}, opts.whatsappLink)}
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 10px 0;">${escapeEmailHtml(text)}</p>`
}

export function emailParagraphs(...lines: string[]): string {
  return lines.filter(Boolean).map(emailParagraph).join('')
}
