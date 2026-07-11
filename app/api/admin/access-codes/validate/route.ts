import { NextRequest, NextResponse } from 'next/server'
import {
  findInviteByCode,
  findUserIdByEmail,
} from '@/lib/admin-invite-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { hasAdminAccessServer } from '@/lib/roles-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Validate an invite access code (setup step 1).
 * Allows recovery when the code was marked used but the users profile is still missing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code || '').trim().toUpperCase()

    if (!code) {
      return NextResponse.json({ success: false, error: 'Access code is required' }, { status: 400 })
    }

    const invite = await findInviteByCode(code)
    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Invalid access code' },
        { status: 401 }
      )
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Access code has expired. Ask a super admin for a new invite.' },
        { status: 401 }
      )
    }

    let recovery = false
    if (invite.isUsed) {
      const profileUid =
        invite.redeemedUserId ||
        (invite.adminEmail ? await findUserIdByEmail(invite.adminEmail) : null)

      let hasCompleteAdminProfile = false
      if (profileUid) {
        const userSnap = await getAdminDb().collection('users').doc(profileUid).get()
        if (userSnap.exists && hasAdminAccessServer(userSnap.data() || {})) {
          hasCompleteAdminProfile = true
        }
      }

      if (hasCompleteAdminProfile) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This access code has already been used. Sign in at Admin Login with your email and password.',
          },
          { status: 401 }
        )
      }

      // Used code but admin profile missing (or only a member stub) — allow finish setup
      recovery = true
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        code: invite.code,
        adminEmail: invite.adminEmail,
        adminName: invite.adminName,
        adminRole: invite.adminRole,
        permissions: invite.permissions,
        expiresAt: invite.expiresAt?.toISOString() || null,
        recovery,
      },
    })
  } catch (error) {
    console.error('[v0] Access code validate error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate access code' },
      { status: 500 }
    )
  }
}
