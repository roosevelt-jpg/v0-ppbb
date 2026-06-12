import { getFirestore, collection, getDocs, setDoc, doc, query, where, deleteDoc } from 'firebase-admin/firestore'
import { getApps } from 'firebase-admin/app'
import { ApiConfig, SystemHealth } from '@/lib/types'

// Get Firestore instance from already-initialized Firebase Admin app
function getDb() {
  const apps = getApps()
  if (!apps.length) {
    throw new Error('Firebase Admin app not initialized')
  }
  return getFirestore(apps[0])
}

const API_CONFIG_COLLECTION = 'apiConfigs'

// Encrypt sensitive data (in production, use a proper encryption library)
function encryptData(data: string): string {
  // For MVP, using base64. In production, use proper encryption
  return Buffer.from(data).toString('base64')
}

function decryptData(data: string): string {
  return Buffer.from(data, 'base64').toString()
}

export async function getApiConfigServer(serviceName: string): Promise<ApiConfig | null> {
  try {
    const db = getDb()
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

    // System fields that shouldn't be decrypted
    const systemFields = ['serviceName', 'status', 'lastChecked', 'updatedBy', 'updatedAt', 'createdAt', 'deletedAt', 'deletedBy']

    // Decrypt all credential fields generically
    Object.keys(decryptedConfig).forEach((key: string) => {
      if (!systemFields.includes(key) && typeof decryptedConfig[key] === 'string') {
        try {
          // Try to decrypt - if it fails, leave it as-is
          decryptedConfig[key] = decryptData(decryptedConfig[key])
        } catch {
          // Data might not be encrypted, keep original
        }
      }
    })

    return decryptedConfig as ApiConfig
  } catch (error) {
    console.error(`[v0] Error fetching API config for ${serviceName}:`, error)
    return null
  }
}

export async function getAllApiConfigsServer(): Promise<ApiConfig[]> {
  try {
    const db = getDb()
    const snapshot = await getDocs(collection(db, API_CONFIG_COLLECTION))
    
    const systemFields = ['serviceName', 'status', 'lastChecked', 'updatedBy', 'updatedAt', 'createdAt', 'deletedAt', 'deletedBy']
    
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      const redactedData: any = {
        ...data,
      }

      // Redact all credential fields (non-system fields)
      Object.keys(redactedData).forEach((key: string) => {
        if (!systemFields.includes(key) && redactedData[key]) {
          redactedData[key] = '***REDACTED***'
        }
      })

      console.log('[v0] Config found:', data.serviceName, 'with fields:', Object.keys(data).filter(k => !systemFields.includes(k)))

      return redactedData as ApiConfig
    })
  } catch (error) {
    console.error('[v0] Error fetching API configs:', error)
    return []
  }
}

export async function setApiConfigServer(
  serviceName: string,
  config: Partial<Omit<ApiConfig, 'id'>>
): Promise<boolean> {
  try {
    const db = getDb()
    const q = query(
      collection(db, API_CONFIG_COLLECTION),
      where('serviceName', '==', serviceName)
    )
    const snapshot = await getDocs(q)

    const docId = snapshot.empty ? serviceName : snapshot.docs[0].id
    const docRef = doc(db, API_CONFIG_COLLECTION, docId)

    const dataToSave: any = {
      serviceName,
    }

    // System fields that shouldn't be encrypted
    const systemFields = ['serviceName', 'status', 'lastChecked', 'updatedBy', 'updatedAt', 'createdAt', 'deletedAt', 'deletedBy']

    // Encrypt all credential fields generically
    Object.keys(config).forEach((key: string) => {
      if (systemFields.includes(key)) {
        // System fields pass through unencrypted
        dataToSave[key] = config[key as keyof typeof config]
      } else if (config[key as keyof typeof config]) {
        // All other fields are credentials and should be encrypted
        const value = config[key as keyof typeof config]
        if (typeof value === 'string') {
          dataToSave[key] = encryptData(value)
        } else {
          // For non-string values (dates, objects), store as-is or convert to JSON
          dataToSave[key] = value
        }
      }
    })

    console.log('[v0] Saving config for', serviceName, 'with fields:', Object.keys(dataToSave))

    await setDoc(docRef, dataToSave, { merge: true })
    return true
  } catch (error) {
    console.error(`[v0] Error setting API config for ${serviceName}:`, error)
    return false
  }
}

