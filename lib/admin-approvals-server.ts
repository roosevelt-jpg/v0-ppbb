import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { paragraphs, sendBrandedEmailToUserSafe, sendBrandedEmailSafe } from '@/lib/platform-email'

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
  /** Full inquiry / body text for in-page review */
  message?: string
  submittedBy?: string
  createdAt: string | null
  amount?: number
  /** Deep link to the dedicated admin page for this item */
  href: string
  /** Human label for the destination (e.g. “Marketplace discounts”) */
  destinationLabel?: string
  communityId?: string
  formId?: string
  queue: 'forms' | 'listings'
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

  const add = (item: ApprovalItem) => pushItem(items, item)

  const results = await Promise.allSettled([
    db.collection('beneficiaryRequests').where('status', '==', 'pending').limit(100).get(),
    db.collection('offers').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('businessOffers').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('discounts').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('businesses').where('isApproved', '==', false).limit(100).get(),
    db.collection('donationSubmissions').where('status', '==', 'pending').limit(100).get(),
    db.collection('events').where('status', '==', 'pending_approval').limit(100).get(),
    db.collection('partnerships').where('status', '==', 'pending').limit(100).get(),
    db.collection('contactSubmissions').where('status', '==', 'unread').limit(100).get(),
    db.collection('formSubmissions').where('status', '==', 'pending').limit(100).get(),
  ])

  const snap = (index: number) =>
    results[index].status === 'fulfilled' ? results[index].value : { docs: [] as never[] }

  const beneficiarySnap = snap(0)
  const offersSnap = snap(1)
  const legacyOffersSnap = snap(2)
  const discountsSnap = snap(3)
  const businessesSnap = snap(4)
  const donationsSnap = snap(5)
  const eventsSnap = snap(6)
  const partnershipsSnap = snap(7)
  const contactSnap = snap(8)
  const formSubmissionsSnap = snap(9)

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
      message: String(d.motivation || d.reasonDetails || d.description || d.reasonCategory || ''),
      submittedBy: String(d.email || d.phone || d.userId || ''),
      createdAt: toIso(d.createdAt || d.submissionDate),
      href: `/admin/beneficiary-requests?focus=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Beneficiary requests',
      queue: 'forms',
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
      message: String(d.description || ''),
      submittedBy: String(d.businessName || d.businessId || ''),
      createdAt: toIso(d.createdAt),
      amount: typeof d.price === 'number' ? d.price : undefined,
      href: `/admin/marketplace?section=offers&focus=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Marketplace · Offers',
      queue: 'listings',
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
      message: String(d.description || ''),
      submittedBy: String(d.businessName || d.businessId || ''),
      createdAt: toIso(d.createdAt),
      amount: typeof d.price === 'number' ? d.price : undefined,
      href: `/admin/marketplace?section=offers&focus=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Marketplace · Offers',
      queue: 'listings',
    })
  }

  for (const doc of discountsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'discount',
      title: String(d.title || 'Member discount'),
      description: String(d.description || '').slice(0, 200),
      message: String(d.description || ''),
      submittedBy: String(d.businessName || d.businessId || ''),
      createdAt: toIso(d.createdAt),
      href: `/admin/marketplace?section=discounts&focus=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Marketplace · Discounts',
      queue: 'listings',
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
      message: String(d.description || d.about || ''),
      submittedBy: String(d.email || d.businessEmail || d.contactEmail || d.userId || d.ownerId || doc.id),
      createdAt: toIso(d.createdAt),
      href: `/admin/businesses?focus=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Businesses',
      queue: 'listings',
    })
  }

  for (const doc of donationsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'donation',
      title: String(d.causeName || d.causeTitle || 'Donation proof'),
      description: String(d.reference || ''),
      message: String(d.notes || d.reference || ''),
      submittedBy: String(d.userEmail || d.userName || ''),
      createdAt: toIso(d.createdAt || d.submittedAt),
      amount: typeof d.amount === 'number' ? d.amount : undefined,
      href: `/admin/finance/donations?focus=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Donation proofs',
      queue: 'forms',
    })
  }

  for (const doc of eventsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'event',
      title: String(d.title || d.name || 'Event'),
      description: String(d.description || '').slice(0, 200),
      message: String(d.description || ''),
      submittedBy: String(d.hostName || d.businessName || d.createdBy || d.organizerId || ''),
      createdAt: toIso(d.createdAt),
      href: `/admin/events/${doc.id}`,
      destinationLabel: 'Event review',
      queue: 'listings',
    })
  }

  for (const doc of partnershipsSnap.docs) {
    const d = doc.data()
    add({
      id: doc.id,
      type: 'partnership',
      title: String(d.title || d.partnerName || 'Partnership request'),
      description: String(d.description || '').slice(0, 200),
      message: String(d.description || ''),
      submittedBy: String(d.submitterEmail || d.submitterName || d.submittedBy || d.businessId || ''),
      createdAt: toIso(d.submittedAt || d.createdAt),
      href: `/admin/contact-submissions?category=partnership&id=${encodeURIComponent(`partnership:${doc.id}`)}`,
      destinationLabel: 'Contact · Partnerships',
      queue: 'forms',
    })
  }

  for (const doc of contactSnap.docs) {
    const d = doc.data()
    const category = String(d.category || d.inquiryType || d.source || 'contact')
    add({
      id: doc.id,
      type: 'contact',
      title: String(d.subject || d.name || 'Contact inquiry'),
      description: `${category}: ${String(d.message || d.body || '').slice(0, 180)}`,
      message: String(d.message || d.body || ''),
      submittedBy: String(d.email || d.name || ''),
      createdAt: toIso(d.submittedAt || d.createdAt),
      href: `/admin/contact-submissions?id=${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Contact submissions',
      queue: 'forms',
    })
  }

  for (const doc of formSubmissionsSnap.docs) {
    const d = doc.data()
    const formId = typeof d.formId === 'string' ? d.formId : ''
    const responses = d.responses && typeof d.responses === 'object' ? d.responses : null
    let message = String(d.summary || '')
    if (!message && responses) {
      message = Object.entries(responses as Record<string, unknown>)
        .slice(0, 8)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join('\n')
    }
    add({
      id: doc.id,
      type: 'form_submission',
      title: String(d.formTitle || d.formName || 'Form submission'),
      description: String(d.summary || d.email || '').slice(0, 200),
      message,
      submittedBy: String(d.email || d.submittedBy || d.userId || ''),
      createdAt: toIso(d.submittedAt || d.createdAt),
      href: `/admin/forms/submissions/${encodeURIComponent(doc.id)}`,
      destinationLabel: 'Form submission detail',
      formId: formId || undefined,
      queue: 'forms',
    })
  }

  items.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  return items
}

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://www.passive-blessings.com'
  ).replace(/\/$/, '')
}

function notifyApprovalOutcome(opts: {
  userId?: string
  email?: string
  subject: string
  purpose: string
  headline: string
  body: string
  ctaLabel: string
  ctaPath: string
}) {
  const cta = { label: opts.ctaLabel, url: `${siteBase()}${opts.ctaPath}` }
  const bodyHtml = paragraphs('Assalamu alaikum,', opts.body)
  const userId = String(opts.userId || '').trim()
  if (userId) {
    sendBrandedEmailToUserSafe({
      userId,
      subject: opts.subject,
      purpose: opts.purpose,
      headline: opts.headline,
      bodyHtml,
      cta,
    })
    return
  }
  if (opts.email && opts.email.includes('@')) {
    sendBrandedEmailSafe({
      to: opts.email,
      subject: opts.subject,
      purpose: opts.purpose,
      headline: opts.headline,
      bodyHtml,
      cta,
    })
  }
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
      const snap = await db.collection('beneficiaryRequests').doc(id).get()
      const d = snap.data() || {}
      await db.collection('beneficiaryRequests').doc(id).update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: adminUid,
        reviewDate: now,
        reviewNotes: notes || null,
        updatedAt: now,
      })
      notifyApprovalOutcome({
        userId: String(d.userId || ''),
        email: String(d.email || ''),
        subject: action === 'approve' ? 'Beneficiary request approved' : 'Beneficiary request update',
        purpose:
          action === 'approve'
            ? 'Beneficiary request approval'
            : 'Beneficiary request rejection',
        headline: action === 'approve' ? 'Request approved' : 'Request not approved',
        body:
          action === 'approve'
            ? 'Your beneficiary request has been approved.'
            : notes
              ? `Your beneficiary request was not approved: ${notes}`
              : 'Your beneficiary request was not approved.',
        ctaLabel: 'Open dashboard',
        ctaPath: '/dashboard',
      })
      return { success: true }
    }

    if (type === 'vendor') {
      if (action === 'reject') {
        const snap = await db.collection('vendorApplications').doc(id).get()
        const d = snap.data() || {}
        await db.collection('vendorApplications').doc(id).update({
          status: 'rejected',
          reviewedAt: now,
          reviewedBy: adminUid,
        })
        notifyApprovalOutcome({
          userId: String(d.userId || d.applicantId || ''),
          email: String(d.email || ''),
          subject: 'Vendor application update',
          purpose: 'Vendor application rejection',
          headline: 'Application not approved',
          body: notes
            ? `Your vendor application was not approved: ${notes}`
            : 'Your vendor application was not approved.',
          ctaLabel: 'Open dashboard',
          ctaPath: '/dashboard',
        })
        return { success: true }
      }
      return {
        success: false,
        error: 'Approve vendor applications from Vendor Applications (requires a linked member account).',
      }
    }

    if (type === 'business') {
      const ref = db.collection('businesses').doc(id)
      const snap = await ref.get()
      const data = snap.data() || {}
      const businessName = String(data.name || data.businessName || 'Business')
      const ownerId = String(data.ownerId || data.userId || id)
      if (action === 'approve') {
        const { ensureBusinessReferralCode } = await import('@/lib/referral-code-server')
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
          businessName,
          typeof data.referralCode === 'string' ? data.referralCode : null
        )
        notifyApprovalOutcome({
          userId: ownerId,
          email: String(data.email || data.contactEmail || ''),
          subject: `Business approved: ${businessName}`,
          purpose: 'Business account approval',
          headline: 'Business approved',
          body: `Your business “${businessName}” has been approved and is now active.`,
          ctaLabel: 'Open business dashboard',
          ctaPath: '/business/dashboard',
        })
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
        notifyApprovalOutcome({
          userId: ownerId,
          email: String(data.email || data.contactEmail || ''),
          subject: `Business application update: ${businessName}`,
          purpose: 'Business account rejection',
          headline: 'Business not approved',
          body: notes
            ? `Your business “${businessName}” was not approved: ${notes}`
            : `Your business “${businessName}” was not approved.`,
          ctaLabel: 'Open business dashboard',
          ctaPath: '/business/dashboard',
        })
      }
      return { success: true }
    }

    if (type === 'offer') {
      const [offersSnap, legacySnap] = await Promise.all([
        db.collection('offers').doc(id).get(),
        db.collection('businessOffers').doc(id).get(),
      ])
      const current = (offersSnap.exists ? offersSnap.data() : legacySnap.data()) || {}
      const title = String(current.title || 'Your offer')
      const businessId = String(current.businessId || '')
      const updates =
        action === 'approve'
          ? { status: 'published', isAvailable: true, approvedAt: now, approvedBy: adminUid }
          : { status: 'archived', isAvailable: false, rejectedAt: now, rejectedBy: adminUid }
      await syncDualCollection(db, id, 'offers', 'businessOffers', updates, action === 'approve')
      if (businessId) {
        notifyApprovalOutcome({
          userId: businessId,
          subject:
            action === 'approve'
              ? `Offer approved: ${title}`
              : `Offer update: ${title}`,
          purpose:
            action === 'approve' ? 'Marketplace offer approval' : 'Marketplace offer rejection',
          headline: action === 'approve' ? 'Offer published' : 'Offer not approved',
          body:
            action === 'approve'
              ? `Your listing “${title}” is now live on the marketplace.`
              : notes
                ? `Your listing “${title}” was not approved: ${notes}`
                : `Your listing “${title}” was not approved.`,
          ctaLabel: 'View offers',
          ctaPath: '/business/offers',
        })
      }
      return { success: true }
    }

    if (type === 'job') {
      const [jobsSnap, oppSnap] = await Promise.all([
        db.collection('jobs').doc(id).get(),
        db.collection('businessOpportunities').doc(id).get(),
      ])
      const current = (jobsSnap.exists ? jobsSnap.data() : oppSnap.data()) || {}
      const title = String(current.title || 'Your listing')
      const businessId = String(current.businessId || '')
      const updates =
        action === 'approve'
          ? { status: 'published', approvedAt: now, approvedBy: adminUid }
          : { status: 'closed', closedAt: now, closedBy: adminUid }
      await syncDualCollection(db, id, 'jobs', 'businessOpportunities', updates, false)
      if (businessId) {
        notifyApprovalOutcome({
          userId: businessId,
          subject:
            action === 'approve'
              ? `Listing approved: ${title}`
              : `Listing update: ${title}`,
          purpose:
            action === 'approve' ? 'Job / opportunity approval' : 'Job / opportunity rejection',
          headline: action === 'approve' ? 'Listing published' : 'Listing closed',
          body:
            action === 'approve'
              ? `Your listing “${title}” is now live.`
              : notes
                ? `Your listing “${title}” was closed: ${notes}`
                : `Your listing “${title}” was closed.`,
          ctaLabel: 'View opportunities',
          ctaPath: '/business/opportunities',
        })
      }
      return { success: true }
    }

    if (type === 'discount') {
      const snap = await db.collection('discounts').doc(id).get()
      const d = snap.data() || {}
      await db.collection('discounts').doc(id).update(
        sanitizeForFirestore({
          status: action === 'approve' ? 'active' : 'expired',
          approvedAt: action === 'approve' ? now : undefined,
          approvedBy: action === 'approve' ? adminUid : undefined,
          updatedAt: now,
        })
      )
      const businessId = String(d.businessId || d.ownerId || '')
      if (businessId) {
        notifyApprovalOutcome({
          userId: businessId,
          subject: action === 'approve' ? 'Discount approved' : 'Discount update',
          purpose:
            action === 'approve' ? 'Discount approval' : 'Discount rejection',
          headline: action === 'approve' ? 'Discount active' : 'Discount not approved',
          body:
            action === 'approve'
              ? `Your discount “${String(d.title || d.code || id)}” is now active.`
              : `Your discount “${String(d.title || d.code || id)}” was not approved.`,
          ctaLabel: 'Open business dashboard',
          ctaPath: '/business/dashboard',
        })
      }
      return { success: true }
    }

    if (type === 'event') {
      const snap = await db.collection('events').doc(id).get()
      const d = snap.data() || {}
      const title = String(d.title || 'Your event')
      const createdBy = String(d.createdBy || d.organizerId || '')
      await db.collection('events').doc(id).update(
        sanitizeForFirestore({
          status: action === 'approve' ? 'published' : 'rejected',
          approvedAt: action === 'approve' ? now : undefined,
          approvedBy: action === 'approve' ? adminUid : undefined,
          approvalNotes: action === 'reject' ? notes || null : undefined,
          updatedAt: now,
        })
      )
      if (createdBy) {
        notifyApprovalOutcome({
          userId: createdBy,
          subject:
            action === 'approve'
              ? `Event approved: ${title}`
              : `Event update: ${title}`,
          purpose: action === 'approve' ? 'Event approval notification' : 'Event rejection notification',
          headline: action === 'approve' ? 'Event approved' : 'Event not approved',
          body:
            action === 'approve'
              ? `Your event “${title}” has been approved and published.`
              : notes
                ? `Your event “${title}” was not approved: ${notes}`
                : `Your event “${title}” was not approved.`,
          ctaLabel: 'View my events',
          ctaPath: '/dashboard/events',
        })
      }
      return { success: true }
    }

    if (type === 'donation') {
      const snap = await db.collection('donationSubmissions').doc(id).get()
      const d = snap.data() || {}
      await db.collection('donationSubmissions').doc(id).update({
        status: action === 'approve' ? 'verified' : 'rejected',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      notifyApprovalOutcome({
        userId: String(d.userId || ''),
        email: String(d.donorEmail || d.email || ''),
        subject: action === 'approve' ? 'Donation verified' : 'Donation proof update',
        purpose:
          action === 'approve'
            ? 'Donation verification confirmation'
            : 'Donation proof rejection',
        headline: action === 'approve' ? 'Donation verified' : 'Donation not verified',
        body:
          action === 'approve'
            ? 'Your donation was verified. Thank you for your support.'
            : notes
              ? `Your donation proof was not verified: ${notes}`
              : 'Your donation proof was not verified.',
        ctaLabel: 'View donations',
        ctaPath: '/dashboard/donations',
      })
      return { success: true }
    }

    if (type === 'partnership') {
      const snap = await db.collection('partnerships').doc(id).get()
      const d = snap.data() || {}
      await db.collection('partnerships').doc(id).update({
        status: action === 'approve' ? 'active' : 'ended',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      notifyApprovalOutcome({
        userId: String(d.submittedBy || d.userId || d.businessId || ''),
        email: String(d.submitterEmail || d.email || ''),
        subject: action === 'approve' ? 'Partnership request approved' : 'Partnership request update',
        purpose:
          action === 'approve'
            ? 'Partnership approval'
            : 'Partnership rejection',
        headline: action === 'approve' ? 'Partnership approved' : 'Partnership not approved',
        body:
          action === 'approve'
            ? `Your partnership request “${String(d.title || id)}” has been approved.`
            : notes
              ? `Your partnership request was not approved: ${notes}`
              : 'Your partnership request was not approved.',
        ctaLabel: 'Open business dashboard',
        ctaPath: '/business/dashboard',
      })
      return { success: true }
    }

    if (type === 'community') {
      const snap = await db.collection('communities').doc(id).get()
      const d = snap.data() || {}
      await db.collection('communities').doc(id).update({
        status: action === 'approve' ? 'active' : 'archived',
        approvedBy: action === 'approve' ? adminUid : undefined,
        approvedAt: action === 'approve' ? now : undefined,
        rejectionReason: action === 'reject' ? notes || null : undefined,
        updatedAt: now,
      })
      notifyApprovalOutcome({
        userId: String(d.createdBy || d.ownerId || ''),
        subject: action === 'approve' ? 'Community approved' : 'Community update',
        purpose:
          action === 'approve' ? 'Community approval' : 'Community rejection',
        headline: action === 'approve' ? 'Community approved' : 'Community not approved',
        body:
          action === 'approve'
            ? `Your community “${String(d.name || id)}” is now active.`
            : notes
              ? `Your community was not approved: ${notes}`
              : 'Your community was not approved.',
        ctaLabel: 'View communities',
        ctaPath: '/communities',
      })
      return { success: true }
    }

    if (type === 'group') {
      if (!communityId) return { success: false, error: 'communityId required for group approval' }
      const snap = await db
        .collection('communities')
        .doc(communityId)
        .collection('groups')
        .doc(id)
        .get()
      const d = snap.data() || {}
      await db.collection('communities').doc(communityId).collection('groups').doc(id).update({
        status: action === 'approve' ? 'active' : 'archived',
        approvedBy: action === 'approve' ? adminUid : undefined,
        approvedAt: action === 'approve' ? now : undefined,
        updatedAt: now,
      })
      notifyApprovalOutcome({
        userId: String(d.createdBy || ''),
        subject: action === 'approve' ? 'Group approved' : 'Group update',
        purpose: action === 'approve' ? 'Group approval' : 'Group rejection',
        headline: action === 'approve' ? 'Group approved' : 'Group not approved',
        body:
          action === 'approve'
            ? `Your group “${String(d.name || id)}” is now active.`
            : 'Your group was not approved.',
        ctaLabel: 'Open community',
        ctaPath: `/communities/${communityId}`,
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
      const snap = await db.collection('formSubmissions').doc(id).get()
      const d = snap.data() || {}
      await db.collection('formSubmissions').doc(id).update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: now,
        reviewedBy: adminUid,
        updatedAt: now,
      })
      notifyApprovalOutcome({
        userId: String(d.userId || d.submittedBy || ''),
        email: String(d.email || ''),
        subject: action === 'approve' ? 'Form submission approved' : 'Form submission update',
        purpose:
          action === 'approve' ? 'Form submission approval' : 'Form submission rejection',
        headline: action === 'approve' ? 'Submission approved' : 'Submission not approved',
        body:
          action === 'approve'
            ? `Your submission for “${String(d.formTitle || d.formName || 'form')}” was approved.`
            : notes
              ? `Your form submission was not approved: ${notes}`
              : 'Your form submission was not approved.',
        ctaLabel: 'Open dashboard',
        ctaPath: '/dashboard',
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
