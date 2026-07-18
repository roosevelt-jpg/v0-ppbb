import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ReportDateRange, ReportPayload, ReportRow, ReportType } from '@/lib/reporting/types'
import { REPORT_DEFINITIONS } from '@/lib/reporting/types'

const VOLUNTEER_ROLES = ['volunteer', 'member+volunteer'] as const

function isVolunteerUser(data: Record<string, unknown>): boolean {
  const role = data.role
  const userType = data.userType
  if (role === 'volunteer' || userType === 'volunteer') return true
  if (Array.isArray(role) && role.some((r) => String(r).toLowerCase().includes('volunteer'))) return true
  if (typeof role === 'string' && VOLUNTEER_ROLES.includes(role as (typeof VOLUNTEER_ROLES)[number])) {
    return true
  }
  return false
}

export function formatReportValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toLocaleString()
    } catch {
      return '—'
    }
  }
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—'
  return String(value).trim() || '—'
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate()
    } catch {
      return null
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

export function getDateRangeStart(range: ReportDateRange): Date | null {
  if (range === 'all') return null
  const now = new Date()
  const start = new Date(now)
  if (range === 'week') start.setDate(now.getDate() - 7)
  else if (range === 'month') start.setMonth(now.getMonth() - 1)
  else start.setFullYear(now.getFullYear() - 1)
  start.setHours(0, 0, 0, 0)
  return start
}

function inRange(value: unknown, range: ReportDateRange, fields: string[] = ['createdAt']): boolean {
  const start = getDateRangeStart(range)
  if (!start) return true
  const data = value as Record<string, unknown>
  for (const field of fields) {
    const d = toDate(data[field])
    if (d && d >= start) return true
  }
  // Keep rows with no date when filtering (legacy docs)
  return !fields.some((f) => data[f] != null)
}

function displayName(row: Record<string, unknown>): string {
  const full = `${row.firstName || ''} ${row.lastName || ''}`.trim()
  return full || String(row.displayName || row.name || row.adminName || '—')
}

function def(type: ReportType) {
  return REPORT_DEFINITIONS.find((d) => d.type === type)!
}

async function safeGetDocs(collectionName: string, ordered = false) {
  try {
    const ref = collection(db, collectionName)
    const q = ordered ? query(ref, orderBy('createdAt', 'desc'), limit(5000)) : query(ref, limit(5000))
    return await getDocs(q)
  } catch {
    try {
      return await getDocs(query(collection(db, collectionName), limit(5000)))
    } catch (error) {
      console.warn(`[reporting] Could not load ${collectionName}:`, error)
      return null
    }
  }
}

function payload(
  type: ReportType,
  details: ReportRow[],
  dateRange: ReportDateRange,
  extras?: Partial<Pick<ReportPayload, 'totalAmount' | 'summary'>>
): ReportPayload {
  const meta = def(type)
  return {
    type: meta.title,
    description: meta.description,
    total: details.length,
    details,
    generatedAt: new Date().toISOString(),
    dateRange,
    ...extras,
  }
}

export async function loadReportData(
  reportType: ReportType,
  dateRange: ReportDateRange = 'all'
): Promise<ReportPayload> {
  switch (reportType) {
    case 'members': {
      const snap = await safeGetDocs('users')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: displayName(row),
              email: String(row.email || '—'),
              role: String(row.role || '—'),
              phone: String(row.phone || row.whatsappNumber || '—'),
              joinedAt: formatReportValue(row.createdAt),
              status: String(row.status || 'active'),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'donations': {
      const snap = await safeGetDocs('donations')
      const rows =
        snap?.docs.filter((d) => inRange(d.data(), dateRange, ['createdAt', 'paidAt', 'donatedAt'])) ||
        []
      const details = rows.map((d) => {
        const row = d.data()
        return {
          id: d.id,
          donor: String(row.donorName || row.donorEmail || 'Anonymous'),
          email: String(row.donorEmail || row.email || '—'),
          amount: Number(row.amount) || 0,
          currency: String(row.currency || 'AED'),
          cause: String(row.causeName || row.cause || '—'),
          date: formatReportValue(row.createdAt || row.paidAt),
          status: String(row.status || 'completed'),
        }
      })
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      return payload(reportType, details, dateRange, {
        totalAmount,
        summary: { totalAmountAED: totalAmount, records: details.length },
      })
    }

    case 'events': {
      const snap = await safeGetDocs('events')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'date', 'startDate']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.name || row.title || 'Untitled'),
              date: formatReportValue(row.date || row.startDate),
              location: String(row.location || row.venue || '—'),
              attendees: Number(row.attendees || row.attendeeCount || row.registeredCount || 0),
              status: String(row.status || 'scheduled'),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'volunteers': {
      const snap = await safeGetDocs('users')
      const volunteerDocs =
        snap?.docs.filter((d) => isVolunteerUser(d.data()) && inRange(d.data(), dateRange)) || []
      const details = volunteerDocs.map((d) => {
        const row = d.data()
        return {
          id: d.id,
          name: displayName(row),
          email: String(row.email || '—'),
          hours: Number(row.volunteeredHours || row.volunteerHours || 0),
          status: String(row.status || 'active'),
          joinedAt: formatReportValue(row.createdAt),
        }
      })
      const totalHours = details.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)
      return payload(reportType, details, dateRange, {
        summary: { totalHours, volunteers: details.length },
      })
    }

    case 'businesses': {
      const snap = await safeGetDocs('businesses')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.businessName || row.name || '—'),
              email: String(row.email || row.contactEmail || '—'),
              category: String(row.category || row.industry || '—'),
              status: String(row.status || 'active'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'marketplace': {
      let snap = await safeGetDocs('businessOffers')
      if (!snap || snap.empty) snap = await safeGetDocs('offers')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              title: String(row.title || row.name || '—'),
              business: String(row.businessName || row.businessId || '—'),
              price: Number(row.price || row.amount || 0),
              discount: String(row.discount || row.discountPercent || '—'),
              status: String(row.status || 'active'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'referrals': {
      const snap = await safeGetDocs('referrals')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'convertedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              referrer: String(row.referrerName || row.referrerBusinessId || row.referrerId || '—'),
              referred: String(row.referredName || row.referredUserId || '—'),
              status: String(row.status || 'pending'),
              amount: Number(row.amount || row.commission || 0),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      return payload(reportType, details, dateRange, { totalAmount })
    }

    case 'memberships': {
      const snap = await safeGetDocs('pricingPlans')
      const details =
        snap?.docs.map((d) => {
          const row = d.data()
          return {
            id: d.id,
            name: String(row.name || row.title || '—'),
            price: Number(row.price || row.amount || 0),
            interval: String(row.interval || row.billingPeriod || '—'),
            status: String(row.status || (row.active === false ? 'inactive' : 'active')),
            order: Number(row.order || 0),
          }
        }) || []
      return payload(reportType, details, dateRange)
    }

    case 'communities': {
      const snap = await safeGetDocs('communities')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.name || row.title || '—'),
              owner: String(row.ownerName || row.createdBy || row.ownerId || '—'),
              members: Number(row.memberCount || row.membersCount || 0),
              status: String(row.status || 'active'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'contact': {
      let snap = await safeGetDocs('contactRequests')
      if (!snap || snap.empty) snap = await safeGetDocs('contactSubmissions')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'submittedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.name || '—'),
              email: String(row.email || '—'),
              subject: String(row.subject || '—'),
              status: String(row.status || (row.read ? 'read' : 'unread')),
              submittedAt: formatReportValue(row.createdAt || row.submittedAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'sponsors': {
      const snap = await safeGetDocs('sponsors')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.name || row.companyName || '—'),
              email: String(row.email || '—'),
              package: String(row.package || row.tier || '—'),
              status: String(row.status || 'active'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'certificates': {
      const snap = await safeGetDocs('certificates')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'issuedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              member: String(row.memberName || row.userName || row.userId || '—'),
              title: String(row.title || row.certificateTitle || '—'),
              hours: Number(row.hours || 0),
              issuedAt: formatReportValue(row.issuedAt || row.createdAt),
              status: String(row.status || (row.certificateIssued ? 'issued' : 'pending')),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'charity': {
      let snap = await safeGetDocs('charityCases')
      if (!snap || snap.empty) snap = await safeGetDocs('causes')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              title: String(row.title || row.name || '—'),
              goal: Number(row.goalAmount || row.targetAmount || 0),
              raised: Number(row.raisedAmount || row.amountRaised || 0),
              status: String(row.status || 'active'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'opportunities': {
      let snap = await safeGetDocs('jobs')
      if (!snap || snap.empty) snap = await safeGetDocs('opportunities')
      if (!snap || snap.empty) snap = await safeGetDocs('businessOpportunities')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              title: String(row.title || row.name || '—'),
              business: String(row.businessName || row.company || row.businessId || '—'),
              type: String(row.type || row.opportunityType || '—'),
              status: String(row.status || 'open'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'audit': {
      let snap = await safeGetDocs('auditLogs', true)
      if (!snap || snap.empty) snap = await safeGetDocs('adminAuditLogs', true)
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'timestamp']))
          .slice(0, 2000)
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              admin: String(row.adminName || row.adminEmail || row.adminId || '—'),
              action: String(row.action || row.actionType || '—'),
              entity: String(row.entityType || row.entityName || '—'),
              status: String(row.status || 'success'),
              createdAt: formatReportValue(row.createdAt || row.timestamp),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'partnerships': {
      const snap = await safeGetDocs('partnerships')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'submittedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.name || row.organizationName || '—'),
              email: String(row.email || '—'),
              type: String(row.type || row.partnershipType || '—'),
              status: String(row.status || 'pending'),
              submittedAt: formatReportValue(row.submittedAt || row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'vendors': {
      const snap = await safeGetDocs('vendorApplications')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              business: String(row.businessName || row.name || '—'),
              email: String(row.email || '—'),
              category: String(row.category || '—'),
              status: String(row.status || 'pending'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      return payload(reportType, details, dateRange)
    }

    case 'subscriptions': {
      const [subsSnap, usersSnap] = await Promise.all([
        safeGetDocs('subscriptions'),
        safeGetDocs('users'),
      ])
      const userById = new Map(
        usersSnap?.docs.map((d) => [d.id, d.data() as Record<string, unknown>]) || []
      )
      const fromSubs =
        subsSnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'updatedAt', 'cancelledAt']))
          .map((d) => {
            const row = d.data()
            const user = userById.get(String(row.userId || '')) || {}
            return {
              id: d.id,
              member: displayName(user) !== '—' ? displayName(user) : String(row.userId || '—'),
              email: String(user.email || '—'),
              plan: String(
                row.planName ||
                  user.membershipPlanName ||
                  row.planId ||
                  user.membershipPlanId ||
                  '—'
              ),
              status: String(row.status || user.membershipStatus || '—'),
              amount: Number(row.amount || 0),
              currency: String(row.currency || 'AED').toUpperCase(),
              interval: String(row.interval || '—'),
              gateway: String(row.gateway || row.paymentGateway || '—'),
              renewsAt: formatReportValue(
                row.nextBillingDate || row.currentPeriodEnd || user.membershipRenewDate
              ),
              cancelAtPeriodEnd: row.cancelAtPeriodEnd === true ? 'yes' : 'no',
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []

      // Also include active members who have plan fields but no subscription doc yet
      const subUserIds = new Set(
        (subsSnap?.docs || [])
          .map((d) => String(d.data()?.userId || '').trim())
          .filter(Boolean)
      )
      const fromUsers =
        usersSnap?.docs
          .filter((d) => {
            const row = d.data()
            if (!row.membershipPlanId && !row.membershipStatus) return false
            if (subUserIds.has(d.id)) return false
            return inRange(row, dateRange, ['createdAt', 'upgradedAt'])
          })
          .map((d) => {
            const row = d.data()
            return {
              id: `user:${d.id}`,
              member: displayName(row),
              email: String(row.email || '—'),
              plan: String(row.membershipPlanName || row.membershipTier || row.membershipPlanId || '—'),
              status: String(row.membershipStatus || '—'),
              amount: 0,
              currency: 'AED',
              interval: '—',
              gateway: row.membershipPromoCode ? 'promo' : 'profile',
              renewsAt: formatReportValue(row.membershipRenewDate),
              cancelAtPeriodEnd: '—',
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []

      const details = [...fromSubs, ...fromUsers]
      const active = details.filter((r) => String(r.status).toLowerCase() === 'active').length
      return payload(reportType, details, dateRange, {
        summary: { active, total: details.length },
      })
    }

    case 'event_registrations': {
      const snap = await safeGetDocs('eventRegistrations')
      const rows =
        snap?.docs.filter((d) =>
          inRange(d.data(), dateRange, ['createdAt', 'registeredAt', 'paidAt'])
        ) || []
      const details = rows.map((d) => {
        const row = d.data()
        return {
          id: d.id,
          eventId: String(row.eventId || '—'),
          guest: String(row.userName || row.guestName || '—'),
          email: String(row.userEmail || row.email || '—'),
          ticket: String(row.ticketTypeName || row.ticketTypeId || '—'),
          paymentStatus: String(row.paymentStatus || '—'),
          status: String(row.status || '—'),
          amountPaid: Number(row.amountPaid || row.amount || 0),
          currency: String(row.currency || 'AED'),
          coupon: String(row.couponCode || '—'),
          checkedIn: row.checkedInAt ? 'yes' : 'no',
          registeredAt: formatReportValue(row.registeredAt || row.createdAt),
        }
      })
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0)
      const paid = details.filter((r) => String(r.paymentStatus).toLowerCase() === 'paid').length
      return payload(reportType, details, dateRange, {
        totalAmount,
        summary: { revenue: totalAmount, paid, total: details.length },
      })
    }

    case 'marketplace_orders': {
      const snap = await safeGetDocs('orders')
      const rows =
        snap?.docs.filter((d) => {
          const row = d.data()
          const isMarketplace =
            row.type === 'marketplace' ||
            Boolean(row.offerId) ||
            Boolean(row.shopName) ||
            Array.isArray(row.items)
          return isMarketplace && inRange(row, dateRange)
        }) || []
      const details = rows.map((d) => {
        const row = d.data()
        return {
          id: d.id,
          buyer: String(row.buyerName || row.userId || '—'),
          business: String(row.shopName || row.businessName || row.businessId || '—'),
          offer: String(row.offerTitle || row.offerId || '—'),
          amount: Number(row.amount || row.total || row.totalAmount || 0),
          currency: String(row.currency || 'AED'),
          paymentStatus: String(row.paymentStatus || row.status || '—'),
          fulfillment: String(row.fulfillmentStatus || '—'),
          createdAt: formatReportValue(row.createdAt),
        }
      })
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      return payload(reportType, details, dateRange, {
        totalAmount,
        summary: { gmv: totalAmount, orders: details.length },
      })
    }

    case 'promo_codes': {
      const snap = await safeGetDocs('membershipPromoCodes')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'codeExpiresAt']))
          .map((d) => {
            const row = d.data()
            const used = Number(row.usedCount || 0)
            const max = Number(row.maxRedemptions || 0)
            return {
              id: d.id,
              code: String(row.code || '—'),
              label: String(row.label || row.description || '—'),
              type: String(row.type || '—'),
              plan: String(row.planName || row.planId || '—'),
              percentOff: Number(row.percentOff || 0),
              usedCount: used,
              maxRedemptions: max || 'unlimited',
              remaining: max > 0 ? Math.max(0, max - used) : 'unlimited',
              status: String(row.status || 'active'),
              expiresAt: formatReportValue(row.codeExpiresAt),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      const totalRedemptions = details.reduce((sum, r) => sum + (Number(r.usedCount) || 0), 0)
      return payload(reportType, details, dateRange, {
        summary: { codes: details.length, redemptions: totalRedemptions },
      })
    }

    case 'beneficiary_requests': {
      let snap = await safeGetDocs('beneficiaryRequests')
      if (!snap || snap.empty) snap = await safeGetDocs('charityRequests')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'submissionDate', 'submittedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              name: String(row.fullName || row.name || displayName(row)),
              email: String(row.email || '—'),
              phone: String(row.phoneNumber || row.phone || '—'),
              status: String(row.status || 'pending'),
              submittedAt: formatReportValue(
                row.submissionDate || row.submittedAt || row.createdAt
              ),
            }
          }) || []
      const byStatus: Record<string, number> = {}
      for (const r of details) {
        const key = String(r.status || 'unknown')
        byStatus[key] = (byStatus[key] || 0) + 1
      }
      return payload(reportType, details, dateRange, {
        summary: { total: details.length, ...byStatus },
      })
    }

    case 'donation_verification': {
      const snap = await safeGetDocs('donationSubmissions')
      const rows =
        snap?.docs.filter((d) =>
          inRange(d.data(), dateRange, ['createdAt', 'submittedAt', 'verifiedAt'])
        ) || []
      const details = rows.map((d) => {
        const row = d.data()
        return {
          id: d.id,
          donor: String(row.donorName || row.userName || '—'),
          email: String(row.donorEmail || row.email || '—'),
          amount: Number(row.amount || 0),
          currency: String(row.currency || 'AED'),
          cause: String(row.causeName || row.partnerName || '—'),
          reference: String(row.referenceNumber || '—'),
          status: String(row.status || 'pending'),
          submittedAt: formatReportValue(row.submittedAt || row.createdAt),
        }
      })
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      const pending = details.filter((r) =>
        String(r.status).toLowerCase().includes('pending')
      ).length
      return payload(reportType, details, dateRange, {
        totalAmount,
        summary: { pending, total: details.length, totalAmount },
      })
    }

    case 'advertising': {
      // Prefer client read (rules allow admin); fall back to advertising admin API
      let rows: Array<{ id: string; data: Record<string, unknown> }> = []
      const snap = await safeGetDocs('advertisingRequests')
      if (snap && !snap.empty) {
        rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
      } else {
        try {
          const { adminApiFetch } = await import('@/lib/admin-api-client')
          const res = await adminApiFetch<Array<Record<string, unknown>>>(
            '/api/advertising/requests?admin=1'
          )
          if (res.success && Array.isArray(res.data)) {
            rows = res.data.map((item) => {
              const { id, ...rest } = item
              return { id: String(id || ''), data: rest }
            })
          }
        } catch (error) {
          console.warn('[reporting] advertising API fallback failed:', error)
        }
      }
      const details = rows
        .filter((r) => inRange(r.data, dateRange, ['createdAt', 'publishedAt']))
        .map((r) => {
          const row = r.data
          return {
            id: r.id,
            business: String(row.businessName || row.businessId || '—'),
            status: String(row.status || '—'),
            priceAed: Number(row.priceAed || row.price || 0),
            currency: String(row.currency || 'AED'),
            href: String(row.href || '—'),
            adminFree: row.adminFree === true ? 'yes' : 'no',
            publishedAt: formatReportValue(row.publishedAt),
            createdAt: formatReportValue(row.createdAt),
          }
        })
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.priceAed) || 0), 0)
      return payload(reportType, details, dateRange, {
        totalAmount,
        summary: { requests: details.length, bookedValueAed: totalAmount },
      })
    }

    case 'job_applications': {
      const snap = await safeGetDocs('jobApplications')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              applicant: String(row.applicantName || row.userName || '—'),
              email: String(row.applicantEmail || row.email || '—'),
              opportunity: String(row.opportunityTitle || row.jobTitle || row.opportunityId || '—'),
              business: String(row.businessName || row.businessId || '—'),
              status: String(row.status || 'submitted'),
              createdAt: formatReportValue(row.createdAt),
            }
          }) || []
      const byStatus: Record<string, number> = {}
      for (const r of details) {
        const key = String(r.status || 'unknown')
        byStatus[key] = (byStatus[key] || 0) + 1
      }
      return payload(reportType, details, dateRange, {
        summary: { applications: details.length, ...byStatus },
      })
    }

    case 'newsletters': {
      const [newsSnap, unsubSnap] = await Promise.all([
        safeGetDocs('newsletters'),
        safeGetDocs('newsletterUnsubscribes'),
      ])
      const campaignRows =
        newsSnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'sentAt', 'scheduledFor']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              kind: 'campaign',
              title: String(row.title || row.subject || '—'),
              status: String(row.status || '—'),
              recipients: Number(row.recipientCount || 0),
              opened: Number(row.openedCount || 0),
              clicked: Number(row.clickedCount || 0),
              date: formatReportValue(row.sentAt || row.scheduledFor || row.createdAt),
            }
          }) || []
      const unsubRows =
        unsubSnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['unsubscribedAt', 'createdAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              kind: 'unsubscribe',
              title: String(row.email || d.id),
              status: 'unsubscribed',
              recipients: 0,
              opened: 0,
              clicked: 0,
              date: formatReportValue(row.unsubscribedAt || row.createdAt),
            }
          }) || []
      const details = [...campaignRows, ...unsubRows]
      return payload(reportType, details, dateRange, {
        summary: {
          campaigns: campaignRows.length,
          unsubscribes: unsubRows.length,
        },
      })
    }

    case 'moderation': {
      const snap = await safeGetDocs('communityReports')
      const details =
        snap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'resolvedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              type: String(row.type || '—'),
              reason: String(row.reason || '—'),
              reportedBy: String(row.reportedBy || '—'),
              reportedUser: String(row.reportedUserId || '—'),
              contentId: String(row.reportedContentId || '—'),
              status: String(row.status || 'open'),
              createdAt: formatReportValue(row.createdAt),
              resolvedAt: formatReportValue(row.resolvedAt),
            }
          }) || []
      const open = details.filter((r) => {
        const s = String(r.status).toLowerCase()
        return s === 'open' || s === 'pending' || s === 'new'
      }).length
      return payload(reportType, details, dateRange, {
        summary: { open, total: details.length },
      })
    }

    case 'business_payments': {
      const [paySnap, payoutSnap] = await Promise.all([
        safeGetDocs('businessPayments'),
        safeGetDocs('payouts'),
      ])
      const paymentRows =
        paySnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'paidDate', 'dueDate']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              kind: 'business_payment',
              business: String(row.businessName || row.businessId || '—'),
              type: String(row.type || '—'),
              amount: Number(row.amount || 0),
              currency: String(row.currency || 'AED'),
              status: String(row.status || '—'),
              reference: String(row.stripeTransactionId || row.paymentReference || '—'),
              date: formatReportValue(row.paidDate || row.dueDate || row.createdAt),
            }
          }) || []
      const payoutRows =
        payoutSnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'initiatedAt', 'completedAt']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              kind: 'event_payout',
              business: String(row.businessName || row.businessId || '—'),
              type: String(row.eventTitle || row.eventId || 'event_payout'),
              amount: Number(row.amount || 0),
              currency: String(row.currency || 'AED'),
              status: String(row.status || '—'),
              reference: String(row.payoutReference || '—'),
              date: formatReportValue(row.completedAt || row.initiatedAt || row.createdAt),
            }
          }) || []
      const details = [...paymentRows, ...payoutRows]
      const totalAmount = details.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
      return payload(reportType, details, dateRange, {
        totalAmount,
        summary: {
          businessPayments: paymentRows.length,
          eventPayouts: payoutRows.length,
          totalAmount,
        },
      })
    }

    case 'learning': {
      const [workshopsSnap, recordingsSnap, resourcesSnap] = await Promise.all([
        safeGetDocs('workshops'),
        safeGetDocs('recordings'),
        safeGetDocs('learningResources'),
      ])
      const workshopRows =
        workshopsSnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'date']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              catalog: 'workshop',
              title: String(row.title || '—'),
              instructor: String(row.instructor || row.speaker || '—'),
              status: String(row.status || '—'),
              date: formatReportValue(row.date || row.createdAt),
              capacity: Number(row.capacity || 0),
            }
          }) || []
      const recordingRows =
        recordingsSnap?.docs
          .filter((d) => inRange(d.data(), dateRange, ['createdAt', 'date']))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              catalog: 'recording',
              title: String(row.title || '—'),
              instructor: String(row.speaker || row.instructor || '—'),
              status: String(row.status || '—'),
              date: formatReportValue(row.date || row.createdAt),
              capacity: Number(row.duration || 0),
            }
          }) || []
      const resourceRows =
        resourcesSnap?.docs
          .filter((d) => inRange(d.data(), dateRange))
          .map((d) => {
            const row = d.data()
            return {
              id: d.id,
              catalog: 'resource',
              title: String(row.title || '—'),
              instructor: String(row.author || '—'),
              status: String(row.status || '—'),
              date: formatReportValue(row.createdAt),
              capacity: 0,
            }
          }) || []
      const details = [...workshopRows, ...recordingRows, ...resourceRows]
      return payload(reportType, details, dateRange, {
        summary: {
          workshops: workshopRows.length,
          recordings: recordingRows.length,
          resources: resourceRows.length,
        },
      })
    }

    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}

