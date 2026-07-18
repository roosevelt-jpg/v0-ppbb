import { NextRequest, NextResponse } from 'next/server'
import { getAuthUidFromRequest } from '@/lib/event-luma-server'
import { reconcileVolunteerHoursForUser } from '@/lib/volunteer-hours-from-event'

/**
 * Recompute this member’s volunteer hours from each event’s start–end duration.
 */
export async function POST(request: NextRequest) {
  const uid = await getAuthUidFromRequest(request)
  if (!uid) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await reconcileVolunteerHoursForUser(uid)
    return NextResponse.json({
      success: true,
      updated: result.updated,
      totalHours: result.totalHours,
    })
  } catch (error) {
    console.error('[volunteering/reconcile-hours]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reconcile volunteer hours' },
      { status: 500 }
    )
  }
}
