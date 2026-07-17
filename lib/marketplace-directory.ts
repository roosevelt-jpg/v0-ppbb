'use client'

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'

export type MarketplaceDirectoryFilter =
  | 'all'
  | 'services'
  | 'products'
  | 'technology'
  | 'hr'
  | 'retail'
  | 'real-estate'
  | 'automotive'
  | 'fb'
  | 'hospitality'
  | 'health-fitness'
  | 'consultancy'
  | 'business'
  | 'other'

export const MARKETPLACE_DIRECTORY_TABS: { id: MarketplaceDirectoryFilter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'services', label: 'SERVICES' },
  { id: 'products', label: 'PRODUCTS' },
  { id: 'technology', label: 'TECHNOLOGY' },
  { id: 'hr', label: 'HR' },
  { id: 'retail', label: 'RETAIL' },
  { id: 'real-estate', label: 'REAL ESTATE' },
  { id: 'automotive', label: 'AUTOMOTIVE' },
  { id: 'fb', label: 'F&B' },
  { id: 'hospitality', label: 'HOSPITALITY' },
  { id: 'health-fitness', label: 'HEALTH & FITNESS' },
  { id: 'consultancy', label: 'CONSULTANCY' },
  { id: 'business', label: 'BUSINESS' },
  { id: 'other', label: 'OTHER' },
]

export interface DirectoryBusiness {
  id: string
  name: string
  description: string
  category: string
  /** Normalized company type (service / product / hybrid / etc.) */
  companyType: string
  logoURL: string
  bannerURL: string
  ownerName: string
  /** Firebase Auth uid of the business owner (for encrypted buyer↔seller DMs) */
  ownerId: string
  services: string[]
  productImages: string[]
  phone: string
  email: string
  website: string
  location: string
  teamSize: string
  socialLinks: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  }
  createdAt?: Date | null
  isSponsor: boolean
  isApproved: boolean
  isActive: boolean
}

export interface DirectoryOffer {
  id: string
  businessId: string
  businessName: string
  title: string
  description: string
  category: string
  type: string
  status: string
  price?: number
  originalPrice?: number
  imageURL: string
  images: string[]
  isMemberDiscount: boolean
  isMemberOnly?: boolean
  genderRestriction?: string
  memberBenefit?: number
  discountPercentage?: number
  phone?: string
  isAvailable?: boolean
}

export interface DirectoryJob {
  id: string
  businessId: string
  title: string
  description: string
  category: string
  status: string
  jobType?: string
  location?: string
  experience?: string
  salary?: string
  publishedAt?: Date | null
}

