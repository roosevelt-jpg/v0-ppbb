import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { upsertAdminUserProfile, normalizeInviteEmail } from '@/lib/admin-invite-server'
import { getAdminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-time bootstrap: creates the very first admin account (Admin SDK only).
 * Requires a valid Firebase ID token, AND a server-only ADMIN_BOOTSTRAP_CODE
 * env var to be configured, AND that no admin account exists yet — this is
 * strictly a "set up the first super admin on a fresh deployment" path, not
 * a standing way in. Once any admin-users doc exists, this route always
 * rejects; further admins must come through a real invite from Management.
 * There is deliberately no hardcoded fallback code — an unconfigured
 * ADMIN_BOOTSTRAP_CODE means bootstrap is disabled, not "use the default".
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const configuredCode = String(process.env.ADMIN_BOOTSTRAP_CODE || '').trim().toUpperCase()
    if (!configuredCode) {
      return NextResponse.json(
        { success: false, error: 'Emergency admin bootstrap is not enabled on this deployment.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const email = normalizeInviteEmail(body.email)
    const firstName = typeof body.firstName === 'string' ? body.firstName : 'Admin'
    const lastName = typeof body.lastName === 'string' ? body.lastName : 'User'
    const bootstrapKey = String(body.bootstrapKey || '').trim().toUpperCase()

    if (!bootstrapKey || bootstrapKey !== configuredCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid emergency bootstrap code' },
        { status: 403 }
      )
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const existingAdmins = await getAdminDb().collection('admin-users').limit(1).get()
    if (!existingAdmins.empty) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Admin accounts already exist. Ask an existing super admin to send you an invite from Admin → Management.',
        },
        { status: 403 }
      )
    }

    // The first bootstrapped account is always the super admin with full
    // access — role/permissions are never taken from the request body, so a
    // caller can't request an elevated grant for themselves.
    await upsertAdminUserProfile({
      uid,
      email,
      firstName,
      lastName,
      role: 'super_admin',
      permissions: ['full_access'],
      accessCodeId: null,
    })

    return NextResponse.json({ success: true, userId: uid })
  } catch (error) {
    console.error('[v0] Admin bootstrap error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to bootstrap admin profile' },
      { status: 500 }
    )
  }
}
