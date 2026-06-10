'use client'

import { db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'

export interface LogoAssets {
  lightLogoUrl: string
  darkLogoUrl: string
  faviconUrl: string
  updatedAt: number
}

// Default fallback logos
export const DEFAULT_LOGOS: LogoAssets = {
  lightLogoUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bblack%5D-9KcTa1PocHznEBM4QR6dN4R2eseFlT.png',
  darkLogoUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-yu7P76Kj7QQ6XvNGPww4648xqCmM4s.png',
  faviconUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-rTk4mN9xK2pL8vQwE6jH3sY1zB5cDfG.png',
  updatedAt: 0,
}

// Fetch logos once from Firestore
export async function fetchLogos(): Promise<LogoAssets> {
  try {
    const docRef = doc(db, 'siteSettings', 'branding')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        lightLogoUrl: data.lightLogoUrl || DEFAULT_LOGOS.lightLogoUrl,
        darkLogoUrl: data.darkLogoUrl || DEFAULT_LOGOS.darkLogoUrl,
        faviconUrl: data.faviconUrl || DEFAULT_LOGOS.faviconUrl,
        updatedAt: data.updatedAt || 0,
      }
    }

    return DEFAULT_LOGOS
  } catch (error) {
    console.error('[v0] Error fetching logos:', error)
    return DEFAULT_LOGOS
  }
}

// Subscribe to real-time logo updates
export function subscribeToLogos(callback: (logos: LogoAssets) => void): () => void {
  try {
    const docRef = doc(db, 'siteSettings', 'branding')
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        callback({
          lightLogoUrl: data.lightLogoUrl || DEFAULT_LOGOS.lightLogoUrl,
          darkLogoUrl: data.darkLogoUrl || DEFAULT_LOGOS.darkLogoUrl,
          faviconUrl: data.faviconUrl || DEFAULT_LOGOS.faviconUrl,
          updatedAt: data.updatedAt || 0,
        })
      } else {
        callback(DEFAULT_LOGOS)
      }
    })

    return unsubscribe
  } catch (error) {
    console.error('[v0] Error subscribing to logos:', error)
    return () => {}
  }
}

// Get logo for current theme
export function getLogoForTheme(isDark: boolean, logos: LogoAssets): string {
  return isDark ? logos.darkLogoUrl : logos.lightLogoUrl
}
