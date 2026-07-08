'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { subscribeToAllAuditLogs, type AuditLog } from '@/lib/admin-audit'
import { ShieldCheck, AlertTriangle, Lock, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default function SecurityCenterPage() {
  const { user: authUser } = useAuth()
  const [auditLogs, setAuditLogs] = useState<(AuditLog & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [securityScore, setSecurityScore] = useState(0)

  useEffect(() => {
    const unsub = subscribeToAllAuditLogs((logs) => {
      setAuditLogs(logs)
      const failedOps = logs.filter((l) => l.status === 'failed').length
      const failureRate = logs.length > 0 ? (failedOps / logs.length) * 100 : 0
      setSecurityScore(Math.max(0, Math.min(100, 100 - failureRate * 2)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Get security events for the last 24 hours
  const last24h = Date.now() - (24 * 60 * 60 * 1000)
  const recentEvents = auditLogs.filter(log => log.timestamp > last24h)
  const failedEvents = recentEvents.filter(log => log.status === 'failed')
  const uniqueAdmins = new Set(recentEvents.map(log => log.adminId)).size

  // Security recommendations
  const recommendations = [
    failedEvents.length > 0 && {
      level: 'warning',
      title: 'Multiple Failed Operations Detected',
      description: `${failedEvents.length} failed operations in the last 24 hours. Review audit logs for suspicious activity.`,
      action: 'Review Logs',
    },
    uniqueAdmins > 5 && {
      level: 'info',
      title: 'Multiple Admin Users Active',
      description: `${uniqueAdmins} admin users have been active in the last 24 hours.`,
      action: 'View Admins',
    },
    securityScore < 80 && {
      level: 'warning',
      title: 'Security Score Below Threshold',
      description: `Current security score is ${securityScore.toFixed(1)}%. Review recent activity.`,
      action: 'Improve',
    },
  ].filter(Boolean)

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          Security Center
        </h1>
        <p style={{ color: '#888888' }}>System security monitoring and recommendations</p>
      </div>

      {/* Security Score */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e1da',
        borderRadius: '0.5rem',
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        <ShieldCheck className="h-12 w-12" style={{ margin: '0 auto 1rem', color: securityScore > 80 ? '#10b981' : '#f59e0b' }} />
        <p style={{ fontSize: '0.875rem', color: '#888888', marginBottom: '0.5rem' }}>Security Score</p>
        <p style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: securityScore > 80 ? '#10b981' : securityScore > 60 ? '#f59e0b' : '#ef4444',
        }}>
          {securityScore.toFixed(1)}%
        </p>
        <p style={{ fontSize: '0.875rem', color: '#666666', marginTop: '1rem' }}>
          {securityScore > 80 ? 'System is secure' : securityScore > 60 ? 'Monitor closely' : 'Review immediately'}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #dcfce7',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.5rem' }}>Last 24 Hours</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>{recentEvents.length}</p>
          <p style={{ fontSize: '0.875rem', color: '#166534', marginTop: '0.5rem' }}>Events</p>
        </div>

        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#991b1b', marginBottom: '0.5rem' }}>Last 24 Hours</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{failedEvents.length}</p>
          <p style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: '0.5rem' }}>Failed Operations</p>
        </div>

        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#0c2340', marginBottom: '0.5rem' }}>Active Admins</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>{uniqueAdmins}</p>
          <p style={{ fontSize: '0.875rem', color: '#0c2340', marginTop: '0.5rem' }}>In Last 24 Hours</p>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111111', marginBottom: '1rem' }}>
            Security Recommendations
          </h2>
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: rec.level === 'warning' ? '#fffbf0' : '#f0fdf4',
                border: `1px solid ${rec.level === 'warning' ? '#fed7aa' : '#dcfce7'}`,
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{
                  color: rec.level === 'warning' ? '#d97706' : '#10b981',
                  flexShrink: 0,
                  marginTop: '0.25rem',
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: '600',
                  color: rec.level === 'warning' ? '#92400e' : '#166534',
                  marginBottom: '0.25rem',
                }}>
                  {rec.title}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                  {rec.description}
                </p>
              </div>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: rec.level === 'warning' ? '#f59e0b' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {rec.action}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security Checklist */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e1da',
        borderRadius: '0.5rem',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111111', marginBottom: '1rem' }}>
          Security Checklist
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { item: 'Access Control Configured', completed: true },
            { item: 'Audit Logging Enabled', completed: true },
            { item: 'Encryption Enabled', completed: true },
            { item: 'Regular Security Reviews', completed: false },
            { item: 'Backup and Recovery Plan', completed: false },
          ].map((check, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                checked={check.completed}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: check.completed ? '#10b981' : '#888888' }}>
                {check.item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
