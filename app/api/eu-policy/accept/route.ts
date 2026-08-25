import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { getAuthUidFromRequest } from '@/lib/event-luma-server'
import { getClientIpFromRequest } from '@/lib/audit-log-shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Records a site visitor's EU Data Protection Policy acceptance server-side.
 *
 * The popup used to write straight to Firestore's `policyAcceptances` from
 * the browser, but only for logged-in visitors, and that write always failed
 * silently — there is no rule permitting it, so it fell through to the
 * default deny-all rule. Anonymous visitors (the majority of first-time
 * traffic this popup targets) never had a write attempted for them at all.
 * Routing through the Admin SDK here — same pattern as the public GET in
 * ../route.ts — records every acceptance regardless of login state and
 * bypasses client security rules entirely, since this endpoint is the only
 * writer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const policyId = typeof body?.policyId === 'string' ? body.policyId.trim() : ''
    const policyVersion = Number(body?.policyVersion)

    if (!policyId || !Number.isFinite(policyVersion)) {
      return NextResponse.json(
        { success: false, error: 'policyId and policyVersion are required' },
        { status: 400 }
      )
    }

    const db = getAdminDb()

    // Confirm this is actually the current policy/version rather than trusting
    // whatever the client sends — the current doc is the only source of truth.
    const currentSnap = await db.collection('euDataProtectionPolicy').doc('current').get()
    const current = currentSnap.exists ? currentSnap.data() : null
    if (!current || current.id !== policyId || Number(current.version) !== policyVersion) {
      return NextResponse.json(
        { success: false, error: 'Policy is out of date, please reload and try again' },
        { status: 409 }
      )
    }

    const uid = await getAuthUidFromRequest(request)

    await db.collection('policyAcceptances').add({
      policyId,
      policyVersion,
      userId: uid,
      acceptedAt: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || '',
      ipAddress: getClientIpFromRequest(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api/eu-policy/accept] error:', error)
    return NextResponse.json({ success: false, error: 'Failed to record acceptance' }, { status: 500 })
  }
}
