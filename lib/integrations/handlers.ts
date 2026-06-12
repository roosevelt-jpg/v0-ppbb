import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, updateDoc } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import { Integration, IntegrationHealth } from './types'
import { encryptCredentials, decryptCredentials } from './encryption'

// Initialize Firebase (client-side)
const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
})

const db = getFirestore(app)

const INTEGRATIONS_COLLECTION = 'integrations'
const HEALTH_COLLECTION = 'integrationHealth'
const INCIDENTS_COLLECTION = 'integrationIncidents'

export async function saveIntegration(userId: string, serviceId: string, credentials: Record<string, string>): Promise<Integration> {
  try {
    const encrypted = encryptCredentials(credentials, serviceId)
    const integrationId = `${userId}_${serviceId}`
    
    const integration: Integration = {
      id: integrationId,
      userId,
      serviceId,
      serviceName: credentials.serviceName || serviceId,
      credentials: encrypted,
      status: 'inactive',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, INTEGRATIONS_COLLECTION, integrationId), {
      ...integration,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log('[v0] Integration saved:', integrationId)
    return integration
  } catch (error) {
    console.error('[v0] Error saving integration:', error)
    throw error
  }
}

export async function getIntegration(userId: string, serviceId: string): Promise<Integration | null> {
  try {
    const integrationId = `${userId}_${serviceId}`
    const docSnap = await getDoc(doc(db, INTEGRATIONS_COLLECTION, integrationId))
    
    if (!docSnap.exists()) return null
    
    const data = docSnap.data() as Integration
    // Decrypt credentials before returning
    data.credentials = decryptCredentials(data.credentials, serviceId)
    return data
  } catch (error) {
    console.error('[v0] Error getting integration:', error)
    return null
  }
}

export async function getAllIntegrations(userId: string): Promise<Integration[]> {
  try {
    const q = query(collection(db, INTEGRATIONS_COLLECTION), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Integration
      data.credentials = decryptCredentials(data.credentials, data.serviceId)
      return data
    })
  } catch (error) {
    console.error('[v0] Error getting all integrations:', error)
    return []
  }
}

export async function deleteIntegration(userId: string, serviceId: string): Promise<void> {
  try {
    const integrationId = `${userId}_${serviceId}`
    await deleteDoc(doc(db, INTEGRATIONS_COLLECTION, integrationId))
    console.log('[v0] Integration deleted:', integrationId)
  } catch (error) {
    console.error('[v0] Error deleting integration:', error)
    throw error
  }
}

export async function updateIntegrationStatus(userId: string, serviceId: string, status: 'active' | 'inactive' | 'error', testResult?: 'success' | 'failure'): Promise<void> {
  try {
    const integrationId = `${userId}_${serviceId}`
    await updateDoc(doc(db, INTEGRATIONS_COLLECTION, integrationId), {
      status,
      lastTested: new Date(),
      lastTestedResult: testResult,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('[v0] Error updating integration status:', error)
    throw error
  }
}

export async function saveIntegrationHealth(health: IntegrationHealth): Promise<void> {
  try {
    const healthId = `${health.serviceId}_health`
    await setDoc(doc(db, HEALTH_COLLECTION, healthId), {
      ...health,
      lastChecked: new Date(),
    })
  } catch (error) {
    console.error('[v0] Error saving health:', error)
    throw error
  }
}

export async function getIntegrationHealth(serviceId: string): Promise<IntegrationHealth | null> {
  try {
    const healthId = `${serviceId}_health`
    const docSnap = await getDoc(doc(db, HEALTH_COLLECTION, healthId))
    return docSnap.exists() ? (docSnap.data() as IntegrationHealth) : null
  } catch (error) {
    console.error('[v0] Error getting health:', error)
    return null
  }
}

export async function getAllIntegrationHealth(): Promise<IntegrationHealth[]> {
  try {
    const snapshot = await getDocs(collection(db, HEALTH_COLLECTION))
    return snapshot.docs.map((doc) => doc.data() as IntegrationHealth)
  } catch (error) {
    console.error('[v0] Error getting all health:', error)
    return []
  }
}