export async function loadReportingOverview(dateRange: ReportDateRange) {
  const [usersSnap, donationsSnap, eventsSnap, businessesSnap, communitiesSnap] = await Promise.all([
    safeGetDocs('users'),
    safeGetDocs('donations'),
    safeGetDocs('events'),
    safeGetDocs('businesses'),
    safeGetDocs('communities'),
  ])

  const users = usersSnap?.docs.filter((d) => inRange(d.data(), dateRange)) || []
  const donations = donationsSnap?.docs.filter((d) =>
    inRange(d.data(), dateRange, ['createdAt', 'paidAt'])
  ) || []
  const events =
    eventsSnap?.docs.filter((d) => inRange(d.data(), dateRange, ['createdAt', 'date', 'startDate'])) ||
    []
  const businesses = businessesSnap?.docs.filter((d) => inRange(d.data(), dateRange)) || []
  const communities = communitiesSnap?.docs.filter((d) => inRange(d.data(), dateRange)) || []

  const donationAmount = donations.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0)

  return {
    totalMembers: users.length,
    totalVolunteers: users.filter((d) => isVolunteerUser(d.data())).length,
    totalDonations: donations.length,
    donationAmount,
    totalEvents: events.length,
    totalBusinesses: businesses.length,
    totalCommunities: communities.length,
  }
}
