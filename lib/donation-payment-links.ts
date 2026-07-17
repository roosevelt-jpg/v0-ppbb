/** Donation type routed to separate partner payment URLs. */
export type DonationPaymentType = 'zakat' | 'sadaqah'

export const DONATION_PAYMENT_TYPES: {
  id: DonationPaymentType
  label: string
  description: string
}[] = [
  {
    id: 'zakat',
    label: 'Zakat',
    description: 'Obligatory charity for eligible wealth',
  },
  {
    id: 'sadaqah',
    label: 'Sadaqah',
    description: 'Voluntary charity and general giving',
  },
]

export type PartnerPaymentLinks = {
  paymentLink?: string | null
  zakatPaymentLink?: string | null
  sadaqahPaymentLink?: string | null
}

export function resolvePartnerPaymentLink(
  partner: PartnerPaymentLinks | null | undefined,
  type: DonationPaymentType | null | undefined,
  fallbackUrl = ''
): string {
  if (!partner) return (fallbackUrl || '').trim()

  if (type === 'zakat') {
    return (
      (partner.zakatPaymentLink || '').trim() ||
      (partner.paymentLink || '').trim() ||
      (fallbackUrl || '').trim()
    )
  }
  if (type === 'sadaqah') {
    return (
      (partner.sadaqahPaymentLink || '').trim() ||
      (partner.paymentLink || '').trim() ||
      (fallbackUrl || '').trim()
    )
  }

  return (
    (partner.paymentLink || '').trim() ||
    (partner.zakatPaymentLink || '').trim() ||
    (partner.sadaqahPaymentLink || '').trim() ||
    (fallbackUrl || '').trim()
  )
}

/** Which donation types a partner can accept (has a usable link). */
export function availableDonationTypes(
  partner: PartnerPaymentLinks | null | undefined,
  fallbackUrl = ''
): DonationPaymentType[] {
  const types: DonationPaymentType[] = []
  if (resolvePartnerPaymentLink(partner, 'zakat', fallbackUrl)) types.push('zakat')
  if (resolvePartnerPaymentLink(partner, 'sadaqah', fallbackUrl)) types.push('sadaqah')
  // Deduplicate if both resolve to same generic link — still offer both choices
  return types
}

export function parseDonationPaymentType(value: unknown): DonationPaymentType | null {
  const v = String(value || '')
    .trim()
    .toLowerCase()
  if (v === 'zakat') return 'zakat'
  if (v === 'sadaqah' || v === 'sadaqa') return 'sadaqah'
  return null
}
