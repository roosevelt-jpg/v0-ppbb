/**
 * Shared helpers for charityCases (canonical donate causes collection).
 * Reads tolerate legacy field names from the older `causes` collection shape.
 */

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
  createdAt?: unknown
  updatedAt?: unknown
}

export function normalizeCharityCase(id: string, data: Record<string, unknown>): CharityCase {
  const statusRaw = String(data.status || 'draft')
  const status = (['draft', 'active', 'completed', 'archived'].includes(statusRaw)
    ? statusRaw
    : 'draft') as CharityCaseStatus

  const amountRaised = Number(
    data.amountRaised ?? data.currentAmount ?? data.collectedAmount ?? 0
  )
  const targetAmount = Number(data.targetAmount ?? 0)

  return {
    id,
    title: String(data.title || data.name || 'Untitled cause'),
    category: String(data.category || 'Other'),
    description: String(data.description || ''),
    targetAmount: Number.isFinite(targetAmount) ? targetAmount : 0,
    amountRaised: Number.isFinite(amountRaised) ? amountRaised : 0,
    bannerImage: String(data.bannerImage || data.image || ''),
    status,
    partnerId: String(data.partnerId || ''),
    partnerName: data.partnerName ? String(data.partnerName) : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
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
])

export function canAccessSensitiveBeneficiaryDocs(adminRole: unknown): boolean {
  if (typeof adminRole !== 'string') return false
  return SENSITIVE_DOC_ROLES.has(adminRole.toLowerCase())
}
