/** Marketplace offer type vs industry category (FEEDBACK_P1.2). */

export const OFFER_TYPES = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
] as const

export type OfferTypeValue = (typeof OFFER_TYPES)[number]['value']

export const OFFER_INDUSTRY_CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'hr', label: 'HR' },
  { value: 'retail', label: 'Retail' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'fb', label: 'F&B' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'health-fitness', label: 'Health & Fitness' },
  { value: 'consultancy', label: 'Consultancy' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
] as const

export type OfferIndustryValue = (typeof OFFER_INDUSTRY_CATEGORIES)[number]['value']

export const OFFER_MARKETPLACE_TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'service', label: 'SERVICES' },
  { id: 'product', label: 'PRODUCTS' },
  ...OFFER_INDUSTRY_CATEGORIES.map((c) => ({
    id: c.value,
    label: c.label.toUpperCase(),
  })),
] as const

export type OfferMarketplaceTabId = (typeof OFFER_MARKETPLACE_TABS)[number]['id']

export function matchesOfferMarketplaceTab(
  offer: { type?: string; category?: string; industryCategory?: string },
  tab: OfferMarketplaceTabId
): boolean {
  if (tab === 'all') return true
  const type = (offer.type || '').toLowerCase()
  const category = (offer.industryCategory || offer.category || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
  if (tab === 'service') return type === 'service'
  if (tab === 'product') return type === 'product' || type === 'merchandise'
  // Discounts are not a marketplace category/type filter
  if (type === 'discount') return false
  if (tab === 'fb') {
    return (
      category.includes('fb') ||
      category.includes('f&b') ||
      category.includes('food') ||
      category.includes('beverage')
    )
  }
  if (tab === 'health-fitness') {
    return category.includes('health') || category.includes('fitness') || category.includes('wellness')
  }
  if (tab === 'consultancy') {
    return category.includes('consult')
  }
  if (tab === 'real-estate') {
    return category.includes('real-estate') || category.includes('realestate') || category.includes('real estate')
  }
  return category.includes(tab) || category === tab
}
