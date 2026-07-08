import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyIdToken } from '@/lib/admin-access-server'
import { getUserRoles } from '@/lib/roles-server'

/**
 * Server-side role probe used by dashboards for dual-layer enforcement.
 * Reads users/{uid}.role (+ roles[]) — same source as lib/roles client helpers.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const uid = await verifyIdToken(token)
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    const snap = await db.collection('users').doc(uid).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const data = snap.data() || {}
    const roles = getUserRoles({
      role: data.role,
      roles: data.roles,
    })

    return NextResponse.json({
      success: true,
      uid,
      role: data.role || null,
      roles,
      isAdmin: roles.includes('admin') || roles.includes('super_admin'),
      isBusiness: roles.includes('business') || roles.includes('admin') || roles.includes('super_admin'),
      isBasicMember:
        !roles.includes('admin') &&
        !roles.includes('super_admin') &&
        !roles.includes('business'),
    })
  } catch (error) {
    console.error('[session/role]', error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
