'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAllAuditLogs, AuditLog } from '@/lib/admin-audit'
import { format } from 'date-fns'
import { ChevronDown, Search, Download } from 'lucide-react'

export default function AuditLogsPage() {
  const { user: authUser } = useAuth()
  const [logs, setLogs] = useState<(AuditLog & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const data = await getAllAuditLogs(200)
      setLogs(data)
    } catch (error) {
      console.error('[v0] Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || log.entityType === filterType

    return matchesSearch && matchesFilter
  })

  const handleExport = () => {
    const csv = [
      'Timestamp,Admin,Action,Entity Type,Entity,Status,Details',
      ...filteredLogs.map(log => 
        `"${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}","${log.adminEmail}","${log.action}","${log.entityType}","${log.entityName || '—'}","${log.status}","${log.details || ''}"`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '0.5rem' }}>
          Audit Logs
        </h1>
        <p style={{ color: '#888888' }}>Complete activity trail of all admin actions</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search className="h-4 w-4" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: '#888888' }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #e4e1da',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #e4e1da',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: '#ffffff',
            minWidth: '150px',
          }}
        >
          <option value="all">All Types</option>
          <option value="admin">Admin</option>
          <option value="integration">Integration</option>
          <option value="settings">Settings</option>
          <option value="webhook">Webhook</option>
          <option value="alert">Alert</option>
        </select>

        <button
          onClick={handleExport}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#111111',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#f9f8f5',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.5rem' }}>Total Logs</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111111' }}>{filteredLogs.length}</p>
        </div>
        <div style={{
          backgroundColor: '#f9f8f5',
          border: '1px solid #e4e1da',
          borderRadius: '0.5rem',
          padding: '1rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#888888', marginBottom: '0.5rem' }}>Success Rate</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {filteredLogs.length > 0 
              ? ((filteredLogs.filter(l => l.status === 'success').length / filteredLogs.length) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e1da',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888888' }}>Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888888' }}>No audit logs found</div>
        ) : (
          <div>
            {filteredLogs.map((log) => (
              <div key={log.id} style={{ borderBottom: '1px solid #e4e1da' }}>
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: expandedLog === log.id ? '#f9f8f5' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'left',
                  }}
                >
                  <ChevronDown
                    className="h-4 w-4"
                    style={{
                      flexShrink: 0,
                      transform: expandedLog === log.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      color: '#888888',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '600', color: '#111111' }}>{log.action}</span>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: log.status === 'success' ? '#ecfdf5' : '#fef2f2',
                          color: log.status === 'success' ? '#10b981' : '#dc2626',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {log.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#888888', marginLeft: 'auto' }}>
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#888888' }}>
                      <span>{log.adminEmail}</span>
                      <span>•</span>
                      <span>{log.entityType}</span>
                      {log.entityName && (
                        <>
                          <span>•</span>
                          <span>{log.entityName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {expandedLog === log.id && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9f8f5',
                    borderTop: '1px solid #e4e1da',
                  }}>
                    {log.details && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111111', marginBottom: '0.5rem' }}>Details</p>
                        <p style={{ fontSize: '0.875rem', color: '#666666', fontFamily: 'monospace' }}>{log.details}</p>
                      </div>
                    )}
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111111', marginBottom: '0.5rem' }}>Changes</p>
                        <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                          {Object.entries(log.changes).map(([key, value]) => (
                            <div key={key} style={{ marginBottom: '0.5rem' }}>
                              <strong>{key}:</strong> {JSON.stringify(value.before)} → {JSON.stringify(value.after)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
