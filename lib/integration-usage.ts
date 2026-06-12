import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

export interface IntegrationUsageEntry {
  id?: string
  timestamp: number
  serviceId: string
  serviceName: string
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  success: boolean
  errorMessage?: string
  userId?: string
}

export interface IntegrationAlert {
  id?: string
  timestamp: number
  serviceId: string
  serviceName: string
  alertType: 'high_latency' | 'repeated_failures' | 'rate_limit' | 'authentication' | 'custom'
  severity: 'info' | 'warning' | 'critical'
  message: string
  triggerCount?: number
  resolved: boolean
  resolvedAt?: number
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
})

const db = getFirestore(app)

/**
 * Log integration usage
 */
export async function logIntegrationUsage(entry: IntegrationUsageEntry): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'integrationUsage'), {
      ...entry,
      timestamp: Date.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error logging integration usage:', error)
    return null
  }
}

/**
 * Get usage for a specific integration
 */
export async function getIntegrationUsage(serviceId: string, hours: number = 24) {
  try {
    const startTime = Date.now() - (hours * 60 * 60 * 1000)
    const q = query(
      collection(db, 'integrationUsage'),
      where('serviceId', '==', serviceId),
      where('timestamp', '>=', startTime),
      orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IntegrationUsageEntry & { id: string }))
  } catch (error) {
    console.error('[v0] Error fetching integration usage:', error)
    return []
  }
}

/**
 * Get usage statistics for a service
 */
export async function getIntegrationStats(serviceId: string, hours: number = 24) {
  const usage = await getIntegrationUsage(serviceId, hours)
  
  if (usage.length === 0) {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      successRate: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
    }
  }

  const successCount = usage.filter(u => u.success).length
  const failedCount = usage.filter(u => !u.success).length
  const responseTimes = usage.map(u => u.responseTime)

  return {
    totalCalls: usage.length,
    successfulCalls: successCount,
    failedCalls: failedCount,
    successRate: (successCount / usage.length) * 100,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    maxResponseTime: Math.max(...responseTimes),
    minResponseTime: Math.min(...responseTimes),
  }
}

/**
 * Create an alert for integration issues
 */
export async function createIntegrationAlert(alert: IntegrationAlert): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'integrationAlerts'), {
      ...alert,
      timestamp: Date.now(),
      resolved: false,
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error creating integration alert:', error)
    return null
  }
}

/**
 * Get active alerts for a service
 */
export async function getActiveAlerts(serviceId?: string) {
  try {
    let q
    if (serviceId) {
      q = query(
        collection(db, 'integrationAlerts'),
        where('serviceId', '==', serviceId),
        where('resolved', '==', false),
        orderBy('timestamp', 'desc')
      )
    } else {
      q = query(
        collection(db, 'integrationAlerts'),
        where('resolved', '==', false),
        orderBy('timestamp', 'desc')
      )
    }
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IntegrationAlert & { id: string }))
  } catch (error) {
    console.error('[v0] Error fetching alerts:', error)
    return []
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'integrationAlerts', alertId), {
      resolved: true,
      resolvedAt: Date.now(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error resolving alert:', error)
    return false
  }
}
