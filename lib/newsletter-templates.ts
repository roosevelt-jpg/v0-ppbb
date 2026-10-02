import { getAdminDb } from '@/lib/firebase-admin'
import { mergeGlobalSettings, type GlobalSettings } from '@/lib/global-settings'
import { getEmailBrandLogoUrl } from '@/lib/gmail-service'
import { buildUnsubscribeUrl } from '@/lib/newsletter-unsubscribe'
import type { NewsletterTemplateId } from '@/lib/newsletter-template-options'

export type { NewsletterTemplateId } from '@/lib/newsletter-template-options'

export interface NewsletterRenderInput {
  subject: string
  content: string
  template: NewsletterTemplateId
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  /** Per-recipient unsubscribe URL; falls back to placeholder for preview */
  unsubscribeUrl?: string
  settings?: GlobalSettings
  logoUrl?: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function youtubeBlock(id: string): string {
  const watch = `https://www.youtube.com/watch?v=${id}`
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  return `<p style="margin:16px 0;"><a href="${watch}" style="text-decoration:none;"><img src="${thumb}" alt="Watch on YouTube" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:8px;" /></a><a href="${watch}" style="display:inline-block;margin-top:8px;color:#111111;font-weight:700;text-decoration:underline;">Watch on YouTube</a></p>`
}

function embedRichMedia(html: string): string {
  let next = html.replace(
    /<iframe\b[^>]*src=["'](?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([\w-]{11})[^"']*["'][^>]*>\s*<\/iframe>/gi,
    (_, id: string) => youtubeBlock(id)
  )
  next = next.replace(
    /(?<![\w"'=])(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})\b/gi,
    (_, id: string) => youtubeBlock(id)
  )
  next = next.replace(/<img\b([^>]*?)>/gi, (tag) => {
    if (/style=/i.test(tag)) return tag
    return tag.replace('<img', '<img style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;"')
  })
  return next
}

function plainToHtml(content: string): string {
  const tokens: string[] = []
  const stash = (html: string) => {
    const key = `%%PB${tokens.length}%%`
    tokens.push(html)
    return key
  }

  let text = content.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_, alt: string, url: string) =>
    stash(
      `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="display:block;max-width:100%;height:auto;border:0;border-radius:8px;margin:12px 0;" />`
    )
  )
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label: string, url: string) =>
    stash(
      `<a href="${escapeHtml(url)}" style="color:#111111;font-weight:600;text-decoration:underline;">${escapeHtml(label)}</a>`
    )
  )
  text = text.replace(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})\b/gi,
    (_, id: string) => stash(youtubeBlock(id))
  )

  const html = text
    .split(/\n\n+/)
    .map((paragraph) => {
      const trimmed = paragraph.trim()
      if (/^%%PB\d+%%$/.test(trimmed)) return trimmed
      return `<p style="margin:0 0 16px 0;line-height:1.6;color:#333333;">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`
    })
    .join('')

  return tokens.reduce((acc, token, index) => acc.replaceAll(`%%PB${index}%%`, token), html)
}

function contentToHtml(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return '<p style="margin:0;color:#333333;">&nbsp;</p>'
  const html = /<[a-z][\s\S]*>/i.test(trimmed) ? trimmed : plainToHtml(trimmed)
  return embedRichMedia(html)
}

function socialPills(settings: GlobalSettings): string {
  const links = settings.socialLinks || {}
  const items: Array<[string, string | undefined]> = [
    ['Facebook', links.facebook],
    ['Instagram', links.instagram],
    ['X', links.twitter],
    ['LinkedIn', links.linkedin],
    ['YouTube', links.youtube],
    ['TikTok', links.tiktok],
    ['Snapchat', links.snapchat],
    ['Discord', links.discord],
    ['WhatsApp', settings.whatsappLink],
  ]
  const cells = items
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(
      ([label, url]) => `
        <td style="padding:4px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:8px 12px;background:#111111;color:#ffffff;border-radius:999px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;text-decoration:none;line-height:1;">${escapeHtml(label)}</a>
        </td>`
    )
    .join('')
  if (!cells) return ''
  return `<table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:12px auto;"><tr>${cells}</tr></table>`
}

