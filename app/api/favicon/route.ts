import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings } from '@/lib/global-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_FAVICON =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-rTk4mN9xK2pL8vQwE6jH3sY1zB5cDfG.png'

/**
 * Redirect to the CMS-configured favicon (platformConfig/globalSettings.faviconUrl).
 */
export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('platformConfig').doc('globalSettings').get()
    const settings = mergeGlobalSettings(
      snap.exists ? (snap.data() as Record<string, unknown>) : undefined
    )
    const url =
      (settings.faviconUrl && settings.faviconUrl !== '/favicon.ico'
        ? settings.faviconUrl
        : '') ||
      DEFAULT_GLOBAL_SETTINGS.faviconUrl ||
      DEFAULT_FAVICON

    const target = url.startsWith('/') ? url : url
    // Absolute Storage URLs redirect; relative paths rewrite via Location.
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: target === '/favicon.ico' ? DEFAULT_FAVICON : target,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.warn('[favicon] Falling back to default:', error)
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: DEFAULT_FAVICON,
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}
