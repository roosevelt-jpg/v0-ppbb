import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { syncMembershipFromStripe } from '@/lib/payment-completion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Pull the signed-in member's live Stripe subscription onto their profile.
 * Called after the embedded card form succeeds and when a member page sees
 * an inactive profile that has Stripe billing on file.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Sign in required' }, { status: 401 })
    }

    const result = await syncMembershipFromStripe(uid)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[membership/sync]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Membership sync failed' },
      { status: 500 }
    )
  }
}
