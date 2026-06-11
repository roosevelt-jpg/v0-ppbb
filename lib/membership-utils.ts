import { db } from '@/lib/firebase'
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'

export interface MembershipTier {
  name: 'standard' | 'gold' | 'platinum'
  displayName: string
  price: number
  currency: string
  renewalPeriod: 'monthly' | 'annual'
  perks: string[]
  maxEvents: number
  priority: number
}

export const MEMBERSHIP_TIERS: Record<string, MembershipTier> = {
  standard: {
    name: 'standard',
    displayName: 'Standard',
    price: 0,
    currency: 'AED',
    renewalPeriod: 'annual',
    perks: [
      'Basic community access',
      'Event invitations',
      'Email support',
      'Monthly newsletters'
    ],
    maxEvents: 5,
    priority: 1
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    price: 500,
    currency: 'AED',
    renewalPeriod: 'annual',
    perks: [
      'All Standard perks',
      'Priority event access',
      'Monthly newsletter',
      'Exclusive webinars',
      'Networking events',
      'Early bird discounts'
    ],
    maxEvents: 15,
    priority: 2
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum',
    price: 1500,
    currency: 'AED',
    renewalPeriod: 'annual',
    perks: [
      'All Gold perks',
      'VIP event access',
      'Direct admin support',
      'Governance voting rights',
      'Private mentoring sessions',
      'Quarterly strategy calls',
      'Custom project opportunities'
    ],
    maxEvents: 50,
    priority: 3
  }
}

/**
 * Get tier info by name
 */
export function getTierInfo(tierName: string): MembershipTier | null {
  return MEMBERSHIP_TIERS[tierName] || null
}

/**
 * Upgrade member to a new tier
 */
export async function upgradeMemberTier(
  memberId: string,
  newTier: 'standard' | 'gold' | 'platinum'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', memberId)
    await updateDoc(userRef, {
      membershipTier: newTier,
      lastTierChange: new Date(),
      tierChangedBy: 'admin',
      tierChangeReason: 'Manual upgrade'
    })
  } catch (error) {
    console.error('[v0] Error upgrading member tier:', error)
    throw error
  }
}

/**
 * Bulk upgrade members to new tier
 */
export async function bulkUpgradeMembersTier(
  memberIds: string[],
  newTier: 'standard' | 'gold' | 'platinum'
): Promise<{ success: number; failed: number }> {
  try {
    const batch = writeBatch(db)
    let successful = 0
    let failed = 0

    memberIds.forEach((memberId) => {
      const userRef = doc(db, 'users', memberId)
      batch.update(userRef, {
        membershipTier: newTier,
        lastTierChange: new Date(),
        bulkUpgradeApplied: true,
        bulkUpgradeDate: new Date()
      })
      successful++
    })

    await batch.commit()
    return { success: successful, failed }
  } catch (error) {
    console.error('[v0] Error bulk upgrading tiers:', error)
    throw error
  }
}

/**
 * Get members by tier
 */
export async function getMembersByTier(
  tier: 'standard' | 'gold' | 'platinum'
): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('membershipTier', '==', tier),
      where('active', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('[v0] Error fetching members by tier:', error)
    throw error
  }
}

/**
 * Get tier statistics
 */
export async function getTierStatistics(): Promise<Record<string, number>> {
  try {
    const tiers = ['standard', 'gold', 'platinum']
    const stats: Record<string, number> = {}

    for (const tier of tiers) {
      const q = query(
        collection(db, 'users'),
        where('membershipTier', '==', tier),
        where('active', '==', true)
      )
      const snapshot = await getDocs(q)
      stats[tier] = snapshot.size
    }

    return stats
  } catch (error) {
    console.error('[v0] Error fetching tier statistics:', error)
    throw error
  }
}

/**
 * Calculate membership value
 */
export function calculateMembershipValue(members: any[]): Record<string, any> {
  const totalValue = members.reduce((sum, member) => {
    const tier = MEMBERSHIP_TIERS[member.membershipTier || 'standard']
    return sum + (tier?.price || 0)
  }, 0)

  const byTier: Record<string, number> = {}
  members.forEach(member => {
    const tierName = member.membershipTier || 'standard'
    byTier[tierName] = (byTier[tierName] || 0) + (MEMBERSHIP_TIERS[tierName]?.price || 0)
  })

  return {
    totalValue,
    byTier,
    averageValue: members.length > 0 ? totalValue / members.length : 0
  }
}

/**
 * Format membership renewal date
 */
export function getNextRenewalDate(joinDate: Date, renewalPeriod: 'monthly' | 'annual'): Date {
  const nextDate = new Date(joinDate)
  if (renewalPeriod === 'annual') {
    nextDate.setFullYear(nextDate.getFullYear() + 1)
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  return nextDate
}

/**
 * Check if membership is expiring soon (within 30 days)
 */
export function isExpiringsoon(renewalDate: Date, daysThreshold: number = 30): boolean {
  const now = new Date()
  const diffTime = renewalDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= daysThreshold
}

/**
 * Get membership analytics
 */
export async function getMembershipAnalytics(): Promise<any> {
  try {
    const stats = await getTierStatistics()
    const allMembers = await getDocs(collection(db, 'users'))
    const members = allMembers.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const value = calculateMembershipValue(members)

    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.active).length,
      tierDistribution: stats,
      membershipValue: value,
      membershipGrowth: {
        // This would typically query historical data
        lastMonth: 0,
        thisMonth: members.length
      }
    }
  } catch (error) {
    console.error('[v0] Error calculating membership analytics:', error)
    throw error
  }
}
