import { useEffect, useState } from 'react'
import { getCommunityStats, formatDonations, CommunityStats } from '@/lib/community-stats'

export interface CommunityStatsState extends CommunityStats {
  loading: boolean
  error: string | null
  donationsTracked: string
}

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStatsState>({
    totalMembers: 0,
    volunteerHours: 0,
    businessPartners: 0,
    totalDonations: 0,
    donationsTracked: 'AED 0',
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCommunityStats()
        setStats({
          ...data,
          donationsTracked: formatDonations(data.totalDonations),
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error('[v0] Error fetching community stats:', err)
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to load statistics',
        }))
      }
    }

    fetchStats()
  }, [])

  return stats
}
