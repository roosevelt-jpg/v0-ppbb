/** UAE marketplace shipping + payment options (enhance existing checkout). */

export type MarketplacePaymentMethod = 'card' | 'cod' | 'bank_transfer'

export type MarketplaceDeliveryPartnerId =
  | 'aramex'
  | 'fetchr'
  | 'smsa'
  | 'dhl'
  | 'emirates_post'
  | 'careem'
  | 'other'
  | 'self_arrange'

export interface MarketplaceAddress {
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  emirate: string
  postalCode?: string
  country: string
}

export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const

export const MARKETPLACE_DELIVERY_PARTNERS: {
  id: MarketplaceDeliveryPartnerId
  label: string
  description: string
}[] = [
  {
    id: 'aramex',
    label: 'Aramex',
    description: 'UAE & GCC courier — shop arranges pickup after order',
  },
  {
    id: 'fetchr',
    label: 'Fetchr / Empost partners',
    description: 'Same-day / next-day UAE delivery partners',
  },
  {
    id: 'smsa',
    label: 'SMSA Express',
    description: 'Regional express shipping',
  },
  {
    id: 'dhl',
    label: 'DHL Express',
    description: 'Express domestic & international',
  },
  {
    id: 'emirates_post',
    label: 'Emirates Post',
    description: 'National postal & parcel service',
  },
  {
    id: 'careem',
    label: 'Careem / local courier',
    description: 'On-demand local pickup & drop-off',
  },
  {
    id: 'self_arrange',
    label: 'Arrange myself',
    description: 'Shop owner coordinates pickup with their own partner',
  },
  {
    id: 'other',
    label: 'Other partner',
    description: 'Custom courier named by the shop',
  },
]

export const MARKETPLACE_PAYMENT_METHODS: {
  id: MarketplacePaymentMethod
  label: string
  description: string
}[] = [
  {
    id: 'card',
    label: 'Card payment',
    description: 'Pay securely by card (Stripe)',
  },
  {
    id: 'cod',
    label: 'Cash on delivery (COD)',
    description: 'Pay the courier when your order arrives',
  },
  {
    id: 'bank_transfer',
    label: 'Bank transfer (UAE)',
    description: 'Transfer to the shop’s UAE bank account, then confirm',
  },
]

export function emptyMarketplaceAddress(): MarketplaceAddress {
  return {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    emirate: 'Dubai',
    postalCode: '',
    country: 'United Arab Emirates',
  }
}

export function formatMarketplaceAddress(addr?: MarketplaceAddress | null): string {
  if (!addr) return '—'
  return [
    addr.fullName,
    addr.line1,
    addr.line2,
    [addr.city, addr.emirate].filter(Boolean).join(', '),
    addr.postalCode,
    addr.country,
    addr.phone ? `Tel: ${addr.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function validateMarketplaceAddress(
  addr: MarketplaceAddress,
  label: string
): string | null {
  if (!addr.fullName.trim()) return `${label}: name is required`
  if (!addr.phone.trim()) return `${label}: phone is required`
  if (!addr.line1.trim()) return `${label}: street address is required`
  if (!addr.city.trim()) return `${label}: city is required`
  if (!addr.emirate.trim()) return `${label}: emirate is required`
  return null
}

export function deliveryPartnerLabel(id?: string | null, customName?: string | null): string {
  if (id === 'other' && customName?.trim()) return customName.trim()
  const found = MARKETPLACE_DELIVERY_PARTNERS.find((p) => p.id === id)
  return found?.label || customName?.trim() || 'To be arranged by shop'
}

export function paymentMethodLabel(id?: string | null): string {
  return MARKETPLACE_PAYMENT_METHODS.find((p) => p.id === id)?.label || id || '—'
}
