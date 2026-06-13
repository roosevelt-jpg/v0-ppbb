import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

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
      try {
        // Try base64 decoding first
        const decoded = Buffer.from(process.env.GCP_SERVICE_ACCOUNT, 'base64').toString()
        serviceAccount = JSON.parse(decoded)
        console.log('[v0] Successfully parsed GCP_SERVICE_ACCOUNT as base64-encoded JSON')
      } catch (base64Error) {
        console.log('[v0] Base64 parsing failed, trying direct JSON...')
        try {
          // If base64 fails, try parsing as direct JSON
          serviceAccount = JSON.parse(process.env.GCP_SERVICE_ACCOUNT)
          console.log('[v0] Successfully parsed GCP_SERVICE_ACCOUNT as direct JSON')
        } catch (jsonError) {
          console.error('[v0] Failed to parse GCP_SERVICE_ACCOUNT as JSON:', jsonError instanceof Error ? jsonError.message : String(jsonError))
          throw new Error(`Invalid GCP_SERVICE_ACCOUNT format: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`)
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
    return adminSnap.exists
  } catch (error) {
    console.error('[v0] Admin check failed:', error)
    return false
  }
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
