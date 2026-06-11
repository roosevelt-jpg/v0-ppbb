import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore'

export interface ApiUsageMetric {
  id?: string
  serviceName: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  statusCode: number
  responseTime: number
  timestamp: Date
  requestSize?: number
  responseSize?: number
  errorMessage?: string
}

const USAGE_COLLECTION = 'apiUsageMetrics'

export async function recordApiUsage(metric: Omit<ApiUsageMetric, 'id' | 'timestamp'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, USAGE_COLLECTION), {
      ...metric,
      timestamp: Timestamp.now(),
    })
    return docRef.id
  } catch (error) {
    console.error('[v0] Error recording API usage:', error)
    return null
  }
}

export async function getServiceUsageStats(serviceName: string, hoursBack: number = 24): Promise<{
  totalRequests: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  p95ResponseTime: number
  errorRate: number
}> {
  try {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    const q = query(
      collection(db, USAGE_COLLECTION),
      where('serviceName', '==', serviceName),
      where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
      orderBy('timestamp', 'desc'),
      limit(1000)
    )

    const snapshot = await getDocs(q)
    const metrics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as ApiUsageMetric
    })

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
      }
    }

    const successCount = metrics.filter(m => m.statusCode >= 200 && m.statusCode < 300).length
    const errorCount = metrics.length - successCount
    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b)
    const p95Index = Math.floor(responseTimes.length * 0.95)

    return {
      totalRequests: metrics.length,
      successCount,
      errorCount,
      averageResponseTime: Math.round(metrics.reduce((a, b) => a + b.responseTime, 0) / metrics.length),
      p95ResponseTime: responseTimes[p95Index] || 0,
      errorRate: (errorCount / metrics.length) * 100,
    }
  } catch (error) {
    console.error('[v0] Error getting usage stats:', error)
    return {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      errorRate: 0,
    }
  }
}

export async function getTopErrorEndpoints(serviceName: string, limit: number = 10): Promise<Array<{
  endpoint: string
  errorCount: number
  lastError: string
}>> {
  try {
    const q = query(
      collection(db, USAGE_COLLECTION),
      where('serviceName', '==', serviceName),
      where('statusCode', '>=', 400),
      orderBy('timestamp', 'desc'),
      limit(100)
    )

    const snapshot = await getDocs(q)
    const metrics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as ApiUsageMetric
    })

    const endpointErrors: Record<string, { count: number; lastError: string }> = {}

    metrics.forEach(metric => {
      if (!endpointErrors[metric.endpoint]) {
        endpointErrors[metric.endpoint] = {
          count: 0,
          lastError: metric.errorMessage || 'Unknown error',
        }
      }
      endpointErrors[metric.endpoint].count++
    })

    return Object.entries(endpointErrors)
      .map(([endpoint, data]) => ({
        endpoint,
        errorCount: data.count,
        lastError: data.lastError,
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit)
  } catch (error) {
    console.error('[v0] Error getting top error endpoints:', error)
    return []
  }
}
