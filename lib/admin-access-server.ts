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
    const serviceAccount = process.env.GCP_SERVICE_ACCOUNT
      ? JSON.parse(Buffer.from(process.env.GCP_SERVICE_ACCOUNT, 'base64').toString())
      : undefined

    if (!serviceAccount) {
      throw new Error('GCP_SERVICE_ACCOUNT not configured')
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })

    return adminApp
  } catch (error) {
    console.error('[v0] Failed to initialize admin app:', error)
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
