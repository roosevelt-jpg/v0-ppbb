'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { auth } from '@/lib/firebase'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileWarning,
  Inbox,
} from 'lucide-react'
type BeneficiaryRow = {
  id: string
  fullName?: string
  name?: string
  email?: string
  emergencyLevel?: string
  status?: string
  createdAt?: string | Date | { seconds?: number; _seconds?: number }
  submissionDate?: string | Date | { seconds?: number; _seconds?: number }
  hasSensitiveDocuments?: boolean
  sensitiveDocumentsRedacted?: boolean
  emiratesIdUrl?: string
  salaryCertificateUrl?: string
  bankStatementUrl?: string
  passportUrl?: string
  visaUrl?: string
  reasonCategory?: string
  phoneNumber?: string
}

async function authHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  const token = await user.getIdToken()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  if (typeof value === 'object') {
    const o = value as { seconds?: number; _seconds?: number; toDate?: () => Date }
    if (typeof o.toDate === 'function') return o.toDate()
    const sec = o.seconds ?? o._seconds
    if (typeof sec === 'number') return new Date(sec * 1000)
  }
  return null
}

export default function BeneficiaryRequestsAdmin() {
  const [requests, setRequests] = useState<BeneficiaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BeneficiaryRow | null>(null)
  const [canViewDocs, setCanViewDocs] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: '', emergencyLevel: '' })
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const headers = await authHeaders()
      const res = await fetch('/api/admin/beneficiary-requests', { headers })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Load failed')
      setRequests(json.data || [])
      setCanViewDocs(Boolean(json.canViewSensitiveDocuments))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = requests.filter((r) => {
    if (filters.status && r.status !== filters.status) return false
    if (filters.emergencyLevel && r.emergencyLevel !== filters.emergencyLevel) return false
    return true
  })

  const runAction = async (id: string, action: 'review' | 'accept' | 'reject') => {
    setActing(true)
    setError('')
    try {
      const notes =
        action === 'reject'
          ? prompt('Rejection reason:') || ''
          : action === 'accept'
            ? prompt('Acceptance notes (optional):') || ''
            : ''
      const headers = await authHeaders()
      const res = await fetch('/api/admin/beneficiary-requests', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, action, notes }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      await load()
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const openSensitiveDoc = async (requestId: string, documentKey: string) => {
    if (!canViewDocs) return
    try {
      const headers = await authHeaders()
      const res = await fetch(
        `/api/admin/beneficiary-requests?id=${encodeURIComponent(requestId)}&document=${encodeURIComponent(documentKey)}`,
        { headers }
      )
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Access denied')
      setDocUrls((prev) => ({ ...prev, [documentKey]: json.url }))
      // View only in-page — no download attribute / no new-tab for non-welfare is already gated
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cannot open document')
    }
  }

  const statusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'under_review':
      case 'submitted':
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-neutral-400" />
    }
  }

  const btnPrimary =
    'min-h-[44px] bg-black hover:bg-neutral-900 text-white px-3 py-2 rounded text-sm font-semibold disabled:opacity-50'
  const btnSecondary =
    'min-h-[44px] bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-3 py-2 rounded text-sm font-semibold disabled:opacity-50'
  const btnDanger =
    'min-h-[44px] bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold disabled:opacity-50'

  return (
    <AdminPageLayout
      title="Beneficiary Requests"
      subtitle="Review charity support applications — sensitive documents role-gated server-side"
    >
      <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
          Sensitive documents (Emirates ID, salary cert, bank statement) are visible only to
          admins with role <strong>welfare</strong>, <strong>founder</strong>, or{' '}
          <strong>coordinator</strong> (also founder_admin / manager). Standard admins see the
          request metadata only — no document URLs.
          {!canViewDocs && (
            <span className="block mt-1 font-medium">
              Your current session cannot view or download sensitive files.
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.emergencyLevel}
            onChange={(e) => setFilters({ ...filters, emergencyLevel: e.target.value })}
            className="border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          >
            <option value="">All emergency levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button type="button" onClick={load} className={btnSecondary}>
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-lg border border-neutral-100 shadow-sm p-4 sm:p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-neutral-100 rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No beneficiary requests</p>
              <p className="text-sm text-neutral-500 mt-1">
                Submissions from the charity support form will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((r) => {
                  const when = toDate(r.submissionDate || r.createdAt)
                  return (
                    <div key={r.id} className="border border-neutral-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className="font-semibold">{r.fullName || r.name || '—'}</span>
                      </div>
                      <p className="text-sm text-neutral-600">{r.email || '—'}</p>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {r.emergencyLevel || '—'} · {r.status || '—'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {when ? when.toLocaleDateString() : '—'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => setSelected(r)}
                        >
                          <Eye className="w-4 h-4 inline mr-1" />
                          Review
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          className={btnPrimary}
                          onClick={() => runAction(r.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          className={btnDanger}
                          onClick={() => runAction(r.id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table with horizontal scroll */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b">
                      <th className="py-3 pr-3">Name</th>
                      <th className="py-3 pr-3">Email</th>
                      <th className="py-3 pr-3">Emergency</th>
                      <th className="py-3 pr-3">Date</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const when = toDate(r.submissionDate || r.createdAt)
                      return (
                        <tr key={r.id} className="border-b border-neutral-100">
                          <td className="py-3 pr-3 font-medium">{r.fullName || r.name || '—'}</td>
                          <td className="py-3 pr-3">{r.email || '—'}</td>
                          <td className="py-3 pr-3 capitalize">{r.emergencyLevel || '—'}</td>
                          <td className="py-3 pr-3">
                            {when ? when.toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 pr-3 capitalize">{r.status || '—'}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="underline"
                                onClick={() => setSelected(r)}
                              >
                                Review
                              </button>
                              <button
                                type="button"
                                className="underline text-green-700"
                                disabled={acting}
                                onClick={() => runAction(r.id, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className="underline text-red-600"
                                disabled={acting}
                                onClick={() => runAction(r.id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <h2 className="text-xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Review request
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Name</dt>
                <dd className="font-medium">{selected.fullName || selected.name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Email</dt>
                <dd>{selected.email}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Phone</dt>
                <dd>{selected.phoneNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Emergency</dt>
                <dd className="capitalize">{selected.emergencyLevel}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Status</dt>
                <dd className="capitalize">{selected.status}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Category</dt>
                <dd>{selected.reasonCategory || '—'}</dd>
              </div>
            </dl>

            <div className="border-t pt-4">
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
                Sensitive documents
              </p>
              {!canViewDocs ? (
                <div className="flex gap-2 items-start text-sm text-neutral-600 bg-neutral-50 p-3 rounded">
                  <FileWarning className="w-5 h-5 shrink-0 text-amber-600" />
                  <span>
                    Documents are hidden for your role. Only welfare / founder / coordinator
                    roles can view them via the secure API.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(
                    [
                      ['emiratesIdUrl', 'Emirates ID'],
                      ['passportUrl', 'Passport'],
                      ['visaUrl', 'Visa'],
                      ['salaryCertificateUrl', 'Salary certificate'],
                      ['bankStatementUrl', 'Bank statement'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`${btnSecondary} text-left`}
                      onClick={() => openSensitiveDoc(selected.id, key)}
                    >
                      View {label}
                      {docUrls[key] ? ' ✓' : ''}
                    </button>
                  ))}
                  <p className="text-xs text-neutral-500">
                    Files open for review only for authorized roles. Direct Storage links are not
                    shown to standard admins.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                disabled={acting}
                className={btnSecondary}
                onClick={() => runAction(selected.id, 'review')}
              >
                Mark under review
              </button>
              <button
                type="button"
                disabled={acting}
                className={btnPrimary}
                onClick={() => runAction(selected.id, 'accept')}
              >
                Accept
              </button>
              <button
                type="button"
                disabled={acting}
                className={btnDanger}
                onClick={() => runAction(selected.id, 'reject')}
              >
                Reject
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  )
}
