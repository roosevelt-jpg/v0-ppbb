import { NextResponse } from 'next/server'
import { computePublicTransparencyStats } from '@/lib/public-transparency-stats-server'

export const dynamic = 'force-dynamic'

/** Public aggregated impact stats for /transparency (no sensitive donor data). */
export async function GET() {
  try {
    const data = await computePublicTransparencyStats()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[transparency-stats GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load transparency statistics' },
      { status: 500 }
    )
  }
}
