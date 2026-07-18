/**
 * Shared helpers for charityCases (canonical donate causes collection).
 * Reads tolerate legacy field names from the older `causes` collection shape.
 */

import { getEffectiveInvitePermissions } from '@/lib/admin-invite-permissions'

export type CharityCaseStatus = 'draft' | 'active' | 'completed' | 'archived'

export const CAUSE_CATEGORIES = [
  'Zakat',
  'Sadaqah',
  'Orphan',
  'Umrah',
  'Education',
  'Health',
  'Food',
  'Shelter',
  'Emergency',
  'Other',
] as const

export interface CharityCase {
  id: string
  title: string
  category: string
  description: string
  targetAmount: number
  amountRaised: number
  bannerImage: string
  status: CharityCaseStatus
  partnerId: string
  partnerName?: string
  /** Which Firestore collection this row was loaded from */
  sourceCollection?: 'charityCases' | 'causes'
  createdAt?: unknown
  updatedAt?: unknown
}

export function normalizeCharityCase(
  id: string,
  data: Record<string, unknown>,
  sourceCollection: 'charityCases' | 'causes' = 'charityCases'
): CharityCase {
  const statusRaw = String(data.status || 'draft').toLowerCase()
  // Legacy causes sometimes used published / open
  const statusNormalized =
    statusRaw === 'published' || statusRaw === 'open' || statusRaw === 'live'
      ? 'active'
      : statusRaw
  const status = (['draft', 'active', 'completed', 'archived'].includes(statusNormalized)
    ? statusNormalized
    : 'draft') as CharityCaseStatus

  const amountRaised = Number(
    data.amountRaised ?? data.currentAmount ?? data.collectedAmount ?? data.raised ?? 0
  )
  const targetAmount = Number(
    data.targetAmount ?? data.goalAmount ?? data.goal ?? data.target ?? 0
  )

  return {
    id,
    title: String(data.title || data.name || 'Untitled cause'),
    category: String(data.category || 'Other'),
    description: String(data.description || ''),
    targetAmount: Number.isFinite(targetAmount) ? targetAmount : 0,
    amountRaised: Number.isFinite(amountRaised) ? amountRaised : 0,
    bannerImage: String(
      data.bannerImage || data.image || data.imageUrl || data.bannerURL || ''
    ),
    status,
    partnerId: String(data.partnerId || ''),
    partnerName: data.partnerName ? String(data.partnerName) : undefined,
    sourceCollection,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/** Merge charityCases + legacy causes; charityCases wins on same id. */
export function mergeCharityCaseLists(
  canonical: CharityCase[],
  legacy: CharityCase[]
): CharityCase[] {
  const byId = new Map<string, CharityCase>()
  for (const c of legacy) byId.set(c.id, c)
  for (const c of canonical) byId.set(c.id, c)
  return Array.from(byId.values()).sort((a, b) => {
    const aMs = (a.createdAt as { toMillis?: () => number })?.toMillis?.() || 0
    const bMs = (b.createdAt as { toMillis?: () => number })?.toMillis?.() || 0
    return bMs - aMs
  })
}

/** Truncate description at a word boundary. */
export function truncateAtWord(text: string, maxLen = 140): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) return trimmed
  const slice = trimmed.slice(0, maxLen)
  const lastSpace = slice.lastIndexOf(' ')
  const cutoff = lastSpace > maxLen * 0.5 ? lastSpace : maxLen
  return `${slice.slice(0, cutoff).trimEnd()}…`
}

export function progressPercent(raised: number, target: number): number {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((raised / target) * 100))
}

/** Roles that may view/download sensitive beneficiary documents (server-enforced). */
export const SENSITIVE_DOC_ROLES = new Set([
  'welfare',
  'founder',
  'coordinator',
  'founder_admin', // maps to "founder" in existing adminUsers
  'manager', // maps to welfare/coordinator operational access
  'admin',
  'super_admin',
  'superadmin',
  'super-admin',
])

export const WELFARE_INVITE_ROLE_OPTIONS = [
  {
    value: 'welfare',
    label: 'Welfare',
    description: 'Defaults to beneficiary access; add permission checkboxes to expand',
  },
  {
    value: 'founder',
    label: 'Founder',
    description: 'Defaults to beneficiary access; add permission checkboxes to expand',
  },
  {
    value: 'coordinator',
    label: 'Coordinator',
    description: 'Defaults to beneficiary access; add permission checkboxes to expand',
  },
  {
    value: 'founder_admin',
    label: 'Founder Admin',
    description: 'Empty permissions = full access; checkboxes limit the menu',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Empty permissions = full access; checkboxes limit the menu',
  },
] as const

/** Normalize role strings from invites / legacy docs (spaces, hyphens, case). */
export function normalizeAdminRoleKey(role: unknown): string {
  if (typeof role !== 'string') return ''
  return role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
}

export function isWelfareOperationalRole(role: unknown): boolean {
  const key = normalizeAdminRoleKey(role)
  if (!key) return false
  if (SENSITIVE_DOC_ROLES.has(key)) return true
  // superadmin variants already covered via normalize → super_admin / superadmin
  return false
}

export function canAccessSensitiveBeneficiaryDocs(adminRole: unknown): boolean {
  return isWelfareOperationalRole(adminRole)
}

/**
 * Resolve whether the signed-in profile may open sensitive docs.
 * Prefer adminRole over primary membership role (member/business users can also be super_admin in adminUsers).
 */
export function canUserAccessSensitiveBeneficiaryDocs(
  user: { role?: unknown; adminRole?: unknown; roles?: unknown; permissions?: unknown } | null | undefined
): boolean {
  if (!user) return false
  const candidates: unknown[] = [user.adminRole, user.role]
  if (Array.isArray(user.roles)) candidates.push(...user.roles)
  if (candidates.some((r) => canAccessSensitiveBeneficiaryDocs(r))) return true

  const role = String(user.adminRole || user.role || '')
  const perms = Array.isArray(user.permissions) ? user.permissions.map(String) : []
  const effective = getEffectiveInvitePermissions(perms, role)
  if (effective.includes('full_access') || effective.includes('manage_beneficiary')) return true

  // roles[] may hold super_admin while primary role stays "member"
  if (Array.isArray(user.roles)) {
    for (const r of user.roles) {
      const effectiveFromRole = getEffectiveInvitePermissions(perms, String(r || ''))
      if (
        effectiveFromRole.includes('full_access') ||
        effectiveFromRole.includes('manage_beneficiary')
      ) {
        return true
      }
    }
  }
  return false
}
