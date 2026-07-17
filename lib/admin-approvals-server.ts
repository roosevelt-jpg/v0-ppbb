import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export type ApprovalItemType =
  | 'beneficiary'
  | 'vendor'
  | 'business'
  | 'offer'
  | 'job'
  | 'discount'
  | 'event'
  | 'donation'
  | 'community'
  | 'group'
  | 'partnership'
  | 'contact'
  | 'form_submission'

export type ApprovalItem = {
  id: string
  type: ApprovalItemType
  title: string
  description?: string
  submittedBy?: string
  createdAt: string | null
  amount?: number
  href: string
  communityId?: string
}

function toIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') {
      try {
        return maybe.toDate().toISOString()
      } catch {
        return null
      }
    }
  }
  return null
}

function pushItem(items: ApprovalItem[], item: ApprovalItem) {
  if (!items.some((x) => x.type === item.type && x.id === item.id)) {
    items.push(item)
  }
}

export async function loadPendingApprovals(): Promise<ApprovalItem[]> {
  const db = getAdminDb()
  const items: ApprovalItem[] = []
  const seenOffers = new Set<string>()
  const seenJobs = new Set<string>()

  const add = (item: ApprovalItem) => pushItem(items, item)

  const results = await Promise.allSettled([
    db.collection('beneficiaryRequests').where('status', '==', 'pending').limit(100).get(),
    db.collection('vendorApplications').where('status', '==', 'pending').limit(100).get(),
    db.collection('offers').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('businessOffers').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('jobs').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('businessOpportunities').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('discounts').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('businesses').where('isApproved', '==', false).limit(100).get(),
    db.collection('donationSubmissions').where('status', '==', 'pending').limit(100).get(),
    db.collection('events').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('partnerships').where('status', '==', 'pending').limit(100).get(),
    db.collection('communities').where('status', '==', 'pending_approval').limit(100).get(),
    db.collectionGroup('groups').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('contactSubmissions').where('status', '==', 'unread').limit(100).get(),
    db.collection('formSubmissions').where('status', '==', 'pending').limit(100).get(),
  ])

  const snap = (index: number) =>
    results[index].status === 'fulfilled' ? results[index].value : { docs: [] as never[] }

  const beneficiarySnap = snap(0)
  const vendorSnap = snap(1)
  const offersSnap = snap(2)
  const legacyOffersSnap = snap(3)
  const jobsSnap = snap(4)
  const legacyJobsSnap = snap(5)
  const discountsSnap = snap(6)
  const businessesSnap = snap(7)
  const donationsSnap = snap(8)
  const eventsSnap = snap(9)
  const partnershipsSnap = snap(10)
  const communitiesSnap = snap(11)
  const groupsSnap = snap(12)
  const contactSnap = snap(13)
  const formSubmissionsSnap = snap(14)

  for (const failed of results) {
    if (failed.status === 'rejected') {
      console.warn('[admin-approvals] query failed:', failed.reason)
    }
  }

  for (const doc of beneficiarySnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'beneficiary',
      title: String(d.fullName || d.name || 'Beneficiary request'),
      description: String(d.reasonCategory || d.motivation || ''),
      submittedBy: String(d.email || d.userId || ''),
      createdAt: toIso(d.createdAt || d.submissionDate),
      href: '/admin/beneficiary-requests',
    })
  }

  for (const doc of vendorSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'vendor',
      title: String(d.businessName || 'Vendor application'),
      description: String(d.description || ''),
      submittedBy: String(d.contactEmail || d.applicantId || ''),
      createdAt: toIso(d.createdAt || d.submittedAt),
      href: '/admin/vendor-applications',
    })
  }

  for (const doc of offersSnap.docs) {
    seenOffers.add(doc.id)
    const d = doc.data()
    add({
      id: doc.id,
      type: 'offer',
      title: String(d.title || 'Marketplace offer'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.businessId || ''),
      createdAt: toIso(d.createdAt),
      amount: typeof d.price === 'number' ? d.price : undefined,
      href: '/admin/marketplace',
    })
  }

  for (const doc of legacyOffersSnap.docs) {
    if (seenOffers.has(doc.id)) continue
    const d = doc.data()
    add({
      id: doc.id,
      type: 'offer',
      title: String(d.title || 'Marketplace offer'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.businessId || ''),
      createdAt: toIso(d.createdAt),
      amount: typeof d.price === 'number' ? d.price : undefined,
      href: '/admin/marketplace',
    })
  }

  for (const doc of jobsSnap.docs) {
    seenJobs.add(doc.id)
    const d = doc.data()
    add({
      id: doc.id,
      type: 'job',
      title: String(d.title || 'Job listing'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.businessId || ''),
      createdAt: toIso(d.createdAt),
      href: '/admin/opportunities',
    })
  }

  for (const doc of legacyJobsSnap.docs) {
    if (seenJobs.has(doc.id)) continue
    const d = doc.data()
    add({
      id: doc.id,
      type: 'job',
      title: String(d.title || 'Job listing'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.businessId || ''),
      createdAt: toIso(d.createdAt),
      href: '/admin/opportunities',
    })
  }

  for (const doc of discountsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'discount',
      title: String(d.title || 'Member discount'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.businessId || ''),
      createdAt: toIso(d.createdAt),
      href: '/admin/marketplace',
    })
  }

  for (const doc of businessesSnap.docs) {
    const d = doc.data()
    if (d.isApproved === true) continue
    add({
      id: doc.id,
      type: 'business',
      title: String(d.name || d.businessName || 'Business profile'),
      description: String(d.description || d.category || ''),
      submittedBy: String(d.userId || d.ownerId || doc.id),
      createdAt: toIso(d.createdAt),
      href: '/admin/businesses',
    })
  }

  for (const doc of donationsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'donation',
      title: String(d.causeName || d.causeTitle || 'Donation proof'),
      description: String(d.reference || ''),
      submittedBy: String(d.userEmail || d.userId || ''),
      createdAt: toIso(d.createdAt || d.submittedAt),
      amount: typeof d.amount === 'number' ? d.amount : undefined,
      href: '/admin/finance/donations',
    })
  }

  for (const doc of eventsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'event',
      title: String(d.title || d.name || 'Event'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.createdBy || d.organizerId || ''),
      createdAt: toIso(d.createdAt),
      href: `/admin/events/${doc.id}`,
    })
  }

  for (const doc of partnershipsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'partnership',
      title: String(d.title || d.partnerName || 'Partnership request'),
      description: String(d.description || ''),
      submittedBy: String(d.submittedBy || d.businessId || ''),
      createdAt: toIso(d.submittedAt || d.createdAt),
      href: '/admin/partnerships',
    })
  }

  for (const doc of communitiesSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'community',
      title: String(d.name || 'Community'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.createdBy || ''),
      createdAt: toIso(d.createdAt),
      href: '/admin/communities',
    })
  }

  for (const doc of groupsSnap.docs) {
    const d = doc.data()
    const communityId = doc.ref.parent.parent?.id || ''
    add({
      id: doc.id,
      type: 'group',
      title: String(d.name || 'Group'),
      description: String(d.description || '').slice(0, 200),
      submittedBy: String(d.createdBy || ''),
      createdAt: toIso(d.createdAt),
      href: communityId ? `/admin/communities/${communityId}` : '/admin/communities',
      communityId: communityId || undefined,
    })
  }

  for (const doc of contactSnap.docs) {
    const d = doc.data()
    const category = String(d.category || d.inquiryType || 'other')
    add({
      id: doc.id,
      type: 'contact',
      title: String(d.subject || d.name || 'Contact inquiry'),
      description: `${category}: ${String(d.message || d.body || '').slice(0, 180)}`,
      submittedBy: String(d.email || d.name || ''),
      createdAt: toIso(d.submittedAt || d.createdAt),
      href: '/admin/contact-submissions',
    })
  }

  for (const doc of formSubmissionsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'form_submission',
      title: String(d.formTitle || d.formName || 'Form submission'),
      description: String(d.summary || d.email || '').slice(0, 200),
      submittedBy: String(d.email || d.submittedBy || d.userId || ''),
      createdAt: toIso(d.submittedAt || d.createdAt),
      href: d.formId ? `/admin/forms/${d.formId}` : '/admin/forms',
    })
  }

  items.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  return items
}