export interface DirectoryBusinessCardData extends DirectoryBusiness {
  activeJobsCount: number
  activeOffersCount: number
  hasMemberDiscount: boolean
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function normalizeStatus(value: unknown): string {
  return asString(value, '').toLowerCase()
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === 'true' || value === 1
}

export function normalizeDirectoryBusiness(
  id: string,
  data: Record<string, unknown>
): DirectoryBusiness {
  const services =
    asStringArray(data.services).length > 0
      ? asStringArray(data.services)
      : asStringArray(data.servicesOffered)

  const productImages =
    asStringArray(data.productImages).length > 0
      ? asStringArray(data.productImages)
      : asStringArray(data.images)

  const isActive =
    data.isActive === undefined && data.status !== undefined
      ? normalizeStatus(data.status) === 'active'
      : data.isActive !== false && normalizeStatus(data.status) !== 'inactive' && normalizeStatus(data.status) !== 'suspended'

  const companyType =
    asString(data.companyType) ||
    asString(data.businessType) ||
    asString(data.type) ||
    asString(data.category) ||
    'other'

  const socialRaw =
    data.socialLinks && typeof data.socialLinks === 'object'
      ? (data.socialLinks as Record<string, unknown>)
      : {}

  const createdAt =
    data.createdAt && typeof data.createdAt === 'object' && 'toDate' in (data.createdAt as object)
      ? (data.createdAt as { toDate: () => Date }).toDate()
      : data.createdAt instanceof Date
        ? data.createdAt
        : data.createdAt
          ? new Date(data.createdAt as string | number)
          : null

  return {
    id,
    name:
      asString(data.name) ||
      asString(data.businessName) ||
      asString(data.companyName) ||
      'Untitled business',
    description: asString(data.description) || asString(data.oneLineDescription) || asString(data.tagline),
    category: asString(data.category) || asString(data.businessType) || asString(data.type),
    companyType,
    logoURL: asString(data.logoURL) || asString(data.logo) || asString(data.logoUrl),
    bannerURL: asString(data.bannerURL) || asString(data.banner) || asString(data.bannerUrl),
    ownerName:
      asString(data.ownerName) ||
      asString(data.memberName) ||
      asString(data.owner) ||
      asString(data.contactName) ||
      asString(data.contact),
    ownerId:
      asString(data.ownerId) ||
      asString(data.userId) ||
      asString(data.createdBy) ||
      asString(data.memberId),
    services,
    productImages,
    phone: asString(data.phone) || asString(data.businessPhone) || asString(data.contact),
    email: asString(data.email),
    website: asString(data.website),
    location:
      asString(data.location) ||
      asString(data.locationLabel) ||
      asString(data.city) ||
      asString(data.emirate) ||
      (data.locationData && typeof data.locationData === 'object'
        ? asString((data.locationData as { formattedAddress?: string }).formattedAddress) ||
          asString((data.locationData as { city?: string }).city)
        : ''),
    teamSize: asString(data.teamSize) || asString(data.companySize) || asString(data.employees),
    socialLinks: {
      facebook: asString(socialRaw.facebook) || asString(data.facebook),
      instagram: asString(socialRaw.instagram) || asString(data.instagram),
      linkedin: asString(socialRaw.linkedin) || asString(data.linkedin),
      twitter: asString(socialRaw.twitter) || asString(data.twitter) || asString(data.x),
    },
    createdAt: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null,
    isSponsor:
      isTruthyFlag(data.isSponsor) ||
      isTruthyFlag(data.sponsor) ||
      normalizeStatus(data.membership) === 'sponsor' ||
      normalizeStatus(data.tier) === 'sponsor',
    isApproved: isTruthyFlag(data.isApproved),
    isActive,
  }
}

export function normalizeDirectoryOffer(
  id: string,
  data: Record<string, unknown>
): DirectoryOffer {
  const images =
    asStringArray(data.images).length > 0
      ? asStringArray(data.images)
      : [asString(data.imageURL) || asString(data.imageUrl) || asString((data.image as { url?: string } | undefined)?.url)].filter(
          Boolean
        )

  const memberBenefit =
    typeof data.memberBenefit === 'number'
      ? data.memberBenefit
      : typeof data.discountPercentage === 'number'
        ? data.discountPercentage
        : undefined

  const type = asString(data.type).toLowerCase()
  const isMemberDiscount =
    isTruthyFlag(data.isMemberDiscount) ||
    type === 'discount' ||
    (typeof memberBenefit === 'number' && memberBenefit > 0)

  return {
    id,
    businessId: asString(data.businessId),
    businessName: asString(data.businessName) || asString(data.business_name),
    title: asString(data.title) || 'Untitled offer',
    description: asString(data.description),
    category: asString(data.category) || type,
    type,
    status: normalizeStatus(data.status) || 'active',
    price: typeof data.price === 'number' ? data.price : undefined,
    originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
    imageURL: images[0] || '',
    images,
    isMemberDiscount,
    isMemberOnly: isTruthyFlag(data.isMemberOnly) || data.targetAudience === 'members',
    genderRestriction:
      asString(data.genderRestriction) ||
      asString(data.gender) ||
      (data.audienceGender as string | undefined) ||
      '',
    memberBenefit,
    discountPercentage:
      typeof data.discountPercentage === 'number' ? data.discountPercentage : memberBenefit,
    phone: asString(data.phone),
    isAvailable: data.isAvailable !== false,
  }
}

export function normalizeDirectoryJob(
  id: string,
  data: Record<string, unknown>
): DirectoryJob {
  const salaryMin = typeof data.salaryMin === 'number' ? data.salaryMin : undefined
  const salaryMax = typeof data.salaryMax === 'number' ? data.salaryMax : undefined
  const compensation = asString(data.compensation) || asString(data.salary)
  const salary =
    compensation ||
    (salaryMin != null || salaryMax != null
      ? [salaryMin, salaryMax].filter((v) => v != null).join(' - ')
      : '')

  const locObj = data.location
  const location =
    asString(data.locationText) ||
    asString(data.locationCity) ||
    (typeof locObj === 'string' ? locObj : '') ||
    (locObj && typeof locObj === 'object'
      ? asString((locObj as { formattedAddress?: string; city?: string }).formattedAddress) ||
        asString((locObj as { city?: string }).city)
      : '')

  const publishedRaw = data.createdAt || data.publishedAt || data.updatedAt
  const publishedAt =
    publishedRaw && typeof publishedRaw === 'object' && 'toDate' in (publishedRaw as object)
      ? (publishedRaw as { toDate: () => Date }).toDate()
      : publishedRaw instanceof Date
        ? publishedRaw
        : publishedRaw
          ? new Date(publishedRaw as string | number)
          : null

  return {
    id,
    businessId: asString(data.businessId),
    title: asString(data.title) || 'Untitled role',
    description: asString(data.description),
    category: asString(data.category) || asString(data.jobType) || asString(data.type),
    status: normalizeStatus(data.status) || 'open',
    jobType: asString(data.jobType) || asString(data.type) || asString(data.roleType),
    location,
    experience:
      asString(data.experience) ||
      asString(data.experienceLevel) ||
      asString(data.experienceRequired),
    salary,
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  }
}

export function isActiveOffer(offer: DirectoryOffer): boolean {
  const status = offer.status
  if (status === 'pending_approval' || status === 'rejected' || status === 'archived') return false
  if (status === 'draft') return false
  if (offer.isAvailable === false) return false
  return status === 'active' || status === 'available' || status === 'published' || status === 'open'
}

export function isActiveJob(job: DirectoryJob): boolean {
  const status = job.status
  if (status === 'pending_approval' || status === 'rejected' || status === 'closed' || status === 'archived') {
    return false
  }
  return status === 'open' || status === 'published' || status === 'active'
}

function businessMatchesFilter(
  business: DirectoryBusiness,
  filter: MarketplaceDirectoryFilter,
  hasMemberDiscount: boolean
): boolean {
  if (filter === 'all') return true
  void hasMemberDiscount

  const haystack = [
    business.category,
    ...business.services,
  ]
    .join(' ')
    .toLowerCase()

  const needles: Record<Exclude<MarketplaceDirectoryFilter, 'all'>, string[]> = {
    services: ['service', 'services'],
    products: ['product', 'products'],
    technology: ['technology', 'tech'],
    hr: ['hr', 'human resources'],
    retail: ['retail'],
    'real-estate': ['real-estate', 'real estate', 'realestate'],
    automotive: ['automotive', 'auto'],
    fb: ['fb', 'f&b', 'food', 'beverage'],
    hospitality: ['hospitality'],
    'health-fitness': ['health', 'fitness', 'wellness'],
    consultancy: ['consultancy', 'consulting', 'consult'],
    business: ['business'],
    other: ['other'],
  }

  return needles[filter].some((needle) => haystack.includes(needle))
}

export type DirectorySort = 'default' | 'name-asc' | 'name-desc' | 'jobs-desc'

export interface DirectoryQueryOptions {
  filter?: MarketplaceDirectoryFilter
  searchTerm?: string
  location?: string
  companyType?: string
  sort?: DirectorySort
}

export function buildDirectoryFacetCounts(businesses: DirectoryBusiness[]): {
  categories: { id: MarketplaceDirectoryFilter; label: string; count: number }[]
  locations: { id: string; label: string; count: number }[]
  companyTypes: { id: string; label: string; count: number }[]
} {
  const categoryCounts = new Map<MarketplaceDirectoryFilter, number>()
  for (const tab of MARKETPLACE_DIRECTORY_TABS) {
    categoryCounts.set(tab.id, 0)
  }
  categoryCounts.set('all', businesses.length)

  const locationCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()

  for (const business of businesses) {
    for (const tab of MARKETPLACE_DIRECTORY_TABS) {
      if (tab.id === 'all') continue
      if (businessMatchesFilter(business, tab.id, false)) {
        categoryCounts.set(tab.id, (categoryCounts.get(tab.id) || 0) + 1)
      }
    }
    const loc = business.location.trim() || 'Unspecified'
    locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1)
    const typeKey = (business.companyType || 'other').trim().toLowerCase() || 'other'
    typeCounts.set(typeKey, (typeCounts.get(typeKey) || 0) + 1)
  }

