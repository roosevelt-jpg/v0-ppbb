import { getFirestore } from 'firebase-admin/firestore'
import { Integration, IntegrationHealth } from './types'
import { encryptCredentials, decryptCredentials } from './encryption'
import { initializeApp, getApps } from 'firebase-admin/app'
import { credential } from 'firebase-admin'

const INTEGRATIONS_COLLECTION = 'integrations'
const HEALTH_COLLECTION = 'integrationHealth'

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  try {
    let serviceAccount: any = null

    if (process.env.GCP_SERVICE_ACCOUNT) {
      // GCP_SERVICE_ACCOUNT is stored as plain JSON in Vercel (not base64)
      const raw = process.env.GCP_SERVICE_ACCOUNT.replace(/\\n/g, '\n')
      serviceAccount = JSON.parse(raw)
    } else {
      // Fallback to individual env vars
      serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
    }

    if (!serviceAccount?.project_id && !serviceAccount?.projectId) {
      throw new Error('Firebase credentials not configured')
    }

    return initializeApp({
      credential: credential.cert(serviceAccount as any),
    })
  } catch (error) {
    console.error('[v0] Firebase init error:', error)
    throw error
  }
}

function getAdminDb() {
  const app = getAdminApp()
  return getFirestore(app)
}

export async function saveIntegrationServer(
  userId: string,
  serviceId: string,
  credentials: Record<string, string>
): Promise<Integration> {
  try {
    console.log('[v0] Saving integration (server):', serviceId, 'for', userId)
    const encrypted = encryptCredentials(credentials, serviceId)
    const integrationId = `${userId}_${serviceId}`
    const db = getAdminDb()

    const integration: Integration = {
      id: integrationId,
      userId,
      serviceId,
      serviceName: credentials.serviceName || serviceId,
      credentials: encrypted,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).set({
      ...integration,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })

    console.log('[v0] Integration saved (server):', integrationId)
    return integration
  } catch (error) {
    console.error('[v0] Error saving integration (server):', error)
    throw error
  }
}

export async function getIntegrationServer(userId: string, serviceId: string): Promise<Integration | null> {
  try {
    const integrationId = `${userId}_${serviceId}`
    const db = getAdminDb()
    const snap = await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).get()

    if (!snap.exists) return null

    const data = snap.data() as Integration
    return {
      ...data,
      credentials: decryptCredentials(data.credentials, serviceId),
    }
  } catch (error) {
    console.error('[v0] Error getting integration (server):', error)
    throw error
  }
}

export async function getAllIntegrationsServer(userId: string): Promise<Integration[]> {
  try {
    const db = getAdminDb()
    const snap = await db.collection(INTEGRATIONS_COLLECTION).where('userId', '==', userId).get()

    return snap.docs.map((doc) => {
      const data = doc.data() as Integration
      return {
        ...data,
        credentials: decryptCredentials(data.credentials, data.serviceId),
      }
    })
  } catch (error) {
    console.error('[v0] Error getting all integrations (server):', error)
    throw error
  }
}

export async function deleteIntegrationServer(userId: string, serviceId: string): Promise<void> {
  try {
    const integrationId = `${userId}_${serviceId}`
    const db = getAdminDb()
    await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).delete()
    console.log('[v0] Integration deleted (server):', integrationId)
  } catch (error) {
    console.error('[v0] Error deleting integration (server):', error)
    throw error
  }
}

export async function updateIntegrationStatusServer(
  userId: string,
  serviceId: string,
  status: 'active' | 'inactive' | 'error'
): Promise<void> {
  try {
    const integrationId = `${userId}_${serviceId}`
    const db = getAdminDb()
    await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).update({
      status,
      updatedAt: new Date(),
    })
    console.log('[v0] Integration status updated (server):', integrationId, status)
  } catch (error) {
    console.error('[v0] Error updating integration status (server):', error)
    throw error
  }
}

export async function getIntegrationHealthServer(serviceId: string): Promise<IntegrationHealth | null> {
  try {
    const db = getAdminDb()
    const snap = await db.collection(HEALTH_COLLECTION).doc(serviceId).get()
    return snap.exists ? (snap.data() as IntegrationHealth) : null
  } catch (error) {
    console.error('[v0] Error getting health (server):', error)
    throw error
  }
}

export async function getAllIntegrationHealthServer(): Promise<IntegrationHealth[]> {
  try {
    const db = getAdminDb()
    const snap = await db.collection(HEALTH_COLLECTION).get()
    return snap.docs.map((doc) => doc.data() as IntegrationHealth)
  } catch (error) {
    console.error('[v0] Error getting all health (server):', error)
    throw error
  }
}

export async function saveIntegrationHealthServer(health: IntegrationHealth): Promise<void> {
  try {
    const db = getAdminDb()
    await db.collection(HEALTH_COLLECTION).doc(health.serviceId).set(
      { ...health, updatedAt: new Date() },
      { merge: true }
    )
  } catch (error) {
    console.error('[v0] Error saving health (server):', error)
    throw error
  }
}
