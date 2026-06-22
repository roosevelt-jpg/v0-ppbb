import { db } from '@/lib/firebase'
import {
  BusinessOpportunity,
  BusinessOffer,
  BusinessLead,
  BusinessReferral,
  BusinessPartnership,
  BusinessSupportRequest,
  BusinessRating,
  BusinessPayment,
  BusinessAnalytics,
  JobApplication,
} from '@/lib/types'
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

// BUSINESS OPPORTUNITIES QUERIES

export async function createOpportunity(
  businessId: string,
  businessName: string,
  data: Omit<BusinessOpportunity, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessOpportunity> {
  const id = doc(collection(db, 'businessOpportunities')).id
  const now = Timestamp.now()
  const opportunity: BusinessOpportunity = {
    id,
    businessId,
    businessName,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessOpportunities', id), opportunity)
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
  callback: (opportunities: BusinessOpportunity[]) => void
) {
  const q = query(
    collection(db, 'businessOpportunities'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const opportunities = snapshot.docs.map((doc) => doc.data() as BusinessOpportunity)
    callback(opportunities)
  })
}

export async function updateOpportunity(
  opportunityId: string,
  data: Partial<BusinessOpportunity>
) {
  await updateDoc(doc(db, 'businessOpportunities', opportunityId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteOpportunity(opportunityId: string) {
  await deleteDoc(doc(db, 'businessOpportunities', opportunityId))
}

// BUSINESS OFFERS QUERIES

export async function createOffer(
  businessId: string,
  businessName: string,
  data: Omit<BusinessOffer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BusinessOffer> {
  const id = doc(collection(db, 'businessOffers')).id
  const now = Timestamp.now()
  const offer: BusinessOffer = {
    id,
    businessId,
    businessName,
    ...data,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'businessOffers', id), offer)
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

export function subscribeToBusinessOffers(
  businessId: string,
  callback: (offers: BusinessOffer[]) => void
) {
  const q = query(
    collection(db, 'businessOffers'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const offers = snapshot.docs.map((doc) => doc.data() as BusinessOffer)
    callback(offers)
  })
}

export async function updateOffer(offerId: string, data: Partial<BusinessOffer>) {
  await updateDoc(doc(db, 'businessOffers', offerId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteOffer(offerId: string) {
  await deleteDoc(doc(db, 'businessOffers', offerId))
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
  callback: (leads: BusinessLead[]) => void
) {
  const q = query(
    collection(db, 'businessLeads'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map((doc) => doc.data() as BusinessLead)
    callback(leads)
  })
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
  callback: (partnerships: BusinessPartnership[]) => void
) {
  const q = query(
    collection(db, 'businessPartnerships'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const partnerships = snapshot.docs.map((doc) => doc.data() as BusinessPartnership)
    callback(partnerships)
  })
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
  callback: (payments: BusinessPayment[]) => void
) {
  const q = query(
    collection(db, 'businessPayments'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map((doc) => doc.data() as BusinessPayment)
    callback(payments)
  })
}

export async function updatePayment(paymentId: string, data: Partial<BusinessPayment>) {
  await updateDoc(doc(db, 'businessPayments', paymentId), {
    ...data,
    updatedAt: Timestamp.now(),
  })
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
  callback: (analytics: BusinessAnalytics[]) => void
) {
  const q = query(
    collection(db, 'businessAnalytics'),
    where('businessId', '==', businessId),
    orderBy('month', 'desc'),
    limit(12)
  )
  return onSnapshot(q, (snapshot) => {
    const analytics = snapshot.docs.map((doc) => doc.data() as BusinessAnalytics)
    callback(analytics)
  })
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
    getBusinessOpportunities(businessId),
    getBusinessOffers(businessId),
    getBusinessLeads(businessId),
    getBusinessPartnerships(businessId),
    getBusinessPayments(businessId),
    getBusinessReferral(businessId),
    getBusinessRatings(businessId),
  ])

  const convertedLeads = leads.filter((l) => l.status === 'converted').length
  const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0
  const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0

  return {
    opportunitiesPosted: opportunities.length,
    openOpportunities: opportunities.filter((o) => o.status === 'open').length,
    offersPosted: offers.length,
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

// Get all open opportunities across every business (for the public jobs board
// and the member dashboard). Sorted client-side to avoid a composite index.
export async function getAllOpenOpportunities(): Promise<BusinessOpportunity[]> {
  const q = query(
    collection(db, 'businessOpportunities'),
    where('status', '==', 'open')
  )
  const snapshot = await getDocs(q)
  const opportunities = snapshot.docs.map((d) => d.data() as BusinessOpportunity)
  return opportunities.sort((a, b) => {
    const aTime = new Date(a.createdAt as any).getTime() || 0
    const bTime = new Date(b.createdAt as any).getTime() || 0
    return bTime - aTime
  })
}

export async function getOpportunityById(
  opportunityId: string
): Promise<BusinessOpportunity | null> {
  const ref = doc(db, 'businessOpportunities', opportunityId)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as BusinessOpportunity) : null
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
  },
  coverLetter?: string,
  resumeUrl?: string
): Promise<JobApplication> {
  const id = doc(collection(db, 'jobApplications')).id
  const now = Timestamp.now()
  const application: JobApplication = {
    id,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    businessId: opportunity.businessId,
    businessName: opportunity.businessName,
    applicantId: applicant.id,
    applicantName: applicant.name,
    applicantEmail: applicant.email,
    applicantPhone: applicant.phone || '',
    applicantAvatarUrl: applicant.avatarUrl || '',
    coverLetter: coverLetter || '',
    resumeUrl: resumeUrl || '',
    status: 'pending',
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  }
  await setDoc(doc(db, 'jobApplications', id), application)

  // Increment the opportunity's application count and track applicant id.
  const oppRef = doc(db, 'businessOpportunities', opportunity.id)
  const applicants = Array.isArray(opportunity.applicants) ? [...opportunity.applicants] : []
  if (!applicants.includes(applicant.id)) {
    applicants.push(applicant.id)
  }
  await updateDoc(oppRef, {
    applicants,
    applications: applicants.length,
    updatedAt: now.toDate(),
  })

  return application
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
  const apps = snapshot.docs.map((d) => d.data() as JobApplication)
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
  return snapshot.docs.map((d) => d.data() as JobApplication)
}

export async function updateApplicationStatus(
  applicationId: string,
  status: JobApplication['status']
): Promise<void> {
  await updateDoc(doc(db, 'jobApplications', applicationId), {
    status,
    updatedAt: Timestamp.now().toDate(),
  })
}
