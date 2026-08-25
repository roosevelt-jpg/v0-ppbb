import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { hasAdminAccessServer } from '@/lib/roles-server'
import {
  findInviteByCode,
  findInviteById,
  markInviteUsed,
  normalizeInviteEmail,
  upsertAdminUserProfile,
} from '@/lib/admin-invite-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Finalize admin setup:
 * 1) Create users/{uid} via Admin SDK (client cannot create admin roles)
 * 2) Sync admin-users / adminUsers
 * 3) Mark invite used
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { codeId, code, email, userId, firstName, lastName } = body

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const tokenUid = token ? await verifyIdToken(token) : null
    const resolvedUserId = tokenUid || (typeof userId === 'string' ? userId : null)

    if (!resolvedUserId) {
      return NextResponse.json(
        { success: false, error: 'Authenticated user id is required. Sign in again and retry.' },
        { status: 401 }
      )
    }

    const requestEmail = normalizeInviteEmail(email)
    if (!requestEmail) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    let invite =
      (typeof codeId === 'string' && codeId ? await findInviteById(codeId) : null) ||
      (typeof code === 'string' && code ? await findInviteByCode(code) : null)

    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Access code invitation not found' },
        { status: 404 }
      )
    }

    if (invite.adminEmail && invite.adminEmail !== requestEmail) {
      return NextResponse.json(
        { success: false, error: 'Email does not match this invitation' },
        { status: 403 }
      )
    }

    if (invite.expiresAt && new Date() > invite.expiresAt && !invite.isUsed) {
      return NextResponse.json(
        { success: false, error: 'Access code has expired' },
        { status: 401 }
      )
    }

    if (invite.isUsed) {
      const userSnap = await getAdminDb().collection('users').doc(resolvedUserId).get()
      const hasAdminProfile =
        userSnap.exists && hasAdminAccessServer(userSnap.data() || {})
      const sameRedeemer =
        !invite.redeemedUserId || invite.redeemedUserId === resolvedUserId

      if (hasAdminProfile && sameRedeemer) {
        return NextResponse.json({ success: true, userId: resolvedUserId, alreadyComplete: true })
      }

      if (!sameRedeemer && invite.redeemedUserId) {
        // Another auth uid already redeemed — only allow if that uid still has no admin profile
        const otherSnap = await getAdminDb().collection('users').doc(invite.redeemedUserId).get()
        if (otherSnap.exists && hasAdminAccessServer(otherSnap.data() || {})) {
          return NextResponse.json(
            { success: false, error: 'This access code has already been used by another account' },
            { status: 409 }
          )
        }
      }
      // Recovery: continue to upsert admin profile
    }

    // Role/permissions always come from the invite itself, never the
    // request body — otherwise redeeming any invite with an elevated role
    // in the POST body would grant that role regardless of what the invite
    // actually specified.
    const role = invite.adminRole || 'admin'
    const permissions = invite.permissions

    // Profile FIRST — never burn the invite before users/{uid} exists
    await upsertAdminUserProfile({
      uid: resolvedUserId,
      email: requestEmail,
      firstName: typeof firstName === 'string' ? firstName : undefined,
      lastName: typeof lastName === 'string' ? lastName : undefined,
      name: invite.adminName,
      role,
      permissions,
      accessCodeId: invite.id,
    })

    await markInviteUsed({
      codeId: invite.id,
      email: requestEmail,
      userId: resolvedUserId,
    })

    return NextResponse.json({ success: true, userId: resolvedUserId })
  } catch (error) {
    console.error('[v0] Access code redeem error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create admin profile. Please try again.',
      },
      { status: 500 }
    )
  }
}
