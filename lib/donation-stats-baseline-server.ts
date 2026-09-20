import { getAdminDb } from '@/lib/firebase-admin'

/** Pre-platform fundraising not stored as individual donation rows. */
export const DEFAULT_HISTORICAL_DONATIONS_BASELINE_AED = 1_800_000

const VERIFIED_SUBMISSION_STATUSES = new Set([
  'verified',
  'confirmed',
  'completed',
  'approved',
])

/**
 * Historical AED already raised before platform tracking.
 * Stored on platformConfig/transparency.historicalDonationsBaselineAed
 * so live totals = baseline + completed DB donations.
 */
export async function getHistoricalDonationsBaselineAed(): Promise<number> {
  try {
    const db = getAdminDb()
    const snap = await db.collection('platformConfig').doc('transparency').get()
    const raw = snap.exists ? snap.data()?.historicalDonationsBaselineAed : undefined
    const n = Number(raw)
    if (Number.isFinite(n) && n >= 0) return Math.round(n)
  } catch (error) {
    console.warn('[donation-baseline] failed to read config, using default:', error)
  }
  return DEFAULT_HISTORICAL_DONATIONS_BASELINE_AED
}

/** Sum completed Stripe/ledger donations + verified bank/form submissions. */
export async function sumTrackedDonationsFromDb(): Promise<{
  amount: number
  count: number
}> {
  const db = getAdminDb()

  const [donationsSnap, submissionsSnap] = await Promise.all([
    db.collection('donations').where('status', '==', 'completed').get(),
    db.collection('donationSubmissions').get().catch(() => null),
  ])

  let amount = 0
  let count = 0

  for (const doc of donationsSnap.docs) {
    const value = Number(doc.data().amount ?? 0)
    if (Number.isFinite(value) && value > 0) {
      amount += value
      count += 1
    }
  }

  if (submissionsSnap) {
    for (const doc of submissionsSnap.docs) {
      const data = doc.data() as Record<string, unknown>
      const status = String(data.status || '').toLowerCase()
      if (!VERIFIED_SUBMISSION_STATUSES.has(status)) continue
      const value = Number(data.amount ?? 0)
      if (Number.isFinite(value) && value > 0) {
        amount += value
        count += 1
      }
    }
  }

  return { amount: Math.round(amount), count }
}
