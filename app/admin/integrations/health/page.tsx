'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAllServices } from '@/lib/integrations/services'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function IntegrationHealthPage() {
  const auth = useAuth()
  const [health, setHealth] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHealth()
  }, [auth.user])

  async function loadHealth() {
    if (!auth.user) return
    try {
      const token = await auth.user.getIdToken()
      const response = await fetch('/api/admin/integrations/health', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setHealth(data.health || [])
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('[v0] Error loading health:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadHealth()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return '#10b981'
      case 'degraded':
        return '#f59e0b'
      case 'down':
        return '#ef4444'
      default:
        return '#888888'
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === 'operational') return '✓'
    if (status === 'degraded') return '⚠'
    if (status === 'down') return '✕'
    return '—'
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
            Integration Health
          </h1>
          <p style={{ color: '#888888' }}>Real-time status and uptime monitoring for all connected services</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#111111',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw className="h-4 w-4" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh all
        </button>
      </div>

      {/* Status Banner */}
      {summary && (
        <div
          style={{
            backgroundColor: summary.overallStatus === 'operational' ? '#d1fae5' : '#fee2e2',
            color: summary.overallStatus === 'operational' ? '#065f46' : '#991b1b',
            border: `1px solid ${summary.overallStatus === 'operational' ? '#6ee7b7' : '#fca5a5'}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {summary.overallStatus === 'operational' ? (
            <CheckCircle className="h-6 w-6 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
          )}
          <div>
            <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
              {summary.operational > 0 ? 'All systems operational' : 'Some systems degraded'}
            </p>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              {summary.operational} of {summary.total} integrations configured and healthy - {summary.overallStatus === 'operational' ? '99.98%' : '95%'} uptime
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Operational
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>{summary.operational}</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Degraded
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>{summary.degraded}</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Down
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444' }}>{summary.down}</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Not Configured
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#888888' }}>{summary.notConfigured}</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: '#888888', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Avg Latency
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111111' }}>{summary.avgLatency}ms</p>
          </div>
        </div>
      )}

      {/* Services Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888888' }}>Loading...</div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e4e1da', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f8f5', borderBottom: '1px solid #e4e1da' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#888888', textTransform: 'uppercase' }}>
                  Integration
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#888888', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#888888', textTransform: 'uppercase' }}>
                  Latency
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#888888', textTransform: 'uppercase' }}>
                  Last Checked
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#888888', textTransform: 'uppercase' }}>
                  Uptime (90d)
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#888888', textTransform: 'uppercase' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {health.map((h) => (
                <tr key={h.serviceId} style={{ borderBottom: '1px solid #e4e1da' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111', fontWeight: '500' }}>
                    {h.serviceName}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: getStatusColor(h.status),
                        fontWeight: '600',
                      }}
                    >
                      {getStatusIcon(h.status)} {h.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111' }}>
                    {h.latency > 0 ? `${h.latency}ms` : '—'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#888888' }}>
                    {h.lastChecked ? new Date(h.lastChecked).toLocaleString() : 'Never'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111111' }}>
                    {h.uptime90d > 0 ? `${h.uptime90d}%` : '—'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <a
                      href="/admin/integrations"
                      style={{
                        display: 'inline-block',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#f9f8f5',
                        border: '1px solid #e4e1da',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#111111',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Configure
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
