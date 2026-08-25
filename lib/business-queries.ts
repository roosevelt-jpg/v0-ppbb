import { db } from '@/lib/firebase'
import {
  BusinessOpportunity,
  BusinessOffer,
  BusinessLead,
  BusinessReferral,
  BusinessPartnership,
  PartnershipRequest,
  ReferralRecord,
  BusinessSupportRequest,
  BusinessRating,
  BusinessPayment,
  BusinessAnalytics,
  JobApplication,
} from '@/lib/types'
import { Community } from '@/lib/community-types'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { normalizeOpportunityFromJob, isOpportunityExpired } from '@/lib/opportunity-utils'

function toCreatedAtMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().getTime()
    } catch {
      return 0
    }
  }
  const d = new Date(value as string)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

function isMissingFirestoreIndex(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : ''
  return code === 'failed-precondition'
}

/** Fetch business-owned docs; falls back to client sort when composite index is building. */
async function getByBusinessId<T extends { createdAt?: unknown }>(
  collectionName: string,
  businessId: string
): Promise<T[]> {
  const col = collection(db, collectionName)
  const mapDocs = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const items = docs.map((d) => ({ id: d.id, ...d.data() }) as T)
    items.sort((a, b) => toCreatedAtMillis(b.createdAt) - toCreatedAtMillis(a.createdAt))
    return items
  }

  try {
    const snap = await getDocs(
      query(col, where('businessId', '==', businessId), orderBy('createdAt', 'desc'))
    )
    return mapDocs(snap.docs)
  } catch (error) {
    if (isMissingFirestoreIndex(error)) {
      try {
        const snap = await getDocs(query(col, where('businessId', '==', businessId)))
        return mapDocs(snap.docs)
      } catch (fallbackError) {
        console.warn(`[v0] ${collectionName} fetch failed:`, fallbackError)
        return []
      }
    }
    console.warn(`[v0] ${collectionName} fetch failed:`, error)
    return []
  }
}

/** Subscribe to business-owned docs; falls back to client sort when composite index is building. */
function subscribeByBusinessId<T extends { createdAt?: unknown }>(
  collectionName: string,
  businessId: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
) {
  const col = collection(db, collectionName)
  const indexedQ = query(col, where('businessId', '==', businessId), orderBy('createdAt', 'desc'))
  const fallbackQ = query(col, where('businessId', '==', businessId))

  let fallbackUnsub: (() => void) | undefined

  const emit = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const items = docs.map((d) => ({ id: d.id, ...d.data() }) as T)
    items.sort((a, b) => toCreatedAtMillis(b.createdAt) - toCreatedAtMillis(a.createdAt))
    callback(items)
  }

  const unsub = onSnapshot(
    indexedQ,
    (snapshot) => emit(snapshot.docs),
    (error) => {
      if (isMissingFirestoreIndex(error)) {
        console.warn(`[v0] ${collectionName} index missing — using client-side sort until index builds`)
        fallbackUnsub = onSnapshot(
          fallbackQ,
          (snapshot) => emit(snapshot.docs),
          (fallbackError) => {
            console.error(`[v0] Error in ${collectionName} subscription:`, fallbackError)
            onError?.(fallbackError as Error)
            callback([])
          }
        )
        return
      }
      console.error(`[v0] Error in ${collectionName} subscription:`, error)
      onError?.(error as Error)
      callback([])
    }
  )

  return () => {
    unsub()
    fallbackUnsub?.()
  }
}

// BUSINESS OPPORTUNITIES QUERIES

/**
 * Business posts always start as pending_approval (admin must publish).
 * Prefer POST /api/business/opportunities (Admin SDK + role check) from UI.
 */
