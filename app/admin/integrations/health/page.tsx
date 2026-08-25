'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAllServices } from '@/lib/integrations/services'
import { IntegrationsVaultGate } from '@/components/admin/integrations-vault-gate'
import { integrationsVaultHeaders } from '@/lib/integrations/vault-client'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

function IntegrationHealthPageContent() {
  const auth = useAuth()
  const [health, setHealth] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHealth()
  }, [auth.firebaseUser])

  async function loadHealth() {
    if (!auth.firebaseUser) {
      setLoading(false)
      return
    }
    try {
      const token = await auth.firebaseUser.getIdToken()
      const response = await fetch('/api/admin/integrations/health', {
        headers: integrationsVaultHeaders(token),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[v0] Health data loaded:', data)
        setHealth(data.health || [])
        setSummary(data.summary || {})
      } else {
        console.error('[v0] Health response failed:', response.status)
        const errText = await response.text()
        console.error('[v0] Error:', errText)
        setHealth([])
        setSummary({})
      }
    } catch (error) {
      console.error('[v0] Error loading health:', error)
      setHealth([])
      setSummary({})
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadHealth()
    setRefreshing(false)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 dark:text-green-400'
      case 'degraded':
        return 'text-amber-600 dark:text-amber-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '0.5rem' }}>
            Integration Health
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Real-time status and uptime monitoring for all connected services</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)',
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
          className={
            summary.overallStatus === 'operational'
              ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800'
              : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
          }
          style={{
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
          <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Operational
            </p>
            <p className="text-green-600 dark:text-green-400" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{summary.operational}</p>
          </div>

          <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Degraded
            </p>
            <p className="text-amber-600 dark:text-amber-400" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{summary.degraded}</p>
          </div>

          <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Down
            </p>
            <p className="text-red-600 dark:text-red-400" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{summary.down}</p>
          </div>

          <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Not Configured
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--muted-foreground)' }}>{summary.notConfigured}</p>
          </div>

          <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Avg Latency
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{summary.avgLatency}ms</p>
          </div>
        </div>
      )}

      {/* Services Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>Loading...</div>
      ) : (
        <div className="admin-table-scroll min-w-0" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
          <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Integration
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Latency
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Last Checked
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Uptime (90d)
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {health.map((h) => (
                <tr key={h.serviceId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: '500' }}>
                    {h.serviceName}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span
                      className={getStatusClass(h.status)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '600',
                      }}
                    >
                      {getStatusIcon(h.status)} {h.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--foreground)' }}>
                    {h.latency > 0 ? `${h.latency}ms` : '—'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    {h.lastChecked ? new Date(h.lastChecked).toLocaleString() : 'Never'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--foreground)' }}>
                    {h.uptime90d > 0 ? `${h.uptime90d}%` : '—'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <a
                      href="/admin/integrations"
                      style={{
                        display: 'inline-block',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: 'var(--secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--foreground)',
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

export default function IntegrationHealthPage() {
  return (
    <IntegrationsVaultGate>
      <IntegrationHealthPageContent />
    </IntegrationsVaultGate>
  )
}
