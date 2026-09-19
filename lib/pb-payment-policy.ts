/**
 * Passive Blessings Stripe may only collect:
 * - Membership fees
 * - PB-hosted paid event ticket fees (admin / paid_by_pb)
 * - Business paid-event posting fees
 * - Merchandise sold by Passive Blessings (platform shop)
 *
 * Business sellers collect via their own payment link or WhatsApp.
 */

/** Keep in sync with lib/marketplace-directory PLATFORM_BUSINESS_ID */
export const PB_PLATFORM_SELLER_ID = 'passive-blessings'

export type HostPaymentCollection = 'payment_link' | 'whatsapp' | 'cash_at_door'

export function isPlatformSeller(businessId: string | null | undefined): boolean {
  const id = String(businessId || '').trim().toLowerCase()
  return !id || id === PB_PLATFORM_SELLER_ID || id === 'passiveblessings' || id === 'pb'
}

/** PB Stripe card checkout for marketplace — only platform (Passive Blessings) listings. */
export function canUsePbStripeForMarketplaceOffer(offer: {
  businessId?: string | null
  category?: string | null
}): boolean {
  return isPlatformSeller(offer.businessId)
}

/** Ticket money through PB Stripe only for PB-hosted paid events. */
export function isPbHostedPaidEvent(event: {
  pricingType?: string | null
  createdByRole?: string | null
  businessId?: string | null
  revenueModel?: string | null
}): boolean {
  const pricing = String(event.pricingType || '').toLowerCase()
  if (pricing === 'paid_by_pb' || pricing === 'premium') return true
  if (pricing === 'paid_by_business') return false
  if (event.createdByRole === 'admin') return pricing !== 'free' && pricing !== 'member_only'
  if (event.revenueModel === 'pb_full') return true
  if (isPlatformSeller(event.businessId) && event.createdByRole !== 'business') return true
  return false
}

/** Business-hosted paid events: attendees pay the host directly. */
export function isBusinessSelfCollectEvent(event: {
  pricingType?: string | null
  createdByRole?: string | null
  businessId?: string | null
}): boolean {
  const pricing = String(event.pricingType || '').toLowerCase()
  if (pricing === 'free' || pricing === 'member_only') return false
  if (pricing === 'paid_by_business') return true
  if (event.createdByRole === 'business' && !isPbHostedPaidEvent(event)) return true
  return false
}

export function normalizeHostPaymentCollection(
  value: unknown
): HostPaymentCollection {
  const v = String(value || '').trim().toLowerCase()
  if (v === 'whatsapp') return 'whatsapp'
  if (v === 'cash_at_door' || v === 'cash' || v === 'door') return 'cash_at_door'
  return 'payment_link'
}
