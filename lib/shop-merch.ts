'use client'

import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore'

export interface ShopMerchProduct {
  id: string
  title: string
  description: string
  category: string
  variant: string
  price: number
  currency: string
  imageURL: string
  status: string
  businessName?: string
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function normalizeMerchOffer(
  id: string,
  data: Record<string, unknown>
): ShopMerchProduct {
  const images = Array.isArray(data.images)
    ? data.images.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : []
  const imageURL =
    asString(data.imageURL) || asString(data.imageUrl) || images[0] || ''

  let variant =
    asString(data.variant) ||
    asString(data.variantLabel) ||
    asString(data.colour) ||
    asString(data.color) ||
    asString(data.size)

  if (
    !variant &&
    typeof data.specifications === 'object' &&
    data.specifications &&
    !Array.isArray(data.specifications)
  ) {
    const spec = data.specifications as Record<string, unknown>
    variant = [asString(spec.colour), asString(spec.color), asString(spec.size)]
      .filter(Boolean)
      .join(' / ')
  }

  return {
    id,
    title: asString(data.title) || asString(data.name) || 'Untitled product',
    description: asString(data.description),
    category: asString(data.category).toLowerCase(),
    variant,
    price: asNumber(data.price),
    currency: asString(data.currency, 'AED') || 'AED',
    imageURL,
    status: asString(data.status).toLowerCase(),
    businessName: asString(data.businessName) || undefined,
  }
}

function mapPublishedMerch(
  docs: { id: string; data: () => Record<string, unknown> }[]
): ShopMerchProduct[] {
  return docs
    .map((d) => normalizeMerchOffer(d.id, d.data()))
    .filter((p) => {
      const cat = p.category
      const isMerch =
        cat === 'merchandise' || cat === 'merch' || cat.includes('merchandise')
      return isMerch && p.status === 'published'
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}

/**
 * Live merch for /shop: offers where category == merchandise AND status == published.
 */
export function subscribeToPublishedMerch(
  callback: (products: ShopMerchProduct[]) => void
): () => void {
  let fallbackUnsub: Unsubscribe | null = null

  const q = query(
    collection(db, 'offers'),
    where('category', '==', 'merchandise'),
    where('status', '==', 'published')
  )

  const unsub = onSnapshot(
    q,
    (snap) => {
      callback(mapPublishedMerch(snap.docs))
    },
    (error) => {
      console.warn('[shop] composite merch query failed, using category-only fallback:', error)
      const fallback = query(collection(db, 'offers'), where('category', '==', 'merchandise'))
      fallbackUnsub = onSnapshot(
        fallback,
        (snap) => callback(mapPublishedMerch(snap.docs)),
        () => callback([])
      )
    }
  )

  return () => {
    unsub()
    fallbackUnsub?.()
  }
}
