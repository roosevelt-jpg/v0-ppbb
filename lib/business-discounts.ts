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

export function subscribeToBusinessDiscounts(
  businessId: string,
  callback: (discounts: BusinessDiscount[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'discounts'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => normalize(d.id, d.data() as Record<string, unknown>)))
  })
}

export function subscribeToActiveBusinessDiscounts(
  businessId: string,
  callback: (discounts: BusinessDiscount[]) => void
): Unsubscribe {
  const q = query(collection(db, 'discounts'), where('businessId', '==', businessId))
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs
        .map((d) => normalize(d.id, d.data() as Record<string, unknown>))
        .filter((d) => d.status === 'active')
    )
  })
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