  return {
    categories: MARKETPLACE_DIRECTORY_TABS.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: categoryCounts.get(tab.id) || 0,
    })),
    locations: Array.from(locationCounts.entries())
      .map(([id, count]) => ({ id, label: id, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    companyTypes: Array.from(typeCounts.entries())
      .map(([id, count]) => ({
        id,
        label: id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  }
}

export function buildDirectoryCards(
  businesses: DirectoryBusiness[],
  offers: DirectoryOffer[],
  jobs: DirectoryJob[],
  filterOrOptions: MarketplaceDirectoryFilter | DirectoryQueryOptions = 'all',
  searchTermLegacy = ''
): DirectoryBusinessCardData[] {
  const options: DirectoryQueryOptions =
    typeof filterOrOptions === 'string'
      ? { filter: filterOrOptions, searchTerm: searchTermLegacy }
      : filterOrOptions

  const filter = options.filter || 'all'
  const searchTerm = options.searchTerm || ''
  const locationFilter = (options.location || 'all').trim()
  const companyTypeFilter = (options.companyType || 'all').trim().toLowerCase()
  const sort = options.sort || 'default'

  const activeOffers = offers.filter(isActiveOffer)
  const activeJobs = jobs.filter(isActiveJob)

  const offersByBusiness = new Map<string, DirectoryOffer[]>()
  for (const offer of activeOffers) {
    if (!offer.businessId) continue
    const list = offersByBusiness.get(offer.businessId) || []
    list.push(offer)
    offersByBusiness.set(offer.businessId, list)
  }

  const jobsByBusiness = new Map<string, DirectoryJob[]>()
  for (const job of activeJobs) {
    if (!job.businessId) continue
    const list = jobsByBusiness.get(job.businessId) || []
    list.push(job)
    jobsByBusiness.set(job.businessId, list)
  }

  const term = searchTerm.trim().toLowerCase()

  // Deduplicate by business id
  const seen = new Set<string>()
  const uniqueBusinesses = businesses.filter((b) => {
    if (!b.id || seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })

  let cards = uniqueBusinesses
    .map((business) => {
      const businessOffers = offersByBusiness.get(business.id) || []
      const businessJobs = jobsByBusiness.get(business.id) || []
      const hasMemberDiscount = businessOffers.some((o) => o.isMemberDiscount)
      return {
        ...business,
        activeJobsCount: businessJobs.length,
        activeOffersCount: businessOffers.length,
        hasMemberDiscount,
      }
    })
    .filter((business) => businessMatchesFilter(business, filter, business.hasMemberDiscount))
    .filter((business) => {
      if (locationFilter === 'all' || !locationFilter) return true
      const loc = business.location.trim() || 'Unspecified'
      return loc === locationFilter
    })
    .filter((business) => {
      if (companyTypeFilter === 'all' || !companyTypeFilter) return true
      return (business.companyType || 'other').trim().toLowerCase() === companyTypeFilter
    })
    .filter((business) => {
      if (!term) return true
      const blob = [
        business.name,
        business.description,
        business.ownerName,
        business.category,
        business.companyType,
        business.location,
        ...business.services,
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(term)
    })

  if (sort === 'name-asc') {
    cards = [...cards].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sort === 'name-desc') {
    cards = [...cards].sort((a, b) => b.name.localeCompare(a.name))
  } else if (sort === 'jobs-desc') {
    cards = [...cards].sort((a, b) => b.activeJobsCount - a.activeJobsCount || a.name.localeCompare(b.name))
  }

  return cards
}

/** Public directory: approved + active businesses only. */
export function subscribeToApprovedBusinesses(
  callback: (businesses: DirectoryBusiness[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'businesses'),
    where('isApproved', '==', true),
    where('isActive', '==', true)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const businesses = snapshot.docs
        .map((d) => normalizeDirectoryBusiness(d.id, d.data() as Record<string, unknown>))
        .filter((b) => b.isApproved && b.isActive)
      callback(businesses)
    },
    (error) => {
      console.error('[marketplace-directory] businesses listener failed:', error)
      onError?.(error)
    }
  )
}

export function subscribeToDirectoryBusiness(
  businessId: string,
  callback: (business: DirectoryBusiness | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'businesses', businessId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null)
        return
      }
      const business = normalizeDirectoryBusiness(
        snapshot.id,
        snapshot.data() as Record<string, unknown>
      )
      callback(business.isApproved && business.isActive ? business : null)
    },
    (error) => {
      console.error('[marketplace-directory] business doc listener failed:', error)
      onError?.(error)
    }
  )
}

function mergeById<T extends { id: string }>(lists: T[][]): T[] {
  const map = new Map<string, T>()
  for (const list of lists) {
    for (const item of list) {
      if (!map.has(item.id)) map.set(item.id, item)
    }
  }
  return Array.from(map.values())
}

/** Prefer CMS `offers`; also merge legacy `businessOffers` used by the business portal. */
export function subscribeToAllOffers(
  callback: (offers: DirectoryOffer[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let canonical: DirectoryOffer[] = []
  let legacy: DirectoryOffer[] = []

  const emit = () => callback(mergeById([canonical, legacy]))

  const unsubA = onSnapshot(
    collection(db, 'offers'),
    (snapshot) => {
      canonical = snapshot.docs.map((d) =>
        normalizeDirectoryOffer(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] offers listener failed:', error)
      onError?.(error)
    }
  )

  const unsubB = onSnapshot(
    collection(db, 'businessOffers'),
    (snapshot) => {
      legacy = snapshot.docs.map((d) =>
        normalizeDirectoryOffer(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] businessOffers listener failed:', error)
      onError?.(error)
    }
  )

  return () => {
    unsubA()
    unsubB()
  }
}

/** Prefer CMS `jobs`; also merge legacy `businessOpportunities`. */
export function subscribeToAllJobs(
  callback: (jobs: DirectoryJob[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let canonical: DirectoryJob[] = []
  let legacy: DirectoryJob[] = []

  const emit = () => callback(mergeById([canonical, legacy]))

  const unsubA = onSnapshot(
    collection(db, 'jobs'),
    (snapshot) => {
      canonical = snapshot.docs.map((d) =>
        normalizeDirectoryJob(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] jobs listener failed:', error)
      onError?.(error)
    }
  )

  const unsubB = onSnapshot(
    collection(db, 'businessOpportunities'),
    (snapshot) => {
      legacy = snapshot.docs.map((d) =>
        normalizeDirectoryJob(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] businessOpportunities listener failed:', error)
      onError?.(error)
    }
  )

  return () => {
    unsubA()
    unsubB()
  }
}

export function subscribeToBusinessOffers(
  businessId: string,
  callback: (offers: DirectoryOffer[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let canonical: DirectoryOffer[] = []
  let legacy: DirectoryOffer[] = []
  const emit = () => callback(mergeById([canonical, legacy]))

  const unsubA = onSnapshot(
    query(collection(db, 'offers'), where('businessId', '==', businessId)),
    (snapshot) => {
      canonical = snapshot.docs.map((d) =>
        normalizeDirectoryOffer(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] business offers listener failed:', error)
      onError?.(error)
    }
  )

  const unsubB = onSnapshot(
    query(collection(db, 'businessOffers'), where('businessId', '==', businessId)),
    (snapshot) => {
      legacy = snapshot.docs.map((d) =>
        normalizeDirectoryOffer(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] legacy business offers listener failed:', error)
      onError?.(error)
    }
  )

  return () => {
    unsubA()
    unsubB()
  }
}

export function subscribeToBusinessJobs(
  businessId: string,
  callback: (jobs: DirectoryJob[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let canonical: DirectoryJob[] = []
  let legacy: DirectoryJob[] = []
  const emit = () => callback(mergeById([canonical, legacy]))

  const unsubA = onSnapshot(
    query(collection(db, 'jobs'), where('businessId', '==', businessId)),
    (snapshot) => {
      canonical = snapshot.docs.map((d) =>
        normalizeDirectoryJob(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] business jobs listener failed:', error)
      onError?.(error)
    }
  )

  const unsubB = onSnapshot(
    query(collection(db, 'businessOpportunities'), where('businessId', '==', businessId)),
    (snapshot) => {
      legacy = snapshot.docs.map((d) =>
        normalizeDirectoryJob(d.id, d.data() as Record<string, unknown>)
      )
      emit()
    },
    (error) => {
      console.error('[marketplace-directory] legacy opportunities listener failed:', error)
      onError?.(error)
    }
  )

  return () => {
    unsubA()
    unsubB()
  }
}