export async function createOpportunity(
  businessId: string,
  businessName: string,
  data: Omit<BusinessOpportunity, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessOpportunity> {
  const id = doc(collection(db, 'businessOpportunities')).id
  const now = Timestamp.now()
  // Enforce approval gate — ignore client-supplied live statuses
  const status: BusinessOpportunity['status'] =
    data.status === 'closed' || data.status === 'filled' || data.status === 'archived'
      ? data.status
      : 'pending_approval'
  const opportunity: BusinessOpportunity = {
    id,
    businessId,
    businessName,
    ...data,
    status,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessOpportunities', id), sanitizeForFirestore(opportunity as unknown as Record<string, unknown>))

  // Dual-write CMS canonical jobs collection (directory counts / profile)
  await setDoc(
    doc(db, 'jobs', id),
    sanitizeForFirestore({
      id,
      businessId,
      businessName,
      title: data.title,
      description: data.description || '',
      category: data.category || data.type || '',
      jobType: data.type || '',
      status,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    })
  )

  return opportunity
}

export async function getBusinessOpportunities(businessId: string) {
  const q = query(
    collection(db, 'businessOpportunities'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessOpportunity)
}

export function subscribeToBusinessOpportunities(
  businessId: string,
  callback: (opportunities: BusinessOpportunity[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeByBusinessId<BusinessOpportunity>(
    'businessOpportunities',
    businessId,
    callback,
    onError
  )
}

export async function updateOpportunity(
  opportunityId: string,
  data: Partial<BusinessOpportunity>
) {
  const now = Timestamp.now()
  const payload = sanitizeForFirestore({
    ...data,
    updatedAt: now,
  } as Record<string, unknown>)
  await updateDoc(doc(db, 'businessOpportunities', opportunityId), payload)
  // Keep canonical jobs in sync when status/title change
  if (data.status !== undefined || data.title !== undefined || data.description !== undefined) {
    try {
      await updateDoc(
        doc(db, 'jobs', opportunityId),
        sanitizeForFirestore({
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          updatedAt: now,
        })
      )
    } catch {
      // jobs dual-write may not exist for older records
    }
  }
}

export async function deleteOpportunity(opportunityId: string) {
  await deleteDoc(doc(db, 'businessOpportunities', opportunityId))
  try {
    await deleteDoc(doc(db, 'jobs', opportunityId))
  } catch {
    /* ignore */
  }
}

// BUSINESS OFFERS QUERIES

/**
 * Business offers always start as pending_approval (admin must publish).
 * Prefer POST /api/business/offers (Admin SDK + role check) from UI.
 */
export async function createOffer(
  businessId: string,
  businessName: string,
  data: Omit<BusinessOffer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessOffer> {
  const id = doc(collection(db, 'businessOffers')).id
  const now = Timestamp.now()
  // Enforce approval gate — ignore client-supplied live statuses
  const offerStatus: BusinessOffer['status'] =
    data.status === 'archived' ? 'archived' : 'pending_approval'
  const offer: BusinessOffer = {
    id,
    businessId,
    businessName,
    ...data,
    status: offerStatus,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessOffers', id), sanitizeForFirestore(offer as unknown as Record<string, unknown>))

  // Dual-write CMS canonical offers collection (directory counts / profile)
  const imageURL =
    (typeof data.imageUrl === 'string' && data.imageUrl) ||
    (data.image && typeof data.image === 'object' && 'url' in data.image
      ? String((data.image as { url?: string }).url || '')
      : '')
  const isMemberDiscount =
    data.type === 'discount' ||
    (typeof data.memberBenefit === 'number' && data.memberBenefit > 0) ||
    (typeof data.discountPercentage === 'number' && data.discountPercentage > 0)

  const categoryRaw = String(data.category || data.type || '').trim()
  const categoryNormalized =
    categoryRaw.toLowerCase() === 'merchandise' || categoryRaw.toLowerCase() === 'merch'
      ? 'merchandise'
      : categoryRaw

  const variant =
    typeof (data as { variant?: string }).variant === 'string'
      ? String((data as { variant?: string }).variant).trim()
      : ''

  await setDoc(
    doc(db, 'offers', id),
    sanitizeForFirestore({
      id,
      businessId,
      businessName,
      title: data.title,
      description: data.description || '',
      category: categoryNormalized,
      type: data.type || 'product',
      status: offerStatus,
      price: data.price,
      originalPrice: data.originalPrice,
      currency: 'AED',
      variant: variant || null,
      imageURL,
      images: imageURL ? [imageURL] : [],
      isMemberDiscount,
      memberBenefit: data.memberBenefit,
      discountPercentage: data.discountPercentage,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    })
  )

  return offer
}

export async function getBusinessOffers(businessId: string) {
  const q = query(
    collection(db, 'businessOffers'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessOffer)
}

// Get all active offers across every business (for the public marketplace and
// member dashboard marketplace). Sorted client-side to avoid a composite index.
export async function getAllActiveOffers(): Promise<BusinessOffer[]> {
  const q = query(
    collection(db, 'businessOffers'),
    where('status', '==', 'active')
  )
  const snapshot = await getDocs(q)
  const offers = snapshot.docs.map((d) => d.data() as BusinessOffer)
  return offers.sort((a, b) => {
    const aTime = new Date(a.createdAt as any).getTime() || 0
    const bTime = new Date(b.createdAt as any).getTime() || 0
    return bTime - aTime
  })
}

export function subscribeToBusinessOffers(
  businessId: string,
  callback: (offers: BusinessOffer[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeByBusinessId<BusinessOffer>('businessOffers', businessId, callback, onError)
}

export async function updateOffer(offerId: string, data: Partial<BusinessOffer>) {
  const now = Timestamp.now()
  const payload = sanitizeForFirestore({
    ...data,
    updatedAt: now,
  } as Record<string, unknown>)
  await updateDoc(doc(db, 'businessOffers', offerId), payload)
  if (data.status !== undefined || data.title !== undefined || data.description !== undefined) {
    try {
      await updateDoc(
        doc(db, 'offers', offerId),
        sanitizeForFirestore({
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          updatedAt: now,
        })
      )
    } catch {
      /* ignore */
    }
  }
}

export async function deleteOffer(offerId: string) {
  await deleteDoc(doc(db, 'businessOffers', offerId))
  try {
    await deleteDoc(doc(db, 'offers', offerId))
  } catch {
    /* ignore */
  }
}

// BUSINESS LEADS QUERIES

export async function createLead(
  businessId: string,
  data: Omit<BusinessLead, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessLead> {
  const id = doc(collection(db, 'businessLeads')).id
  const now = Timestamp.now()
  const lead: BusinessLead = {
    id,
    businessId,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessLeads', id), lead)
  return lead
}

export async function getBusinessLeads(businessId: string) {
  const q = query(
    collection(db, 'businessLeads'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessLead)
}

export function subscribeToBusinessLeads(
  businessId: string,
  callback: (leads: BusinessLead[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeByBusinessId<BusinessLead>('businessLeads', businessId, callback, onError)
}

export async function updateLead(leadId: string, data: Partial<BusinessLead>) {
  await updateDoc(doc(db, 'businessLeads', leadId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

// BUSINESS REFERRALS QUERIES

export async function getBusinessReferral(businessId: string) {
  const q = query(
    collection(db, 'businessReferrals'),
    where('businessId', '==', businessId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs[0]?.data() as BusinessReferral | undefined
}

export async function createOrUpdateReferral(
  businessId: string,
  data: Partial<BusinessReferral>
) {
  const existing = await getBusinessReferral(businessId)
  const now = Timestamp.now()
  
  if (existing) {
    await updateDoc(doc(db, 'businessReferrals', existing.id), {
      ...data,
      updatedAt: now,
    })
  } else {
    const id = doc(collection(db, 'businessReferrals')).id
    await setDoc(doc(db, 'businessReferrals', id), {
      id,
      businessId,
      ...data,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    })
  }
}

export function subscribeToReferral(
  businessId: string,
  callback: (referral: BusinessReferral | undefined) => void
) {
  const q = query(
    collection(db, 'businessReferrals'),
    where('businessId', '==', businessId)
  )
  return onSnapshot(q, (snapshot) => {
    const referral = snapshot.docs[0]?.data() as BusinessReferral | undefined
    callback(referral)
  })
}

export function subscribeToReferralRecords(
  referrerId: string,
  callback: (records: ReferralRecord[]) => void
) {
  const q = query(
    collection(db, 'referrals'),
    where('referrerId', '==', referrerId),
    orderBy('referredAt', 'desc')
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ReferralRecord
      )
      callback(records)
    },
    () => callback([])
  )
}

export async function updateBusinessReferralPercent(businessId: string, percent: number) {
  await updateDoc(doc(db, 'businesses', businessId), {
    referralContributionPercent: percent,
    referralPercent: percent,
    updatedAt: Timestamp.now(),
  })
  await createOrUpdateReferral(businessId, { referralPercentage: percent })
}

// BUSINESS PARTNERSHIPS QUERIES

export async function createPartnership(
  businessId: string,
  data: Omit<BusinessPartnership, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessPartnership> {
  const id = doc(collection(db, 'businessPartnerships')).id
  const now = Timestamp.now()
  const partnership: BusinessPartnership = {
    id,
    businessId,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessPartnerships', id), partnership)
  return partnership
}

export function subscribeToPartnershipRequests(
  submittedBy: string,
  callback: (requests: PartnershipRequest[]) => void
) {
  const q = query(
    collection(db, 'partnerships'),
    where('submittedBy', '==', submittedBy),
    orderBy('submittedAt', 'desc')
  )
  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as PartnershipRequest
      )
      callback(requests)
    },
    () => callback([])
  )
}

export async function getPartnershipRequestById(
  requestId: string
): Promise<PartnershipRequest | null> {
  const snap = await getDoc(doc(db, 'partnerships', requestId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as PartnershipRequest
}

export async function withdrawPartnershipRequest(requestId: string) {
  await updateDoc(doc(db, 'partnerships', requestId), {
    status: 'declined',
    updatedAt: Timestamp.now(),
  })
}

export async function getBusinessPartnerships(businessId: string) {
  const q = query(
    collection(db, 'businessPartnerships'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessPartnership)
}

export function subscribeToBusinessPartnerships(
  businessId: string,
  callback: (partnerships: BusinessPartnership[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeByBusinessId<BusinessPartnership>(
    'businessPartnerships',
    businessId,
    callback,
    onError
  )
}

export async function updatePartnership(
  partnershipId: string,
  data: Partial<BusinessPartnership>
) {
  await updateDoc(doc(db, 'businessPartnerships', partnershipId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

// BUSINESS SUPPORT REQUESTS QUERIES

export async function createSupportRequest(
  businessId: string,
  businessName: string,
  data: Omit<BusinessSupportRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessSupportRequest> {
  const id = doc(collection(db, 'businessSupportRequests')).id
  const now = Timestamp.now()
  const request: BusinessSupportRequest = {
    id,
    businessId,
    businessName,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessSupportRequests', id), request)
  return request
}

export async function getBusinessSupportRequests(businessId: string) {
  const q = query(
    collection(db, 'businessSupportRequests'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessSupportRequest)
}

export function subscribeToBusinessSupportRequests(
  businessId: string,
  callback: (requests: BusinessSupportRequest[]) => void
) {
  const q = query(
    collection(db, 'businessSupportRequests'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((doc) => doc.data() as BusinessSupportRequest)
    callback(requests)
  })
}

export async function updateSupportRequest(
  requestId: string,
  data: Partial<BusinessSupportRequest>
) {
  await updateDoc(doc(db, 'businessSupportRequests', requestId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

// BUSINESS RATINGS QUERIES

export async function createRating(
  businessId: string,
  ratedBy: string,
  data: Omit<BusinessRating, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessRating> {
  const id = doc(collection(db, 'businessRatings')).id
  const now = Timestamp.now()
  const rating: BusinessRating = {
    id,
    businessId,
    ratedBy,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessRatings', id), rating)
  return rating
}

export async function getBusinessRatings(businessId: string) {
  const q = query(
    collection(db, 'businessRatings'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessRating)
}

export async function getAverageRating(businessId: string): Promise<number> {
  const ratings = await getBusinessRatings(businessId)
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
  return sum / ratings.length
}

// BUSINESS PAYMENTS QUERIES

export async function createPayment(
  businessId: string,
  data: Omit<BusinessPayment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessPayment> {
  const id = doc(collection(db, 'businessPayments')).id
  const now = Timestamp.now()
  const payment: BusinessPayment = {
    id,
    businessId,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessPayments', id), payment)
  return payment
}

export async function getBusinessPayments(businessId: string) {
  const q = query(
    collection(db, 'businessPayments'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as BusinessPayment)
}

export function subscribeToBusinessPayments(
  businessId: string,
  callback: (payments: BusinessPayment[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeByBusinessId<BusinessPayment>(
    'businessPayments',
    businessId,
    callback,
    onError
  )
}

export async function updatePayment(paymentId: string, data: Partial<BusinessPayment>) {
  await updateDoc(doc(db, 'businessPayments', paymentId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

// BUSINESS COMMUNITIES QUERIES

export function subscribeToBusinessCommunities(
  businessId: string,
  callback: (communities: Community[]) => void,
  onError?: (error: Error) => void
) {
  const col = collection(db, 'communities')
  const indexedQ = query(col, where('businessId', '==', businessId), orderBy('createdAt', 'desc'))
  const fallbackQ = query(col, where('businessId', '==', businessId))

  let fallbackUnsub: (() => void) | undefined

  const emit = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const communities = docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt:
          (d.data().createdAt as { toDate?: () => Date })?.toDate?.() || d.data().createdAt,
        updatedAt:
          (d.data().updatedAt as { toDate?: () => Date })?.toDate?.() || d.data().updatedAt,
      }))
      .sort((a, b) => toCreatedAtMillis(b.createdAt) - toCreatedAtMillis(a.createdAt)) as Community[]
    callback(communities)
  }

  const unsub = onSnapshot(
    indexedQ,
    (snapshot) => emit(snapshot.docs),
    (error) => {
      if (isMissingFirestoreIndex(error)) {
        console.warn('[v0] communities index missing — using client-side sort until index builds')
        fallbackUnsub = onSnapshot(
          fallbackQ,
          (snapshot) => emit(snapshot.docs),
          (fallbackError) => {
            console.error('[v0] Error in subscribeToBusinessCommunities:', fallbackError)
            onError?.(fallbackError as Error)
            callback([])
          }
        )
        return
      }
      console.error('[v0] Error in subscribeToBusinessCommunities:', error)
      onError?.(error as Error)
      callback([])
    }
  )

  return () => {
    unsub()
    fallbackUnsub?.()
  }
}

export async function getBusinessCommunities(businessId: string): Promise<Community[]> {
  const q = query(
    collection(db, 'communities'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
  })) as Community[]
}

// BUSINESS ANALYTICS QUERIES

export async function getOrCreateAnalytics(
  businessId: string,
  month: string
): Promise<BusinessAnalytics> {
  const q = query(
    collection(db, 'businessAnalytics'),
    where('businessId', '==', businessId),
    where('month', '==', month)
  )
  const snapshot = await getDocs(q)
  
  if (snapshot.docs.length > 0) {
    return snapshot.docs[0].data() as BusinessAnalytics
  }
  
  const id = doc(collection(db, 'businessAnalytics')).id
  const now = Timestamp.now()
  const analytics: BusinessAnalytics = {
    id,
    businessId,
    month,
    opportunitiesPosted: 0,
    offersPosted: 0,
    leadsGenerated: 0,
    conversionRate: 0,
    impressions: 0,
    clicks: 0,
    referralCommissions: 0,
    eventAttendance: 0,
    networkConnections: 0,
    averageRating: 0,
    totalTransactions: 0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  
  await setDoc(doc(db, 'businessAnalytics', id), analytics)
  return analytics
}

export async function updateAnalytics(analyticsId: string, data: Partial<BusinessAnalytics>) {
  await updateDoc(doc(db, 'businessAnalytics', analyticsId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export function subscribeToBusinessAnalytics(
  businessId: string,
  callback: (analytics: BusinessAnalytics[]) => void,
  onError?: (error: Error) => void
) {
  const col = collection(db, 'businessAnalytics')
  const indexedQ = query(
    col,
    where('businessId', '==', businessId),
    orderBy('month', 'desc'),
    limit(12)
  )
  const fallbackQ = query(col, where('businessId', '==', businessId), limit(50))

  let fallbackUnsub: (() => void) | undefined

  const emit = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const analytics = docs
      .map((d) => ({ id: d.id, ...d.data() }) as BusinessAnalytics)
      .sort((a, b) => String(b.month || '').localeCompare(String(a.month || '')))
      .slice(0, 12)
    callback(analytics)
  }

  const unsub = onSnapshot(
    indexedQ,
    (snapshot) => emit(snapshot.docs),
    (error) => {
      if (isMissingFirestoreIndex(error)) {
        console.warn('[v0] businessAnalytics index missing — using client-side sort until index builds')
        fallbackUnsub = onSnapshot(
          fallbackQ,
          (snapshot) => emit(snapshot.docs),
          (fallbackError) => {
            console.error('[v0] Error in businessAnalytics subscription:', fallbackError)
            onError?.(fallbackError as Error)
            callback([])
          }
        )
        return
      }
      console.error('[v0] Error in businessAnalytics subscription:', error)
      onError?.(error as Error)
      callback([])
    }
  )

  return () => {
    unsub()
    fallbackUnsub?.()
  }
}

// UTILITY FUNCTIONS

export async function getBusinessDashboardStats(businessId: string) {
  const [
    opportunities,
    offers,
    leads,
    partnerships,
    payments,
    referral,
    ratings,
  ] = await Promise.all([
    getByBusinessId<BusinessOpportunity>('businessOpportunities', businessId),
    getByBusinessId<BusinessOffer>('businessOffers', businessId),
    getByBusinessId<BusinessLead>('businessLeads', businessId),
    getByBusinessId<BusinessPartnership>('businessPartnerships', businessId),
    getByBusinessId<BusinessPayment>('businessPayments', businessId),
    getBusinessReferral(businessId).catch(() => undefined),
    getByBusinessId<BusinessRating>('businessRatings', businessId),
  ])

  const convertedLeads = leads.filter((l) => l.status === 'converted').length
  const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0
  const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0

  // Own events only (createdBy == businessId) — never platform-wide
  let ownEvents = 0
  let ownPublishedEvents = 0
  try {
    const eventsSnap = await getDocs(
      query(collection(db, 'events'), where('createdBy', '==', businessId), limit(200))
    )
    ownEvents = eventsSnap.size
    ownPublishedEvents = eventsSnap.docs.filter((d) => d.data().status === 'published').length
  } catch {
    /* index or permission — leave zeros */
  }

  let ownGroups = 0
  try {
    const communities = await getBusinessCommunities(businessId)
    ownGroups = communities.length
  } catch {
    /* leave zero */
  }

  return {
    opportunitiesPosted: opportunities.length,
    openOpportunities: opportunities.filter((o) => o.status === 'open').length,
    pendingOpportunities: opportunities.filter((o) => o.status === 'pending_approval').length,
    offersPosted: offers.length,
    pendingOffers: offers.filter((o) => o.status === 'pending_approval').length,
    ownEvents,
    ownPublishedEvents,
    ownCommunities: ownGroups,
    leadsGenerated: leads.length,
    convertedLeads,
    conversionRate,
    partnerships: partnerships.filter((p) => p.status === 'active').length,
    referralEarnings: referral?.totalCommissions || 0,
    pendingCommission: referral?.pendingCommission || 0,
    averageRating,
    totalPayments: payments.length,
    completedPayments: payments.filter((p) => p.status === 'completed').length,
  }
}

// PUBLIC / CROSS-BUSINESS OPPORTUNITY BROWSING

// Get all published opportunities (jobs + legacy businessOpportunities).
export async function getAllOpenOpportunities(): Promise<BusinessOpportunity[]> {
  const jobsQ = query(collection(db, 'jobs'), where('status', 'in', ['published', 'open']))
  const legacyQ = query(collection(db, 'businessOpportunities'), where('status', '==', 'open'))

  const [jobsSnap, legacySnap] = await Promise.all([getDocs(jobsQ), getDocs(legacyQ)])

  const map = new Map<string, BusinessOpportunity>()
  for (const d of legacySnap.docs) {
    map.set(d.id, { id: d.id, ...d.data() } as BusinessOpportunity)
  }
  for (const d of jobsSnap.docs) {
    map.set(d.id, normalizeOpportunityFromJob(d.id, d.data() as Record<string, unknown>))
  }

  return Array.from(map.values())
    .filter((o) => !isOpportunityExpired(o))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt as Date).getTime() || 0
      const bTime = new Date(b.createdAt as Date).getTime() || 0
      return bTime - aTime
    })
}

export function subscribeToPublishedOpportunities(
  callback: (opportunities: BusinessOpportunity[]) => void
): () => void {
  const mergeAndEmit = () => {
    const map = new Map<string, BusinessOpportunity>()
    const apply = (id: string, data: Record<string, unknown>, fromJob: boolean) => {
      const status = String(data.status || '')
      if (fromJob && status !== 'published' && status !== 'open') return
      if (!fromJob && status !== 'open') return
      const opp = fromJob
        ? normalizeOpportunityFromJob(id, data)
        : ({ id, ...data } as BusinessOpportunity)
      if (!isOpportunityExpired(opp)) map.set(id, opp)
    }

    let jobsData: BusinessOpportunity[] = []
    let legacyData: BusinessOpportunity[] = []

    const emit = () => {
      const merged = new Map<string, BusinessOpportunity>()
      for (const o of legacyData) merged.set(o.id, o)
      for (const o of jobsData) merged.set(o.id, o)
      callback(
        Array.from(merged.values()).sort((a, b) => {
          const aT = new Date(a.createdAt as Date).getTime() || 0
          const bT = new Date(b.createdAt as Date).getTime() || 0
          return bT - aT
        })
      )
    }

    const unsubJobs = onSnapshot(
      query(collection(db, 'jobs'), where('status', 'in', ['published', 'open'])),
      (snap) => {
        jobsData = snap.docs.map((d) =>
          normalizeOpportunityFromJob(d.id, d.data() as Record<string, unknown>)
        )
        emit()
      },
      () => {
        jobsData = []
        emit()
      }
    )

    const unsubLegacy = onSnapshot(
      query(collection(db, 'businessOpportunities'), where('status', '==', 'open')),
      (snap) => {
        legacyData = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessOpportunity)
        emit()
      },
      () => {
        legacyData = []
        emit()
      }
    )

    return () => {
      unsubJobs()
      unsubLegacy()
    }
  }

  return mergeAndEmit()
}

export async function getOpportunityById(
  opportunityId: string
): Promise<BusinessOpportunity | null> {
  const jobRef = doc(db, 'jobs', opportunityId)
  const jobSnap = await getDoc(jobRef)
  if (jobSnap.exists()) {
    return normalizeOpportunityFromJob(jobSnap.id, jobSnap.data() as Record<string, unknown>)
  }
  const ref = doc(db, 'businessOpportunities', opportunityId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BusinessOpportunity) : null
}

// JOB APPLICATION QUERIES

export async function applyToOpportunity(
  opportunity: BusinessOpportunity,
  applicant: {
    id: string
    name: string
    email: string
    phone?: string
    avatarUrl?: string
    title?: string
    location?: string
    education?: string
    experience?: string
    volunteerHours?: number
    skills?: string[]
  },
  coverLetter?: string,
  resumeUrl?: string
): Promise<JobApplication> {
  const { auth } = await import('@/lib/firebase')
  const token = await auth.currentUser?.getIdToken()
  if (!token) {
    throw new Error('Sign in required to apply')
  }

  const res = await fetch('/api/jobs/apply', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      applicantPhone: applicant.phone || '',
      applicantAvatarUrl: applicant.avatarUrl || '',
      applicantTitle: applicant.title || '',
      applicantLocation: applicant.location || '',
      applicantEducation: applicant.education || '',
      applicantExperience: applicant.experience || '',
      applicantVolunteerHours:
        typeof applicant.volunteerHours === 'number' ? applicant.volunteerHours : null,
      applicantSkills: Array.isArray(applicant.skills) ? applicant.skills.filter(Boolean) : [],
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
    }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to submit application')
  }

  const data = (json.data || {}) as Record<string, unknown>
  return {
    id: String(data.id || ''),
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    businessId: opportunity.businessId,
    businessName: opportunity.businessName,
    applicantId: applicant.id,
    applicantName: applicant.name,
    applicantEmail: applicant.email,
    applicantPhone: applicant.phone || '',
    applicantAvatarUrl: applicant.avatarUrl || '',
    applicantTitle: applicant.title || '',
    applicantLocation: applicant.location || '',
    applicantEducation: applicant.education || '',
    applicantExperience: applicant.experience || '',
    applicantVolunteerHours:
      typeof applicant.volunteerHours === 'number' ? applicant.volunteerHours : undefined,
    applicantSkills: Array.isArray(applicant.skills) ? applicant.skills.filter(Boolean) : [],
    coverLetter: coverLetter || '',
    resumeUrl: resumeUrl || '',
    status: 'pending',
    createdAt: data.createdAt ? new Date(String(data.createdAt)) : new Date(),
    updatedAt: data.updatedAt ? new Date(String(data.updatedAt)) : new Date(),
  } as JobApplication
}

// Has a given member already applied to a given opportunity?
export async function hasApplied(
  opportunityId: string,
  applicantId: string
): Promise<boolean> {
  const q = query(
    collection(db, 'jobApplications'),
    where('opportunityId', '==', opportunityId),
    where('applicantId', '==', applicantId)
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

// All applications a member has submitted.
export async function getMemberApplications(
  applicantId: string
): Promise<JobApplication[]> {
  const q = query(
    collection(db, 'jobApplications'),
    where('applicantId', '==', applicantId)
  )
  const snapshot = await getDocs(q)
  const apps = snapshot.docs.map((d) => d.data() as JobApplication)
  return apps.sort((a, b) => {
    const aTime = new Date(a.createdAt as any).getTime() || 0
    const bTime = new Date(b.createdAt as any).getTime() || 0
    return bTime - aTime
  })
}

// All applications submitted to a business (for the business applicants view).
export async function getBusinessApplications(
  businessId: string
): Promise<JobApplication[]> {
  const q = query(
    collection(db, 'jobApplications'),
    where('businessId', '==', businessId)
  )
  const snapshot = await getDocs(q)
  const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as JobApplication)
  return apps.sort((a, b) => {
    const aTime = new Date(a.createdAt as any).getTime() || 0
    const bTime = new Date(b.createdAt as any).getTime() || 0
    return bTime - aTime
  })
}

// Applications for one specific opportunity.
export async function getOpportunityApplications(
  opportunityId: string
): Promise<JobApplication[]> {
  const q = query(
    collection(db, 'jobApplications'),
    where('opportunityId', '==', opportunityId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as JobApplication)
}

export async function updateApplicationStatus(
  applicationId: string,
  status: JobApplication['status']
): Promise<void> {
  const payload = {
    status,
    updatedAt: Timestamp.now().toDate(),
  }
  const appRef = doc(db, 'jobApplications', applicationId)
  await updateDoc(appRef, payload)

  // Keep jobs/{id}/applications mirror in sync when present
  try {
    const snap = await getDoc(appRef)
    const opportunityId = snap.exists() ? String(snap.data()?.opportunityId || '') : ''
    if (opportunityId) {
      await updateDoc(doc(db, 'jobs', opportunityId, 'applications', applicationId), payload).catch(
        () => undefined
      )
    }
  } catch {
    /* mirror is best-effort */
  }
}

// ======================== ADDITIONAL BUSINESS SUITE QUERIES ========================

// JOBS QUERIES (Enhanced)
export async function createJob(jobData: any): Promise<string> {
  const docRef = await addDoc(collection(db, 'jobs'), {
    ...jobData,
    applicantCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getJob(jobId: string): Promise<any> {
  const snapshot = await getDoc(doc(db, 'jobs', jobId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

// REFERRAL EARNINGS QUERIES
export async function getReferralEarnings(businessId: string): Promise<number> {
  const referrals = await getBusinessReferral(businessId)
  return referrals?.totalCommissions || 0
}

// VENDOR APPLICATION QUERIES
export async function createVendorApplication(applicationData: any): Promise<string> {
  const docRef = await addDoc(collection(db, 'vendorApplications'), {
    ...applicationData,
    status: 'pending',
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getAllVendorApplications(): Promise<any[]> {
  const q = query(collection(db, 'vendorApplications'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateVendorApplication(applicationId: string, updates: any): Promise<void> {
  await updateDoc(doc(db, 'vendorApplications', applicationId), {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}
