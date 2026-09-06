'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import { db } from '@/lib/firebase'
import {
  EMAIL_SEND_LOGS_COLLECTION,
  mapEmailSendLogDoc,
  type EmailSendLog,
} from '@/lib/email-send-log-shared'
import { FILTER_PILL_ACTIVE, FILTER_PILL_INACTIVE } from '@/lib/admin-design-system'

export default function EmailSendLogsPage() {
  const [logs, setLogs] = useState<EmailSendLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all')

  useEffect(() => {
    const q = query(
      collection(db, EMAIL_SEND_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(300)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(snap.docs.map((d) => mapEmailSendLogDoc(d.id, d.data() as Record<string, unknown>)))
        setLoading(false)
      },
      (err) => {
        console.error('[admin/email-logs]', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false
      if (!term) return true
      return (
        log.to.toLowerCase().includes(term) ||
        log.subject.toLowerCase().includes(term) ||
        log.purpose.toLowerCase().includes(term) ||
        String(log.department || '')
          .toLowerCase()
          .includes(term) ||
        String(log.userId || '')
          .toLowerCase()
          .includes(term)
      )
    })
  }, [logs, search, statusFilter])

  const counts = useMemo(() => {
    return {
      sent: logs.filter((l) => l.status === 'sent').length,
      failed: logs.filter((l) => l.status === 'failed').length,
      skipped: logs.filter((l) => l.status === 'skipped').length,
    }
  }, [logs])

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Email activity</h1>
        <p className="text-sm text-neutral-600 mt-1">
          CRM log of outbound branded emails (membership, events, payments, and more).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Sent</p>
          <p className="text-2xl font-semibold text-neutral-900">{counts.sent}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Failed</p>
          <p className="text-2xl font-semibold text-neutral-900">{counts.failed}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Skipped</p>
          <p className="text-2xl font-semibold text-neutral-900">{counts.skipped}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'sent', label: 'Sent' },
              { id: 'failed', label: 'Failed' },
              { id: 'skipped', label: 'Skipped' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={statusFilter === tab.id ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 bg-white rounded-md border border-neutral-300 px-2.5 min-w-0 h-8">
          <Search size={14} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, subject, purpose, department…"
            className="flex-1 py-1 outline-none bg-white text-xs text-neutral-800 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden min-w-0">
        <div className="admin-table-scroll">
          <table className="w-full min-w-[960px]">
            <thead className="bg-neutral-100 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-800">When</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-800">To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-800">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-800">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-800">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-800">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                    Loading email activity…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                    No email activity yet. Logs appear after the next branded send.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="px-4 py-3 text-xs text-neutral-600 whitespace-nowrap">
                      {log.createdAt.getTime()
                        ? format(log.createdAt, 'MMM d, yyyy HH:mm')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-900 break-all max-w-[180px]">
                      {log.to || '—'}
                      {log.userId ? (
                        <span className="block text-[10px] text-neutral-400 mt-0.5">{log.userId}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-900 max-w-[240px]">
                      <span className="font-medium line-clamp-2">{log.subject}</span>
                      {log.preview ? (
                        <span className="block text-[11px] text-neutral-500 mt-1 line-clamp-2">
                          {log.preview}
                        </span>
                      ) : null}
                      {log.error ? (
                        <span className="block text-[11px] text-red-600 mt-1">{log.error}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 capitalize">
                      {log.department || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={
                          log.status === 'sent'
                            ? 'text-green-700'
                            : log.status === 'skipped'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 max-w-[160px] line-clamp-2">
                      {log.purpose}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
