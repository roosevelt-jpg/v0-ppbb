import type { GenderRestriction } from '@/lib/community-types'

/** Canonical gender restriction for communities & groups */
export type NormalizedGenderRestriction = 'mixed' | 'male' | 'female'

export type MemberModerationStatus = 'active' | 'suspended' | 'banned' | 'removed'

export const GENDER_RESTRICTION_OPTIONS: {
  value: NormalizedGenderRestriction
  label: string
  description: string
}[] = [
  { value: 'mixed', label: 'Mixed', description: 'Open to everyone' },
  { value: 'male', label: 'Men only', description: 'Men-only group' },
  { value: 'female', label: 'Ladies only', description: 'Ladies-only group' },
]

/** Map legacy / UI values to canonical enum */
export function normalizeGenderRestriction(value: unknown): NormalizedGenderRestriction {
  const raw = String(value || 'mixed')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')

  if (raw === 'male' || raw === 'men' || raw === 'men-only' || raw === 'man') return 'male'
  if (raw === 'female' || raw === 'women' || raw === 'ladies' || raw === 'ladies-only' || raw === 'woman')
    return 'female'
  return 'mixed'
}

export function genderRestrictionLabel(value: unknown): string {
  const n = normalizeGenderRestriction(value)
  return GENDER_RESTRICTION_OPTIONS.find((o) => o.value === n)?.label ?? 'Mixed'
}

/** Normalize user profile gender for eligibility checks */
export function normalizeUserGender(value: unknown): 'male' | 'female' | 'unknown' {
  const raw = String(value || '')
    .toLowerCase()
    .trim()
  if (['male', 'man', 'men', 'm'].includes(raw)) return 'male'
  if (['female', 'woman', 'women', 'ladies', 'f'].includes(raw)) return 'female'
  return 'unknown'
}

export function canJoinByGenderRestriction(
  restriction: unknown,
  userGender: unknown
): { allowed: boolean; reason?: string } {
  const limit = normalizeGenderRestriction(restriction)
  if (limit === 'mixed') return { allowed: true }

  const gender = normalizeUserGender(userGender)
  if (gender === 'unknown') {
    return {
      allowed: false,
      reason: 'Please set your gender on your profile before joining this group.',
    }
  }
  if (limit === 'male' && gender !== 'male') {
    return { allowed: false, reason: 'This group is for men only.' }
  }
  if (limit === 'female' && gender !== 'female') {
    return { allowed: false, reason: 'This group is for ladies only.' }
  }
  return { allowed: true }
}

export function isCommunityVisible(status: unknown): boolean {
  return String(status || '') === 'active'
}

export function isGroupVisible(status: unknown): boolean {
  const s = String(status || 'active')
  return s === 'active'
}

export function isPendingApproval(status: unknown): boolean {
  return String(status || '') === 'pending_approval'
}

export function initialCommunityStatus(opts: {
  isAdmin: boolean
  businessId?: string | null
}): 'active' | 'pending_approval' {
  if (opts.isAdmin) return 'active'
  if (opts.businessId) return 'pending_approval'
  return 'pending_approval'
}

export function initialGroupStatus(opts: {
  isAdmin: boolean
  communityBusinessId?: string | null
  createdByBusiness?: boolean
}): 'active' | 'pending_approval' {
  if (opts.isAdmin) return 'active'
  if (opts.communityBusinessId || opts.createdByBusiness) return 'pending_approval'
  return 'active'
}

export function memberCanChat(memberStatus: unknown): boolean {
  const s = String(memberStatus || 'active')
  return s === 'active'
}
