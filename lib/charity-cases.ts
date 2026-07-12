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
])

export const WELFARE_INVITE_ROLE_OPTIONS = [
  { value: 'welfare', label: 'Welfare', description: 'Review beneficiary requests and sensitive documents' },
  { value: 'founder', label: 'Founder', description: 'Founder-level beneficiary and welfare access' },
  { value: 'coordinator', label: 'Coordinator', description: 'Coordinate welfare cases and document review' },
  { value: 'founder_admin', label: 'Founder Admin', description: 'Full admin access including sensitive documents' },
  { value: 'manager', label: 'Manager', description: 'Operational manager with welfare document access' },
] as const

export function isWelfareOperationalRole(role: unknown): boolean {
  if (typeof role !== 'string') return false
  return SENSITIVE_DOC_ROLES.has(role.toLowerCase())
}

export function canAccessSensitiveBeneficiaryDocs(adminRole: unknown): boolean {
  if (typeof adminRole !== 'string') return false
  return SENSITIVE_DOC_ROLES.has(adminRole.toLowerCase())
}
