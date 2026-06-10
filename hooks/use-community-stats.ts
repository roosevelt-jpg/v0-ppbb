import { useEffect, useState } from 'react'
import { db } from './firebase'
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore'

export interface CommunityStats {
  members: number
  volunteerHours: number
  businessPartners: number
  donationsTracked: string
  loading: boolean
  error: string | null
}

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats>({
    members: 0,
    volunteerHours: 0,
    businessPartners: 0,
    donationsTracked: 'AED 0',
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total members
        const membersSnapshot = await getCountFromServer(collection(db, 'users'))
        const memberCount = membersSnapshot.data().count

        // Fetch total volunteer hours
        const usersSnapshot = await getDocs(collection(db, 'users'))
        let totalVolunteerHours = 0
        usersSnapshot.forEach(doc => {
          const userData = doc.data()
          totalVolunteerHours += userData.volunteeredHours || 0
        })

        // Fetch business partners count
        const businessSnapshot = await getCountFromServer(
          query(collection(db, 'users'), where('role', '==', 'business'))
        )
        const businessCount = businessSnapshot.data().count

        // Fetch total donations
        const donationsSnapshot = await getDocs(collection(db, 'donations'))
        let totalDonations = 0
        donationsSnapshot.forEach(doc => {
          const donationData = doc.data()
          if (donationData.amount) totalDonations += donationData.amount
        })

        setStats({
          members: memberCount,
          volunteerHours: totalVolunteerHours,
          businessPartners: businessCount,
          donationsTracked: `AED ${totalDonations.toLocaleString()}`,
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error('[v0] Error fetching community stats:', err)
        setStats(prev => ({
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