export async function processApprovalAction(
  adminUid: string,
  params: {
    type: ApprovalItemType
    id: string
    action: 'approve' | 'reject'
    communityId?: string
    notes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb()
  const now = Timestamp.now()
  const { type, id, action, communityId, notes } = params

  try {
    if (type === 'beneficiary') {
      await db.collection('beneficiaryRequests').doc(id).update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: adminUid,
        reviewDate: now,
        reviewNotes: notes || null,
        updatedAt: now,
      })
      return { success: true }
    }

    if (type === 'vendor') {
      if (action === 'reject') {
        await db.collection('vendorApplications').doc(id).update({
          status: 'rejected',
          reviewedAt: now,
          reviewedBy: adminUid,
        })
        return { success: true }
      }
      return {
        success: false,
        error: 'Approve vendor applications from Vendor Applications (requires a linked member account).',
      }
    }

    if (type === 'business') {
      if (action === 'approve') {
        const { ensureBusinessReferralCode } = await import('@/lib/referral-code-server')
        const ref = db.collection('businesses').doc(id)
        const snap = await ref.get()
        const data = snap.data() || {}
        await ref.set(
          sanitizeForFirestore({
            isApproved: true,
            isActive: true,
            status: 'approved',
            approvedAt: now,
            updatedAt: now,
          }),
          { merge: true }
        )
        await ensureBusinessReferralCode(
          db,
          id,
          String(data.name || data.businessName || 'Business'),
          typeof data.referralCode === 'string' ? data.referralCode : null
        )
      } else {
        await db.collection('businesses').doc(id).set(
          sanitizeForFirestore({
            isApproved: false,
            status: 'rejected',
            rejectedAt: now,
            updatedAt: now,
          }),
          { merge: true }
        )
      }
      return { success: true }
    }

    if (type === 'offer') {
      const updates =
        action === 'approve'
          ? { status: 'published', isAvailable: true, approvedAt: now, approvedBy: adminUid }
          : { status: 'archived', isAvailable: false, rejectedAt: now, rejectedBy: adminUid }
      await syncDualCollection(db, id, 'offers', 'businessOffers', updates, action === 'approve')
      return { success: true }
    }

    if (type === 'job') {
      const updates =
        action === 'approve'
          ? { status: 'published', approvedAt: now, approvedBy: adminUid }
          : { status: 'closed', closedAt: now, closedBy: adminUid }
      await syncDualCollection(db, id, 'jobs', 'businessOpportunities', updates, false)
      return { success: true }
    }

    if (type === 'discount') {
      await db.collection('discounts').doc(id).update(
        sanitizeForFirestore({
          status: action === 'approve' ? 'active' : 'expired',
          approvedAt: action === 'approve' ? now : undefined,
          approvedBy: action === 'approve' ? adminUid : undefined,
          updatedAt: now,
        })
      )
      return { success: true }
    }

    if (type === 'event') {
      await db.collection('events').doc(id).update(
        sanitizeForFirestore({
          status: action === 'approve' ? 'published' : 'rejected',
          approvedAt: action === 'approve' ? now : undefined,
          approvedBy: action === 'approve' ? adminUid : undefined,
          approvalNotes: action === 'reject' ? notes || null : undefined,
          updatedAt: now,
        })
      )
      return { success: true }
    }

    if (type === 'donation') {
      await db.collection('donationSubmissions').doc(id).update({
        status: action === 'approve' ? 'verified' : 'rejected',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      return { success: true }
    }

    if (type === 'partnership') {
      await db.collection('partnerships').doc(id).update({
        status: action === 'approve' ? 'active' : 'ended',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      return { success: true }
    }

    if (type === 'community') {
      await db.collection('communities').doc(id).update({
        status: action === 'approve' ? 'active' : 'archived',
        approvedBy: action === 'approve' ? adminUid : undefined,
        approvedAt: action === 'approve' ? now : undefined,
        rejectionReason: action === 'reject' ? notes || null : undefined,
        updatedAt: now,
      })
      return { success: true }
    }

    if (type === 'group') {
      if (!communityId) return { success: false, error: 'communityId required for group approval' }
      await db.collection('communities').doc(communityId).collection('groups').doc(id).update({
        status: action === 'approve' ? 'active' : 'archived',
        approvedBy: action === 'approve' ? adminUid : undefined,
        approvedAt: action === 'approve' ? now : undefined,
        updatedAt: now,
      })
      return { success: true }
    }

    if (type === 'contact') {
      await db.collection('contactSubmissions').doc(id).update({
        status: action === 'approve' ? 'read' : 'archived',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      return { success: true }
    }

    if (type === 'form_submission') {
      await db.collection('formSubmissions').doc(id).update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      return { success: true }
    }

    return { success: false, error: 'Unknown approval type' }
  } catch (error) {
    console.error('[admin-approvals] action failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Action failed',
    }
  }
}

async function syncDualCollection(
  db: Firestore,
  id: string,
  primary: string,
  legacy: string,
  updates: Record<string, unknown>,
  legacyPublishAsActive: boolean
) {
  const payload = sanitizeForFirestore({ ...updates, updatedAt: Timestamp.now() })
  const [primarySnap, legacySnap] = await Promise.all([
    db.collection(primary).doc(id).get(),
    db.collection(legacy).doc(id).get(),
  ])
  const writes: Promise<unknown>[] = []
  if (primarySnap.exists) writes.push(db.collection(primary).doc(id).update(payload))
  if (legacySnap.exists) {
    const legacyPayload = { ...payload } as Record<string, unknown>
    if (legacyPublishAsActive && updates.status === 'published') {
      legacyPayload.status = 'active'
    }
    writes.push(db.collection(legacy).doc(id).update(legacyPayload))
  }
  await Promise.all(writes)
}
