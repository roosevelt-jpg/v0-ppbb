import { BusinessOpportunity } from '@/lib/types'
import { htmlToPlainText } from '@/lib/cms-page-content'

export const ROLE_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  freelance: 'Freelance',
  volunteer: 'Volunteer',
  internship: 'Internship',
  training: 'Training',
  contract: 'Contract',
  job: 'Job',
  gig: 'Gig',
}

/** Single Role Type field — shared by business post/edit and public display */
export const ROLE_TYPE_FORM_OPTIONS = [
  { value: 'freelance', label: 'Freelance' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'training', label: 'Training' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'contract', label: 'Contract' },
] as const

export const WORK_TYPE_FORM_OPTIONS = [
  { value: 'onsite', label: 'Onsite' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

export const SUITABILITY_OPTIONS = [
  'Ladies Only',
  'Men Only',
  'Fresh Graduates',
  'Experienced 5yrs+',
] as const

export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const

/** Map Role Type → legacy `type` for filters / older records */
export function roleTypeToLegacyType(roleType: string): BusinessOpportunity['type'] {
  if (roleType === 'internship' || roleType === 'volunteer') return roleType
  if (roleType === 'freelance' || roleType === 'contract' || roleType === 'gig') return 'gig'
  return 'job'
}

export function normalizeRoleType(value: unknown): string {
  const raw = String(value || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (raw === 'fulltime' || raw === 'full_time' || raw === 'job') return 'full_time'
  if (raw === 'parttime' || raw === 'part_time') return 'part_time'
  if (raw === 'gig') return 'freelance'
  if (ROLE_TYPE_FORM_OPTIONS.some((o) => o.value === raw)) return raw
  return 'full_time'
}

export const WORK_TYPE_OPTIONS = [
  { id: 'all', label: 'All work types' },
  { id: 'onsite', label: 'Onsite' },
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
] as const

/** Role types for the public job search filter */
export const ROLE_TYPE_FILTER_OPTIONS = [
  { id: 'all', label: 'All role types' },
  { id: 'full_time', label: 'Full Time' },
  { id: 'part_time', label: 'Part Time' },
  { id: 'contract', label: 'Contract' },
  { id: 'freelance', label: 'Freelance / Gig' },
  { id: 'internship', label: 'Internship' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'training', label: 'Training' },
] as const

/** Shared industry list (matches business post form) */
export const INDUSTRY_OPTIONS = [
  'Technology',
  'HR',
  'Retail',
  'Real Estate',
  'Automotive',
  'F&B',
  'Hospitality',
  'Health & Fitness',
  'Consultancy',
  'Business',
  'Education',
  'Nonprofit',
  'Other',
] as const

export const UAE_LOCATION_OPTIONS = [
  'All locations',
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
  'Remote',
] as const

export const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'job', label: 'Job', roleTypes: ['full_time', 'part_time', 'job'] },
  { id: 'internship', label: 'Internship', roleTypes: ['internship'] },
  { id: 'gig', label: 'Gig', roleTypes: ['freelance', 'gig'] },
  { id: 'volunteer', label: 'Volunteer', roleTypes: ['volunteer'] },
  { id: 'training', label: 'Training', roleTypes: ['training'] },
  { id: 'contract', label: 'Contract', roleTypes: ['contract'] },
] as const

export function getWorkType(opp: BusinessOpportunity): string {
  if (opp.remote || opp.locationType === 'remote') return 'remote'
  const t = (opp.locationType || 'onsite').toLowerCase()
  if (t === 'hybrid') return 'hybrid'
  return 'onsite'
}

export function getWorkTypeLabel(opp: BusinessOpportunity): string {
  const t = getWorkType(opp)
  if (t === 'remote') return 'Remote'
  if (t === 'hybrid') return 'Hybrid'
  return 'Onsite'
}

export function getOpportunityLocation(opp: BusinessOpportunity): string {
  if (getWorkType(opp) === 'remote') return 'Remote'
  return (
    (opp as { locationCity?: string }).locationCity ||
    opp.locationText ||
    ''
  )
}

export function getPostedDate(opp: BusinessOpportunity): Date | null {
  return toDate(opp.createdAt) || toDate((opp as { postedAt?: unknown }).postedAt)
}

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
  return normalizeRoleType((opp as { roleType?: string }).roleType || opp.type || 'job')
}

export function matchesRoleTypeFilter(opp: BusinessOpportunity, filterId: string): boolean {
  if (filterId === 'all') return true
  const roleType = getRoleType(opp)
  if (filterId === 'freelance') {
    return roleType === 'freelance' || roleType === 'gig' || opp.type === 'gig'
  }
  if (filterId === 'full_time') {
    return roleType === 'full_time' || roleType === 'job' || opp.type === 'job'
  }
  return roleType === filterId || opp.type === filterId
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
    description: htmlToPlainText(String(data.description || '')),
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
