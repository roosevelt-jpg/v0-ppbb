'use client'

import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export interface ShopPageConfig {
  headline: string
  body: string
  donateBannerEyebrow: string
  donateBannerHeadline: string
  donateBannerCTA: string
  donateBannerCTAHref: string
}

export interface ShopPlatformConfig {
  pageConfig: ShopPageConfig
}

export const DEFAULT_SHOP_PAGE_CONFIG: ShopPageConfig = {
  headline: 'Merch & Products',
  body: 'Purpose-driven products. Every purchase fuels a cause.',
  donateBannerEyebrow: 'DONATE VIA PURCHASE',
  donateBannerHeadline: 'A portion of every sale funds the meal programme.',
  donateBannerCTA: 'See impact',
  donateBannerCTAHref: '/impact',
}

export const DEFAULT_SHOP_CONFIG: ShopPlatformConfig = {
  pageConfig: DEFAULT_SHOP_PAGE_CONFIG,
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

export function mergeShopPageConfig(data: unknown): ShopPageConfig {
  const d = (data || {}) as Partial<ShopPageConfig>
  const defaults = DEFAULT_SHOP_PAGE_CONFIG
  return {
    headline: asString(d.headline, defaults.headline),
    body: asString(d.body, defaults.body),
    donateBannerEyebrow: asString(d.donateBannerEyebrow, defaults.donateBannerEyebrow),
    donateBannerHeadline: asString(d.donateBannerHeadline, defaults.donateBannerHeadline),
    donateBannerCTA: asString(d.donateBannerCTA, defaults.donateBannerCTA),
    donateBannerCTAHref: asString(d.donateBannerCTAHref, defaults.donateBannerCTAHref),
  }
}

export function mergeShopConfig(data: unknown): ShopPlatformConfig {
  const raw = (data || {}) as { pageConfig?: unknown }
  return {
    pageConfig: mergeShopPageConfig(raw.pageConfig ?? data),
  }
}

export function subscribeToShopConfig(
  callback: (config: ShopPlatformConfig) => void
): () => void {
  const docRef = doc(db, 'platformConfig', 'shop')
  return onSnapshot(
    docRef,
    (snap) => {
      callback(mergeShopConfig(snap.exists() ? snap.data() : null))
    },
    () => {
      callback(DEFAULT_SHOP_CONFIG)
    }
  )
}
