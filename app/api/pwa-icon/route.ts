import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_FAVICON_URL, DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'
import { getAdminDb } from '@/lib/firebase-admin'
import { DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings } from '@/lib/global-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function resolveIconUrl(): Promise<string> {
  try {
    const snap = await getAdminDb().collection('platformConfig').doc('globalSettings').get()
    const settings = mergeGlobalSettings(
      snap.exists ? (snap.data() as Record<string, unknown>) : undefined
    )
    const favicon = settings.faviconUrl?.trim()
    if (favicon && favicon !== '/favicon.ico') return favicon
    if (DEFAULT_GLOBAL_SETTINGS.faviconUrl) return DEFAULT_GLOBAL_SETTINGS.faviconUrl
  } catch {
    /* use defaults */
  }
  return DEFAULT_FAVICON_URL || DEFAULT_LOGO_ON_LIGHT_BG
}

/** Serve brand icons for the PWA install / home-screen shortcut. */
export async function GET(request: NextRequest) {
  try {
    const source = await resolveIconUrl()
    const upstream = await fetch(source, { next: { revalidate: 3600 } })
    if (!upstream.ok) {
      return NextResponse.redirect(DEFAULT_FAVICON_URL, 302)
    }

    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.warn('[pwa-icon] fallback:', error)
    return NextResponse.redirect(DEFAULT_FAVICON_URL, 302)
  }
}
