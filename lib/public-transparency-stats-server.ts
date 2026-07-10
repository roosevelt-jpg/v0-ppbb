import { getAdminDb } from '@/lib/firebase-admin'
import { normalizeCharityCase } from '@/lib/charity-cases'

export type PublicTransparencyCause = {
  id: string
  title: string
  currentAmount: number
  goalAmount: number
}

export type PublicTransparencyStats = {
  totalDonations: number
  completedDonations: number
  totalBeneficiaries: number
  activeCauses: number
  totalVolunteers: number
  volunteerHours: number
  causes: PublicTransparencyCause[]
}

function toCauseRow(id: string, data: Record<string, unknown>): PublicTransparencyCause {
  const normalized = normalizeCharityCase(id, data)
  return {
    id: normalized.id,
    title: normalized.title,
    currentAmount: normalized.amountRaised,
    goalAmount: normalized.targetAmount,
  }
}

/** Aggregate public-safe transparency metrics (no donor PII). */
export async function computePublicTransparencyStats(): Promise<PublicTransparencyStats> {
  const db = getAdminDb()

  const [donationsSnap, beneficiariesSnap, charityCasesSnap, legacyCausesSnap, volunteersSnap] =
    await Promise.all([
      db.collection('donations').where('status', '==', 'completed').get(),
      db.collection('beneficiaryRequests').where('status', '==', 'approved').get(),
      db.collection('charityCases').where('status', '==', 'active').get(),
      db.collection('causes').where('status', '==', 'active').get(),
      db.collection('volunteers').get().catch(() => null),
    ])

  let totalDonations = 0
  for (const doc of donationsSnap.docs) {
    const amount = Number(doc.data().amount ?? 0)
    if (Number.isFinite(amount)) totalDonations += amount
  }

  const byId = new Map<string, PublicTransparencyCause>()
  for (const doc of legacyCausesSnap.docs) {
    byId.set(doc.id, toCauseRow(doc.id, doc.data() as Record<string, unknown>))
  }
  for (const doc of charityCasesSnap.docs) {
    byId.set(doc.id, toCauseRow(doc.id, doc.data() as Record<string, unknown>))
  }

  const causes = [...byId.values()].sort((a, b) => b.currentAmount - a.currentAmount)

  let totalVolunteers = 0
  let volunteerHours = 0
  if (volunteersSnap) {
    totalVolunteers = volunteersSnap.size
    for (const doc of volunteersSnap.docs) {
      const hours = Number(doc.data().hoursContributed ?? 0)
      if (Number.isFinite(hours)) volunteerHours += hours
    }
  }

  return {
    totalDonations: Math.round(totalDonations),
    completedDonations: donationsSnap.size,
    totalBeneficiaries: beneficiariesSnap.size,
    activeCauses: causes.length,
    totalVolunteers,
    volunteerHours: Math.round(volunteerHours),
    causes,
  }
}