function buildFooter(settings: GlobalSettings, unsubscribeUrl: string): string {
  const year = new Date().getFullYear()
  const address = escapeHtml(settings.address || 'Dubai, UAE')
  const platform = escapeHtml(settings.platformName || 'Passive Blessings')
  const phone = settings.phone?.trim()
    ? `<p style="margin:0 0 8px 0;">${escapeHtml(settings.phone.trim())}</p>`
    : ''
  const email = settings.contactEmail?.trim()
    ? `<p style="margin:0 0 8px 0;"><a href="mailto:${escapeHtml(settings.contactEmail.trim())}" style="color:#111111;text-decoration:underline;">${escapeHtml(settings.contactEmail.trim())}</a></p>`
    : ''
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px;">
      <tr>
        <td style="border-top:1px solid #e5e5e5;padding-top:24px;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;color:#666666;text-align:center;">
          ${socialPills(settings)}
          <p style="margin:8px 0;">&copy; ${year} ${platform}. All rights reserved.</p>
          <p style="margin:0 0 8px 0;">${address}</p>
          ${phone}
          ${email}
          <p style="margin:8px 0 0 0;">
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:#111111;text-decoration:underline;">Unsubscribe</a>
            from these emails
          </p>
        </td>
      </tr>
    </table>
  `
}

function logoHeader(logoUrl: string, settings: GlobalSettings, variant: 'classic' | 'modern' | 'minimal' | 'highlight'): string {
  const name = escapeHtml(settings.platformName || 'Passive Blessings')
  const logoImg = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;" />`
    : `<span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:bold;color:#111111;">${name}</span>`

  if (variant === 'modern') {
    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#111111;">
        <tr>
          <td align="center" style="padding:32px 24px;">
            ${logoImg}
            <p style="margin:12px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;opacity:0.85;">Community Newsletter</p>
          </td>
        </tr>
      </table>
    `
  }

  if (variant === 'minimal') {
    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding:40px 24px 24px 24px;">
            ${logoImg}
          </td>
        </tr>
      </table>
    `
  }

  if (variant === 'highlight') {
    return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#111111;">
        <tr>
          <td align="center" style="padding:20px 24px;">
            ${logoImg}
          </td>
        </tr>
      </table>
    `
  }

  // classic
  return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#111111;">
      <tr>
        <td align="center" style="padding:28px 24px;">
          ${logoImg}
          <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;opacity:0.8;">Newsletter</p>
        </td>
      </tr>
    </table>
  `
}

function ctaBlock(ctaText?: string, ctaUrl?: string): string {
  if (!ctaText?.trim()) return ''
  const url = ctaUrl?.trim() || '#'
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0 auto;">
      <tr>
        <td align="center" style="background-color:#111111;border-radius:6px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(ctaText)}</a>
        </td>
      </tr>
    </table>
  `
}

export async function loadNewsletterBrandContext(): Promise<{ settings: GlobalSettings; logoUrl: string }> {
  const db = getAdminDb()
  const snap = await db.collection('platformConfig').doc('globalSettings').get()
  const settings = mergeGlobalSettings(snap.data() as Record<string, unknown> | undefined)
  const logoUrl = await getEmailBrandLogoUrl()
  return { settings, logoUrl }
}

export function renderNewsletterHtml(input: NewsletterRenderInput): string {
  const settings = input.settings || mergeGlobalSettings(undefined)
  const logoUrl = input.logoUrl || ''
  const unsubscribeUrl = input.unsubscribeUrl || buildUnsubscribeUrl('preview@example.com')
  const bodyHtml = contentToHtml(input.content)
  const subtitle = input.subtitle?.trim()
  const footer = buildFooter(settings, unsubscribeUrl)
  const cta = ctaBlock(input.ctaText, input.ctaUrl)

  const wrapper = (inner: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;">
          ${inner}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  switch (input.template) {
    case 'modern':
      return wrapper(`
        ${logoHeader(logoUrl, settings, 'modern')}
        <tr>
          <td style="padding:36px 28px 12px 28px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:bold;color:#111111;line-height:1.3;">
            ${escapeHtml(input.subject)}
          </td>
        </tr>
        ${subtitle ? `<tr><td style="padding:0 28px 8px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;color:#666666;">${escapeHtml(subtitle)}</td></tr>` : ''}
        <tr>
          <td style="padding:16px 28px 32px 28px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7f6f2;border-left:4px solid #111111;">
              <tr>
                <td style="padding:24px;font-family:Inter,Arial,sans-serif;font-size:15px;">
                  ${bodyHtml}
                  ${cta}
                </td>
              </tr>
            </table>
            ${footer}
          </td>
        </tr>
      `)

    case 'minimal':
      return wrapper(`
        ${logoHeader(logoUrl, settings, 'minimal')}
        <tr>
          <td style="padding:8px 40px 32px 40px;">
            <h1 style="margin:0 0 24px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:bold;color:#111111;text-align:center;line-height:1.35;">${escapeHtml(input.subject)}</h1>
            ${subtitle ? `<p style="margin:0 0 32px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#888888;text-align:center;">${escapeHtml(subtitle)}</p>` : ''}
            <div style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.8;">
              ${bodyHtml}
            </div>
            ${cta}
            ${footer}
          </td>
        </tr>
      `)

    case 'highlight':
      return wrapper(`
        ${logoHeader(logoUrl, settings, 'highlight')}
        <tr>
          <td style="padding:0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff8e6;border-left:6px solid #d4a574;">
              <tr>
                <td style="padding:28px 24px 8px 24px;font-family:Inter,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#856404;font-weight:600;">Featured</td>
              </tr>
              <tr>
                <td style="padding:0 24px 8px 24px;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:bold;color:#111111;">${escapeHtml(input.subject)}</td>
              </tr>
              ${subtitle ? `<tr><td style="padding:0 24px 16px 24px;font-family:Inter,Arial,sans-serif;font-size:15px;color:#555555;">${escapeHtml(subtitle)}</td></tr>` : ''}
              <tr>
                <td style="padding:0 24px 28px 24px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.65;color:#333333;">
                  ${bodyHtml}
                  ${cta}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;background-color:#fafafa;">
            ${footer}
          </td>
        </tr>
      `)

    case 'classic':
    default:
      return wrapper(`
        ${logoHeader(logoUrl, settings, 'classic')}
        <tr>
          <td style="padding:32px 28px 8px 28px;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:bold;color:#111111;">
            ${escapeHtml(input.subject)}
          </td>
        </tr>
        ${subtitle ? `<tr><td style="padding:0 28px 16px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;color:#666666;">${escapeHtml(subtitle)}</td></tr>` : ''}
        <tr>
          <td style="padding:8px 28px 32px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.65;color:#333333;background-color:#fafafa;">
            ${bodyHtml}
            ${cta}
            ${footer}
          </td>
        </tr>
      `)
  }
}

/** HTML with SendGrid substitution tag for per-recipient unsubscribe links */
export function renderNewsletterHtmlForSend(input: Omit<NewsletterRenderInput, 'unsubscribeUrl'>): string {
  return renderNewsletterHtml({
    ...input,
    unsubscribeUrl: '-unsubscribeUrl-',
  })
}
