import sgMail from '@sendgrid/mail'
import { resolveSendGridConfig } from '@/lib/resolve-sendgrid-key'
import { renderNewsletterHtmlForSend, type NewsletterTemplateId } from '@/lib/newsletter-templates'
import { buildUnsubscribeUrl } from '@/lib/newsletter-unsubscribe'
import type { NewsletterRecipient } from '@/lib/newsletter-recipients'

const BATCH_SIZE = 500
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
  const config = await resolveSendGridConfig()
  if (!config) {
    return {
      success: false,
      sentCount: 0,
      failedCount: input.recipients.length,
      totalRecipients: input.recipients.length,
      status: 'failed',
      errors: ['SendGrid is not configured. Add API key in Admin → Integrations or SENDGRID_API_KEY env.'],
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

  sgMail.setApiKey(config.apiKey)

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

  let sentCount = 0
  const errors: string[] = []

  for (let i = 0; i < input.recipients.length; i += BATCH_SIZE) {
    const batch = input.recipients.slice(i, i + BATCH_SIZE)
    try {
      await sgMail.send({
        from: { email: config.fromAddress, name: config.fromName },
        subject: input.subject,
        html: htmlBase,
        personalizations: batch.map((r) => ({
          to: [{ email: r.email, name: r.name }],
          substitutions: {
            [UNSUB_TAG]: buildUnsubscribeUrl(r.email),
          },
        })),
      } as sgMail.MailDataRequired)
      sentCount += batch.length
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[v0] SendGrid batch error:', msg)
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${msg}`)
    }
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
