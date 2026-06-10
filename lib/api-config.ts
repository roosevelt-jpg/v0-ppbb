import { db } from '@/lib/firebase'
import { ApiConfig } from '@/lib/types'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore'

const API_CONFIG_COLLECTION = 'apiConfigs'

// Encrypt sensitive data (in production, use a proper encryption library)
function encryptData(data: string): string {
  // For MVP, using base64. In production, use proper encryption
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

    const doc = snapshot.docs[0]
    const data = doc.data()

    // Decrypt sensitive fields
    return {
      ...data,
      apiKey: decryptData(data.apiKey),
      apiSecret: data.apiSecret ? decryptData(data.apiSecret) : undefined,
    } as ApiConfig
  } catch (error) {
    console.error(`[v0] Error fetching API config for ${serviceName}:`, error)
    return null
  }
}

export async function getAllApiConfigs(): Promise<ApiConfig[]> {
  try {
    const snapshot = await getDocs(collection(db, API_CONFIG_COLLECTION))
    return snapshot.docs.map((doc) => {
      const data = doc.data()
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

    const dataToSave = {
      serviceName,
      ...config,
      apiKey: config.apiKey ? encryptData(config.apiKey) : undefined,
      apiSecret: config.apiSecret ? encryptData(config.apiSecret) : undefined,
      updatedAt: new Date(),
    }

    await setDoc(docRef, dataToSave, { merge: true })
    return true
  } catch (error) {
    console.error(`[v0] Error setting API config for ${serviceName}:`, error)
    return false
  }
}

export async function checkServiceHealth(serviceName: string): Promise<SystemHealth> {
  const config = await getApiConfig(serviceName)

  if (!config || !config.isActive) {
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

// Types for system health
export interface SystemHealth {
  id: string
  serviceName: string
  status: 'healthy' | 'degraded' | 'down'
  lastChecked: Date
  responseTime?: number
  errorMessage?: string
  metadata?: Record<string, any>
}
