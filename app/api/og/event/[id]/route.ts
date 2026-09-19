import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { buildEventOgJpeg } from '@/lib/event-og-image'
import { getSiteUrl } from '@/lib/site-metadata'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const site = getSiteUrl()

  try {
    const snap = await getAdminDb().collection('events').doc(id).get()
    if (snap.exists) {
      const jpeg = await buildEventOgJpeg(snap.data() as Record<string, unknown>)
      if (jpeg?.length) {
        return new NextResponse(new Uint8Array(jpeg), {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }
    }
  } catch (err) {
    console.error('[api/og/event]', err)
  }

  return NextResponse.redirect(`${site}/opengraph-image`, 302)
}