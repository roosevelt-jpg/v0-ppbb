import { NextRequest, NextResponse } from 'next/server'
import {
  verifyIdToken,
  isAdminUser,
  getAdminUserData,
} from '@/lib/admin-access-server'
import {
  canAccessAdminApi,
  hasInvitePermission,
  type InvitePermissionId,
} from '@/lib/admin-invite-permissions'
import type { User } from '@/lib/types'

function permissionUserFromAdminData(
  data: Record<string, unknown> | null
): Pick<User, 'role' | 'permissions'> | null {
  if (!data) return null
  return {
    role: data.role as User['role'],
    permissions: Array.isArray(data.permissions) ? (data.permissions as string[]) : [],
  }
}

/**
 * Require a signed-in admin. Invite permissions are enforced against the request
 * path (see API_PERMISSION_PREFIXES) unless `permission` is passed explicitly.
 */
export async function requireAdminFromRequest(
  request: NextRequest,
  options?: {
    /** Explicit permission(s) instead of path inference */
    permission?: InvitePermissionId | InvitePermissionId[]
    /** Any admin panel user — skips invite permission check (rare) */
    anyAdmin?: boolean
  }
): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const uid = await verifyIdToken(token)
  if (!uid) return null
  const isAdmin = await isAdminUser(uid)
  if (!isAdmin) return null

  if (options?.anyAdmin) return uid

  const data = await getAdminUserData(uid)
  const user = permissionUserFromAdminData(data)
  if (!user) return null

  if (options?.permission) {
    const needed = Array.isArray(options.permission) ? options.permission : [options.permission]
    const ok = needed.some((perm) => hasInvitePermission(user, perm))
    return ok ? uid : null
  }

  const apiPath = request.nextUrl.pathname
  if (!canAccessAdminApi(user, apiPath)) return null
  return uid
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden: insufficient admin permission') {
  return NextResponse.json({ error: message }, { status: 403 })
}
