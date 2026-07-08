import { getFirestore, doc, getDoc } from 'firebase/firestore'

export interface CommunityStats {
  totalMembers: number
  volunteerHours: number
  businessPartners: number
  totalDonations: number
}

const FALLBACK_STATS: CommunityStats = {
  totalMembers: 3400,
  volunteerHours: 12000,
  businessPartners: 120,
  totalDonations: 250000,
}

function parseStatNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const digits = value.replace(/[^0-9.]/g, '')
    const parsed = Number(digits)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

/**
 * Public community stats for login/marketing surfaces.
 * Reads only from publicly-readable collections — never queries `users` or `donations`.
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  try {
    const db = getFirestore()

    const communityStatsSnap = await getDoc(doc(db, 'communityStats', 'public'))
    if (communityStatsSnap.exists()) {
      const data = communityStatsSnap.data()
      return {
        totalMembers: parseStatNumber(data.totalMembers, FALLBACK_STATS.totalMembers),
        volunteerHours: parseStatNumber(data.volunteerHours, FALLBACK_STATS.volunteerHours),
        businessPartners: parseStatNumber(data.businessPartners, FALLBACK_STATS.businessPartners),
        totalDonations: parseStatNumber(data.totalDonations, FALLBACK_STATS.totalDonations),
      }
    }

    const homepageSnap = await getDoc(doc(db, 'platformConfig', 'homepage'))
    if (homepageSnap.exists()) {
      const statsItems = homepageSnap.data()?.stats?.items
      if (Array.isArray(statsItems) && statsItems.length >= 4) {
        return {
          totalMembers: parseStatNumber(statsItems[0]?.number, FALLBACK_STATS.totalMembers),
          volunteerHours: parseStatNumber(statsItems[1]?.number, FALLBACK_STATS.volunteerHours),
          businessPartners: parseStatNumber(statsItems[2]?.number, FALLBACK_STATS.businessPartners),
          totalDonations: parseStatNumber(statsItems[3]?.number, FALLBACK_STATS.totalDonations),
        }
      }
    }

    return FALLBACK_STATS
  } catch (error) {
    console.error('[v0] Error fetching community stats:', error)
    return FALLBACK_STATS
  }
}

export function formatDonations(amount: number): string {
  if (amount >= 1000000) {
    return `AED ${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `AED ${(amount / 1000).toFixed(0)}K`
  }
  return `AED ${amount}`
}
