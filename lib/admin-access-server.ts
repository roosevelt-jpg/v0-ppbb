import { getFirestore } from 'firebase-admin/firestore'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getAdminApp } from '@/lib/firebase-admin'
import {
  canAccessAdminPath,
  hasInvitePermission,
  type InvitePermissionId,
} from '@/lib/admin-invite-permissions'
import { isWelfareOperationalRole } from '@/lib/charity-cases'
import type { User } from '@/lib/types'

/**
 * Firebase ID token JWKS. Verifying with jose avoids importing `firebase-admin/auth`,
 * which currently crashes some Next.js serverless bundles at module load
 * (HTML 500 before route handlers run). Firestore Admin remains fine.
 */
const FIREBASE_AUTH_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

function firebaseProjectId(): string | null {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    null
  )
}

/**
 * Server-side only: Verify Firebase ID token and get user ID.
 * Uses JWKS verification (no firebase-admin/auth import).
 */
export async function verifyIdToken(token: string): Promise<string | null> {
  try {
    const projectId = firebaseProjectId()
    if (!projectId) {
      console.error('[admin-access] Token verification failed: missing Firebase project id')
      return null
    }

    const { payload } = await jwtVerify(token, FIREBASE_AUTH_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })

    const uid = typeof payload.sub === 'string' ? payload.sub : null
    if (!uid) return null
    if (payload.auth_time == null) return null
    return uid
  } catch (error) {
    console.error('[v0] Token verification failed:', error)
    return null
  }
}

/**
 * Server-side only: Check if user is admin
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const app = getAdminApp()
    const db = getFirestore(app)
    const adminRef = db.collection('adminUsers').doc(userId)
    const adminSnap = await adminRef.get()
    if (adminSnap.exists) return true
    const legacyAdminRef = db.collection('admin-users').doc(userId)
    const legacyAdminSnap = await legacyAdminRef.get()
    if (legacyAdminSnap.exists) return true
    const userSnap = await db.collection('users').doc(userId).get()
    const data = userSnap.data() || {}
    const role = data.role
    const roles = Array.isArray(data.roles) ? data.roles.map(String) : []
    if (
      role === 'admin' ||
      role === 'super_admin' ||
      isWelfareOperationalRole(role) ||
      roles.some((r) => r === 'admin' || r === 'super_admin' || isWelfareOperationalRole(r))
    ) {
      return true
    }
    return false
  } catch (error) {
    console.error('[v0] Admin check failed:', error)
    return false
  }
}

/**
 * Server-side only: Get user profile from users collection
 */
export async function getUserProfileData(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const app = getAdminApp()
    const db = getFirestore(app)
    const userSnap = await db.collection('users').doc(userId).get()
    return userSnap.exists ? (userSnap.data() as Record<string, unknown>) : null
  } catch (error) {
    console.error('[v0] Get user profile failed:', error)
    return null
  }
}

/**
 * Server-side invite permission check (users/{uid}.permissions from invitation flow)
 */
export async function hasInvitePermissionServer(
  userId: string,
  permission: InvitePermissionId
): Promise<boolean> {
  const data = await getAdminUserData(userId)
  if (!data) return false
  return hasInvitePermission(
    {
      role: data.role as string,
      permissions: data.permissions as string[],
    },
    permission
  )
}

/**
 * Server-side route access for scoped admin permissions
 */
export async function canAccessAdminPathServer(userId: string, pathname: string): Promise<boolean> {
  const data = await getAdminUserData(userId)
  if (!data) return false
  if (!(await isAdminUser(userId))) return false
  return canAccessAdminPath(
    {
      role: data.role as User['role'],
      permissions: data.permissions as string[],
    },
    pathname
  )
}

/**
 * @deprecated Do not auto-expand invite permissions by role.
 * Kept as a no-op so older callers do not grant extra access.
 */
export async function grantIntegrationPermission(_userId: string): Promise<boolean> {
  return false
}

/**
 * Server-side only: Get admin user data
 */
export async function getAdminUserData(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const app = getAdminApp()
    const db = getFirestore(app)
    const [adminSnap, legacyAdminSnap, userSnap] = await Promise.all([
      db.collection('adminUsers').doc(userId).get(),
      db.collection('admin-users').doc(userId).get(),
      db.collection('users').doc(userId).get(),
    ])

    if (!adminSnap.exists && !legacyAdminSnap.exists && !userSnap.exists) {
      return null
    }

    const adminData = adminSnap.exists ? adminSnap.data() : {}
    const legacyAdminData = legacyAdminSnap.exists ? legacyAdminSnap.data() : {}
    const userData = userSnap.exists ? userSnap.data() : {}

    let role =
      adminData?.adminRole ||
      adminData?.role ||
      legacyAdminData?.adminRole ||
      legacyAdminData?.role ||
      userData?.adminRole ||
      userData?.role

    // Membership roles (member/business) must not shadow admin panel access —
    // Passive Blessings superadmins often keep users.role as member.
    const membershipRoles = new Set(['member', 'volunteer', 'business', 'sponsor'])
    const roleKey = typeof role === 'string' ? role.trim().toLowerCase() : ''
    const isPanelAdmin = adminSnap.exists || legacyAdminSnap.exists
    const rolesList = [
      ...(Array.isArray(userData?.roles) ? (userData.roles as unknown[]) : []),
      ...(Array.isArray(adminData?.roles) ? (adminData.roles as unknown[]) : []),
      ...(Array.isArray(legacyAdminData?.roles) ? (legacyAdminData.roles as unknown[]) : []),
    ].map((r) => String(r || '').trim().toLowerCase())
    const flaggedSuper =
      adminData?.isSuperAdmin === true ||
      userData?.isSuperAdmin === true ||
      adminData?.superAdmin === true ||
      rolesList.includes('super_admin') ||
      rolesList.includes('superadmin') ||
      roleKey === 'super_admin' ||
      roleKey === 'superadmin'

    if (flaggedSuper) {
      role = 'super_admin'
    } else if (isPanelAdmin && (!roleKey || membershipRoles.has(roleKey))) {
      role = 'admin'
    }

    return {
      ...userData,
      ...legacyAdminData,
      ...adminData,
      role,
      adminRole: role,
      roles: Array.from(
        new Set([
          ...(Array.isArray(userData?.roles) ? (userData.roles as string[]) : []),
          ...(role ? [String(role)] : []),
        ])
      ),
      // Invite permissions on users/{uid} are the source of truth for menu gating
      permissions:
        (Array.isArray(userData?.permissions) && (userData.permissions as unknown[]).length > 0
          ? userData.permissions
          : null) ||
        (Array.isArray(legacyAdminData?.permissions) &&
        (legacyAdminData.permissions as unknown[]).length > 0
          ? legacyAdminData.permissions
          : null) ||
        adminData?.permissions ||
        [],
    }
  } catch (error) {
    console.error('[v0] Get admin user failed:', error)
    return null
  }
}
