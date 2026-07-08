import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import {
  canAccessAdminPath,
  hasInvitePermission,
  type InvitePermissionId,
} from '@/lib/admin-invite-permissions'

// Initialize Firebase Admin SDK
let adminApp: any = null

function getAdminApp() {
  if (adminApp) return adminApp
  
  const apps = getApps()
  if (apps.length > 0) return apps[0]

  try {
    console.log('[v0] GCP_SERVICE_ACCOUNT env var exists:', !!process.env.GCP_SERVICE_ACCOUNT)
    console.log('[v0] NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    
    let serviceAccount: any = undefined
    
    if (process.env.GCP_SERVICE_ACCOUNT) {
      console.log('[v0] Attempting to parse GCP_SERVICE_ACCOUNT...')
      const raw = process.env.GCP_SERVICE_ACCOUNT

      // Strategy 1: parse as-is. The env var is normally a complete JSON
      // document whose private_key already contains escaped "\n" sequences;
      // JSON.parse converts those to real newlines, exactly what cert() needs.
      // This MUST be tried before any \n replacement, otherwise we corrupt the
      // JSON string literal and get "Bad control character in string literal".
      try {
        serviceAccount = JSON.parse(raw)
        console.log('[v0] Successfully parsed GCP_SERVICE_ACCOUNT as direct JSON')
      } catch (directError) {
        // Strategy 2: maybe it's base64-encoded JSON.
        try {
          const decoded = Buffer.from(raw, 'base64').toString('utf8')
          serviceAccount = JSON.parse(decoded)
          console.log('[v0] Successfully parsed GCP_SERVICE_ACCOUNT as base64-encoded JSON')
        } catch (base64Error) {
          // Strategy 3: last resort — the value had its newlines unescaped
          // somewhere along the way; re-escape raw control chars and retry.
          try {
            const repaired = raw
              .replace(/\r\n/g, '\\n')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\n')
              .replace(/\t/g, '\\t')
            serviceAccount = JSON.parse(repaired)
            console.log('[v0] Successfully parsed GCP_SERVICE_ACCOUNT after re-escaping newlines')
          } catch (jsonError) {
            console.error('[v0] Failed to parse GCP_SERVICE_ACCOUNT as JSON:', jsonError instanceof Error ? jsonError.message : String(jsonError))
            throw new Error(`Invalid GCP_SERVICE_ACCOUNT format: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`)
          }
        }
      }
    } else {
      console.error('[v0] GCP_SERVICE_ACCOUNT environment variable is not set')
    }

    if (!serviceAccount) {
      throw new Error('GCP_SERVICE_ACCOUNT not configured')
    }

    console.log('[v0] Initializing Firebase Admin SDK...')
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
    console.log('[v0] Firebase Admin SDK initialized successfully')

    return adminApp
  } catch (error) {
    console.error('[v0] Failed to initialize admin app:', error instanceof Error ? error.message : String(error))
    throw error
  }
}

/**
 * Server-side only: Verify Firebase ID token and get user ID
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
    const userSnap = await db.collection('users').doc(userId).get()
    const role = userSnap.data()?.role
    return role === 'admin' || role === 'super_admin'
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
  const data = await getUserProfileData(userId)
  if (!data) return false
  return hasInvitePermission(
    { role: data.role as string, permissions: data.permissions as string[] },
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
  if (role !== 'admin' && role !== 'super_admin') return false
  return canAccessAdminPath(
    { role: role as 'admin' | 'super_admin', permissions: data.permissions as string[] },
    pathname
  )
}

/**
 * Server-side only: Check if user has specific permission
 */
export async function hasPermissionServer(userId: string, permission: string): Promise<boolean> {
  try {
    const app = getAdminApp()
    const db = getFirestore(app)
    const adminRef = db.collection('adminUsers').doc(userId)
    const adminSnap = await adminRef.get()
    
    if (!adminSnap.exists) return false
    const adminData = adminSnap.data()
    return adminData?.permissions?.includes(permission) || false
  } catch (error) {
    console.error('[v0] Permission check failed:', error)
    return false
  }
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
export async function getAdminUserData(userId: string): Promise<any> {
  try {
    const app = getAdminApp()
    const db = getFirestore(app)
    const adminRef = db.collection('adminUsers').doc(userId)
    const adminSnap = await adminRef.get()
    return adminSnap.exists ? adminSnap.data() : null
  } catch (error) {
    console.error('[v0] Get admin user failed:', error)
    return null
  }
}
