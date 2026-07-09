import { getAdminDb } from '@/lib/firebase-admin'
import type { IntegrationAlert, IntegrationUsageEntry } from '@/lib/integration-usage'

export type IntegrationStats = {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  successRate: number
  avgResponseTime: number
  maxResponseTime: number
  minResponseTime: number
}

function computeStats(usage: IntegrationUsageEntry[]): IntegrationStats {
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

  const successfulCalls = usage.filter((u) => u.success).length
  const failedCalls = usage.filter((u) => !u.success).length
  const responseTimes = usage.map((u) => Number(u.responseTime) || 0)

  return {
    totalCalls: usage.length,
    successfulCalls,
    failedCalls,
    successRate: (successfulCalls / usage.length) * 100,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    maxResponseTime: Math.max(...responseTimes),
    minResponseTime: Math.min(...responseTimes),
  }
}

export async function loadIntegrationAnalytics(serviceId: string, hours: number) {
  const db = getAdminDb()
  const startTime = Date.now() - hours * 60 * 60 * 1000

  const [usageSnap, alertsSnap] = await Promise.all([
    db
      .collection('integrationUsage')
      .where('serviceId', '==', serviceId)
      .where('timestamp', '>=', startTime)
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get(),
    db
      .collection('integrationAlerts')
      .where('serviceId', '==', serviceId)
      .where('resolved', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get(),
  ])

  const usage = usageSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as IntegrationUsageEntry & { id: string }
  )

  const alerts = alertsSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as IntegrationAlert & { id: string }
  )

  return {
    usage,
    stats: computeStats(usage),
    alerts,
  }
}

export async function resolveIntegrationAlert(alertId: string): Promise<boolean> {
  const db = getAdminDb()
  const ref = db.collection('integrationAlerts').doc(alertId)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.update({
    resolved: true,
    resolvedAt: Date.now(),
  })
  return true
}
