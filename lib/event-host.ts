/** Resolve denormalized host branding for event cards. */

export interface EventHostInfo {
  businessId: string
  businessName: string
  ownerName: string
  businessLogoUrl: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveEventHostFromUserData(
  userId: string,
  data: Record<string, unknown> | undefined,
  role: 'admin' | 'business' | string = 'admin'
): EventHostInfo {
  const profile =
    data?.businessProfile && typeof data.businessProfile === 'object'
      ? (data.businessProfile as Record<string, unknown>)
      : {}

  const firstName = asString(data?.firstName)
  const lastName = asString(data?.lastName)
  const fullName = `${firstName} ${lastName}`.trim()
  const ownerName =
    asString(data?.ownerName) ||
    asString(data?.memberName) ||
    asString(data?.contactName) ||
    fullName ||
    asString(data?.displayName) ||
    (role === 'admin' ? 'Passive Blessings' : '')

  const businessName =
    asString(data?.businessName) ||
    asString(data?.name) ||
    asString(profile.businessName) ||
    asString(data?.companyName) ||
    (role === 'admin' ? 'Passive Blessings' : ownerName || 'Host')

  const businessLogoUrl =
    asString(data?.logoUrl) ||
    asString(data?.logoURL) ||
    asString(data?.logo) ||
    asString(data?.photoURL) ||
    asString(data?.avatarUrl) ||
    ''

  return {
    businessId: userId || '',
    businessName,
    ownerName,
    businessLogoUrl,
  }
}

export function hostFromEventDoc(data: Record<string, unknown>): EventHostInfo | null {
  const businessName = asString(data.businessName)
  const ownerName = asString(data.ownerName)
  const businessLogoUrl = asString(data.businessLogoUrl) || asString(data.businessLogoURL)
  if (!businessName && !ownerName && !businessLogoUrl) return null
  return {
    businessId: asString(data.businessId) || asString(data.createdBy),
    businessName: businessName || 'Host',
    ownerName,
    businessLogoUrl,
  }
}

/** Banner corner label: Free or currency + price. */
export function getEventPriceCornerLabel(data: Record<string, unknown>): string {
  const pricingType = asString(data.pricingType) || 'free'
  const currency = asString(data.currency) || asString(data.ticketCurrency) || 'AED'
  let price: number | null =
    typeof data.price === 'number'
      ? data.price
      : typeof data.ticketPrice === 'number'
        ? data.ticketPrice
        : null

  if (Array.isArray(data.ticketTypes) && data.ticketTypes.length > 0) {
    const prices = data.ticketTypes
      .map((t) =>
        t && typeof t === 'object' && typeof (t as { price?: unknown }).price === 'number'
          ? (t as { price: number }).price
          : null
      )
      .filter((p): p is number => p != null && p >= 0)
    if (prices.length > 0) {
      price = Math.min(...prices)
    }
  }

  const paidTypes = new Set(['paid_by_business', 'paid_by_pb', 'premium', 'member_only'])
  const explicitlyPaid =
    data.isPaid === true ||
    data.ticketType === 'paid' ||
    paidTypes.has(pricingType) ||
    (price != null && price > 0)

  if (!explicitlyPaid || pricingType === 'free' || (price != null && price <= 0 && !paidTypes.has(pricingType))) {
    if (price != null && price > 0) {
      return `${currency} ${Number.isInteger(price) ? price : price.toFixed(2)}`
    }
    return 'Free'
  }

  if (price != null && price > 0) {
    return `${currency} ${Number.isInteger(price) ? price : price.toFixed(2)}`
  }

  if (pricingType === 'member_only') return 'Members'
  if (pricingType === 'premium') return 'Premium'
  return 'Paid'
}
