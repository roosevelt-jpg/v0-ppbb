export interface CommunityStats {
  totalMembers: number
  volunteerHours: number
  businessPartners: number
  totalDonations: number
}

const EMPTY_STATS: CommunityStats = {
  totalMembers: 0,
  volunteerHours: 0,
  businessPartners: 0,
  totalDonations: 0,
}

function parseStatNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const digits = value.replace(/[^0-9.]/g, '')
    const parsed = Number(digits)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function normalizeStats(data: Partial<CommunityStats> | null | undefined): CommunityStats {
  if (!data) return EMPTY_STATS
  return {
    totalMembers: parseStatNumber(data.totalMembers),
    volunteerHours: parseStatNumber(data.volunteerHours),
    businessPartners: parseStatNumber(data.businessPartners),
    totalDonations: parseStatNumber(data.totalDonations),
  }
}

/**
 * Live platform stats for login/marketing surfaces.
 * Prefers /api/public/community-stats (Admin SDK aggregation), then cached communityStats/public.
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  try {
    const res = await fetch('/api/public/community-stats', { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      if (json.success && json.data) {
        return normalizeStats(json.data)
      }
    }
  } catch (error) {
    console.warn('[v0] Live stats API unavailable, trying cache:', error)
  }

  try {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore')
    const db = getFirestore()
    const communityStatsSnap = await getDoc(doc(db, 'communityStats', 'public'))
    if (communityStatsSnap.exists()) {
      return normalizeStats(communityStatsSnap.data() as CommunityStats)
    }
  } catch (error) {
    console.error('[v0] Error reading cached community stats:', error)
  }

  return EMPTY_STATS
}

export function formatDonations(amount: number): string {
  if (amount >= 1000000) {
    return `AED ${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `AED ${(amount / 1000).toFixed(0)}K`
  }
  return `AED ${Math.round(amount).toLocaleString()}`
}
