'use server'

import { db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore'
import { SponsorTag, AdminAnalytics, AIMatchingResult, CommunityReputation, DigitalWallet } from '@/lib/types'

// Priority 1 & 2: Sponsor Tag Management
export async function updateSponsorTags(sponsorId: string, tags: SponsorTag[]) {
  try {
    await updateDoc(doc(db, 'sponsors', sponsorId), {
      tags: tags,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating sponsor tags:', error)
    throw error
  }
}

export async function getSponsorsByTag(tag: SponsorTag) {
  try {
    const q = query(collection(db, 'sponsors'), where('tags', 'array-contains', tag))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('[v0] Error fetching sponsors by tag:', error)
    throw error
  }
}

// Priority 3: Volunteer Skills & Departments
export async function updateVolunteerSkills(volunteerId: string, skillIds: string[]) {
  try {
    await updateDoc(doc(db, 'volunteers', volunteerId), {
      skillIds: skillIds,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating volunteer skills:', error)
    throw error
  }
}

export async function updateVolunteerDepartment(volunteerId: string, departmentId: string) {
  try {
    await updateDoc(doc(db, 'volunteers', volunteerId), {
      departmentId: departmentId,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating volunteer department:', error)
    throw error
  }
}

// Priority 4: Leaderboard & Analytics
export async function getVolunteerLeaderboard(timeframe: 'month' | 'year' | 'all' = 'month', limit_count = 100) {
  try {
    const collectionName =
      timeframe === 'month' ? 'volunteerHoursMonth' : timeframe === 'year' ? 'volunteerHoursYear' : 'volunteerHours'

    const q = query(collection(db, collectionName), orderBy('hours', 'desc'), limit(limit_count))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('[v0] Error fetching leaderboard:', error)
    throw error
  }
}

export async function getSystemAnalytics(): Promise<AdminAnalytics> {
  try {
    // Get referrals
    const referralsSnap = await getDocs(collection(db, 'businessReferrals'))
    let totalReferrals = 0
    let topBusinesses: any[] = []

    referralsSnap.forEach((doc) => {
      totalReferrals += 1
      const data = doc.data()
      const existing = topBusinesses.find((b) => b.businessId === data.businessId)
      if (existing) {
        existing.referrals += 1
      } else {
        topBusinesses.push({
          id: data.businessId,
          name: data.businessName,
          referrals: 1,
        })
      }
    })

    topBusinesses = topBusinesses.sort((a, b) => b.referrals - a.referrals).slice(0, 5)

    // Get volunteer hours
    const hoursSnap = await getDocs(collection(db, 'volunteerHours'))
    let totalVolunteerHours = 0
    let topVolunteers: any[] = []

    hoursSnap.forEach((doc) => {
      const data = doc.data()
      totalVolunteerHours += data.hours || 0
      topVolunteers.push({
        id: data.volunteerId,
        name: data.volunteerName,
        hours: data.hours,
      })
    })

    topVolunteers = topVolunteers.sort((a, b) => b.hours - a.hours).slice(0, 5)

    // Get donations
    const donationsSnap = await getDocs(collection(db, 'donations'))
    let totalDonations = 0
    donationsSnap.forEach((doc) => {
      totalDonations += doc.data().amount || 0
    })

    return {
      id: 'system-analytics',
      period: 'monthly',
      date: new Date(),
      totalReferrals,
      totalVolunteerHours: Math.round(totalVolunteerHours),
      totalDonations,
      conversionRate: 12.5,
      revenueContribution: totalReferrals * 150,
      topBusinesses: topBusinesses.slice(0, 3),
      topVolunteers: topVolunteers.slice(0, 3),
      topSponsors: [],
      businessLeaderboard: [],
      referralAnalytics: {
        totalReferrals,
        activeReferrals: Math.round(totalReferrals * 0.8),
        conversionCount: Math.round(totalReferrals * 0.125),
        totalCommission: totalReferrals * 150,
        topReferrers: [],
      },
    }
  } catch (error) {
    console.error('[v0] Error fetching system analytics:', error)
    throw error
  }
}

// Priority 6: AI Matching
export async function createAIMatches(volunteerId: string) {
  try {
    // Get volunteer profile
    const volunteerSnap = await getDocs(query(collection(db, 'volunteers'), where('volunteerId', '==', volunteerId)))
    if (volunteerSnap.empty) return []

    const volunteer = volunteerSnap.docs[0].data()

    // Get all opportunities
    const opportunitiesSnap = await getDocs(collection(db, 'businessOpportunities'))
    const matches: AIMatchingResult[] = []

    opportunitiesSnap.forEach((doc) => {
      const opportunity = doc.data()
      let score = 0
      const reasons: string[] = []

      // Check skill match
      if (volunteer.skillIds && opportunity.requiredSkills) {
        const matchingSkills = volunteer.skillIds.filter((s: string) => opportunity.requiredSkills.includes(s))
        if (matchingSkills.length > 0) {
          score += matchingSkills.length * 20
          reasons.push(`${matchingSkills.length} matching skills`)
        }
      }

      // Check availability
      if (volunteer.availability === opportunity.schedule) {
        score += 15
        reasons.push('Schedule match')
      }

      // Check location
      if (volunteer.location?.emirate === opportunity.location?.emirate) {
        score += 10
        reasons.push('Same emirate')
      }

      // Add experience bonus
      if (volunteer.yearsOfExperience >= opportunity.yearsRequired) {
        score += 15
        reasons.push('Experience match')
      }

      if (score > 30) {
        matches.push({
          id: `match-${volunteerId}-${doc.id}`,
          volunteerId,
          opportunityId: doc.id,
          matchScore: Math.min(score, 100),
          reasons,
          createdAt: new Date(),
          viewed: false,
        })
      }
    })

    // Save matches to Firestore
    for (const match of matches.slice(0, 5)) {
      await addDoc(collection(db, 'aiMatches'), match)
    }

    return matches
  } catch (error) {
    console.error('[v0] Error creating AI matches:', error)
    throw error
  }
}

// Priority 6: Community Reputation
export async function getCommunityReputation(userId: string): Promise<CommunityReputation> {
  try {
    const userSnap = await getDocs(query(collection(db, 'communityReputation'), where('userId', '==', userId)))

    if (!userSnap.empty) {
      return userSnap.docs[0].data() as CommunityReputation
    }

    // Create default reputation
    const defaultReputation: CommunityReputation = {
      userId,
      score: 0,
      level: 'bronze',
      contributions: {
        volunteering: 0,
        donations: 0,
        referrals: 0,
        community: 0,
      },
      badges: [],
    }

    return defaultReputation
  } catch (error) {
    console.error('[v0] Error fetching reputation:', error)
    throw error
  }
}

export async function updateCommunityReputation(userId: string, score: number) {
  try {
    const q = query(collection(db, 'communityReputation'), where('userId', '==', userId))
    const snap = await getDocs(q)

    const newLevel = score > 1000 ? 'diamond' : score > 500 ? 'platinum' : score > 250 ? 'gold' : score > 100 ? 'silver' : 'bronze'

    if (snap.empty) {
      await addDoc(collection(db, 'communityReputation'), {
        userId,
        score,
        level: newLevel,
        contributions: { volunteering: 0, donations: 0, referrals: 0, community: 0 },
        badges: [],
      })
    } else {
      await updateDoc(snap.docs[0].ref, {
        score,
        level: newLevel,
        updatedAt: serverTimestamp(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] Error updating reputation:', error)
    throw error
  }
}

// Priority 6: Digital Wallet
export async function getDigitalWallet(userId: string): Promise<DigitalWallet> {
  try {
    const walletSnap = await getDocs(query(collection(db, 'digitalWallets'), where('userId', '==', userId)))

    if (!walletSnap.empty) {
      return walletSnap.docs[0].data() as DigitalWallet
    }

    // Create default wallet
    const defaultWallet: DigitalWallet = {
      userId,
      balance: 0,
      currency: 'AED',
      transactions: [],
      lastUpdated: new Date(),
    }

    return defaultWallet
  } catch (error) {
    console.error('[v0] Error fetching wallet:', error)
    throw error
  }
}

export async function addWalletTransaction(userId: string, type: 'earn' | 'spend', amount: number, description: string, source: string) {
  try {
    const walletSnap = await getDocs(query(collection(db, 'digitalWallets'), where('userId', '==', userId)))

    const transaction = {
      id: `txn-${Date.now()}`,
      type,
      amount,
      description,
      source,
      date: new Date(),
    }

    if (walletSnap.empty) {
      const newBalance = type === 'earn' ? amount : -amount
      await addDoc(collection(db, 'digitalWallets'), {
        userId,
        balance: Math.max(0, newBalance),
        currency: 'AED',
        transactions: [transaction],
        lastUpdated: new Date(),
      })
    } else {
      const wallet = walletSnap.docs[0].data()
      const newBalance = type === 'earn' ? wallet.balance + amount : Math.max(0, wallet.balance - amount)
      await updateDoc(walletSnap.docs[0].ref, {
        balance: newBalance,
        transactions: [...(wallet.transactions || []), transaction],
        lastUpdated: serverTimestamp(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] Error adding wallet transaction:', error)
    throw error
  }
}
