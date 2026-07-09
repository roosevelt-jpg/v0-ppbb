import { BusinessOpportunity } from '@/lib/types'

export const ROLE_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  freelance: 'Freelance',
  volunteer: 'Volunteer',
  internship: 'Internship',
  contract: 'Contract',
  job: 'Job',
  gig: 'Gig',
}

export const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'job', label: 'Job', roleTypes: ['full_time', 'part_time', 'job'] },
  { id: 'internship', label: 'Internship', roleTypes: ['internship'] },
  { id: 'gig', label: 'Gig', roleTypes: ['freelance', 'gig'] },
  { id: 'volunteer', label: 'Volunteer', roleTypes: ['volunteer'] },
  { id: 'contract', label: 'Contract', roleTypes: ['contract'] },
] as const

export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate()
      return Number.isNaN(d.getTime()) ? null : d
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

export function isOpportunityExpired(opp: BusinessOpportunity): boolean {
  const expires = toDate((opp as { expiresAt?: unknown }).expiresAt) || toDate(opp.deadline)
  if (!expires) return false
  return expires.getTime() < Date.now()
}

export function getRoleType(opp: BusinessOpportunity): string {
  return (opp as { roleType?: string }).roleType || opp.type || 'job'
}

export function matchesOpportunityFilter(opp: BusinessOpportunity, filterId: string): boolean {
  if (filterId === 'all') return true
  const tab = FILTER_TABS.find((t) => t.id === filterId)
  if (!tab || !('roleTypes' in tab)) return opp.type === filterId
  const roleType = getRoleType(opp)
  return tab.roleTypes.includes(roleType) || opp.type === filterId
}

export function opportunitySearchHaystack(opp: BusinessOpportunity): string {
  return [
    opp.title,
    opp.businessName,
    (opp as { companyName?: string }).companyName,
    opp.category,
    (opp as { locationCity?: string }).locationCity,
    opp.locationText,
    ...(opp.requirements || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function opportunityGenderBlocksUser(
  opp: BusinessOpportunity,
  userGender?: string | null
): string | null {
  const restriction = (opp as { genderRestriction?: string }).genderRestriction
  if (!restriction || restriction === 'mixed') return null
  const gender = (userGender || '').toLowerCase()
  if (restriction === 'female' || restriction === 'ladies-only') {
    return gender === 'female' ? null : 'This opportunity is for women only'
  }
  if (restriction === 'male' || restriction === 'men-only') {
    return gender === 'male' ? null : 'This opportunity is for men only'
  }
  return null
}

export function opportunityMemberBlocksUser(
  opp: BusinessOpportunity,
  userRole?: string | null,
  isBusiness?: boolean
): string | null {
  const isMemberOnly = Boolean((opp as { isMemberOnly?: boolean }).isMemberOnly)
  if (!isMemberOnly) return null
  if (isBusiness) return 'Business accounts cannot apply'
  if (userRole && userRole !== 'member') {
    return 'This opportunity is for platform members only'
  }
  return null
}

export function daysUntilDeadline(opp: BusinessOpportunity): number | null {
  const deadline = toDate(opp.deadline) || toDate((opp as { expiresAt?: unknown }).expiresAt)
  if (!deadline) return null
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function normalizeOpportunityFromJob(
  id: string,
  data: Record<string, unknown>
): BusinessOpportunity {
  const status = String(data.status || 'draft')
  const published = status === 'published' || status === 'open'
  return {
    id,
    businessId: String(data.businessId || ''),
    businessName: String(data.businessName || data.companyName || ''),
    businessLogoUrl: (data.businessLogoUrl || data.businessLogoURL) as string | undefined,
    title: String(data.title || ''),
    type: (data.jobType || data.type || 'job') as BusinessOpportunity['type'],
    roleType: String(data.roleType || data.jobType || data.type || 'job'),
    companyName: String(data.companyName || data.businessName || ''),
    description: String(data.description || ''),
    category: String(data.category || ''),
    salary: typeof data.salary === 'number' ? data.salary : undefined,
    compensation: data.compensation as string | undefined,
    locationCity: (data.locationCity as string) || undefined,
    locationText: (data.locationCity as string) || (data.locationText as string) || undefined,
    locationType: (data.locationType as string) || undefined,
    remote: data.locationType === 'remote' || Boolean(data.remote),
    duration: (data.duration as string) || undefined,
    hoursPerWeek: typeof data.hoursPerWeek === 'number' ? data.hoursPerWeek : undefined,
    requirements: Array.isArray(data.requirements) ? (data.requirements as string[]) : [],
    benefits: Array.isArray(data.benefits) ? (data.benefits as string[]) : [],
    suitableFor: Array.isArray(data.suitableFor) ? (data.suitableFor as string[]) : [],
    genderRestriction: (data.genderRestriction as string) || 'mixed',
    applicationProcess: (data.applicationProcess as string) || 'cv_upload',
    applicationURL: (data.applicationURL as string) || null,
    posterRelation: (data.posterRelation as string) || 'employer',
    isMemberOnly: Boolean(data.isMemberOnly),
    deadline: toDate(data.deadline) || toDate(data.expiresAt) || undefined,
    applications:
      typeof data.applications === 'number'
        ? data.applications
        : typeof data.applicationCount === 'number'
          ? data.applicationCount
          : 0,
    applicants: Array.isArray(data.applicants) ? (data.applicants as string[]) : [],
    status: published ? 'open' : (status as BusinessOpportunity['status']),
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
  } as BusinessOpportunity
}
