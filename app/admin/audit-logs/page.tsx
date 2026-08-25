'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  subscribeToAllAuditLogs,
  recordAdminAuditFromUser,
  type AuditLog,
} from '@/lib/admin-audit'
import { AUDIT_ACTION_FILTER_OPTIONS } from '@/lib/audit-log-shared'
import { format } from 'date-fns'
import { ChevronDown, Search, Download, Globe, Monitor, Smartphone } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/admin-design-system'

function AuditLogsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="h-20 bg-neutral-200 dark:bg-muted rounded-lg" />
        <div className="h-20 bg-neutral-200 dark:bg-muted rounded-lg" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-neutral-200 dark:bg-muted rounded-lg" />
      ))}
    </div>
  )
}

export default function AuditLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeToAllAuditLogs((data) => {
      setLogs(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return logs.filter((log) => {
      const matchesSearch =
        !term ||
        log.adminEmail?.toLowerCase().includes(term) ||
        log.adminName?.toLowerCase().includes(term) ||
        log.entityName?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.route?.toLowerCase().includes(term) ||
        log.entityType?.toLowerCase().includes(term)

      const matchesFilter =
        filterType === 'all' ||
        log.actionType === filterType ||
        log.entityType === filterType

      return matchesSearch && matchesFilter
    })
  }, [logs, searchTerm, filterType])

  const successRate = useMemo(() => {
    if (filteredLogs.length === 0) return 0
    const ok = filteredLogs.filter((l) => l.status === 'success').length
    return (ok / filteredLogs.length) * 100
  }, [filteredLogs])

  const handleExport = () => {
    const headers = [
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Role',
      'Action Type',
      'Action',
      'Entity Type',
      'Entity',
      'Route',
      'Status',
      'IP',
      'Browser',
      'OS',
      'Device',
      'Details',
    ]
    const rows = filteredLogs.map((log) =>
      [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        log.adminName,
        log.adminEmail,
        log.adminRole,
        log.actionType,
        log.action,
        log.entityType,
        log.entityName || '',
        log.route || '',
        log.status,
        log.ipAddress || '',
        log.deviceBrowser || '',
        log.deviceOs || '',
        log.deviceType || '',
        log.details || log.failureReason || '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    if (user) {
      recordAdminAuditFromUser(user, {
        actionType: 'export',
        action: `Exported ${filteredLogs.length} audit logs`,
        entityType: 'other',
        status: 'success',
      })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <p className="font-body text-xs uppercase tracking-[0.15em] text-neutral-500 dark:text-muted-foreground mb-1">Security</p>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-foreground">Audit Logs</h1>
        <p className="font-body text-sm text-neutral-600 dark:text-muted-foreground mt-1">Complete activity trail of admin actions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by admin, action, route…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-border rounded-lg bg-white dark:bg-card text-neutral-900 dark:text-foreground text-sm font-body"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 border border-neutral-300 dark:border-border rounded-lg bg-white dark:bg-card text-sm font-body min-w-[140px]"
        >
          {AUDIT_ACTION_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleExport} className={`${BUTTON_PRIMARY} inline-flex items-center gap-2 whitespace-nowrap`}>
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-neutral-50 dark:bg-muted border border-neutral-200 dark:border-border rounded-lg p-4">
          <p className="text-xs text-neutral-500 dark:text-muted-foreground font-body uppercase tracking-wide">Total Logs</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-foreground mt-1">{filteredLogs.length}</p>
        </div>
        <div className="bg-neutral-50 dark:bg-muted border border-neutral-200 dark:border-border rounded-lg p-4">
          <p className="text-xs text-neutral-500 dark:text-muted-foreground font-body uppercase tracking-wide">Success Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{successRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-neutral-200 dark:border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6">
            <AuditLogsSkeleton />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-neutral-600 dark:text-muted-foreground font-body text-sm">
            No audit logs found. Actions will appear here as admins use the panel.
          </div>
        ) : (
          <div>
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`border-b border-neutral-200 dark:border-border last:border-b-0 ${
                  expandedLog === log.id ? 'bg-neutral-50 dark:bg-muted' : 'bg-white dark:bg-card hover:bg-neutral-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="pb-ghost-btn w-full h-auto max-h-none min-h-0 p-4 text-left flex items-start gap-3 text-neutral-900 dark:text-foreground"
                >
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 mt-1 text-neutral-500 dark:text-muted-foreground transition-transform ${
                      expandedLog === log.id ? 'rotate-180' : ''
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-neutral-900 dark:text-foreground font-body text-sm sm:text-base">{log.action}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-muted text-neutral-700 dark:text-foreground font-body">
                        {log.actionType}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-muted-foreground ml-auto font-body whitespace-nowrap">
                        {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-muted-foreground font-body truncate">
                      {log.adminName} ({log.adminRole}) · {log.adminEmail}
                      {log.route ? ` · ${log.route}` : ''}
                      {log.entityName ? ` · ${log.entityName}` : ''}
                    </p>
                  </div>
                </button>

                {expandedLog === log.id && (
                  <div className="px-4 pb-4 pt-0 bg-neutral-50 dark:bg-muted border-t border-neutral-100 dark:border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 text-sm font-body">
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-foreground mb-2">Security</p>
                        <div className="space-y-2 text-neutral-700 dark:text-foreground">
                          <div className="flex items-start gap-2">
                            <Globe className="h-4 w-4 mt-0.5 text-neutral-500 dark:text-muted-foreground flex-shrink-0" />
                            <span className="font-mono text-xs break-all">{log.ipAddress || '—'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Monitor className="h-4 w-4 mt-0.5 text-neutral-500 dark:text-muted-foreground flex-shrink-0" />
                            <span>
                              {log.deviceBrowser} on {log.deviceOs}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Smartphone className="h-4 w-4 mt-0.5 text-neutral-500 dark:text-muted-foreground flex-shrink-0" />
                            <span className="capitalize">{log.deviceType || 'desktop'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-foreground mb-2">Context</p>
                        <dl className="space-y-1 text-neutral-700 dark:text-foreground text-xs sm:text-sm">
                          <div>
                            <dt className="inline font-medium">Entity: </dt>
                            <dd className="inline">{log.entityType}{log.entityId ? ` (${log.entityId})` : ''}</dd>
                          </div>
                          {log.details ? (
                            <div>
                              <dt className="font-medium">Details</dt>
                              <dd className="mt-1 text-neutral-600 dark:text-muted-foreground">{log.details}</dd>
                            </div>
                          ) : null}
                          {log.failureReason ? (
                            <div>
                              <dt className="font-medium text-red-700">Failure</dt>
                              <dd className="text-red-600">{log.failureReason}</dd>
                            </div>
                          ) : null}
                          {log.userAgent ? (
                            <div className="mt-2">
                              <dt className="font-medium text-neutral-500 dark:text-muted-foreground">User agent</dt>
                              <dd className="font-mono text-[10px] sm:text-xs break-all text-neutral-500 dark:text-muted-foreground">{log.userAgent}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    </div>
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
