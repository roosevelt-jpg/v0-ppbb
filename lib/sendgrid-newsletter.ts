/**
 * Bulk newsletter send via Zoho Mail SMTP.
 * (Filename kept for import stability; SendGrid is no longer used.)
 */

import { createZohoTransporter, getZohoSmtpConfig } from '@/lib/zoho-mail-service'
import { renderNewsletterHtmlForSend, type NewsletterTemplateId } from '@/lib/newsletter-templates'
import { buildUnsubscribeUrl } from '@/lib/newsletter-unsubscribe'
import type { NewsletterRecipient } from '@/lib/newsletter-recipients'
import { DEFAULT_MAIL_FROM_NAME } from '@/lib/mail-identity'

const CONCURRENCY = 5
const UNSUB_TAG = '-unsubscribeUrl-'

export interface BulkSendInput {
  subject: string
  content: string
  template: NewsletterTemplateId
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  recipients: NewsletterRecipient[]
  settings?: Parameters<typeof renderNewsletterHtmlForSend>[0]['settings']
  logoUrl?: string
}

export interface BulkSendResult {
  success: boolean
  sentCount: number
  failedCount: number
  totalRecipients: number
  status: 'sent' | 'partial' | 'failed'
  errors: string[]
}

export async function sendNewsletterBulk(input: BulkSendInput): Promise<BulkSendResult> {
  const config = await getZohoSmtpConfig()
  if (!config) {
    return {
      success: false,
      sentCount: 0,
      failedCount: input.recipients.length,
      totalRecipients: input.recipients.length,
      status: 'failed',
      errors: [
        'Zoho Mail SMTP is not configured. Add credentials in Admin → Integrations → Zoho Mail SMTP.',
      ],
    }
  }

  if (input.recipients.length === 0) {
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      totalRecipients: 0,
      status: 'failed',
      errors: ['No eligible recipients found.'],
    }
  }

  const htmlBase = renderNewsletterHtmlForSend({
    subject: input.subject,
    content: input.content,
    template: input.template,
    subtitle: input.subtitle,
    ctaText: input.ctaText,
    ctaUrl: input.ctaUrl,
    settings: input.settings,
    logoUrl: input.logoUrl,
  })

  const textBase = String(input.content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const transporter = createZohoTransporter(config)
  const from = `"${config.fromName || DEFAULT_MAIL_FROM_NAME}" <${config.email}>`
  const errors: string[] = []
  let sentCount = 0

  async function sendOne(r: NewsletterRecipient): Promise<void> {
    const unsub = buildUnsubscribeUrl(r.email)
    const html = htmlBase.split(UNSUB_TAG).join(unsub)
    try {
      await transporter.sendMail({
        from,
        replyTo: config.email,
        to: r.name ? `"${r.name}" <${r.email}>` : r.email,
        subject: input.subject,
        html,
        text: `${textBase}\n\nUnsubscribe: ${unsub}`,
        headers: {
          'List-Unsubscribe': `<${unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      sentCount += 1
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[newsletter] Zoho send error:', r.email, msg)
      errors.push(`${r.email}: ${msg}`)
    }
  }

  for (let i = 0; i < input.recipients.length; i += CONCURRENCY) {
    const batch = input.recipients.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(sendOne))
  }

  const failedCount = input.recipients.length - sentCount
  let status: BulkSendResult['status'] = 'sent'
  if (sentCount === 0) status = 'failed'
  else if (failedCount > 0) status = 'partial'

  return {
    success: sentCount > 0,
    sentCount,
    failedCount,
    totalRecipients: input.recipients.length,
    status,
    errors,
  }
}
