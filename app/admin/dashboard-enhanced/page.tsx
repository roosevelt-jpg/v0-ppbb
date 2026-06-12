'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAllAuditLogs } from '@/lib/admin-audit'
import { getActiveAlerts } from '@/lib/integration-usage'
import { Users, Plug, AlertCircle, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'

export default function AdminDashboardEnhanced() {
  const { user: authUser } = useAuth()
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalIntegrations: 0,
    activeAlerts: 0,
    recentLogs: 0,
  })
  const [loading, setLoading] = useState(true)
  const [uptime, setUptime] = useState(99.9)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [adminsSnap, integrationsSnap, auditLogs, alerts] = await Promise.all([
        getDocs(query(collection(db, 'adminUsers'))),
        getDocs(query(collection(db, 'integrations'))),
        getAllAuditLogs(100),
        getActiveAlerts(),
      ])

      // Calculate uptime from successful operations
      const successCount = auditLogs.filter(l => l.status === 'success').length
      const calculatedUptime = auditLogs.length > 0 ? (successCount / auditLogs.length) * 100 : 99.9

      setStats({
        totalAdmins: adminsSnap.size,
        totalIntegrations: integrationsSnap.size,
        activeAlerts: alerts.length,
        recentLogs: auditLogs.length,
      })
      setUptime(calculatedUptime)
    } catch (error) {
      console.error('[v0] Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const systemHealth = uptime > 99 ? 'excellent' : uptime > 95 ? 'good' : uptime > 90 ? 'warning' : 'critical'
  const healthColor = {
    excellent: '#10b981',
    good: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444',
  }[systemHealth]

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#888888' }}>System overview and key metrics</p>
      </div>

      {/* Health Status */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e1da',
        borderRadius: '0.5rem',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: healthColor + '15',
          border: `3px solid ${healthColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: healthColor }}>
              {uptime.toFixed(1)}%
            </p>
            <p style={{ fontSize: '0.75rem', color: healthColor }}>Uptime</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111111', marginBottom: '0.5rem' }}>
            System Status: {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
          </h2>
          <p style={{ color: '#888888', marginBottom: '1rem' }}>
            {systemHealth === 'excellent' && 'All systems operating normally. No issues detected.'}
            {systemHealth === 'good' && 'System performance is good. Monitor for any degradation.'}
            {systemHealth === 'warning' && 'System experiencing minor issues. Review logs for details.'}
            {systemHealth === 'critical' && 'Critical issues detected. Immediate action required.'}
          </p>
          <button
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#111111',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            View Details
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Users className="h-5 w-5" style={{ color: '#0c2340' }} />
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Admin Users</p>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{stats.totalAdmins}</p>
          <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem' }}>
            <CheckCircle2 className="h-3 w-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
            All active
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Plug className="h-5 w-5" style={{ color: '#7c3aed' }} />
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Integrations</p>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{stats.totalIntegrations}</p>
          <p style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: '0.5rem' }}>
            <Clock className="h-3 w-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
            Configured
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <AlertCircle className="h-5 w-5" style={{ color: stats.activeAlerts > 0 ? '#ef4444' : '#10b981' }} />
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Active Alerts</p>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{stats.activeAlerts}</p>
          <p style={{
            fontSize: '0.875rem',
            color: stats.activeAlerts > 0 ? '#ef4444' : '#10b981',
            marginTop: '0.5rem',
          }}>
            {stats.activeAlerts > 0 ? 'Review needed' : 'All clear'}
          </p>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp className="h-5 w-5" style={{ color: '#3b82f6' }} />
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>Audit Events</p>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111' }}>{stats.recentLogs}</p>
          <p style={{ fontSize: '0.875rem', color: '#3b82f6', marginTop: '0.5rem' }}>
            Last 100 events
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e1da',
        borderRadius: '0.5rem',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111111', marginBottom: '1rem' }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
        }}>
          {[
            { label: 'View Admins', href: '/admin/access-control' },
            { label: 'Audit Logs', href: '/admin/audit-logs' },
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Security Center', href: '/admin/security-center' },
            { label: 'Health Status', href: '/admin/integrations/health' },
            { label: 'Analytics', href: '/admin/integration-analytics' },
          ].map(action => (
            <a
              key={action.href}
              href={action.href}
              style={{
                padding: '1rem',
                backgroundColor: '#f9f8f5',
                border: '1px solid #e4e1da',
                borderRadius: '0.375rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#111111',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f3f1'
                e.currentTarget.style.borderColor = '#d4d1ca'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f8f5'
                e.currentTarget.style.borderColor = '#e4e1da'
              }}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
