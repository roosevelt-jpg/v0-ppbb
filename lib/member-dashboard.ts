import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import type { BusinessOffer } from '@/lib/types'

export function parseFirestoreDate(value: unknown): Date | null {
  if (!value) return null
  try {
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate()
    }
    const d = new Date(value as string | number)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export function eventVisibleToUser(
  event: Record<string, unknown>,
  gender?: string
): boolean {
  const restriction = event.genderRestriction as string | undefined
  if (!restriction || restriction === 'mixed') return true
  if (!gender) return true
  if (restriction === 'ladies-only') return gender === 'female'
  if (restriction === 'men-only') return gender === 'male'
  return true
}

export function isDonationCompleted(status?: string): boolean {
  return status === 'completed' || status === 'verified'
}

export type DonationRow = {
  id: string
  charityName?: string
  causeName?: string
  amount?: number
  currency?: string
  status?: string
  createdAt?: unknown
  submittedAt?: unknown
  receiptURL?: string | null
  partnerName?: string
}

export function parseDonationDate(row: DonationRow): string {
  const raw = row.createdAt ?? row.submittedAt
  const d = parseFirestoreDate(raw)
  return d ? d.toLocaleDateString() : '—'
}

export function mergeDonationRows(...lists: DonationRow[][]): DonationRow[] {
  const merged = new Map<string, DonationRow>()
  for (const list of lists) {
    for (const row of list ?? []) {
      if (row?.id) merged.set(row.id, row)
    }
  }
  return Array.from(merged.values()).sort((a, b) =>
    parseDonationDate(b).localeCompare(parseDonationDate(a))
  )
}

/** Subscribe to all donation sources for a member (donorId, userId, submissions). */
export function subscribeToMemberDonations(
  userId: string,
  onData: (rows: DonationRow[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  const buckets: Record<string, DonationRow[]> = {
    donorId: [],
    userId: [],
    submissions: [],
  }

  const emit = () => {
    onData(mergeDonationRows(buckets.donorId, buckets.userId, buckets.submissions))
  }

  const unsubs = [
    onSnapshot(
      query(collection(db, 'donations'), where('donorId', '==', userId)),
      (snap) => {
        buckets.donorId = snap?.docs?.map((d) => ({ id: d.id, ...d.data() } as DonationRow)) ?? []
        emit()
      },
      (err) => onError?.(err.message)
    ),
    onSnapshot(
      query(collection(db, 'donations'), where('userId', '==', userId)),
      (snap) => {
        buckets.userId = snap?.docs?.map((d) => ({ id: d.id, ...d.data() } as DonationRow)) ?? []
        emit()
      },
      (err) => onError?.(err.message)
    ),
    onSnapshot(
      query(collection(db, 'donationSubmissions'), where('userId', '==', userId)),
      (snap) => {
        buckets.submissions = snap?.docs?.map((d) => ({ id: d.id, ...d.data() } as DonationRow)) ?? []
        emit()
      },
      (err) => onError?.(err.message)
    ),
  ]

  return () => unsubs.forEach((u) => u())
}

export async function fetchMemberDonationTotal(userId: string): Promise<number> {
  const [byDonor, byUser, subs] = await Promise.allSettled([
    getDocs(query(collection(db, 'donations'), where('donorId', '==', userId), limit(100))),
    getDocs(query(collection(db, 'donations'), where('userId', '==', userId), limit(100))),
    getDocs(query(collection(db, 'donationSubmissions'), where('userId', '==', userId), limit(100))),
  ])

  const rows = mergeDonationRows(
    byDonor.status === 'fulfilled'
      ? (byDonor.value?.docs?.map((d) => ({ id: d.id, ...d.data() } as DonationRow)) ?? [])
      : [],
    byUser.status === 'fulfilled'
      ? (byUser.value?.docs?.map((d) => ({ id: d.id, ...d.data() } as DonationRow)) ?? [])
      : [],
    subs.status === 'fulfilled'
      ? (subs.value?.docs?.map((d) => ({ id: d.id, ...d.data() } as DonationRow)) ?? [])
      : []
  )

  return rows
    .filter((d) => isDonationCompleted(d.status))
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
}

export type MemberNotification = {
  id: string
  title?: string
  message?: string
  body?: string
  read?: boolean
  dismissed?: boolean
  createdAt?: unknown
}

export function subscribeToMemberNotifications(
  userId: string,
  onData: (items: MemberNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(10)
  )
  return onSnapshot(q, (snap) => {
    const items =
      snap?.docs
        ?.map((d) => ({ id: d.id, ...d.data() } as MemberNotification))
        ?.filter((n) => !n.dismissed && !n.read)
        ?.slice(0, 5) ?? []
    onData(items)
  })
}

const MARKETPLACE_STATUSES = new Set(['active', 'published'])

export function isMarketplaceOfferVisible(offer: BusinessOffer): boolean {
  return MARKETPLACE_STATUSES.has(offer.status)
}

export function filterMarketplaceOffers(
  offers: BusinessOffer[],
  category: string
): BusinessOffer[] {
  const visible = offers.filter(isMarketplaceOfferVisible)
  if (category === 'all') return visible
  if (category === 'discounts') {
    return visible.filter((o) => o.type === 'discount' || Boolean(o.discountPercentage))
  }
  if (category === 'books') {
    return visible.filter((o) => ['books', 'education'].includes((o.category ?? '').toLowerCase()))
  }
  if (category === 'courses') {
    return visible.filter((o) =>
      ['courses', 'coaching', 'education'].includes((o.category ?? '').toLowerCase())
    )
  }
  return visible.filter((o) => (o.category ?? '').toLowerCase() === category)
}

export function subscribeToMarketplaceOffers(
  onData: (offers: BusinessOffer[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'businessOffers'),
    (snap) => {
      const rows =
        snap?.docs?.map((d) => ({ ...(d.data() as BusinessOffer), id: d.id })) ?? []
      onData(rows.filter(isMarketplaceOfferVisible))
    },
    (err) => onError?.(err.message)
  )
}
