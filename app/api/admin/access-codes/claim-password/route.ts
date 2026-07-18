import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminApp } from '@/lib/firebase-admin'
import {
  findInviteByCode,
  findInviteById,
  normalizeInviteEmail,
} from '@/lib/admin-invite-server'
import { getAdminDb } from '@/lib/firebase-admin'
import { hasAdminAccessServer } from '@/lib/roles-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Set/reset the invitee's Auth password during /admin/setup when an Auth
 * account already exists (e.g. super admin sent password reset early).
 * Requires a valid unused/recovery invite matching the email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = normalizeInviteEmail(body.email)
    const password = String(body.password || '')
    const codeId = typeof body.codeId === 'string' ? body.codeId : ''
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const invite =
      (codeId ? await findInviteById(codeId) : null) ||
      (code ? await findInviteByCode(code) : null)

    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Access code invitation not found' },
        { status: 404 }
      )
    }

    if (invite.adminEmail && invite.adminEmail !== email) {
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
      const profileUid = invite.redeemedUserId
      if (profileUid) {
        const userSnap = await getAdminDb().collection('users').doc(profileUid).get()
        if (userSnap.exists && hasAdminAccessServer(userSnap.data() || {})) {
          return NextResponse.json(
            {
              success: false,
              error:
                'This access code has already been used. Sign in at Admin Login, or use password reset from there.',
            },
            { status: 409 }
          )
        }
      }
    }

    const auth = getAuth(getAdminApp())
    let uid: string
    try {
      const existing = await auth.getUserByEmail(email)
      uid = existing.uid
      await auth.updateUser(uid, { password, displayName: invite.adminName || undefined })
    } catch {
      const created = await auth.createUser({
        email,
        password,
        emailVerified: false,
        displayName: invite.adminName || undefined,
        disabled: false,
      })
      uid = created.uid
    }

    return NextResponse.json({ success: true, uid })
  } catch (error) {
    console.error('[v0] claim-password error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to set password for this invitation',
      },
      { status: 500 }
    )
  }
}
