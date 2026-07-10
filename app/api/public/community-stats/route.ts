import { NextResponse } from 'next/server'
import {
  cachePublicCommunityStats,
  computePublicCommunityStats,
} from '@/lib/public-community-stats-server'

export const dynamic = 'force-dynamic'

/** Public platform counters for login page, footer, etc. */
export async function GET() {
  try {
    const stats = await computePublicCommunityStats()
    await cachePublicCommunityStats(stats).catch((err) => {
      console.warn('[community-stats] cache write failed:', err)
    })
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('[community-stats GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load community statistics' },
      { status: 500 }
    )
  }
}
