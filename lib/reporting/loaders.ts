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
