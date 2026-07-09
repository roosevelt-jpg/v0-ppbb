import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { toPublicMemberProfile } from '@/lib/user-settings'

/**
 * Public member profile respecting privacy settings.
 * GET /api/members/[id]/public-profile?viewerId=
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const viewerId = request.nextUrl.searchParams.get('viewerId')

    const db = getAdminDb()
    const snap = await db.collection('users').doc(id).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 })
    }

    const profile = toPublicMemberProfile(id, snap.data(), viewerId)

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('[v0] public-profile error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load profile' }, { status: 500 })
  }
}
