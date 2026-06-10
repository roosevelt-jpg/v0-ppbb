import { getFirestore, collection, getDocs, query, where, sum, getCountFromServer, aggregateQuerySnapshot } from 'firebase/firestore'

export interface CommunityStats {
  totalMembers: number
  volunteerHours: number
  businessPartners: number
  totalDonations: number
}

export async function getCommunityStats(): Promise<CommunityStats> {
  try {
    const db = getFirestore()

    // Count total active members
    const membersSnapshot = await getCountFromServer(
      query(collection(db, 'users'), where('active', '==', true))
    )
    const totalMembers = membersSnapshot.data().count

    // Get total volunteer hours
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const volunteerHours = usersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().volunteeredHours || 0), 0)

    // Count business partners
    const businessSnapshot = await getCountFromServer(
      query(collection(db, 'users'), where('role', '==', 'business'), where('active', '==', true))
    )
    const businessPartners = businessSnapshot.data().count

    // Get total donations
    const donationsSnapshot = await getDocs(
      query(collection(db, 'donations'), where('status', '==', 'completed'))
    )
    const totalDonations = donationsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

    return {
      totalMembers,
      volunteerHours,
      businessPartners,
      totalDonations,
    }
  } catch (error) {
    console.error('[v0] Error fetching community stats:', error)
    return {
      totalMembers: 0,
      volunteerHours: 0,
      businessPartners: 0,
      totalDonations: 0,
    }
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
