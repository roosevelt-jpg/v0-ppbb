import { db } from '@/lib/firebase'
import { ApiConfig, SystemHealth } from '@/lib/types'
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore'

const API_CONFIG_COLLECTION = 'apiConfigs'

// Encrypt sensitive data (in production, use a proper encryption library)
function encryptData(data: string): string {
  return Buffer.from(data).toString('base64')
}

function decryptData(data: string): string {
  return Buffer.from(data, 'base64').toString()
}

export async function getApiConfig(serviceName: string): Promise<ApiConfig | null> {
  try {
    const q = query(
      collection(db, API_CONFIG_COLLECTION),
      where('serviceName', '==', serviceName)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    const data = docSnap.data()

    const decryptedConfig: any = {
      ...data,
    }

    // Decrypt standard fields
    if (data.apiKey) {
      decryptedConfig.apiKey = decryptData(data.apiKey)
    }
    if (data.apiSecret) {
      decryptedConfig.apiSecret = decryptData(data.apiSecret)
    }

    // Decrypt Firebase Admin SDK fields
    if (data.privateKey) {
      decryptedConfig.privateKey = decryptData(data.privateKey)
    }
    if (data.clientEmail) {
      decryptedConfig.clientEmail = decryptData(data.clientEmail)
    }
    if (data.projectId) {
      decryptedConfig.projectId = decryptData(data.projectId)
    }
    if (data.privateKeyId) {
      decryptedConfig.privateKeyId = decryptData(data.privateKeyId)
    }

    return decryptedConfig as ApiConfig
  } catch (error) {
    console.error(`[v0] Error fetching API config for ${serviceName}:`, error)
    return null
  }
}

export async function getAllApiConfigs(): Promise<ApiConfig[]> {
  try {
    const snapshot = await getDocs(collection(db, API_CONFIG_COLLECTION))
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        apiKey: '***REDACTED***',
        apiSecret: data.apiSecret ? '***REDACTED***' : undefined,
      } as ApiConfig
    })
  } catch (error) {
    console.error('[v0] Error fetching API configs:', error)
    return []
  }
}

export async function setApiConfig(
  serviceName: string,
  config: Partial<Omit<ApiConfig, 'id'>>
): Promise<boolean> {
  try {
    const q = query(
      collection(db, API_CONFIG_COLLECTION),
      where('serviceName', '==', serviceName)
    )
    const snapshot = await getDocs(q)

    const docId = snapshot.empty ? serviceName : snapshot.docs[0].id
    const docRef = doc(db, API_CONFIG_COLLECTION, docId)

    const dataToSave: any = {
      serviceName,
      ...config,
      updatedAt: new Date(),
    }

    // Encrypt apiKey and apiSecret if they exist
    if (config.apiKey) {
      dataToSave.apiKey = encryptData(config.apiKey)
    }
    if (config.apiSecret) {
      dataToSave.apiSecret = encryptData(config.apiSecret)
    }

    // For Firebase Admin SDK and other complex credentials, encrypt the entire JSON object
    if (config.privateKey) {
      dataToSave.privateKey = encryptData(config.privateKey)
    }
    if (config.clientEmail) {
      dataToSave.clientEmail = encryptData(config.clientEmail)
    }
    if (config.projectId) {
      dataToSave.projectId = encryptData(config.projectId)
    }
    if (config.privateKeyId) {
      dataToSave.privateKeyId = encryptData(config.privateKeyId)
    }

    await setDoc(docRef, dataToSave, { merge: true })
    return true
  } catch (error) {
    console.error(`[v0] Error setting API config for ${serviceName}:`, error)
    return false
  }
}

// Client-side health check functions (deprecated - use api-config-server.ts on server)
export async function checkServiceHealth(serviceName: string): Promise<SystemHealth> {
  const config = await getApiConfig(serviceName)

  if (!config || config.status !== 'active') {
    return {
      id: serviceName,
      serviceName,
      status: 'down',
      lastChecked: new Date(),
      errorMessage: 'Service not configured',
    }
  }

  try {
    const startTime = Date.now()

    switch (serviceName) {
      case 'stripe':
        const stripeResponse = await fetch('https://api.stripe.com/v1/account', {
          headers: { Authorization: `Bearer ${config.apiKey}` },
        })
        return stripeResponse.ok
          ? { id: serviceName, serviceName, status: 'healthy', lastChecked: new Date(), responseTime: Date.now() - startTime }
          : { id: serviceName, serviceName, status: 'down', lastChecked: new Date(), errorMessage: stripeResponse.statusText }

      case 'openai':
        const oaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${config.apiKey}` },
        })
        return oaiResponse.ok
          ? { id: serviceName, serviceName, status: 'healthy', lastChecked: new Date(), responseTime: Date.now() - startTime }
          : { id: serviceName, serviceName, status: 'down', lastChecked: new Date(), errorMessage: oaiResponse.statusText }

      default:
        return { id: serviceName, serviceName, status: 'healthy', lastChecked: new Date() }
    }
  } catch (error) {
    return { id: serviceName, serviceName, status: 'degraded', lastChecked: new Date(), errorMessage: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function checkAllServicesHealth(): Promise<SystemHealth[]> {
  const configs = await getAllApiConfigs()
  const healthChecks = configs.map((config) => checkServiceHealth(config.serviceName))
  return Promise.all(healthChecks)
}
