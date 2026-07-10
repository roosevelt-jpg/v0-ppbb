import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from '@/lib/firebase-admin'
import {
  canAccessAdminPath,
  hasInvitePermission,
  type InvitePermissionId,
} from '@/lib/admin-invite-permissions'
import { isWelfareOperationalRole } from '@/lib/charity-cases'
import type { User } from '@/lib/types'

/**
 * Server-side only: Verify Firebase ID token and get user ID.
 * Uses the shared Admin app from lib/firebase-admin (GCP_SERVICE_ACCOUNT or FIREBASE_ADMIN_*).
 */
export async function verifyIdToken(token: string): Promise<string | null> {
  try {
    const app = getAdminApp()
    const decodedToken = await getAuth(app).verifyIdToken(token)
    return decodedToken.uid
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
    const role = userSnap.data()?.role
    return (
      role === 'admin' ||
      role === 'super_admin' ||
      isWelfareOperationalRole(role)
    )
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
  const data = await getUserProfileData(userId)
  if (!data) return false
  const role = data.role as string
  if (
    role !== 'admin' &&
    role !== 'super_admin' &&
    !isWelfareOperationalRole(role)
  ) {
    return false
  }
  return canAccessAdminPath(
    { role: role as User['role'], permissions: data.permissions as string[] },
    pathname
  )
}

/**
 * Server-side only: Auto-grant manage_integrations to founder_admin
 */
export async function grantIntegrationPermission(userId: string): Promise<boolean> {
  try {
    const app = getAdminApp()
    const db = getFirestore(app)
    const adminRef = db.collection('adminUsers').doc(userId)
    const adminSnap = await adminRef.get()

    if (!adminSnap.exists) return false

    const adminData = adminSnap.data()
    if (adminData?.adminRole !== 'founder_admin') return false

    const currentPerms = adminData?.permissions || []
    if (!currentPerms.includes('manage_integrations')) {
      await adminRef.update({
        permissions: [...currentPerms, 'manage_integrations'],
      })
    }
    return true
  } catch (error) {
    console.error('[v0] Grant permission failed:', error)
    return false
  }
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

    const role =
      adminData?.adminRole ||
      adminData?.role ||
      legacyAdminData?.adminRole ||
      legacyAdminData?.role ||
      userData?.adminRole ||
      userData?.role

    return {
      ...userData,
      ...legacyAdminData,
      ...adminData,
      role,
      adminRole: role,
    }
  } catch (error) {
    console.error('[v0] Get admin user failed:', error)
    return null
  }
}
