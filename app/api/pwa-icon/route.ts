import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
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

function absoluteSource(request: NextRequest, source: string): string {
  if (/^https?:\/\//i.test(source)) return source
  return new URL(source.startsWith('/') ? source : `/${source}`, request.nextUrl.origin).toString()
}

/** Exact-size PNG icons. Chrome only offers Install when 192 and 512 match the manifest. */
export async function GET(request: NextRequest) {
  const sizeParam = Number(request.nextUrl.searchParams.get('size') || 192)
  const size = sizeParam === 512 ? 512 : sizeParam === 96 ? 96 : 192
  const maskable = request.nextUrl.searchParams.get('maskable') === '1'
  const background = { r: 249, g: 247, b: 244, alpha: 1 }

  try {
    const source = absoluteSource(request, await resolveIconUrl())
    const upstream = await fetch(source, { cache: 'force-cache' })
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Icon source unavailable' }, { status: 502 })
    }

    const input = Buffer.from(await upstream.arrayBuffer())
    let png: Buffer
    if (maskable) {
      const inner = Math.round(size * 0.72)
      const logo = await sharp(input)
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      png = await sharp({
        create: { width: size, height: size, channels: 4, background },
      })
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toBuffer()
    } else {
      png = await sharp(input)
        .resize(size, size, { fit: 'contain', background })
        .png()
        .toBuffer()
    }

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.warn('[pwa-icon] fallback:', error)
    return NextResponse.json({ error: 'Icon unavailable' }, { status: 500 })
  }
}
