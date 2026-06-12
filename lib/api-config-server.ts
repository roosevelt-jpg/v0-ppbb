import { getFirestore, collection, getDocs, setDoc, doc, query, where } from 'firebase-admin/firestore'
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

export async function getAllApiConfigsServer(): Promise<ApiConfig[]> {
  try {
    const db = getDb()
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
      ...config,
      updatedAt: new Date(),
    }

    // Encrypt standard fields
    if (config.apiKey) {
      dataToSave.apiKey = encryptData(config.apiKey)
    }
    if (config.apiSecret) {
      dataToSave.apiSecret = encryptData(config.apiSecret)
    }

    // Encrypt Firebase Admin SDK fields
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
