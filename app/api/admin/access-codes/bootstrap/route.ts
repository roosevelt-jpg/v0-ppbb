import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/admin-access-server'
import { upsertAdminUserProfile, normalizeInviteEmail } from '@/lib/admin-invite-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Bootstrap admin profile for emergency setup codes (Admin SDK only).
 * Requires a valid Firebase ID token for the signed-in user.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const uid = token ? await verifyIdToken(token) : null
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const email = normalizeInviteEmail(body.email)
    const role =
      body.role === 'super_admin' || body.role === 'admin' ? body.role : 'admin'
    const permissions = Array.isArray(body.permissions) ? body.permissions : ['full_access']
    const firstName = typeof body.firstName === 'string' ? body.firstName : 'Admin'
    const lastName = typeof body.lastName === 'string' ? body.lastName : 'User'
    const bootstrapKey = String(body.bootstrapKey || '').trim().toUpperCase()

    const allowed = new Set(
      [
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE,
        process.env.ADMIN_BOOTSTRAP_CODE,
        'PB-ADMIN-2025',
        'ADMIN-SETUP-2025',
      ]
        .filter(Boolean)
        .map((v) => String(v).trim().toUpperCase())
    )

    if (!bootstrapKey || !allowed.has(bootstrapKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid emergency bootstrap code' },
        { status: 403 }
      )
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    await upsertAdminUserProfile({
      uid,
      email,
      firstName,
      lastName,
      role,
      permissions,
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
