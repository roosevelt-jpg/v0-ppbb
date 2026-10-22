/**
 * Advertising / promotion payment confirmation (Advertising & Promotions department).
 */

import { paragraphs, sendBrandedEmailToUserSafe } from '@/lib/platform-email'

export function notifyAdvertisingPaymentConfirmed(opts: {
  businessId: string
  businessName?: string
  amount: number
  currency?: string
  paymentReference?: string
  requestId?: string
}): void {
  const currency = (opts.currency || 'AED').toUpperCase()
  const amountLine =
    opts.amount > 0 ? `Amount paid: ${currency} ${opts.amount.toFixed(2)}.` : ''
  const refLine = opts.paymentReference?.trim()
    ? `Payment reference: ${opts.paymentReference.trim()}.`
    : ''
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')

  const paidFor =
    opts.amount > 0
      ? `${currency} ${opts.amount.toFixed(2)} paid for homepage advertising${opts.businessName ? ` for ${opts.businessName}` : ''}.`
      : `Payment received for homepage advertising${opts.businessName ? ` for ${opts.businessName}` : ''}.`

  void import('@/lib/in-app-notifications').then(({ addUserNotification }) => {
    addUserNotification(opts.businessId, {
      title: 'Payment received',
      message: paidFor,
      href: '/business/advertise',
      type: 'advertising_payment',
    }).catch(() => undefined)
  })
  void import('@/lib/push-notifications-server').then(({ pushToUserSafe }) => {
    pushToUserSafe(opts.businessId, { title: 'Payment received', body: paidFor }, {
      type: 'advertising_payment',
      click_action: '/business/advertise',
    })
  })

  sendBrandedEmailToUserSafe({
    userId: opts.businessId,
    subject: 'Advertising payment confirmed',
    purpose: 'Advertising payment confirmation',
    department: 'advertising',
    headline: 'Payment confirmed',
    bodyHtml: paragraphs(
      'Assalamu alaikum,',
      paidFor,
      amountLine,
      refLine,
      'Our team will review your banner and publish it once approved.'
    ),
    cta: { label: 'View advertising requests', url: `${site}/business/advertise` },
    respectPreference: false,
  })
}