export async function deleteApiConfigServer(serviceName: string): Promise<boolean> {
  try {
    const db = getDb()
    const q = query(
      collection(db, API_CONFIG_COLLECTION),
      where('serviceName', '==', serviceName)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      console.log('[v0] Config not found for deletion:', serviceName)
      return false
    }

    const docRef = doc(db, API_CONFIG_COLLECTION, snapshot.docs[0].id)
    await deleteDoc(docRef)

    console.log('[v0] Config deleted for', serviceName)
    return true
  } catch (error) {
    console.error(`[v0] Error deleting API config for ${serviceName}:`, error)
    return false
  }
}

export async function checkServiceHealth(serviceName: string): Promise<SystemHealth> {
  const config = await getApiConfigServer(serviceName)

  if (!config || config.status !== 'active') {
    return {
      id: serviceName,
      serviceName,
      status: 'down',
      lastChecked: new Date(),
      errorMessage: 'Service not configured',
    }
  }

  // Service-specific health checks
  try {
    const startTime = Date.now()

    switch (serviceName) {
      case 'stripe':
        // Basic Stripe health check
        const response = await fetch('https://api.stripe.com/v1/account', {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        })
        const responseTime = Date.now() - startTime

        if (response.ok) {
          return {
            id: serviceName,
            serviceName,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime,
          }
        } else {
          return {
            id: serviceName,
            serviceName,
            status: 'down',
            lastChecked: new Date(),
            errorMessage: response.statusText,
          }
        }

      case 'sendgrid':
        // Basic SendGrid health check
        const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: 'test@example.com' }] }],
            from: { email: 'test@example.com' },
            subject: 'test',
            content: [{ type: 'text/plain', value: 'test' }],
          }),
        })

        const sgResponseTime = Date.now() - startTime
        if (sgResponse.ok || sgResponse.status === 400) {
          // 400 is ok for validation
          return {
            id: serviceName,
            serviceName,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: sgResponseTime,
          }
        } else {
          return {
            id: serviceName,
            serviceName,
            status: 'down',
            lastChecked: new Date(),
            errorMessage: sgResponse.statusText,
          }
        }

      case 'openai':
        // Check OpenAI models endpoint
        const oaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
        })
        const oaiResponseTime = Date.now() - startTime
        if (oaiResponse.ok) {
          return {
            id: serviceName,
            serviceName,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: oaiResponseTime,
          }
        } else {
          return {
            id: serviceName,
            serviceName,
            status: 'down',
            lastChecked: new Date(),
            errorMessage: oaiResponse.statusText,
          }
        }

      case 'anthropic':
        // Check Anthropic API
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        })
        const anthropicResponseTime = Date.now() - startTime
        if (anthropicResponse.ok || anthropicResponse.status === 400) {
          return {
            id: serviceName,
            serviceName,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: anthropicResponseTime,
          }
        } else {
          return {
            id: serviceName,
            serviceName,
            status: 'down',
            lastChecked: new Date(),
            errorMessage: anthropicResponse.statusText,
          }
        }

      case 'youtube':
        // Check YouTube API
        const youtubeResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=test&key=${config.apiKey}`
        )
        const youtubeResponseTime = Date.now() - startTime
        if (youtubeResponse.ok) {
          return {
            id: serviceName,
            serviceName,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: youtubeResponseTime,
          }
        } else {
          return {
            id: serviceName,
            serviceName,
            status: 'down',
            lastChecked: new Date(),
            errorMessage: youtubeResponse.statusText,
          }
        }

      case 'googlemaps':
        // Check Google Maps API
        const mapsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${config.apiKey}`
        )
        const mapsResponseTime = Date.now() - startTime
        if (mapsResponse.ok) {
          return {
            id: serviceName,
            serviceName,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: mapsResponseTime,
          }
        } else {
          return {
            id: serviceName,
            serviceName,
            status: 'down',
            lastChecked: new Date(),
            errorMessage: mapsResponse.statusText,
          }
        }

      default:
        return {
          id: serviceName,
          serviceName,
          status: 'healthy',
          lastChecked: new Date(),
        }
    }
  } catch (error) {
    return {
      id: serviceName,
      serviceName,
      status: 'degraded',
      lastChecked: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function checkAllServicesHealth(): Promise<SystemHealth[]> {
  const configs = await getAllApiConfigsServer()
  const healthChecks = configs.map((config) => checkServiceHealth(config.serviceName))
  return Promise.all(healthChecks)
}
