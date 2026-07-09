'use client'

import React from 'react'
import { adminApiFetch } from '@/lib/admin-api-client'
import type { IntegrationAlert, IntegrationUsageEntry } from '@/lib/integration-usage'
import type { IntegrationStats } from '@/lib/integration-analytics-server'
import { INTEGRATION_SERVICES } from '@/lib/integrations/services'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { format } from 'date-fns'
import { AlertCircle, TrendingUp, Zap, X } from 'lucide-react'

type AnalyticsPayload = {
  usage: (IntegrationUsageEntry & { id: string })[]
  stats: IntegrationStats
  alerts: (IntegrationAlert & { id: string })[]
}

const EMPTY_STATS: IntegrationStats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  successRate: 0,
  avgResponseTime: 0,
  maxResponseTime: 0,
  minResponseTime: 0,
}

export default function IntegrationAnalyticsPage() {
  const services = Object.values(INTEGRATION_SERVICES)
  const [selectedService, setSelectedService] = React.useState(services[0]?.id || '')
  const [usage, setUsage] = React.useState<(IntegrationUsageEntry & { id: string })[]>([])
  const [stats, setStats] = React.useState<IntegrationStats>(EMPTY_STATS)
  const [alerts, setAlerts] = React.useState<(IntegrationAlert & { id: string })[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [timeRange, setTimeRange] = React.useState(24)

  const loadData = React.useCallback(async () => {
    if (!selectedService) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminApiFetch<AnalyticsPayload>(
        `/api/admin/integration-analytics?serviceId=${encodeURIComponent(selectedService)}&hours=${timeRange}`
      )
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to load analytics')
        setUsage([])
        setStats(EMPTY_STATS)
        setAlerts([])
        return
      }
      setUsage(res.data.usage || [])
      setStats(res.data.stats || EMPTY_STATS)
      setAlerts(res.data.alerts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      setUsage([])
      setStats(EMPTY_STATS)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [selectedService, timeRange])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  const handleResolveAlert = async (alertId: string) => {
    const res = await adminApiFetch('/api/admin/integration-analytics', {
      method: 'PATCH',
      body: JSON.stringify({ alertId }),
    })
    if (res.success) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    }
  }

  const service = services.find((s) => s.id === selectedService)

  return (
    <AdminPageLayout
      title="Integration Analytics"
      subtitle="Usage statistics and health monitoring for connected services"
    >
      <div className="space-y-6 min-w-0">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg text-sm bg-white"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="w-full sm:w-auto min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg text-sm bg-white"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
            <option value={720}>Last 30 days</option>
          </select>
        </div>

        {service ? (
          <p className="text-sm text-neutral-500">
            Monitoring <span className="font-medium text-neutral-800">{service.name}</span>
          </p>
        ) : null}

        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <AlertCircle
                  className={`h-5 w-5 shrink-0 ${
                    alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold text-sm ${
                      alert.severity === 'critical' ? 'text-red-900' : 'text-amber-900'
                    }`}
                  >
                    {alert.message}
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleResolveAlert(alert.id)}
                  className="p-2 rounded bg-white text-neutral-500 hover:text-neutral-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#e4e1da] rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Total Calls</p>
            <p className="text-3xl font-bold text-neutral-900">{stats.totalCalls}</p>
            <p className="text-sm text-emerald-600 mt-2 inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats.successfulCalls} successful
            </p>
          </div>

          <div className="bg-white border border-[#e4e1da] rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-neutral-900">{stats.successRate.toFixed(1)}%</p>
            <p className="text-sm text-red-500 mt-2">{stats.failedCalls} failed</p>
          </div>

          <div className="bg-white border border-[#e4e1da] rounded-lg p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-neutral-900">{stats.avgResponseTime.toFixed(0)}ms</p>
            <p className="text-sm text-neutral-500 mt-2 inline-flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {stats.maxResponseTime.toFixed(0)}ms peak
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#e4e1da] rounded-lg overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-[#e4e1da]">
            <h2 className="text-base font-semibold text-neutral-900">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-neutral-500 text-sm">Loading activity…</div>
          ) : usage.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No activity in the selected time range. Usage is logged when integrations are called.
            </div>
          ) : (
            <div className="admin-table-scroll min-w-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-[#e4e1da] text-left text-neutral-500">
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Endpoint</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.slice(0, 20).map((entry) => (
                    <tr key={entry.id} className="border-b border-[#f0eee8] last:border-0">
                      <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                        {format(new Date(entry.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 font-mono text-xs">
                        {entry.method} {entry.endpoint}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            entry.success
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {entry.statusCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {Number(entry.responseTime).toFixed(0)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  )
}
