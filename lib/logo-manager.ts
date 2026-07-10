'use client'

import { db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { mergeGlobalSettings } from '@/lib/global-settings'

export interface LogoAssets {
  lightLogoUrl: string
  darkLogoUrl: string
  faviconUrl: string
  updatedAt: number
}

/** Built-in dark artwork for light backgrounds (original brand mark). */
export const DEFAULT_LOGO_ON_LIGHT_BG =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bblack%5D-9KcTa1PocHznEBM4QR6dN4R2eseFlT.png'

/** Built-in light artwork for dark backgrounds (original brand mark). */
export const DEFAULT_LOGO_ON_DARK_BG =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-yu7P76Kj7QQ6XvNGPww4648xqCmM4s.png'

/**
 * Site chrome always uses the built-in brand logos.
 * Admin CMS uploads no longer override these (they looked worse than the originals).
 * Favicon can still come from Global Settings.
 */
export const DEFAULT_LOGOS: LogoAssets = {
  lightLogoUrl: DEFAULT_LOGO_ON_LIGHT_BG,
  darkLogoUrl: DEFAULT_LOGO_ON_DARK_BG,
  faviconUrl:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-rTk4mN9xK2pL8vQwE6jH3sY1zB5cDfG.png',
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
