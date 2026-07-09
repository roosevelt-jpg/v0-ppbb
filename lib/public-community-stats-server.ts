import { getAdminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { CommunityStats } from '@/lib/community-stats'

function readHours(data: Record<string, unknown>): number {
  const hours = Number(data.volunteeredHours ?? data.volunteerHours ?? 0)
  return Number.isFinite(hours) ? hours : 0
}

function isAdminRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase()
  return r === 'admin' || r === 'super_admin'
}

/**
 * Aggregate live platform stats from Firestore (Admin SDK).
 * Used by public login/marketing surfaces via /api/public/community-stats.
 */
export async function computePublicCommunityStats(): Promise<CommunityStats> {
  const db = getAdminDb()

  const [usersSnap, businessesSnap, donationsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('businesses').where('isApproved', '==', true).where('isActive', '==', true).get(),
    db.collection('donations').where('status', '==', 'completed').get(),
  ])

  let volunteersSnap: { docs: Array<{ data: () => Record<string, unknown> }> } | null = null
  try {
    volunteersSnap = await db.collection('volunteers').get()
  } catch {
    volunteersSnap = null
  }

  let totalMembers = 0
  let volunteerHours = 0

  for (const doc of usersSnap.docs) {
    const data = doc.data() as Record<string, unknown>
    if (data.active === false) continue
    if (isAdminRole(data.role)) continue
    totalMembers += 1
    volunteerHours += readHours(data)
  }

  if (volunteersSnap) {
    for (const doc of volunteersSnap.docs) {
      const hours = Number(doc.data().hoursContributed ?? 0)
      if (Number.isFinite(hours)) volunteerHours += hours
    }
  }

  let totalDonations = 0
  for (const doc of donationsSnap.docs) {
    const amount = Number(doc.data().amount ?? 0)
    if (Number.isFinite(amount)) totalDonations += amount
  }

  return {
    totalMembers,
    volunteerHours: Math.round(volunteerHours),
    businessPartners: businessesSnap.size,
    totalDonations: Math.round(totalDonations),
  }
}

/** Persist snapshot for public Firestore readers (communityStats/public). */
export async function cachePublicCommunityStats(stats: CommunityStats): Promise<void> {
  const db = getAdminDb()
  await db.collection('communityStats').doc('public').set(
    {
      ...stats,
      updatedAt: Timestamp.now(),
      source: 'live',
    },
    { merge: true }
  )
}
