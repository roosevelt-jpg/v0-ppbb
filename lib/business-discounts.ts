'use client'

import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'

export type BusinessDiscount = {
  id: string
  businessId: string
  ownerId: string
  title: string
  description: string
  discountCode: string | null
  discountType: 'percent' | 'fixed'
  discountValue: number
  currency: string | null
  validFrom: Date
  validUntil: Date | null
  isMemberOnly: boolean
  usageLimit: number | null
  usageCount: number
  status: 'active' | 'expired' | 'paused' | 'pending_approval'
  createdAt: Date
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date()
}

function normalize(id: string, data: Record<string, unknown>): BusinessDiscount {
  return {
    id,
    businessId: String(data.businessId || ''),
    ownerId: String(data.ownerId || data.businessId || ''),
    title: String(data.title || ''),
    description: String(data.description || ''),
    discountCode: data.discountCode ? String(data.discountCode) : null,
    discountType: data.discountType === 'fixed' ? 'fixed' : 'percent',
    discountValue: Number(data.discountValue || 0),
    currency: data.currency ? String(data.currency) : null,
    validFrom: toDate(data.validFrom),
    validUntil: data.validUntil ? toDate(data.validUntil) : null,
    isMemberOnly: data.isMemberOnly === true,
    usageLimit: typeof data.usageLimit === 'number' ? data.usageLimit : null,
    usageCount: Number(data.usageCount || 0),
    status: (data.status as BusinessDiscount['status']) || 'pending_approval',
    createdAt: toDate(data.createdAt),
  }
}

function isMissingFirestoreIndex(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : ''
  return code === 'failed-precondition'
}

function toCreatedAtMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().getTime()
    } catch {
      return 0
    }
  }
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

export function subscribeToBusinessDiscounts(
  businessId: string,
  callback: (discounts: BusinessDiscount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const col = collection(db, 'discounts')
  const indexedQ = query(col, where('businessId', '==', businessId), orderBy('createdAt', 'desc'))
  const fallbackQ = query(col, where('businessId', '==', businessId))

  let fallbackUnsub: Unsubscribe | undefined

  const emit = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const items = docs
      .map((d) => normalize(d.id, d.data()))
      .sort((a, b) => toCreatedAtMillis(b.createdAt) - toCreatedAtMillis(a.createdAt))
    callback(items)
  }

  const unsub = onSnapshot(
    indexedQ,
    (snap) => emit(snap.docs),
    (error) => {
      if (isMissingFirestoreIndex(error)) {
        console.warn('[discounts] index missing — using client-side sort until index builds')
        fallbackUnsub = onSnapshot(
          fallbackQ,
          (snap) => emit(snap.docs),
          (fallbackError) => {
            console.error('[discounts] subscription failed:', fallbackError)
            onError?.(fallbackError as Error)
            callback([])
          }
        )
        return
      }
      console.error('[discounts] subscription failed:', error)
      onError?.(error as Error)
      callback([])
    }
  )

  return () => {
    unsub()
    fallbackUnsub?.()
  }
}

export function subscribeToActiveBusinessDiscounts(
  businessId: string,
  callback: (discounts: BusinessDiscount[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'discounts'), where('businessId', '==', businessId))
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs
          .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
          .filter((d) => d.status === 'active')
      )
    },
    (error) => {
      console.error('[discounts] active subscription failed:', error)
      onError?.(error as Error)
      callback([])
    }
  )
}

export async function createBusinessDiscount(
  businessId: string,
  data: Omit<BusinessDiscount, 'id' | 'createdAt' | 'usageCount' | 'businessId' | 'ownerId'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'discounts'), {
    ...data,
    businessId,
    ownerId: businessId,
    usageCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export async function updateBusinessDiscount(id: string, updates: Partial<BusinessDiscount>) {
  await updateDoc(doc(db, 'discounts', id), { ...updates, updatedAt: Timestamp.now() })
}

export async function deleteBusinessDiscount(id: string) {
  await deleteDoc(doc(db, 'discounts', id))
}
