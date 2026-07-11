'use client'

import { db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { mergeGlobalSettings } from '@/lib/global-settings'
import {
  DEFAULT_FAVICON_URL,
  DEFAULT_LOGO_ON_DARK_BG,
  DEFAULT_LOGO_ON_LIGHT_BG,
} from '@/lib/brand-assets'

export {
  DEFAULT_LOGO_ON_DARK_BG,
  DEFAULT_LOGO_ON_LIGHT_BG,
} from '@/lib/brand-assets'

export interface LogoAssets {
  lightLogoUrl: string
  darkLogoUrl: string
  faviconUrl: string
  updatedAt: number
}

/**
 * Site chrome always uses the built-in brand logos.
 * Admin CMS uploads no longer override these (they looked worse than the originals).
 * Favicon can still come from Global Settings.
 */
export const DEFAULT_LOGOS: LogoAssets = {
  lightLogoUrl: DEFAULT_LOGO_ON_LIGHT_BG,
  darkLogoUrl: DEFAULT_LOGO_ON_DARK_BG,
  faviconUrl: DEFAULT_FAVICON_URL,
  updatedAt: 0,
}

function logosFromGlobal(data: Record<string, unknown> | undefined): LogoAssets {
  const g = mergeGlobalSettings(data)
  return {
    lightLogoUrl: DEFAULT_LOGO_ON_LIGHT_BG,
    darkLogoUrl: DEFAULT_LOGO_ON_DARK_BG,
    faviconUrl: g.faviconUrl || DEFAULT_LOGOS.faviconUrl,
    updatedAt: Date.now(),
  }
}

/** Pick logo URL based on the background it sits on (not app theme). */
export function getLogoForBackground(
  background: 'light' | 'dark',
  logos: LogoAssets = DEFAULT_LOGOS
): string {
  return background === 'dark' ? logos.darkLogoUrl : logos.lightLogoUrl
}

export async function fetchLogos(): Promise<LogoAssets> {
  try {
    const docSnap = await getDoc(doc(db, 'platformConfig', 'globalSettings'))
    return logosFromGlobal(docSnap.exists() ? docSnap.data() : undefined)
  } catch (error) {
    console.error('[v0] Error fetching logos:', error)
    return DEFAULT_LOGOS
  }
}

export function subscribeToLogos(callback: (logos: LogoAssets) => void): () => void {
  try {
    return onSnapshot(
      doc(db, 'platformConfig', 'globalSettings'),
      (snap) => {
        callback(logosFromGlobal(snap.exists() ? snap.data() : undefined))
      },
      () => callback(DEFAULT_LOGOS)
    )
  } catch (error) {
    console.error('[v0] Error subscribing to logos:', error)
    callback(DEFAULT_LOGOS)
    return () => {}
  }
}

export function getLogoForTheme(isDark: boolean, logos: LogoAssets): string {
  return isDark ? logos.darkLogoUrl : logos.lightLogoUrl
}
