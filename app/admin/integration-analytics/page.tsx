'use client'

import React, { useEffect, useState } from 'react'
import { getIntegrationUsage, getIntegrationStats, getActiveAlerts, resolveAlert, IntegrationUsageEntry, IntegrationAlert } from '@/lib/integration-usage'
import { INTEGRATION_SERVICES } from '@/lib/integrations/services'
import { format } from 'date-fns'
import { AlertCircle, TrendingUp, Zap, X } from 'lucide-react'

export default function IntegrationAnalyticsPage() {
  const services = Object.values(INTEGRATION_SERVICES)
  const [selectedService, setSelectedService] = useState(services[0]?.id || '')
  const [usage, setUsage] = useState<(IntegrationUsageEntry & { id: string })[]>([])
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<(IntegrationAlert & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(24)

  useEffect(() => {
    if (selectedService) {
      loadData()
    }
  }, [selectedService, timeRange])

  async function loadData() {
    setLoading(true)
    try {
      const [usageData, statsData, alertsData] = await Promise.all([
        getIntegrationUsage(selectedService, timeRange),
        getIntegrationStats(selectedService, timeRange),
        getActiveAlerts(selectedService),
      ])
      setUsage(usageData)
      setStats(statsData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('[v0] Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlert(alertId)
    setAlerts(alerts.filter(a => a.id !== alertId))
  }

  if (!selectedService || !stats) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', color: '#888888' }}>
          Loading integration analytics...
        </div>
      </div>
    )
  }

  const service = services.find(s => s.id === selectedService)

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          Integration Analytics
        </h1>
        <p style={{ color: '#888888' }}>Usage statistics and health monitoring</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #e4e1da',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: '#ffffff',
            minWidth: '200px',
          }}
        >
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          style={{
            padding: '0.75rem',
            border: '1px solid #e4e1da',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: '#ffffff',
            minWidth: '150px',
          }}
        >
          <option value={1}>Last 1 hour</option>
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={168}>Last 7 days</option>
          <option value={720}>Last 30 days</option>
        </select>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          {alerts.map(alert => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: alert.severity === 'critical' ? '#fef2f2' : '#fffbf0',
                border: `1px solid ${alert.severity === 'critical' ? '#fecaca' : '#fed7aa'}`,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <AlertCircle
                className="h-5 w-5"
                style={{
                  color: alert.severity === 'critical' ? '#dc2626' : '#d97706',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: '600',
                  color: alert.severity === 'critical' ? '#991b1b' : '#92400e',
                  marginBottom: '0.25rem',
                }}>
                  {alert.message}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                  {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <button
                onClick={() => handleResolveAlert(alert.id)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: '#888888',
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.5rem' }}>Total Calls</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{stats.totalCalls}</p>
          <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem' }}>
            <TrendingUp className="h-3 w-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
            {stats.successfulCalls} successful
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.5rem' }}>Success Rate</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>
            {stats.successRate.toFixed(1)}%
          </p>
          <p style={{ fontSize: '0.875rem', color: '#ef4444', marginTop: '0.5rem' }}>
            {stats.failedCalls} failed
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.5rem' }}>Avg Response Time</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>
            {stats.avgResponseTime.toFixed(0)}ms
          </p>
          <p style={{ fontSize: '0.875rem', color: '#888888', marginTop: '0.5rem' }}>
            <Zap className="h-3 w-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
            {stats.maxResponseTime.toFixed(0)}ms peak
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e1da',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e4e1da' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111111' }}>Recent Activity</h2>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888888' }}>
            Loading activity...
          </div>
        ) : usage.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888888' }}>
            No activity in selected time range
          </div>
        ) : (
          <div className="admin-table-scroll min-w-0">
            <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f8f5', borderBottom: '1px solid #e4e1da' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888888', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888888', fontWeight: '600' }}>Endpoint</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888888', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888888', fontWeight: '600' }}>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {usage.slice(0, 20).map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #e4e1da' }}>
                    <td style={{ padding: '1rem', color: '#666666' }}>
                      {format(new Date(entry.timestamp), 'HH:mm:ss')}
                    </td>
                    <td style={{ padding: '1rem', color: '#666666', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {entry.method} {entry.endpoint}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: entry.success ? '#ecfdf5' : '#fef2f2',
                          color: entry.success ? '#10b981' : '#dc2626',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {entry.statusCode}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#666666' }}>
                      {entry.responseTime.toFixed(0)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
